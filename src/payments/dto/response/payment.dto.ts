import { Expose } from 'class-transformer';
import { PaymentStatus } from '../../domain/payment-status.enum';
import { ReceiverAccountType, SecCode } from '../../types/payments.service.types';

export class PaymentResponseDto {
  @Expose()
  public id: string;

  @Expose()
  public partnerId: string;

  @Expose()
  public amountCents: number;

  @Expose()
  public receiverAccountType: ReceiverAccountType;

  @Expose()
  public secCode: SecCode;

  @Expose()
  public effectiveDate: string;

  @Expose()
  public settlementDate: string | null;

  @Expose()
  public status: PaymentStatus;

  @Expose()
  public returnCode: string | null;

  @Expose()
  public returnDate: string | null;

  @Expose()
  public reversalReason: string | null;

  @Expose()
  public reversalDate: string | null;

  @Expose()
  public failureReason: string | null;

  @Expose()
  public createdAt: string;

  @Expose()
  public updatedAt: string;
}
