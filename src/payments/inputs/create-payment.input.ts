import { ReceiverAccountType, SecCode } from '../domain/payment.interface';

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
