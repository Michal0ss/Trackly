import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError, createApi } from '../src/api/client.ts';
import type { Subscription } from '../src/api/types.ts';
import { subscriptionDraft, subscriptionErrorFields, validateSubscriptionDraft } from '../src/payments/subscriptions.ts';

const subscription: Subscription = { id: 9, user_id: 1, service_name: 'Netflix', plan_name: 'Standard', price: 49, currency: 'PLN', billing_cycle: 'monthly', start_date: '2026-10-31', end_date: null, renewal_date: '2026-11-30', status: 'confirmed', source: 'manual', source_url: '', auto_renew: true, created_at: '2026-10-01T00:00:00', detected_at: null };

test('editing a subscription keeps its first date and submits only editable fields', () => {
  const draft = subscriptionDraft(subscription);
  assert.equal(draft.start_date, '2026-10-31');
  const result = validateSubscriptionDraft({ ...draft, amount: '59,50', interval_months: '12', end_date: '2028-10-31' }, ' Premium ');
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.value, { service_name: 'Netflix', plan_name: 'Premium', price: 59.5, currency: 'PLN', billing_cycle: 'yearly', start_date: '2026-10-31', end_date: '2028-10-31' });
});

test('subscription form rejects unsupported recurrence, invalid dates and long plans', () => {
  const draft = subscriptionDraft(subscription);
  for (const interval of ['2', '3', '6', '4', '']) assert.equal(validateSubscriptionDraft({ ...draft, interval_months: interval }, '').errors.interval_months, 'invalidChoice');
  assert.equal(validateSubscriptionDraft(draft, 'x'.repeat(121)).errors.plan_name, 'invalidPlan');
  assert.equal(validateSubscriptionDraft({ ...draft, start_date: '2026-02-30' }, '').value, null);
  assert.equal(validateSubscriptionDraft({ ...draft, end_date: '2026-10-30' }, '').errors.end_date, 'invalidEnd');
  assert.equal(validateSubscriptionDraft({ ...draft, amount: '0' }, '').errors.amount, 'invalidAmount');
  assert.equal(subscriptionDraft({ ...subscription, start_date: null }).start_date, '');
  assert.equal(subscriptionDraft({ ...subscription, billing_cycle: 'weekly' }).interval_months, '');
});

test('backend field errors point to the matching subscription form inputs', () => {
  assert.deepEqual(subscriptionErrorFields(['price', 'service_name', 'plan_name', 'billing_cycle', 'private-detail']), {
    amount: 'invalidField', name: 'invalidField', plan_name: 'invalidField', interval_months: 'invalidField',
  });
});

test('subscription updates and deletes use the guarded endpoint and never create entries', async () => {
  const value = validateSubscriptionDraft(subscriptionDraft(subscription), '').value!;
  const requests: { url: string; method?: string; body: unknown }[] = [];
  const api = createApi('http://localhost:8000', 'test-only', async (url, options) => {
    requests.push({ url: String(url), method: options?.method, body: options?.body ? JSON.parse(String(options.body)) : null });
    return Response.json(subscription);
  });
  await api.saveSubscription(9, value);
  await api.removeSubscription(9);
  assert.deepEqual(requests, [
    { url: 'http://localhost:8000/api/manual-subscriptions/9', method: 'PUT', body: value },
    { url: 'http://localhost:8000/api/manual-subscriptions/9', method: 'DELETE', body: null },
  ]);
});

test('subscription writes are not retried after an uncertain network failure', async () => {
  let calls = 0;
  const api = createApi('http://localhost:8000', 'test-only', async () => { calls++; throw new TypeError('network'); });
  await assert.rejects(api.saveSubscription(9, validateSubscriptionDraft(subscriptionDraft(subscription), '').value!), error => error instanceof ApiError && error.kind === 'network');
  assert.equal(calls, 1);
  await assert.rejects(api.removeSubscription(9), error => error instanceof ApiError && error.kind === 'network');
  assert.equal(calls, 2);
});
