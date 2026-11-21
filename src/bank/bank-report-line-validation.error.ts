export class BankReportLineValidationError extends Error {
  public readonly code = 'MALFORMED_REPORT_LINE';

  public constructor(message: string) {
    super(message);
    this.name = 'BankReportLineValidationError';
  }
}
