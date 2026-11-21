import { IsArray, IsDateString, Matches } from 'class-validator';
import type { BankReportLine } from '../../bank-report';

export class BankReportRequestDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  public reportDate: string;

  @IsArray()
  public lines: BankReportLine[];
}
