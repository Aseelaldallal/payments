import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { BankReport } from './bank-report';
import { BankService } from './bank.service';

@Controller('bank')
export class BankController {
  constructor(private readonly bank: BankService) {}

  /** The bank's daily report, delivered as one request. */
  @Post('reports')
  @HttpCode(200)
  applyReport(@Body() report: BankReport) {
    return this.bank.applyReport(report);
  }
}
