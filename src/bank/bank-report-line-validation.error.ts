export class BankReportLineValidationError extends Error {
  constructor(public readonly rule: string) {
    super(rule);
    this.name = 'BankReportLineValidationError';
  }
}
