import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus } from '../payments/payment-status';
import { BankReport, BankReportLine } from './bank-report';

/**
 * Consumes the bank's daily reports and writes the result onto the payment.
 * One line, one status. Whatever the file says, the payment becomes.
 */
@Injectable()
export class BankService {
  constructor(private readonly payments: PaymentsService) {}

  applyReport(report: BankReport): { applied: number } {
    let applied = 0;
    for (const line of report.lines) {
      this.applyLine(line);
      applied += 1;
    }
    return { applied };
  }

  private applyLine(line: BankReportLine): void {
    switch (line.type) {
      case 'ACKNOWLEDGED':
        this.payments.setStatus(line.paymentId, PaymentStatus.PROCESSING, {
          settlementDate: line.settlementDate,
        });
        return;
      case 'REJECTED':
      case 'OPERATOR_REJECTED':
        this.payments.setStatus(line.paymentId, PaymentStatus.FAILED, {
          failureReason: line.reason,
        });
        return;
      case 'SETTLED':
        this.payments.setStatus(line.paymentId, PaymentStatus.SETTLED, {
          settlementDate: line.settlementDate,
        });
        return;
      case 'RETURN':
        this.payments.setStatus(line.paymentId, PaymentStatus.RETURNED, {
          returnCode: line.code,
          returnDate: line.returnDate,
        });
        return;
      case 'NOC':
        // The money moved; nothing to change on the payment. Someone should
        // update the partner's account data. Nobody does.
        return;
    }
  }
}
