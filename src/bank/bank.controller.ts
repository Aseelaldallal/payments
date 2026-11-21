import { Body, Controller, HttpCode, Post, SerializeOptions } from '@nestjs/common';
import { BankService } from './bank.service';
import { BankReportRequestDto } from './dto/request/bank-report.dto';
import { BankReportResponseDto } from './dto/response/bank-report.dto';

@Controller('bank')
export class BankController {
  constructor(private readonly bank: BankService) {}

  /** The bank's daily report, delivered as one request. */
  @Post('reports')
  @HttpCode(200)
  @SerializeOptions({ type: BankReportResponseDto })
  applyReport(@Body() report: BankReportRequestDto) {
    return {
      results: this.bank.applyReport(report),
    };
  }
}
