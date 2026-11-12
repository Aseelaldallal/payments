/**
 * Normalized reasons currently permitted when originating an ACH reversal.
 */
export const REVERSAL_REASONS = [
  'duplicate',
  'wrong_amount',
  'wrong_account',
  'wrong_date',
] as const;

export type ReversalReason = (typeof REVERSAL_REASONS)[number];
