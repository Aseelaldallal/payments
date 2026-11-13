/**
 * Thrown when a payment amount is not a positive integer number of cents.
 */
export class InvalidPaymentAmountError extends Error {
  public constructor(public readonly amountCents: number) {
    super('Invalid payment amount');
    this.name = 'InvalidPaymentAmountError';
  }
}
