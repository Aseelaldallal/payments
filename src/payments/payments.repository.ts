import { Injectable } from '@nestjs/common';
import { Payment } from './domain/payment.interface';
import { PaymentStatus } from './domain/payment-status.enum';
import { PaymentStatusHistoryRecord } from './persistence/payment-status-history-record.interface';

/**
 * In-memory persistence for payments and their status history.
 * A future database implementation must preserve atomic creation and transitions.
 */
@Injectable()
export class PaymentsRepository {
  private readonly payments = new Map<string, Payment>();
  private readonly history = new Map<string, PaymentStatusHistoryRecord[]>();

  /**
   * Stores a new payment and its initial history record atomically.
   * A SQL implementation must perform both writes in the same transaction.
   *
   * @param payment The payment to store.
   * @param event The event that created the payment.
   * @returns The stored payment.
   */
  public create({ payment, event }: { payment: Payment; event: string }): Payment {
    const historyRecord = {
      paymentId: payment.id,
      sequence: 1,
      status: payment.status,
      event,
      reason: null,
      createdAt: payment.createdAt,
    };
    this.payments.set(payment.id, payment);
    this.history.set(payment.id, [historyRecord]);
    return payment;
  }

  /**
   * Finds a payment by its identifier.
   *
   * @param id The payment identifier.
   * @returns The payment, or undefined when it does not exist.
   */
  public findById(id: string): Payment | undefined {
    return this.payments.get(id);
  }

  /**
   * Reads a payment's status history in insertion order.
   *
   * @param paymentId The payment identifier.
   * @returns A copy of the history records, or an empty array when none exist.
   */
  public findHistoryByPaymentId(paymentId: string): PaymentStatusHistoryRecord[] {
    return [...(this.history.get(paymentId) ?? [])];
  }

  /**
   * Atomically persists an approved payment status transition and its history record.
   * A SQL implementation must perform both writes in the same transaction.
   *
   * @param paymentId The payment being transitioned.
   * @param to The resulting payment status.
   * @param event The event that caused the status change.
   * @param reason Optional detail associated with the event.
   * @param changes Additional payment fields changed by the transition.
   * @returns The updated payment, or undefined when the payment does not exist.
   */
  public persistTransition({
    paymentId,
    to,
    event,
    reason = null,
    changes = {},
  }: {
    paymentId: string;
    to: PaymentStatus;
    event: string;
    reason?: string | null;
    changes?: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'status'>>;
  }): Payment | undefined {
    const payment = this.payments.get(paymentId);
    if (!payment) return undefined;

    const history = this.history.get(paymentId) ?? [];
    const createdAt = new Date().toISOString();

    const updatedPayment = {
      ...payment,
      ...changes,
      status: to,
      updatedAt: createdAt,
    };

    const historyRecord = {
      paymentId,
      sequence: history.length + 1,
      status: to,
      event,
      reason,
      createdAt,
    };

    this.payments.set(paymentId, updatedPayment);
    this.history.set(paymentId, [...history, historyRecord]);

    return updatedPayment;
  }
}
