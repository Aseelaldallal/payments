/**
 * Thrown when internal or persisted state violates an invariant required for
 * the application to continue safely.
 *
 * This error represents a programming or data-integrity defect, not an
 * expected caller-correctable failure.
 */
export class InvariantViolationError extends Error {
  public constructor(
    public readonly invariant: string,
    public readonly metadata: Readonly<Record<string, string | number | boolean | null>> = {},
  ) {
    super('Invariant violation');
    this.name = 'InvariantViolationError';
  }
}
