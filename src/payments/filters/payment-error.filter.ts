import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AchWindowPolicyError, AchWindowPolicyErrorCode } from '../../ach/errors/ach-window-policy.error';
import { PaymentError, PaymentErrorCode } from '../errors/payment.error';

/** HTTP status assigned to each transport-neutral payment failure. */
const PAYMENT_ERROR_STATUSES: Record<PaymentErrorCode | AchWindowPolicyErrorCode, HttpStatus> = {
  [PaymentErrorCode.INVALID_PAYMENT_AMOUNT]: HttpStatus.BAD_REQUEST,
  [PaymentErrorCode.PAYMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [PaymentErrorCode.ILLEGAL_PAYMENT_TRANSITION]: HttpStatus.CONFLICT,
  [PaymentErrorCode.INVALID_DATE]: HttpStatus.BAD_REQUEST,
  [AchWindowPolicyErrorCode.REVERSAL_DATE_PRECEDES_SETTLEMENT]: HttpStatus.CONFLICT,
  [AchWindowPolicyErrorCode.REVERSAL_WINDOW_EXPIRED]: HttpStatus.CONFLICT,
  [AchWindowPolicyErrorCode.RETURN_DATE_PRECEDES_SETTLEMENT]: HttpStatus.CONFLICT,
  [AchWindowPolicyErrorCode.STANDARD_RETURN_WINDOW_EXPIRED]: HttpStatus.CONFLICT,
  [AchWindowPolicyErrorCode.EXTENDED_RETURN_WINDOW_EXPIRED]: HttpStatus.CONFLICT,
};

@Catch(PaymentError, AchWindowPolicyError)
export class PaymentErrorFilter implements ExceptionFilter {
  public catch(exception: PaymentError | AchWindowPolicyError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = PAYMENT_ERROR_STATUSES[exception.code];

    response.status(statusCode).json({
      statusCode,
      code: exception.code,
      message: exception.message,
    });
  }
}
