import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentCreationValidationError } from '../errors/payment-creation-validation.error';

@Catch(PaymentCreationValidationError)
export class PaymentCreationValidationFilter implements ExceptionFilter {
  public catch(exception: PaymentCreationValidationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: exception.message,
    });
  }
}
