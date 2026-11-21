/* -------------------------------------------------------------
 * Outputs
 * ------------------------------------------------------------- */

export interface BankReportLineResult {
  paymentId: string;
  type: string;
  applied: boolean;
  rule?: string;
}
