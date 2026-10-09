import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError, createApi } from '../src/api/client.ts';
import type { PaymentInput } from '../src/api/types.ts';

const payload: PaymentInput = { name: 'Rent', category: 'rent', amount: 1850, currency: 'USD', interval_months: 1, start_date: '2026-10-10', end_date: null, note: null };
const errorKind = (kind: string) => (error: unknown) => error instanceof ApiError && error.kind === kind;

test('overview sends the selected month, local today and bearer header', async () => {
  const data = { month: '2026-10', totals: [{ currency: 'USD', amount: 1850 }], items: [], next: null };
  const api = createApi('http://localhost:8000/', 'test-only', async (url, options) => {
    assert.equal(String(url), 'http://localhost:8000/api/overview?month=2026-10&today=2026-10-07');
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-only');
    assert.equal(options?.redirect, 'error');
    return Response.json(data);
  });
  assert.deepEqual(await api.overview('2026-10', '2026-10-07'), data);
});

test('CRUD sends the complete payment payload and uses separate read-only subscription endpoint', async () => {
  const calls: [string, string | undefined, unknown][] = [];
  const api = createApi('http://localhost:8000', 'test-only', async (url, options) => {
    calls.push([String(url), options?.method, options?.body ? JSON.parse(String(options.body)) : null]);
    return Response.json({ id: 12, ...payload });
  });
  await api.save(payload);
  await api.save({ ...payload, name: 'Updated' }, 12);
  await api.remove(12);
  await api.payments();
  await api.subscriptions();
  assert.deepEqual(calls.map(([url, method]) => [url.replace('http://localhost:8000', ''), method]), [
    ['/api/payments', 'POST'], ['/api/payments/12', 'PUT'], ['/api/payments/12', 'DELETE'], ['/api/payments', 'GET'], ['/api/subscriptions', 'GET'],
  ]);
  assert.deepEqual(calls[0]?.[2], payload);
  assert.deepEqual(calls[1]?.[2], { ...payload, name: 'Updated' });
});

test('HTTP errors never expose server details to the interface', async () => {
  for (const [status, kind] of [[401, 'unauthorized'], [403, 'unauthorized'], [404, 'notFound'], [500, 'server']] as const) {
    const api = createApi('http://localhost:8000', 'test-only', async () => Response.json({ detail: 'private-database-error' }, { status }));
    await assert.rejects(api.payments(), error => errorKind(kind)(error) && !(error as Error).message.includes('private'));
  }
});

test('validation errors retain field names, including several failed fields', async () => {
  const api = createApi('http://localhost:8000', 'test-only', async () => Response.json({ detail: [{ loc: ['body', 'amount'], msg: 'private' }, { loc: ['body', 'start_date'] }, { loc: ['body'] }] }, { status: 422 }));
  await assert.rejects(api.save(payload), error => error instanceof ApiError && error.kind === 'validation' && JSON.stringify(error.fields) === '["amount","start_date"]');
});

test('network failure is reported without automatically retrying a write', async () => {
  let attempts = 0;
  const api = createApi('http://localhost:8000', 'test-only', async () => { attempts++; throw new TypeError('Failed to fetch'); });
  await assert.rejects(api.save(payload), errorKind('network'));
  assert.equal(attempts, 1);
});

test('slow requests time out and abort the transport', async () => {
  const api = createApi('http://localhost:8000', 'test-only', async (_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }), 10);
  await assert.rejects(api.payments(), errorKind('timeout'));
});

test('switching months can cancel old requests without reporting an offline error', async () => {
  const controller = new AbortController();
  const api = createApi('http://localhost:8000', 'test-only', async (_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }));
  const pending = api.overview('2026-10', '2026-10-07', controller.signal);
  controller.abort();
  await assert.rejects(pending, errorKind('cancelled'));
  await assert.rejects(api.payments(controller.signal), errorKind('cancelled'));
});

test('a successful response containing invalid JSON produces a safe error', async () => {
  const api = createApi('http://localhost:8000', 'test-only', async () => new Response('<html>proxy</html>'));
  await assert.rejects(api.payments(), errorKind('server'));
});
