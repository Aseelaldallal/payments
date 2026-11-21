import { Injectable } from '@nestjs/common';
import { Payment } from './domain/payment.interface';
import { PaymentHistoryEntry } from './domain/payment-history-entry.interface';

/** In-memory store. Enough for the platform's first project. */
/** Currently DB Design is really bad -- coming back to it in week 10 */
@Injectable()
export class PaymentsRepository {
  private readonly payments = new Map<string, Payment>();
  private readonly history = new Map<string, PaymentHistoryEntry[]>();

  public create(payment: Payment): Payment {
    this.payments.set(payment.id, payment);
    return payment;
  }

  public findById(id: string): Payment | undefined {
    return this.payments.get(id);
  }

  public appendHistory(entry: PaymentHistoryEntry): void {
    const entries = this.history.get(entry.paymentId) ?? [];
    entries.push(entry);
    this.history.set(entry.paymentId, entries);
  }

  public findHistoryByPaymentId(paymentId: string): PaymentHistoryEntry[] {
    return [...(this.history.get(paymentId) ?? [])];
  }

  public update(
    id: string,
    changes: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Payment | undefined {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment = {
      ...payment,
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }
}
