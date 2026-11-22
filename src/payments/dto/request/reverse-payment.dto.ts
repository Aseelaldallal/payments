import { IsIn } from 'class-validator';
import { REVERSAL_REASONS, ReversalReason } from '../../../ach/domain/reversal-reason';

export class ReversePaymentRequestDto {
  /** Reason for originating the reversing entry. */
  @IsIn(REVERSAL_REASONS)
  public reason: ReversalReason;
}
