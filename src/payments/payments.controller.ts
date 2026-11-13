import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { PaymentErrorFilter } from './filters/payment-error.filter';

@UseFilters(PaymentErrorFilter)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(@Body() body: CreatePaymentDto) {
    return this.payments.create(body);
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.payments.get(id);
  }

  /** Sweep: the entry has been handed to the bank in the file. */
  @Post(':id/submit')
  @HttpCode(200)
  submit(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.payments.submit(id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.payments.cancel(id);
  }

  @Post(':id/reverse')
  @HttpCode(200)
  reverse(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ReversePaymentDto,
  ) {
    return this.payments.reverse(id, body.reason);
  }
}
