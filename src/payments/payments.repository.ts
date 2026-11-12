import { Injectable } from '@nestjs/common';
import { Payment } from './payment';

/** In-memory store. Enough for the platform's first project. */
@Injectable()
export class PaymentsRepository {
  private readonly payments = new Map<string, Payment>();

  public create(payment: Payment): Payment {
    this.payments.set(payment.id, payment);
    return payment;
  }

  public findById(id: string): Payment | undefined {
    return this.payments.get(id);
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
