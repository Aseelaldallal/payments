import { Expose, Type } from 'class-transformer';
import { BankReportLineResultResponseDto } from './bank-report-line-result.dto';

export class BankReportResponseDto {
  @Expose()
  @Type(() => BankReportLineResultResponseDto)
  public results: BankReportLineResultResponseDto[];
}
