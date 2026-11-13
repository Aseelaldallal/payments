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

type PaymentErrorMetadata = Readonly<Record<string, string | number | boolean | null>>;

export class PaymentError extends Error {
  public constructor(
    public readonly code: PaymentErrorCode,
    public readonly metadata: PaymentErrorMetadata,
  ) {
    super(code);
    this.name = 'PaymentError';
  }
}
