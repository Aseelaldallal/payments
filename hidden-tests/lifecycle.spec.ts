import { Harness, expectRejected } from './support';

/**
 * Project 1: the lifecycle.
 * Done when: illegal transitions are rejected, a late return is rejected
 * with the rule that blocks it, and the full history of any payment can be
 * read back in order.
 *
 * Dates used:
 *   2026-09-08  Tuesday, settlement date for most cases
 *   2026-09-10  Thursday, 2nd banking day after settlement (standard window closes)
 *   2026-09-15  Tuesday, 5th banking day after settlement (reversal window closes)
 *   2026-11-07  60 calendar days after 2026-09-08 (extended window closes)
 *   2026-11-25  Wednesday before Thanksgiving (2026-11-26 is a Fed holiday)
 */
describe('Project 1: the lifecycle', () => {
  const h = new Harness();
  beforeAll(() => h.start());
  afterAll(() => h.stop());

  describe('happy path', () => {
    it('walks CREATED, SUBMITTED, PROCESSING, SETTLED on the bank events', async () => {
      const p = await h.create();
      expect(p.status).toBe('CREATED');

      const s = await h.submit(p.id);
      expect(s.status).toBe(200);
      expect((await h.get(p.id)).status).toBe('SUBMITTED');

      const ack = await h.report([
        { type: 'ACKNOWLEDGED', paymentId: p.id, settlementDate: '2026-09-08' },
      ]);
      expect(ack.results[0].applied).toBe(true);
      const processing = await h.get(p.id);
      expect(processing.status).toBe('PROCESSING');
      expect(processing.settlementDate).toBe('2026-09-08');

      const settled = await h.report([
        { type: 'SETTLED', paymentId: p.id, settlementDate: '2026-09-08' },
      ]);
      expect(settled.results[0].applied).toBe(true);
      expect((await h.get(p.id)).status).toBe('SETTLED');
    });
  });

  describe('illegal transitions', () => {
    it('does not let the admin tool move SETTLED back to CREATED', async () => {
      const p = await h.settled();
      const res = await h.patchStatus(p.id, 'CREATED');
      expect([404, 409]).toContain(res.status);
      if (res.status === 409) expect(typeof res.body.rule).toBe('string');
      expect((await h.get(p.id)).status).toBe('SETTLED');
    });

    it('does not let the admin tool jump CREATED straight to SETTLED', async () => {
      const p = await h.create();
      const res = await h.patchStatus(p.id, 'SETTLED');
      expect([404, 409]).toContain(res.status);
      expect((await h.get(p.id)).status).toBe('CREATED');
    });

    it('ignores a SETTLED line for a payment the bank never acknowledged', async () => {
      const p = await h.create();
      await h.submit(p.id);
      const r = await h.report([
        { type: 'SETTLED', paymentId: p.id, settlementDate: '2026-09-08' },
      ]);
      expect(r.results[0].applied).toBe(false);
      expect(typeof r.results[0].rule).toBe('string');
      expect((await h.get(p.id)).status).toBe('SUBMITTED');
    });

    it('ignores a RETURN line for a payment that has not settled', async () => {
      const p = await h.create();
      await h.submit(p.id);
      await h.report([{ type: 'ACKNOWLEDGED', paymentId: p.id, settlementDate: '2026-09-08' }]);
      const r = await h.report([
        { type: 'RETURN', paymentId: p.id, code: 'R01', returnDate: '2026-09-09' },
      ]);
      expect(r.results[0].applied).toBe(false);
      expect((await h.get(p.id)).status).toBe('PROCESSING');
    });

    it('treats RETURNED as terminal', async () => {
      const p = await h.settled();
      await h.report([{ type: 'RETURN', paymentId: p.id, code: 'R01', returnDate: '2026-09-09' }]);
      expect((await h.get(p.id)).status).toBe('RETURNED');
      const again = await h.report([
        { type: 'SETTLED', paymentId: p.id, settlementDate: '2026-09-08' },
      ]);
      expect(again.results[0].applied).toBe(false);
      expect((await h.get(p.id)).status).toBe('RETURNED');
      const rev = await h.reverse(p.id, 'duplicate', '2026-09-10');
      expectRejected(rev);
    });

    it('lets us cancel from CREATED but not once the bank has acknowledged', async () => {
      const a = await h.create();
      expect((await h.cancel(a.id)).status).toBe(200);
      expect((await h.get(a.id)).status).toBe('CANCELLED');

      const b = await h.create();
      await h.submit(b.id);
      await h.report([{ type: 'ACKNOWLEDGED', paymentId: b.id, settlementDate: '2026-09-08' }]);
      expectRejected(await h.cancel(b.id));
      expect((await h.get(b.id)).status).toBe('PROCESSING');
    });

    it('fails a payment the bank rejects while SUBMITTED, and one the operator rejects while PROCESSING', async () => {
      const a = await h.create();
      await h.submit(a.id);
      const ra = await h.report([{ type: 'REJECTED', paymentId: a.id, reason: 'invalid file' }]);
      expect(ra.results[0].applied).toBe(true);
      expect((await h.get(a.id)).status).toBe('FAILED');

      const b = await h.create();
      await h.submit(b.id);
      await h.report([{ type: 'ACKNOWLEDGED', paymentId: b.id, settlementDate: '2026-09-08' }]);
      const rb = await h.report([
        { type: 'OPERATOR_REJECTED', paymentId: b.id, reason: 'invalid routing number' },
      ]);
      expect(rb.results[0].applied).toBe(true);
      expect((await h.get(b.id)).status).toBe('FAILED');

      const c = await h.create();
      const rc = await h.report([
        { type: 'REJECTED', paymentId: c.id, reason: 'nothing was sent' },
      ]);
      expect(rc.results[0].applied).toBe(false);
      expect((await h.get(c.id)).status).toBe('CREATED');
    });
  });

  describe('return windows', () => {
    it('applies a business return inside 2 banking days', async () => {
      const p = await h.settled({ receiverAccountType: 'business', secCode: 'CCD' });
      const r = await h.report([
        { type: 'RETURN', paymentId: p.id, code: 'R29', returnDate: '2026-09-10' },
      ]);
      expect(r.results[0].applied).toBe(true);
      const after = await h.get(p.id);
      expect(after.status).toBe('RETURNED');
      expect(after.returnCode).toBe('R29');
      expect(after.returnDate).toBe('2026-09-10');
    });

    it('rejects a business return on the 3rd banking day, naming the 2 banking day rule', async () => {
      const p = await h.settled({ receiverAccountType: 'business', secCode: 'CCD' });
      const r = await h.report([
        { type: 'RETURN', paymentId: p.id, code: 'R29', returnDate: '2026-09-11' },
      ]);
      expect(r.results[0].applied).toBe(false);
      expect(r.results[0].rule).toMatch(/2 banking days/i);
      const after = await h.get(p.id);
      expect(after.status).toBe('SETTLED');
      expect(after.returnCode).toBeNull();
    });

    it('gives a business account no extended window, even for a not-authorized code', async () => {
      const p = await h.settled({ receiverAccountType: 'business', secCode: 'CCD' });
      const r = await h.report([
        { type: 'RETURN', paymentId: p.id, code: 'R10', returnDate: '2026-09-14' },
      ]);
      expect(r.results[0].applied).toBe(false);
      expect(r.results[0].rule).toMatch(/2 banking days/i);
      expect((await h.get(p.id)).status).toBe('SETTLED');
    });

    it('applies a consumer R10 inside 60 calendar days', async () => {
      const p = await h.settled({ receiverAccountType: 'consumer', secCode: 'WEB' });
      const r = await h.report([
        { type: 'RETURN', paymentId: p.id, code: 'R10', returnDate: '2026-11-03' },
      ]);
      expect(r.results[0].applied).toBe(true);
      expect((await h.get(p.id)).status).toBe('RETURNED');
    });

    it('applies every extended code for a consumer: R05, R07, R10, R11', async () => {
      for (const code of ['R05', 'R07', 'R10', 'R11']) {
        const p = await h.settled({ receiverAccountType: 'consumer', secCode: 'PPD' });
        const r = await h.report([
          { type: 'RETURN', paymentId: p.id, code, returnDate: '2026-10-20' },
        ]);
        expect(r.results[0].applied).toBe(true);
        expect((await h.get(p.id)).status).toBe('RETURNED');
      }
    });

    it('rejects a consumer R10 on day 62, naming the 60 calendar day rule', async () => {
      const p = await h.settled({ receiverAccountType: 'consumer', secCode: 'WEB' });
      const r = await h.report([
        { type: 'RETURN', paymentId: p.id, code: 'R10', returnDate: '2026-11-09' },
      ]);
      expect(r.results[0].applied).toBe(false);
      expect(r.results[0].rule).toMatch(/60 calendar days/i);
      expect((await h.get(p.id)).status).toBe('SETTLED');
    });

    it('rejects a consumer R01 on the 4th banking day: money codes get only the standard window', async () => {
      const p = await h.settled({ receiverAccountType: 'consumer', secCode: 'WEB' });
      const r = await h.report([
        { type: 'RETURN', paymentId: p.id, code: 'R01', returnDate: '2026-09-14' },
      ]);
      expect(r.results[0].applied).toBe(false);
      expect(r.results[0].rule).toMatch(/2 banking days/i);
      expect((await h.get(p.id)).status).toBe('SETTLED');
    });

    it('counts banking days, not calendar days, across a Fed holiday', async () => {
      // Settles Wed 2026-11-25. Thu 11-26 is Thanksgiving. Banking day 1 is Fri 11-27, day 2 is Mon 11-30.
      const inside = await h.settled(
        { receiverAccountType: 'business', secCode: 'CCD' },
        '2026-11-25',
      );
      const r1 = await h.report([
        { type: 'RETURN', paymentId: inside.id, code: 'R01', returnDate: '2026-11-30' },
      ]);
      expect(r1.results[0].applied).toBe(true);
      expect((await h.get(inside.id)).status).toBe('RETURNED');

      const outside = await h.settled(
        { receiverAccountType: 'business', secCode: 'CCD' },
        '2026-11-25',
      );
      const r2 = await h.report([
        { type: 'RETURN', paymentId: outside.id, code: 'R01', returnDate: '2026-12-01' },
      ]);
      expect(r2.results[0].applied).toBe(false);
      expect((await h.get(outside.id)).status).toBe('SETTLED');
    });

    it('does not stop the rest of a report when one line is late', async () => {
      const late = await h.settled({ receiverAccountType: 'business', secCode: 'CCD' });
      const fine = await h.settled({ receiverAccountType: 'business', secCode: 'CCD' });
      const r = await h.report([
        { type: 'RETURN', paymentId: late.id, code: 'R29', returnDate: '2026-09-18' },
        { type: 'RETURN', paymentId: fine.id, code: 'R01', returnDate: '2026-09-09' },
      ]);
      expect(r.results.map((x) => x.applied)).toEqual([false, true]);
      expect((await h.get(late.id)).status).toBe('SETTLED');
      expect((await h.get(fine.id)).status).toBe('RETURNED');
    });
  });

  describe('reversals', () => {
    it('allows a duplicate reversal on the 5th banking day', async () => {
      const p = await h.settled();
      const res = await h.reverse(p.id, 'duplicate', '2026-09-15');
      expect(res.status).toBe(200);
      expect((await h.get(p.id)).status).toBe('REVERSED');
    });

    it('rejects a reversal on the 6th banking day, naming the 5 banking day rule', async () => {
      const p = await h.settled();
      const res = await h.reverse(p.id, 'duplicate', '2026-09-16');
      expectRejected(res, /5 banking days/i);
      expect((await h.get(p.id)).status).toBe('SETTLED');
    });

    it('rejects a reversal for a reason the rules do not allow', async () => {
      const p = await h.settled();
      const res = await h.reverse(p.id, 'customer_changed_mind', '2026-09-09');
      expectRejected(res);
      expect((await h.get(p.id)).status).toBe('SETTLED');
    });

    it('accepts each of the four permitted reasons', async () => {
      for (const reason of ['duplicate', 'wrong_amount', 'wrong_account', 'wrong_date']) {
        const p = await h.settled();
        const res = await h.reverse(p.id, reason, '2026-09-09');
        expect(res.status).toBe(200);
        expect((await h.get(p.id)).status).toBe('REVERSED');
      }
    });

    it('does not allow a reversal before settlement', async () => {
      const p = await h.create();
      await h.submit(p.id);
      await h.report([{ type: 'ACKNOWLEDGED', paymentId: p.id, settlementDate: '2026-09-08' }]);
      expectRejected(await h.reverse(p.id, 'duplicate', '2026-09-08'));
      expect((await h.get(p.id)).status).toBe('PROCESSING');
    });
  });

  describe('history', () => {
    it('reads back every transition in order with an event and a timestamp', async () => {
      const p = await h.settled({ receiverAccountType: 'business', secCode: 'CCD' });
      await h.report([{ type: 'RETURN', paymentId: p.id, code: 'R01', returnDate: '2026-09-09' }]);

      const history = await h.history(p.id);
      expect(history.map((x) => x.to)).toEqual([
        'CREATED',
        'SUBMITTED',
        'PROCESSING',
        'SETTLED',
        'RETURNED',
      ]);
      expect(history[0].from).toBeNull();
      for (let i = 1; i < history.length; i += 1) {
        expect(history[i].from).toBe(history[i - 1].to);
      }
      for (const entry of history) {
        expect(typeof entry.event).toBe('string');
        expect(entry.event.length).toBeGreaterThan(0);
        expect(Number.isNaN(Date.parse(entry.at))).toBe(false);
      }
      const times = history.map((x) => Date.parse(x.at));
      expect([...times].sort((a, b) => a - b)).toEqual(times);
    });

    it('records the return code on the RETURNED transition', async () => {
      const p = await h.settled({ receiverAccountType: 'consumer', secCode: 'WEB' });
      await h.report([{ type: 'RETURN', paymentId: p.id, code: 'R10', returnDate: '2026-10-01' }]);
      const history = await h.history(p.id);
      const last = history[history.length - 1];
      expect(last.to).toBe('RETURNED');
      expect(`${last.event} ${last.reason ?? ''}`).toMatch(/R10/);
    });

    it('does not record a rejected late return as a transition', async () => {
      const p = await h.settled({ receiverAccountType: 'business', secCode: 'CCD' });
      const before = (await h.history(p.id)).length;
      await h.report([{ type: 'RETURN', paymentId: p.id, code: 'R29', returnDate: '2026-09-25' }]);
      const after = await h.history(p.id);
      expect(after.length).toBe(before);
      expect(after[after.length - 1].to).toBe('SETTLED');
    });

    it('records a reversal with its reason', async () => {
      const p = await h.settled();
      await h.reverse(p.id, 'wrong_amount', '2026-09-10');
      const history = await h.history(p.id);
      const last = history[history.length - 1];
      expect(last.to).toBe('REVERSED');
      expect(`${last.event} ${last.reason ?? ''}`).toMatch(/wrong_amount/);
    });
  });
});
