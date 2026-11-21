import { PaymentEvent } from '../domain/payment-event.enum';
import { PaymentStatus } from '../domain/payment-status.enum';

export interface PaymentStatusHistoryRecord {
  sequence: number;
  paymentId: string;
  status: PaymentStatus;
  event: PaymentEvent;
  reason: string | null;
  createdAt: string;
}
