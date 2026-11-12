import { IsDateString, IsIn, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ReceiverAccountType, SecCode } from '../payment';

/**
 * HTTP request body accepted when creating a payment.
 *
 * The controller maps this transport DTO to the application-layer
 * `CreatePaymentInput`; services do not depend on this class.
 */
export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  public partnerId: string;

  @IsInt()
  @Min(1)
  public amountCents: number;

  @IsIn(['consumer', 'business'])
  public receiverAccountType: ReceiverAccountType;

  @IsIn(['PPD', 'CCD', 'WEB', 'TEL'])
  public secCode: SecCode;

  @IsDateString()
  public effectiveDate: string;
}
