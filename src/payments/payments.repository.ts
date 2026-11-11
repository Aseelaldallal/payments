import { Injectable, NotFoundException } from '@nestjs/common';
import { Payment } from './payment';

/** In-memory store. Enough for the platform's first project. */
@Injectable()
export class PaymentsRepository {
  private readonly payments = new Map<string, Payment>();

  save(payment: Payment): Payment {
    this.payments.set(payment.id, payment);
    return payment;
  }

  findById(id: string): Payment {
    const p = this.payments.get(id);
    if (!p) throw new NotFoundException(`Payment ${id} not found`);
    return p;
  }

  all(): Payment[] {
    return [...this.payments.values()];
  }

  clear(): void {
    this.payments.clear();
  }
}
