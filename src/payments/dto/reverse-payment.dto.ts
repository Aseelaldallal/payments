import { IsIn } from 'class-validator';
import { REVERSAL_REASONS, ReversalReason } from '../domain/reversal-reason';

export class ReversePaymentDto {
  /** Reason for originating the reversing entry. */
  @IsIn(REVERSAL_REASONS)
  public reason: ReversalReason;
}
