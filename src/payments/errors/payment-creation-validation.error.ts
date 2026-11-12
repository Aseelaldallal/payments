/**
 * Thrown when data supplied to create a payment violates a payment creation invariant.
 */
export class PaymentCreationValidationError extends Error {
  public constructor(
    message: string,
    public readonly metadata: Readonly<Record<string, string | number | boolean | null>> = {},
  ) {
    super(message);
    this.name = 'PaymentCreationValidationError';
  }
}
