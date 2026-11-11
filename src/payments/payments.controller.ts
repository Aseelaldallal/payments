import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CreatePaymentInput, PaymentsService } from './payments.service';
import { PaymentStatus } from './payment-status';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  create(@Body() body: CreatePaymentInput) {
    return this.payments.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.payments.get(id);
  }

  /** Sweep: the entry has been handed to the bank in the file. */
  @Post(':id/submit')
  @HttpCode(200)
  submit(@Param('id') id: string) {
    return this.payments.submit(id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string) {
    return this.payments.cancel(id);
  }

  @Post(':id/reverse')
  @HttpCode(200)
  reverse(@Param('id') id: string, @Body() body: { reason: string }) {
    // TODO: Pass the effective reversal date from the request.
    // return this.payments.reverse(id, body?.reason ?? '');
  }

  /** Admin tool: set the status to whatever ops says it should be. */
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: { status: PaymentStatus }) {
    return this.payments.setStatus(id, body.status);
  }
}
