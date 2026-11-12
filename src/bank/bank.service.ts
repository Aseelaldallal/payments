import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { BankReport, BankReportLine } from './bank-report';

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
  constructor(private readonly payments: PaymentsService) {}

  applyReport(report: BankReport): BankReportResult {
    const results = report.lines.map<BankReportLineResult>((line) => {
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
          rule: error instanceof Error ? error.message : 'Unable to apply bank report line',
        };
      }
    });
    return { results };
  }

  private applyLine(line: BankReportLine): void {
    if (!line || typeof line !== 'object') {
      throw new Error('Malformed bank report line: expected an object');
    }
    if (line.paymentId === undefined || line.paymentId === null || line.paymentId === '') {
      throw new Error('Malformed bank report line: paymentId is required');
    }
    if (typeof line.paymentId !== 'string') {
      throw new Error('Malformed bank report line: paymentId must be a string');
    }

    const lineType: unknown = line.type;
    switch (line.type) {
      case 'ACKNOWLEDGED':
        if (
          line.settlementDate === undefined ||
          line.settlementDate === null ||
          line.settlementDate === ''
        ) {
          throw new Error('Malformed ACKNOWLEDGED line: settlementDate is required');
        }
        if (typeof line.settlementDate !== 'string') {
          throw new Error('Malformed ACKNOWLEDGED line: settlementDate must be a string');
        }
        this.payments.acknowledge(line.paymentId, line.settlementDate);
        return;
      case 'REJECTED':
      case 'OPERATOR_REJECTED':
        if (line.reason === undefined || line.reason === null || line.reason === '') {
          throw new Error(`Malformed ${line.type} line: reason is required`);
        }
        if (typeof line.reason !== 'string') {
          throw new Error(`Malformed ${line.type} line: reason must be a string`);
        }
        this.payments.fail(line.paymentId, line.reason);
        return;
      case 'SETTLED':
        if (
          line.settlementDate === undefined ||
          line.settlementDate === null ||
          line.settlementDate === ''
        ) {
          throw new Error('Malformed SETTLED line: settlementDate is required');
        }
        if (typeof line.settlementDate !== 'string') {
          throw new Error('Malformed SETTLED line: settlementDate must be a string');
        }
        this.payments.settle(line.paymentId, line.settlementDate);
        return;
      case 'RETURN':
        if (line.code === undefined || line.code === null || line.code === '') {
          throw new Error('Malformed RETURN line: code is required');
        }
        if (typeof line.code !== 'string') {
          throw new Error('Malformed RETURN line: code must be a string');
        }
        if (line.returnDate === undefined || line.returnDate === null || line.returnDate === '') {
          throw new Error('Malformed RETURN line: returnDate is required');
        }
        if (typeof line.returnDate !== 'string') {
          throw new Error('Malformed RETURN line: returnDate must be a string');
        }
        this.payments.return(line.paymentId, line.code, line.returnDate);
        return;
      case 'NOC':
        // The money moved; nothing to change on the payment. Someone should
        // update the partner's account data. Nobody does.
        return;
      default:
        throw new Error(`Malformed bank report line: unknown type ${String(lineType)}`);
    }
  }
}
