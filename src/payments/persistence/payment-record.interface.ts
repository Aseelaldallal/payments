import { Payment } from '../types/payments.service.types';

/**
 * Current in-memory persistence shape.
 *
 * This will change when we build a proper DB implementation
 */
export interface PaymentRecord extends Payment {}
