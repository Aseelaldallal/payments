import { PaymentStatus } from './payment-status';

export type ReceiverAccountType = 'consumer' | 'business';
export type SecCode = 'PPD' | 'CCD' | 'WEB' | 'TEL';

/**
 * One ACH debit the platform originates: a pull from a partner's bank
 * account (business) or, for the few partners that onboard individuals,
 * from a consumer's account, into the partner's virtual account.
 */
export interface Payment {
  id: string;
  partnerId: string;
  amountCents: number;
  receiverAccountType: ReceiverAccountType;
  secCode: SecCode;
  /**
   * The requested ACH effective entry date: the date we want the entry to
   * settle and post. The bank-assigned settlement date may differ.
   */
  effectiveDate: string;
  /** What the bank assigned. ISO date. Null until the bank acknowledges. */
  settlementDate: string | null;
  status: PaymentStatus;
  /** Set when a return is applied. */
  returnCode: string | null;
  returnDate: string | null;
  /** Set when a reversal is applied. */
  reversalReason: string | null;
  reversalDate: string | null;
  /** Free text the bank sent with a rejection, if any. */
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
