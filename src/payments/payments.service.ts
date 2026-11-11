import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Payment, ReceiverAccountType, SecCode } from './payment';
import { PaymentStatus, ALL_STATUSES } from './payment-status';
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
    return this.repo.save(payment);
  }

  public get(id: string): Payment {
    return this.repo.findById(id);
  }

  /** The sweep calls this when the entry has been put in the file for the bank. */
  public submit(id: string): Payment {
    return this.setStatus(id, PaymentStatus.SUBMITTED);
  }

  public cancel(id: string): Payment {
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

  public acknowledge(id: string, settlementDate: string): Payment {
    return this.setStatus(id, PaymentStatus.PROCESSING, {
      settlementDate,
    });
  }

  public settle(id: string, settlementDate: string): Payment {
    return this.setStatus(id, PaymentStatus.SETTLED, {
      settlementDate,
    });
  }

  public fail(id: string, failureReason: string): Payment {
    return this.setStatus(id, PaymentStatus.FAILED, {
      failureReason,
    });
  }

  /**
   * Sets the status. Any status, from any status. This is how every
   * status on every payment has been written since the service was built:
   * the sweep calls it when it hands a file to the bank, the bank report
   * consumer calls it with whatever the file says, and ops call it from
   * the admin tool when something looks wrong.
   */
  setStatus(id: string, status: PaymentStatus, patch: Partial<Payment> = {}): Payment {
    if (!ALL_STATUSES.includes(status)) {
      throw new BadRequestException(`Unknown status ${status}`);
    }
    const payment = this.repo.findById(id);
    Object.assign(payment, patch, { status, updatedAt: new Date().toISOString() });
    return this.repo.save(payment);
  }
}
