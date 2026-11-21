import { PaymentStatus } from '../domain/payment-status.enum';

export interface PaymentStatusHistoryRecord {
  sequence: number;
  paymentId: string;
  status: PaymentStatus;
  event: string;
  reason: string | null;
  createdAt: string;
}
