import { PaymentEvent } from '../domain/payment-event.enum';
import { PaymentStatus } from '../domain/payment-status.enum';

export type ReceiverAccountType = 'consumer' | 'business';
export type SecCode = 'PPD' | 'CCD' | 'WEB' | 'TEL';

/* -------------------------------------------------------------
 * Inputs
 * ------------------------------------------------------------- */

export interface CreatePaymentInput {
  partnerId: string;
  amountCents: number;
  receiverAccountType: ReceiverAccountType;
  secCode: SecCode;
  effectiveDate: string;
}

/* -------------------------------------------------------------
 * Outputs
 * ------------------------------------------------------------- */

/**
 * One ACH debit the platform originates: a pull from a partner's bank
 * account into the partner's virtual account.
 */
export interface Payment {
  id: string;
  partnerId: string;
  amountCents: number;
  receiverAccountType: ReceiverAccountType;
  secCode: SecCode;
  /** The requested ACH effective entry date. */
  effectiveDate: string;
  /** The bank-assigned settlement date, or null before acknowledgement. */
  settlementDate: string | null;
  status: PaymentStatus;
  returnCode: string | null;
  returnDate: string | null;
  reversalReason: string | null;
  reversalDate: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryEntry {
  from: PaymentStatus | null;
  to: PaymentStatus;
  event: PaymentEvent;
  reason: string | null;
  at: string;
}
