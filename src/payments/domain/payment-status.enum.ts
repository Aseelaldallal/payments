export enum PaymentStatus {
  CREATED = 'CREATED',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  SETTLED = 'SETTLED',
  RETURNED = 'RETURNED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

export const ALL_STATUSES: PaymentStatus[] = Object.values(PaymentStatus);
