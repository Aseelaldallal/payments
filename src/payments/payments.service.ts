import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Payment, ReceiverAccountType, SecCode } from './payment';
import { PaymentStatus } from './payment-status';
import { PaymentsRepository } from './payments.repository';
import { bankingDaysBetween, calendarDaysBetween } from '../shared/calendar';

export interface CreatePaymentInput {
  partnerId: string;
  amountCents: number;
  receiverAccountType: ReceiverAccountType;
  secCode: SecCode;
  effectiveDate: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly repo: PaymentsRepository) {}

  public create(input: CreatePaymentInput): Payment {
    if (!input.partnerId) throw new BadRequestException('partnerId is required');
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    if (input.receiverAccountType !== 'consumer' && input.receiverAccountType !== 'business') {
      throw new BadRequestException('receiverAccountType must be consumer or business');
    }
    if (!['PPD', 'CCD', 'WEB', 'TEL'].includes(input.secCode)) {
      throw new BadRequestException('secCode must be one of PPD, CCD, WEB, TEL');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)) {
      throw new BadRequestException('effectiveDate must be an ISO date');
    }
    const now = new Date().toISOString();
    const payment: Payment = {
      id: randomUUID(),
      partnerId: input.partnerId,
      amountCents: input.amountCents,
      receiverAccountType: input.receiverAccountType,
      secCode: input.secCode,
      effectiveDate: input.effectiveDate,
      settlementDate: null,
      status: PaymentStatus.CREATED,
      returnCode: null,
      returnDate: null,
      reversalReason: null,
      reversalDate: null,
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.create(payment);
  }

  public get(id: string): Payment {
    const payment = this.repo.findById(id);
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }
    return payment;
  }

  /** Marks a created payment as submitted after its entry is handed to the bank in a file. */
  public submit(id: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.CREATED) {
      throw new Error(`Illegal transition from status ${payment.status} to SUBMITTED`);
    }
    return this.setStatus(id, PaymentStatus.SUBMITTED);
  }

  /** Cancels a created payment before its entry is handed to the bank. */
  public cancel(id: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.CREATED) {
      throw new Error(`Illegal transition from status ${payment.status} to CANCELLED`);
    }
    return this.setStatus(id, PaymentStatus.CANCELLED);
  }

  /**
   * Reverses a settled payment.
   *
   * @param reason The reason for originating the reversing entry.
   * @param reversalDate The effective date of the reversing entry, formatted as
   * YYYY-MM-DD. This business date determines the five-banking-day window.
   */
  public reverse(id: string, reason: string, reversalDate: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.SETTLED) {
      throw new Error(`Illegal transition from status ${payment.status} to REVERSED`);
    }
    if (!payment.settlementDate) {
      throw new Error(`Settlement date is not set on a settled payment ${id}`);
    }
    const permittedReasons = ['duplicate', 'wrong_amount', 'wrong_account', 'wrong_date'];
    if (!permittedReasons.includes(reason)) {
      throw new Error(`Reversal reason ${reason} is not permitted`);
    }
    const bankingDaysDelta = bankingDaysBetween(payment.settlementDate, reversalDate);
    if (bankingDaysDelta < 0) {
      throw new Error(`Reversal date precedes settlement for payment ${id}`);
    }
    if (bankingDaysDelta > 5) {
      throw new Error(`Reversal must occur within 5 banking days of settlement`);
    }
    return this.setStatus(id, PaymentStatus.REVERSED, {
      reversalReason: reason,
      reversalDate,
    });
  }

  /**
   * Applies a return received for a settled payment.
   *
   * @param returnCode The ACH return reason code.
   * @param returnDate The settlement date of the return entry, formatted as YYYY-MM-DD.
   */
  public return(id: string, returnCode: string, returnDate: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.SETTLED) {
      throw new Error(`Illegal transition from status ${payment.status} to RETURNED`);
    }
    if (!payment.settlementDate) {
      throw new Error(`Settlement date is not set on a settled payment ${id}`);
    }
    const bankingDaysDelta = bankingDaysBetween(payment.settlementDate, returnDate);
    const calendarDaysDelta = calendarDaysBetween(payment.settlementDate, returnDate);
    const notAuthorizedFamily = ['R05', 'R07', 'R10', 'R11'];
    const hasExtendedWindow =
      payment.receiverAccountType === 'consumer' && notAuthorizedFamily.includes(returnCode);
    if (calendarDaysDelta < 0) {
      throw new Error(`Return date precedes settlement for payment ${id}`);
    }
    if (hasExtendedWindow && calendarDaysDelta > 60) {
      throw new Error(`Return date window has passed for payment ${id}`);
    }
    if (!hasExtendedWindow && bankingDaysDelta > 2) {
      throw new Error(`Return date window has passed for payment ${id}`);
    }
    return this.setStatus(id, PaymentStatus.RETURNED, {
      returnCode,
      returnDate,
    });
  }

  /**
   * Records the bank's acknowledgement of a submitted payment.
   *
   * @param settlementDate The settlement date assigned by the bank, formatted as YYYY-MM-DD.
   */
  public acknowledge(id: string, settlementDate: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.SUBMITTED) {
      throw new Error(`Illegal transition from status ${payment.status} to PROCESSING`);
    }
    return this.setStatus(id, PaymentStatus.PROCESSING, {
      settlementDate,
    });
  }

  /**
   * Settles a payment that is currently processing.
   *
   * @param settlementDate The bank-reported settlement date, formatted as YYYY-MM-DD.
   */
  public settle(id: string, settlementDate: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new Error(`Illegal transition from status ${payment.status} to SETTLED`);
    }
    if (!settlementDate) {
      throw new Error(`Settlement date is required to settle payment ${id}`);
    }
    return this.setStatus(id, PaymentStatus.SETTLED, {
      settlementDate,
    });
  }

  /**
   * Fails a payment before settlement.
   *
   * @param failureReason The reason the payment failed.
   */
  public fail(id: string, failureReason: string): Payment {
    const payment = this.get(id);
    if (
      payment.status !== PaymentStatus.CREATED &&
      payment.status !== PaymentStatus.SUBMITTED &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      throw new Error(`Illegal transition from status ${payment.status} to FAILED`);
    }
    return this.setStatus(id, PaymentStatus.FAILED, {
      failureReason,
    });
  }

  /** Persists a status change after the public operation validates the transition. */
  private setStatus(
    id: string,
    status: PaymentStatus,
    patch: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'status'>> = {},
  ): Payment {
    const payment = this.repo.update(id, {
      ...patch,
      status,
    });
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }
    return payment;
  }
}
