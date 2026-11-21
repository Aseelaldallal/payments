/* -------------------------------------------------------------
 * Outputs
 * ------------------------------------------------------------- */

export type BankReportLineResult =
  | {
      paymentId: string;
      type: string;
      applied: true;
    }
  | {
      paymentId: string;
      type: string;
      applied: false;
      code: string;
      message: string;
    };
