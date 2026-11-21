import { PaymentStatus } from './payment-status.enum';

export interface PaymentHistoryEntry {
  paymentId: string;
  from: PaymentStatus | null;
  to: PaymentStatus;
  event: string;
  reason: string | null;
  at: string;
}
