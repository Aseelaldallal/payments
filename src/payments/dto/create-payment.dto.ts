import { ReceiverAccountType, SecCode } from '../payment';

/**
 * HTTP request body accepted when creating a payment.
 *
 * The controller maps this transport DTO to the application-layer
 * `CreatePaymentInput`; services do not depend on this class.
 */
export class CreatePaymentDto {
  public partnerId: string;
  public amountCents: number;
  public receiverAccountType: ReceiverAccountType;
  public secCode: SecCode;
  public effectiveDate: string;
}
