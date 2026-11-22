/* -------------------------------------------------------------
 * Codes
 * ------------------------------------------------------------- */

export enum PaymentErrorCode {
  INVALID_PAYMENT_AMOUNT = 'INVALID_PAYMENT_AMOUNT',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  ILLEGAL_PAYMENT_TRANSITION = 'ILLEGAL_PAYMENT_TRANSITION',
  INVALID_DATE = 'INVALID_DATE',
}

/* -------------------------------------------------------------
 * Messages
 * ------------------------------------------------------------- */

const PAYMENT_ERROR_MESSAGES: Record<PaymentErrorCode, string> = {
  [PaymentErrorCode.INVALID_PAYMENT_AMOUNT]: 'Payment amount must be a positive integer',
  [PaymentErrorCode.PAYMENT_NOT_FOUND]: 'Payment not found',
  [PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION]:
    'The payment cannot move to the requested status from its current status.',
  [PaymentErrorCode.INVALID_DATE]: 'Date must be a valid YYYY-MM-DD calendar date.',
};

/* -------------------------------------------------------------
 * Error
 * ------------------------------------------------------------- */

type PaymentErrorMetadata = Readonly<Record<string, string | number | boolean | null>>;

export class PaymentError extends Error {
  public constructor(
    public readonly code: PaymentErrorCode,
    public readonly metadata: PaymentErrorMetadata,
  ) {
    super(PAYMENT_ERROR_MESSAGES[code]);
    this.name = 'PaymentError';
  }
}
