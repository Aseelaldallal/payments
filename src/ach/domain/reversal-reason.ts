export enum ReversalReason {
  DUPLICATE = 'duplicate',
  WRONG_AMOUNT = 'wrong_amount',
  WRONG_ACCOUNT = 'wrong_account',
  WRONG_DATE = 'wrong_date',
}

/** Normalized reasons currently permitted when originating an ACH reversal. */
export const REVERSAL_REASONS = Object.values(ReversalReason);
