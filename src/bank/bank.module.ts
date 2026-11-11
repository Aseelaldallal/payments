import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';

@Module({
  imports: [PaymentsModule],
  controllers: [BankController],
  providers: [BankService],
})
export class BankModule {}
