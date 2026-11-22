import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AchWindowPolicyService } from '../ach/ach-window-policy.service';
import { ReversalReason } from '../ach/domain/reversal-reason';
import { isValidIsoDate } from '../shared/iso-date';
import { PaymentEvent } from './domain/payment-event.enum';
import { PaymentStatus } from './domain/payment-status.enum';
import { PaymentError, PaymentErrorCode } from './errors/payment.error';
import { PaymentsRepository } from './payments.repository';
import { CreatePaymentInput, Payment, PaymentHistoryEntry } from './types/payments.service.types';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly achWindowPolicyService: AchWindowPolicyService,
  ) {}

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
      throw new PaymentError(PaymentErrorCode.INVALID_PAYMENT_AMOUNT, {
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
    return this.repo.create({
      payment,
      event: PaymentEvent.PULL_REQUESTED,
    });
  }

  public get(id: string): Payment {
    const payment = this.repo.findById(id);
    if (!payment) {
      throw new PaymentError(PaymentErrorCode.PAYMENT_NOT_FOUND, {
        paymentId: id,
      });
    }
    return payment;
  }

  /** Marks a created payment as submitted after its entry is handed to the bank in a file. */
  public submit(id: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.CREATED) {
      throw new PaymentError(PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.SUBMITTED,
      });
    }
    return this.setStatus({
      paymentId: id,
      status: PaymentStatus.SUBMITTED,
      event: PaymentEvent.SENT_TO_BANK,
    });
  }

  /** Cancels a created payment before its entry is handed to the bank. */
  public cancel(id: string): Payment {
    const payment = this.get(id);
    if (payment.status !== PaymentStatus.CREATED) {
      throw new PaymentError(PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.CANCELLED,
      });
    }
    return this.setStatus({
      paymentId: id,
      status: PaymentStatus.CANCELLED,
      event: PaymentEvent.CANCEL_REQUESTED,
    });
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
      throw new PaymentError(PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.REVERSED,
      });
    }
    const settlementDate = payment.settlementDate!;
    const reversalDate = new Date().toISOString().slice(0, 10);
    this.achWindowPolicyService.assertReversalWindowOpen({
      settlementDate,
      reversalDate,
    });
    return this.setStatus({
      paymentId: id,
      status: PaymentStatus.REVERSED,
      event: PaymentEvent.REVERSAL_SENT,
      reason: reason,
      patch: {
        reversalReason: reason,
        reversalDate,
      },
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
      throw new PaymentError(PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.RETURNED,
      });
    }
    const settlementDate = payment.settlementDate!;
    this.achWindowPolicyService.assertReturnWindowOpen({
      returnCode,
      returnDate,
      receiverAccountType: payment.receiverAccountType,
      settlementDate,
    });
    return this.setStatus({
      paymentId: id,
      status: PaymentStatus.RETURNED,
      event: PaymentEvent.RETURN_RECEIVED,
      reason: returnCode,
      patch: {
        returnCode,
        returnDate,
      },
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
      throw new PaymentError(PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.PROCESSING,
      });
    }
    return this.setStatus({
      paymentId: id,
      status: PaymentStatus.PROCESSING,
      event: PaymentEvent.BANK_ACKNOWLEDGED,
      patch: {
        settlementDate,
      },
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
      throw new PaymentError(PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION, {
        paymentId: id,
        from: payment.status,
        to: PaymentStatus.SETTLED,
      });
    }
    return this.setStatus({
      paymentId: id,
      status: PaymentStatus.SETTLED,
      event: PaymentEvent.SETTLEMENT_REPORTED,
      patch: {
        settlementDate,
      },
    });
  }

  /**
   * Fails a payment before settlement.
   *
   * @param failureReason The reason the payment failed.
   */
  public fail({
    paymentId,
    failureCause,
    failureReason,
  }: {
    paymentId: string;
    failureCause: PaymentEvent;
    failureReason: string;
  }): Payment {
    const payment = this.get(paymentId);
    if (
      payment.status !== PaymentStatus.CREATED &&
      payment.status !== PaymentStatus.SUBMITTED &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      throw new PaymentError(PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION, {
        paymentId,
        from: payment.status,
        to: PaymentStatus.FAILED,
      });
    }
    return this.setStatus({
      paymentId,
      status: PaymentStatus.FAILED,
      event: failureCause,
      reason: failureReason,
    });
  }

  /**
   * Reads a payment's status history in chronological order.
   *
   * @param id The payment identifier.
   * @returns The payment's status changes, oldest first.
   * @throws {PaymentError} When the payment does not exist.
   */
  public getHistory(id: string): PaymentHistoryEntry[] {
    this.get(id); // Ensure the parent payment exists.
    const history = this.repo.findHistoryByPaymentId(id);
    return history.map((record, index) => ({
      from: index === 0 ? null : history[index - 1].status,
      to: record.status,
      event: record.event,
      reason: record.reason,
      recordedAt: record.createdAt,
    }));
  }

  /** Persists a status change after the public operation validates the transition. */
  private setStatus({
    paymentId,
    status,
    event,
    reason = null,
    patch = {},
  }: {
    paymentId: string;
    status: PaymentStatus;
    event: PaymentEvent;
    reason?: string | null;
    patch?: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'status'>>;
  }): Payment {
    const updatedPayment = this.repo.persistTransition({
      paymentId,
      to: status,
      event,
      reason,
      changes: patch,
    });
    if (!updatedPayment) {
      throw new PaymentError(PaymentErrorCode.PAYMENT_NOT_FOUND, {
        paymentId,
      });
    }
    return updatedPayment;
  }

  private assertValidDate(field: 'effectiveDate' | 'settlementDate' | 'returnDate', value: string): void {
    if (!isValidIsoDate(value)) {
      throw new PaymentError(PaymentErrorCode.INVALID_DATE, {
        field,
        value,
      });
    }
  }
}
