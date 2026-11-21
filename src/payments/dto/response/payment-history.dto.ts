import { Expose, Type } from 'class-transformer';
import { PaymentHistoryEntryResponseDto } from './payment-history-entry.dto';

export class PaymentHistoryResponseDto {
  @Expose()
  @Type(() => PaymentHistoryEntryResponseDto)
  public entries: PaymentHistoryEntryResponseDto[];
}
