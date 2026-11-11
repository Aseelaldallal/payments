import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { BankModule } from './bank/bank.module';

@Module({
  imports: [PaymentsModule, BankModule],
})
export class AppModule {}
