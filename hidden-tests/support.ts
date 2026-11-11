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

  async reverse(id: string, reason: string, date: string) {
    return this.http().post(`/payments/${id}/reverse`).send({ reason, date });
  }

  async patchStatus(id: string, status: string) {
    return this.http().patch(`/payments/${id}/status`).send({ status });
  }

  async report(lines: any[], reportDate = '2026-09-08') {
    const res = await this.http().post('/bank/reports').send({ reportDate, lines });
    expect(res.status).toBe(200);
    return res.body as {
      results: Array<{ paymentId: string; type: string; applied: boolean; rule?: string }>;
    };
  }

  async history(id: string) {
    const res = await this.http().get(`/payments/${id}/history`);
    expect(res.status).toBe(200);
    return res.body as Array<{
      from: string | null;
      to: string;
      event: string;
      reason?: string | null;
      at: string;
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

/** A rejected transition: HTTP 409 with a human-readable rule. */
export function expectRejected(res: request.Response, rulePattern?: RegExp) {
  expect(res.status).toBe(409);
  expect(typeof res.body.rule).toBe('string');
  expect(res.body.rule.length).toBeGreaterThan(0);
  if (rulePattern) expect(res.body.rule).toMatch(rulePattern);
}
