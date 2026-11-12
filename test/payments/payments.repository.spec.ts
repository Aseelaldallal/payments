import { Payment } from '../../src/payments/payment';
import { PaymentStatus } from '../../src/payments/payment-status';
import { PaymentsRepository } from '../../src/payments/payments.repository';

describe('PaymentsRepository', () => {
  let repository: PaymentsRepository;

  beforeEach(() => {
    repository = new PaymentsRepository();
  });

  describe('create', () => {
    it('stores the payment', () => {
      const payment = buildPayment(PaymentStatus.CREATED);

      repository.create(payment);

      expect(repository.findById(payment.id)).toBe(payment);
    });
  });

  describe('findById', () => {
    it('returns undefined when the payment does not exist', () => {
      expect(repository.findById('missing-payment')).toBeUndefined();
    });
  });

  describe('update', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns undefined when the payment does not exist', () => {
      expect(
        repository.update('missing-payment', {
          status: PaymentStatus.SUBMITTED,
        }),
      ).toBeUndefined();
    });

    it('returns the updated payment', () => {
      const payment = buildPayment(PaymentStatus.CREATED);
      repository.create(payment);

      const updated = repository.update(payment.id, {
        status: PaymentStatus.SUBMITTED,
      });

      expect(updated?.status).toBe(PaymentStatus.SUBMITTED);
    });

    it('persists the updated payment', () => {
      const payment = buildPayment(PaymentStatus.CREATED);
      repository.create(payment);

      repository.update(payment.id, {
        status: PaymentStatus.SUBMITTED,
      });

      expect(repository.findById(payment.id)?.status).toBe(PaymentStatus.SUBMITTED);
    });

    it('sets updatedAt to the update time', () => {
      const updateTime = new Date('2026-09-02T00:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(updateTime);
      const payment = buildPayment(PaymentStatus.CREATED);
      repository.create(payment);

      const updated = repository.update(payment.id, {
        status: PaymentStatus.SUBMITTED,
      });

      expect(updated?.updatedAt).toBe(updateTime.toISOString());
    });
  });
});

const buildPayment = (status: PaymentStatus): Payment => {
  return {
    id: 'payment-1',
    partnerId: 'partner-1',
    amountCents: 1000,
    receiverAccountType: 'business',
    secCode: 'CCD',
    effectiveDate: '2026-09-08',
    settlementDate: null,
    status,
    returnCode: null,
    returnDate: null,
    reversalReason: null,
    reversalDate: null,
    failureReason: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };
};
