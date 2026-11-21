export const PaymentErrorCode = {
  InvalidPaymentAmount: 'INVALID_PAYMENT_AMOUNT',
  PaymentNotFound: 'PAYMENT_NOT_FOUND',
  IllegalPaymentTransition: 'ILLEGAL_PAYMENT_TRANSITION',
  ReversalDatePrecedesSettlement: 'REVERSAL_DATE_PRECEDES_SETTLEMENT',
  ReversalWindowExpired: 'REVERSAL_WINDOW_EXPIRED',
  ReturnDatePrecedesSettlement: 'RETURN_DATE_PRECEDES_SETTLEMENT',
  StandardReturnWindowExpired: 'STANDARD_RETURN_WINDOW_EXPIRED',
  ExtendedReturnWindowExpired: 'EXTENDED_RETURN_WINDOW_EXPIRED',
  InvalidDate: 'INVALID_DATE',
} as const;

export type PaymentErrorCode = (typeof PaymentErrorCode)[keyof typeof PaymentErrorCode];

/** Safe descriptions shared by every adapter that exposes payment failures. */
const PAYMENT_ERROR_MESSAGES: Record<PaymentErrorCode, string> = {
  [PaymentErrorCode.InvalidPaymentAmount]: 'Payment amount must be a positive integer',
  [PaymentErrorCode.PaymentNotFound]: 'Payment not found',
  [PaymentErrorCode.IllegalPaymentTransition]:
    'The payment cannot move to the requested status from its current status.',
  [PaymentErrorCode.ReversalDatePrecedesSettlement]: 'Reversal date cannot precede settlement date.',
  [PaymentErrorCode.ReversalWindowExpired]: 'Reversal must occur within 5 banking days of settlement.',
  [PaymentErrorCode.ReturnDatePrecedesSettlement]: 'Return date cannot precede settlement date.',
  [PaymentErrorCode.StandardReturnWindowExpired]: 'Return must occur within 2 banking days of settlement.',
  [PaymentErrorCode.ExtendedReturnWindowExpired]: 'Return must occur within 60 calendar days of settlement.',
  [PaymentErrorCode.InvalidDate]: 'Date must be a valid YYYY-MM-DD calendar date.',
};

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
