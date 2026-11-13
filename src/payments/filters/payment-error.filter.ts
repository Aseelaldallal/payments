import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentError, PaymentErrorCode } from '../errors/payment.error';

interface PaymentErrorResponse {
  statusCode: HttpStatus;
  message: string;
  rule?: string;
}

/**
 * The only place where client-facing payment error text is defined.
 * Every payment error code must have an entry.
 */
const PAYMENT_ERROR_RESPONSES: Record<PaymentErrorCode, PaymentErrorResponse> = {
  [PaymentErrorCode.InvalidPaymentAmount]: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Payment amount must be a positive integer',
  },
  [PaymentErrorCode.PaymentNotFound]: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Payment not found',
  },
  [PaymentErrorCode.IllegalPaymentTransition]: {
    statusCode: HttpStatus.CONFLICT,
    message: 'The payment cannot move to the requested status from its current status.',
    rule: 'Illegal payment status transition',
  },
  [PaymentErrorCode.ReversalDatePrecedesSettlement]: {
    statusCode: HttpStatus.CONFLICT,
    message: 'The reversal cannot be applied.',
    rule: 'Reversal date cannot precede settlement date.',
  },
  [PaymentErrorCode.ReversalWindowExpired]: {
    statusCode: HttpStatus.CONFLICT,
    message: 'The reversal cannot be applied.',
    rule: 'Reversal must occur within 5 banking days of settlement.',
  },
  [PaymentErrorCode.ReturnDatePrecedesSettlement]: {
    statusCode: HttpStatus.CONFLICT,
    message: 'The return cannot be applied.',
    rule: 'Return date cannot precede settlement date.',
  },
  [PaymentErrorCode.StandardReturnWindowExpired]: {
    statusCode: HttpStatus.CONFLICT,
    message: 'The return cannot be applied.',
    rule: 'Return must occur within 2 banking days of settlement.',
  },
  [PaymentErrorCode.ExtendedReturnWindowExpired]: {
    statusCode: HttpStatus.CONFLICT,
    message: 'The return cannot be applied.',
    rule: 'Return must occur within 60 calendar days of settlement.',
  },
  [PaymentErrorCode.SettlementDateRequired]: {
    statusCode: HttpStatus.CONFLICT,
    message: 'The payment cannot be settled.',
    rule: 'Settlement date is required.',
  },
};

@Catch(PaymentError)
export class PaymentErrorFilter implements ExceptionFilter {
  public catch(exception: PaymentError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, message, rule } = PAYMENT_ERROR_RESPONSES[exception.code];

    response.status(statusCode).json({
      statusCode,
      code: exception.code,
      message,
      ...(rule ? { rule } : {}),
    });
  }
}
