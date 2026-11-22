/* -------------------------------------------------------------
 * Codes
 * ------------------------------------------------------------- */

export enum AchWindowPolicyErrorCode {
  REVERSAL_DATE_PRECEDES_SETTLEMENT = 'REVERSAL_DATE_PRECEDES_SETTLEMENT',
  REVERSAL_WINDOW_EXPIRED = 'REVERSAL_WINDOW_EXPIRED',
  RETURN_DATE_PRECEDES_SETTLEMENT = 'RETURN_DATE_PRECEDES_SETTLEMENT',
  STANDARD_RETURN_WINDOW_EXPIRED = 'STANDARD_RETURN_WINDOW_EXPIRED',
  EXTENDED_RETURN_WINDOW_EXPIRED = 'EXTENDED_RETURN_WINDOW_EXPIRED',
}

/* -------------------------------------------------------------
 * Messages
 * ------------------------------------------------------------- */

const ACH_WINDOW_POLICY_ERROR_MESSAGES: Record<AchWindowPolicyErrorCode, string> = {
  [AchWindowPolicyErrorCode.REVERSAL_DATE_PRECEDES_SETTLEMENT]: 'Reversal date cannot precede settlement date.',
  [AchWindowPolicyErrorCode.REVERSAL_WINDOW_EXPIRED]: 'Reversal must occur within 5 banking days of settlement.',
  [AchWindowPolicyErrorCode.RETURN_DATE_PRECEDES_SETTLEMENT]: 'Return date cannot precede settlement date.',
  [AchWindowPolicyErrorCode.STANDARD_RETURN_WINDOW_EXPIRED]: 'Return must occur within 2 banking days of settlement.',
  [AchWindowPolicyErrorCode.EXTENDED_RETURN_WINDOW_EXPIRED]: 'Return must occur within 60 calendar days of settlement.',
};

/* -------------------------------------------------------------
 * Error
 * ------------------------------------------------------------- */

type AchWindowPolicyErrorMetadata = Readonly<Record<string, string | number | boolean | null>>;

export class AchWindowPolicyError extends Error {
  public constructor(
    public readonly code: AchWindowPolicyErrorCode,
    public readonly metadata: AchWindowPolicyErrorMetadata,
  ) {
    super(ACH_WINDOW_POLICY_ERROR_MESSAGES[code]);
    this.name = 'AchWindowPolicyError';
  }
}
