import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { InvalidPaymentAmountError } from '../errors/invalid-payment-amount.error';

@Catch(InvalidPaymentAmountError)
export class InvalidPaymentAmountFilter implements ExceptionFilter {
  public catch(_exception: InvalidPaymentAmountError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'INVALID_PAYMENT_AMOUNT',
      message: 'Payment amount must be a positive integer',
    });
  }
}
