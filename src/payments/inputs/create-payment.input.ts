import { ReceiverAccountType, SecCode } from '../payment';

/**
 * Application-layer values required to create a payment.
 */
export interface CreatePaymentInput {
  partnerId: string;
  amountCents: number;
  receiverAccountType: ReceiverAccountType;
  secCode: SecCode;
  effectiveDate: string;
}
