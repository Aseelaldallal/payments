/**
 * What the sponsor bank tells us about entries we originated.
 *
 * The bank delivers these as lines in its daily reports. In this platform
 * they arrive as a POST to /bank/reports, one request per report, in the
 * order the bank produced them. The bank never checks return windows for
 * us; it passes on whatever the receiving bank sent.
 */
export type BankReportLine =
  | {
      /** The bank accepted the entry into a file and assigned a settlement date. */
      type: 'ACKNOWLEDGED';
      paymentId: string;
      settlementDate: string;
    }
  | {
      /** The bank refused the entry or the file it was in. Never left the bank. */
      type: 'REJECTED';
      paymentId: string;
      reason: string;
    }
  | {
      /** The operator refused the entry: bad routing number, malformed, duplicate batch. Never cleared. */
      type: 'OPERATOR_REJECTED';
      paymentId: string;
      reason: string;
    }
  | {
      /** The entry settled; the credit is on the FBO account statement for this date. */
      type: 'SETTLED';
      paymentId: string;
      settlementDate: string;
    }
  | {
      /** The receiving bank returned the entry. `returnDate` is the settlement date of the return entry. */
      type: 'RETURN';
      paymentId: string;
      code: string;
      returnDate: string;
    }
  | {
      /** The receiving bank posted the entry but says our account data is wrong. */
      type: 'NOC';
      paymentId: string;
      changeCode: string;
      correctedData: string;
    };

export interface BankReport {
  reportDate: string;
  lines: BankReportLine[];
}
