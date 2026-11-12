import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { BankReport, BankReportLine } from './bank-report';
import { BankReportLineValidationError } from './bank-report-line-validation.error';

export interface BankReportLineResult {
  paymentId: string;
  type: string;
  applied: boolean;
  rule?: string;
}

export interface BankReportResult {
  results: BankReportLineResult[];
}

/**
 * Consumes the bank's daily reports and applies each line independently.
 * A rejected line is reported without stopping the lines that follow it.
 */
@Injectable()
export class BankService {
  public constructor(private readonly payments: PaymentsService) {}

  /**
   * Processes each line independently so a rejected line does not stop later lines.
   *
   * @param report The bank report to process.
   * @returns Per-line application outcomes in the bank-provided order.
   */
  public applyReport(report: BankReport): BankReportResult {
    return {
      results: report.lines.map((line) => this.processLine(line)),
    };
  }

  private processLine(line: BankReportLine): BankReportLineResult {
    const paymentId =
      typeof line?.paymentId === 'string' && line.paymentId ? line.paymentId : 'UNKNOWN';
    const type = typeof line?.type === 'string' && line.type ? line.type : 'UNKNOWN';

    try {
      this.applyLine(line);
      return {
        paymentId,
        type,
        applied: true,
      };
    } catch (error) {
      return {
        paymentId,
        type,
        applied: false,
        rule: this.getRule(error),
      };
    }
  }

  private applyLine(line: BankReportLine): void {
    if (!line || typeof line !== 'object') {
      throw new BankReportLineValidationError('Malformed bank report line: expected an object');
    }

    this.assertRequiredString(line.paymentId, 'paymentId', line.type);

    const lineType: unknown = line.type;
    switch (line.type) {
      case 'ACKNOWLEDGED':
        this.assertRequiredString(line.settlementDate, 'settlementDate', line.type);
        this.payments.acknowledge(line.paymentId, line.settlementDate);
        return;
      case 'REJECTED':
      case 'OPERATOR_REJECTED':
        this.assertRequiredString(line.reason, 'reason', line.type);
        this.payments.fail(line.paymentId, line.reason);
        return;
      case 'SETTLED':
        this.assertRequiredString(line.settlementDate, 'settlementDate', line.type);
        this.payments.settle(line.paymentId, line.settlementDate);
        return;
      case 'RETURN':
        this.assertRequiredString(line.code, 'code', line.type);
        this.assertRequiredString(line.returnDate, 'returnDate', line.type);
        this.payments.return(line.paymentId, line.code, line.returnDate);
        return;
      case 'NOC':
        // The money moved; nothing to change on the payment. Someone should
        // update the partner's account data. Nobody does.
        return;
      default:
        throw new BankReportLineValidationError(
          `Malformed bank report line: unknown type ${String(lineType)}`,
        );
    }
  }

  private assertRequiredString(value: unknown, field: string, lineType: unknown): void {
    const type = typeof lineType === 'string' && lineType ? lineType : 'UNKNOWN';
    if (value === undefined || value === null || value === '') {
      throw new BankReportLineValidationError(`Malformed ${type} line: ${field} is required`);
    }
    if (typeof value !== 'string') {
      throw new BankReportLineValidationError(`Malformed ${type} line: ${field} must be a string`);
    }
  }

  private getRule(error: unknown): string {
    if (error instanceof BankReportLineValidationError) {
      return error.rule;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unable to apply bank report line';
  }
}
