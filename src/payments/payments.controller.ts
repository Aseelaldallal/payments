import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  SerializeOptions,
  UseFilters,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentRequestDto } from './dto/request/create-payment.dto';
import { ReversePaymentRequestDto } from './dto/request/reverse-payment.dto';
import { PaymentHistoryResponseDto } from './dto/response/payment-history.dto';
import { PaymentResponseDto } from './dto/response/payment.dto';
import { PaymentErrorFilter } from './filters/payment-error.filter';

@UseFilters(PaymentErrorFilter)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @SerializeOptions({ type: PaymentResponseDto })
  create(@Body() body: CreatePaymentRequestDto) {
    return this.payments.create(body);
  }

  @Get(':id/history')
  @SerializeOptions({ type: PaymentHistoryResponseDto })
  getHistory(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return {
      entries: this.payments.getHistory(id),
    };
  }

  @Get(':id')
  @SerializeOptions({ type: PaymentResponseDto })
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.payments.get(id);
  }

  /** Sweep: the entry has been handed to the bank in the file. */
  @Post(':id/submit')
  @HttpCode(200)
  @SerializeOptions({ type: PaymentResponseDto })
  submit(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.payments.submit(id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @SerializeOptions({ type: PaymentResponseDto })
  cancel(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.payments.cancel(id);
  }

  @Post(':id/reverse')
  @HttpCode(200)
  @SerializeOptions({ type: PaymentResponseDto })
  reverse(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() body: ReversePaymentRequestDto) {
    return this.payments.reverse(id, body.reason);
  }
}
