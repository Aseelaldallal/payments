import { Expose } from 'class-transformer';

export class BankReportLineResultResponseDto {
  @Expose()
  public paymentId: string;

  @Expose()
  public type: string;

  @Expose()
  public applied: boolean;

  @Expose()
  public code?: string;

  @Expose()
  public message?: string;
}
