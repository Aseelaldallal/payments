/**
 * Thrown when an operation requires a payment that does not exist.
 */
export class PaymentNotFoundError extends Error {
  public constructor(public readonly paymentId: string) {
    super('Payment not found');
    this.name = 'PaymentNotFoundError';
  }
}
