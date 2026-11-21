import { Expose } from 'class-transformer';
import { PaymentEvent } from '../domain/payment-event.enum';
import { PaymentStatus } from '../domain/payment-status.enum';

export class PaymentHistoryEntryResponseDto {
  @Expose()
  public from: PaymentStatus | null;

  @Expose()
  public to: PaymentStatus;

  @Expose()
  public event: PaymentEvent;

  @Expose()
  public reason: string | null;

  @Expose()
  public recordedAt: string;
}
