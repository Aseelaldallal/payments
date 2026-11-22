import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

export interface CreateInput {
  partnerId?: string;
  amountCents?: number;
  receiverAccountType?: 'consumer' | 'business';
  secCode?: 'PPD' | 'CCD' | 'WEB' | 'TEL';
  effectiveDate?: string;
}

export class Harness {
  app!: INestApplication;

  async start(): Promise<void> {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    this.app = moduleRef.createNestApplication();
    await this.app.init();
  }

  async stop(): Promise<void> {
    await this.app.close();
  }

  http() {
    return request(this.app.getHttpServer());
  }

  async create(input: CreateInput = {}) {
    const body = {
      partnerId: 'partner-alpha',
      amountCents: 1_200_000,
      receiverAccountType: 'business',
      secCode: 'CCD',
      effectiveDate: '2026-09-08',
      ...input,
    };
    const res = await this.http().post('/payments').send(body);
    expect(res.status).toBe(201);
    return res.body;
  }

  async get(id: string) {
    const res = await this.http().get(`/payments/${id}`);
    expect(res.status).toBe(200);
    return res.body;
  }

  async submit(id: string) {
    return this.http().post(`/payments/${id}/submit`).send();
  }

  async cancel(id: string) {
    return this.http().post(`/payments/${id}/cancel`).send();
  }

  /**
   * The API takes only a reason and treats the reversal as happening now, so
   * `on` moves the clock to that date for this one request.
   */
  async reverse(id: string, reason: string, on?: string) {
    const send = () => this.http().post(`/payments/${id}/reverse`).send({ reason });
    return on ? this.at(on, send) : send();
  }

  /** Runs `fn` with the system clock at noon UTC on `date`. Only Date is faked. */
  async at<T>(date: string, fn: () => PromiseLike<T> | T): Promise<T> {
    jest.useFakeTimers({
      now: new Date(`${date}T12:00:00.000Z`),
      doNotFake: [
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'requestIdleCallback',
        'cancelIdleCallback',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
    try {
      return await fn();
    } finally {
      jest.useRealTimers();
    }
  }

  async patchStatus(id: string, status: string) {
    return this.http().patch(`/payments/${id}/status`).send({ status });
  }

  async report(lines: any[], reportDate = '2026-09-08') {
    const res = await this.http().post('/bank/reports').send({ reportDate, lines });
    expect(res.status).toBe(200);
    return res.body as {
      results: Array<{
        paymentId: string;
        type: string;
        applied: boolean;
        code?: string;
        message?: string;
      }>;
    };
  }

  async history(id: string) {
    const res = await this.http().get(`/payments/${id}/history`);
    expect(res.status).toBe(200);
    // Collections come back as an object containing a named array.
    expect(Array.isArray(res.body.entries)).toBe(true);
    return res.body.entries as Array<{
      from: string | null;
      to: string;
      event: string;
      reason?: string | null;
      recordedAt: string;
    }>;
  }

  /** Create, submit, acknowledge and settle a payment on the given dates. */
  async settled(input: CreateInput = {}, settlementDate = '2026-09-08') {
    const p = await this.create({ effectiveDate: settlementDate, ...input });
    await this.submit(p.id);
    await this.report([{ type: 'ACKNOWLEDGED', paymentId: p.id, settlementDate }]);
    await this.report([{ type: 'SETTLED', paymentId: p.id, settlementDate }], settlementDate);
    const after = await this.get(p.id);
    expect(after.status).toBe('SETTLED');
    return after;
  }
}

/** A rejected transition: HTTP 409 with a code and a human-readable message. */
export function expectRejected(res: request.Response, messagePattern?: RegExp) {
  expect(res.status).toBe(409);
  expect(typeof res.body.code).toBe('string');
  expect(typeof res.body.message).toBe('string');
  expect(res.body.message.length).toBeGreaterThan(0);
  if (messagePattern) expect(res.body.message).toMatch(messagePattern);
}

/** Invalid input: HTTP 400, VALIDATION_FAILED, with the offending field named. */
export function expectInvalid(res: request.Response, field: string) {
  expect(res.status).toBe(400);
  expect(res.body.code).toBe('VALIDATION_FAILED');
  expect(res.body.errors.map((e: { field: string }) => e.field)).toContain(field);
}
