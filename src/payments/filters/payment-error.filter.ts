import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentError, PaymentErrorCode } from '../errors/payment.error';

/** HTTP status assigned to each transport-neutral payment failure. */
const PAYMENT_ERROR_STATUSES: Record<PaymentErrorCode, HttpStatus> = {
  [PaymentErrorCode.InvalidPaymentAmount]: HttpStatus.BAD_REQUEST,
  [PaymentErrorCode.PaymentNotFound]: HttpStatus.NOT_FOUND,
  [PaymentErrorCode.IllegalPaymentTransition]: HttpStatus.CONFLICT,
  [PaymentErrorCode.ReversalDatePrecedesSettlement]: HttpStatus.CONFLICT,
  [PaymentErrorCode.ReversalWindowExpired]: HttpStatus.CONFLICT,
  [PaymentErrorCode.ReturnDatePrecedesSettlement]: HttpStatus.CONFLICT,
  [PaymentErrorCode.StandardReturnWindowExpired]: HttpStatus.CONFLICT,
  [PaymentErrorCode.ExtendedReturnWindowExpired]: HttpStatus.CONFLICT,
  [PaymentErrorCode.InvalidDate]: HttpStatus.BAD_REQUEST,
};

@Catch(PaymentError)
export class PaymentErrorFilter implements ExceptionFilter {
  public catch(exception: PaymentError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = PAYMENT_ERROR_STATUSES[exception.code];

    response.status(statusCode).json({
      statusCode,
      code: exception.code,
      message: exception.message,
    });
  }
}
