import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Payment, ReceiverAccountType, SecCode } from './payment';
import { PaymentStatus, ALL_STATUSES } from './payment-status';
import { PaymentsRepository } from './payments.repository';

export interface CreatePaymentInput {
  partnerId: string;
  amountCents: number;
  receiverAccountType: ReceiverAccountType;
  secCode: SecCode;
  effectiveDate: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly repo: PaymentsRepository) {}

  create(input: CreatePaymentInput): Payment {
    if (!input.partnerId) throw new BadRequestException('partnerId is required');
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    if (input.receiverAccountType !== 'consumer' && input.receiverAccountType !== 'business') {
      throw new BadRequestException('receiverAccountType must be consumer or business');
    }
    if (!['PPD', 'CCD', 'WEB', 'TEL'].includes(input.secCode)) {
      throw new BadRequestException('secCode must be one of PPD, CCD, WEB, TEL');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)) {
      throw new BadRequestException('effectiveDate must be an ISO date');
    }
    const now = new Date().toISOString();
    const payment: Payment = {
      id: randomUUID(),
      partnerId: input.partnerId,
      amountCents: input.amountCents,
      receiverAccountType: input.receiverAccountType,
      secCode: input.secCode,
      effectiveDate: input.effectiveDate,
      settlementDate: null,
      status: PaymentStatus.CREATED,
      returnCode: null,
      returnDate: null,
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(payment);
  }

  get(id: string): Payment {
    return this.repo.findById(id);
  }

  /**
   * Sets the status. Any status, from any status. This is how every
   * status on every payment has been written since the service was built:
   * the sweep calls it when it hands a file to the bank, the bank report
   * consumer calls it with whatever the file says, and ops call it from
   * the admin tool when something looks wrong.
   */
  setStatus(id: string, status: PaymentStatus, patch: Partial<Payment> = {}): Payment {
    if (!ALL_STATUSES.includes(status)) {
      throw new BadRequestException(`Unknown status ${status}`);
    }
    const payment = this.repo.findById(id);
    Object.assign(payment, patch, { status, updatedAt: new Date().toISOString() });
    return this.repo.save(payment);
  }

  /** The sweep calls this when the entry has been put in the file for the bank. */
  submit(id: string): Payment {
    return this.setStatus(id, PaymentStatus.SUBMITTED);
  }

  cancel(id: string): Payment {
    return this.setStatus(id, PaymentStatus.CANCELLED);
  }

  reverse(id: string, reason: string): Payment {
    return this.setStatus(id, PaymentStatus.REVERSED, { failureReason: reason });
  }
}
