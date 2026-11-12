import { IsDateString, IsIn, IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';
import { ReceiverAccountType, SecCode } from '../payment';

export class CreatePaymentDto {
  /** Identifier of the platform partner requesting the ACH pull. */
  @IsString()
  @IsNotEmpty()
  public partnerId: string;

  /** Amount to pull from the receiver's account, expressed in cents. */
  @IsInt()
  @Min(1)
  public amountCents: number;

  /** Whether the bank account being debited belongs to a consumer or business. */
  @IsIn(['consumer', 'business'])
  public receiverAccountType: ReceiverAccountType;

  /** NACHA Standard Entry Class code describing the entry's authorization channel. */
  @IsIn(['PPD', 'CCD', 'WEB', 'TEL'])
  public secCode: SecCode;

  /** Requested ACH effective entry date, formatted as YYYY-MM-DD. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  public effectiveDate: string;
}
