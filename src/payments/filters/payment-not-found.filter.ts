import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentNotFoundError } from '../errors/payment-not-found.error';

@Catch(PaymentNotFoundError)
export class PaymentNotFoundFilter implements ExceptionFilter {
  public catch(_exception: PaymentNotFoundError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      code: 'PAYMENT_NOT_FOUND',
      message: 'Payment not found',
    });
  }
}
