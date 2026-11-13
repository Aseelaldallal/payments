import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Payment } from './payment';
import { PaymentStatus } from './payment-status';
import { PaymentsRepository } from './payments.repository';
import { bankingDaysBetween } from '../shared/banking-calendar';
import { calendarDaysBetween, isValidIsoDate } from '../shared/iso-date';
import { InvariantViolationError } from '../shared/errors/invariant-violation.error';
import { CreatePaymentInput } from './inputs/create-payment.input';
import { ReversalReason } from './reversal-reason';
import { PaymentError, PaymentErrorCode } from './errors/payment.error';

@Injectable()
export class PaymentsService {
  constructor(private readonly repo: PaymentsRepository) {}

  /**
   * Creates a payment in the CREATED status from structurally validated input.
   * The amount must be a whole number of cents greater than zero.
   *
   * @param input The application-layer values required to create the payment.
   * @returns The newly created payment.
   */
  public create(input: CreatePaymentInput): Payment {
    this.assertValidDate('effectiveDate', input.effectiveDate);
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new PaymentError(PaymentErrorCode.InvalidPaymentAmount, {
        amountCents: input.amountCents,
      });
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
      throw new PaymentError(PaymentErrorCode.PaymentNotFound, { paymentId: id });
    }
    return payment;
  }

  /** Marks a created payment as submitted after its entry is handed to the bank in a file. */
  public submit(id: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.CREATED) {
      throw new PaymentError(PaymentErrorCode.IllegalPaymentTransition, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.SUBMITTED,
      });
    }
    return this.setStatus(id, PaymentStatus.SUBMITTED);
  }

  /** Cancels a created payment before its entry is handed to the bank. */
  public cancel(id: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.CREATED) {
      throw new PaymentError(PaymentErrorCode.IllegalPaymentTransition, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.CANCELLED,
      });
    }
    return this.setStatus(id, PaymentStatus.CANCELLED);
  }

  /**
   * Reverses a settled payment.
   *
   * @param reason The reason for originating the reversing entry.
   * @returns The reversed payment with the current UTC date recorded as its
   * reversal date.
   */
  public reverse(id: string, reason: ReversalReason): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.SETTLED) {
      throw new PaymentError(PaymentErrorCode.IllegalPaymentTransition, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.REVERSED,
      });
    }
    if (!payment.settlementDate || !isValidIsoDate(payment.settlementDate)) {
      throw new InvariantViolationError('SETTLED_PAYMENT_REQUIRES_VALID_SETTLEMENT_DATE', {
        paymentId: id,
        status: payment.status,
        settlementDate: payment.settlementDate,
      });
    }
    const reversalDate = new Date().toISOString().slice(0, 10);
    const bankingDaysDelta = bankingDaysBetween(payment.settlementDate, reversalDate);
    if (bankingDaysDelta < 0) {
      throw new PaymentError(PaymentErrorCode.ReversalDatePrecedesSettlement, {
        paymentId: id,
        settlementDate: payment.settlementDate,
        reversalDate,
      });
    }
    if (bankingDaysDelta > 5) {
      throw new PaymentError(PaymentErrorCode.ReversalWindowExpired, {
        paymentId: id,
        settlementDate: payment.settlementDate,
        reversalDate,
        bankingDaysElapsed: bankingDaysDelta,
      });
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
    this.assertValidDate('returnDate', returnDate);
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.SETTLED) {
      throw new PaymentError(PaymentErrorCode.IllegalPaymentTransition, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.RETURNED,
      });
    }
    if (!payment.settlementDate || !isValidIsoDate(payment.settlementDate)) {
      throw new InvariantViolationError('SETTLED_PAYMENT_REQUIRES_VALID_SETTLEMENT_DATE', {
        paymentId: id,
        status: payment.status,
        settlementDate: payment.settlementDate,
      });
    }
    const bankingDaysDelta = bankingDaysBetween(payment.settlementDate, returnDate);
    const calendarDaysDelta = calendarDaysBetween(payment.settlementDate, returnDate);
    const notAuthorizedFamily = ['R05', 'R07', 'R10', 'R11'];
    const hasExtendedWindow =
      payment.receiverAccountType === 'consumer' && notAuthorizedFamily.includes(returnCode);
    if (calendarDaysDelta < 0) {
      throw new PaymentError(PaymentErrorCode.ReturnDatePrecedesSettlement, {
        paymentId: id,
        returnCode,
        settlementDate: payment.settlementDate,
        returnDate,
        receiverAccountType: payment.receiverAccountType,
      });
    }
    if (hasExtendedWindow && calendarDaysDelta > 60) {
      throw new PaymentError(PaymentErrorCode.ExtendedReturnWindowExpired, {
        paymentId: id,
        returnCode,
        settlementDate: payment.settlementDate,
        returnDate,
        receiverAccountType: payment.receiverAccountType,
        calendarDaysElapsed: calendarDaysDelta,
      });
    }
    if (!hasExtendedWindow && bankingDaysDelta > 2) {
      throw new PaymentError(PaymentErrorCode.StandardReturnWindowExpired, {
        paymentId: id,
        returnCode,
        settlementDate: payment.settlementDate,
        returnDate,
        receiverAccountType: payment.receiverAccountType,
        bankingDaysElapsed: bankingDaysDelta,
      });
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
    this.assertValidDate('settlementDate', settlementDate);
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.SUBMITTED) {
      throw new PaymentError(PaymentErrorCode.IllegalPaymentTransition, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.PROCESSING,
      });
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
    this.assertValidDate('settlementDate', settlementDate);
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new PaymentError(PaymentErrorCode.IllegalPaymentTransition, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.SETTLED,
      });
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
      throw new PaymentError(PaymentErrorCode.IllegalPaymentTransition, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.FAILED,
      });
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
      throw new PaymentError(PaymentErrorCode.PaymentNotFound, { paymentId: id });
    }
    return payment;
  }

  private assertValidDate(
    field: 'effectiveDate' | 'settlementDate' | 'returnDate',
    value: string,
  ): void {
    if (!isValidIsoDate(value)) {
      throw new PaymentError(PaymentErrorCode.InvalidDate, {
        field,
        value,
      });
    }
  }
}
