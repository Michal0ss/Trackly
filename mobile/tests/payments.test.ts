import assert from 'node:assert/strict';
import test from 'node:test';

import type { Payment, Subscription } from '../src/api/types.ts';
import { formatDueDate, formatMoney, localDate, monthLabel, newDraft, paymentDraft, paymentRows, shiftMonth, validDate, validateDraft } from '../src/payments/model.ts';

const payment: Payment = { id: 1, name: 'Czynsz', category: 'rent', amount: 2400.5, currency: 'PLN', interval_months: 1, start_date: '2026-01-31', end_date: null, note: null, created_at: '2026-01-01T00:00:00', updated_at: null };
const subscription: Subscription = { id: 1, user_id: 1, service_name: 'Spotify', plan_name: 'Premium', price: 5.99, currency: 'EUR', billing_cycle: 'monthly', start_date: null, end_date: null, renewal_date: '2026-10-20', status: 'confirmed', source: 'extension', source_url: 'https://example.com', auto_renew: true, created_at: '2026-01-01T00:00:00', detected_at: null };
const normalizeSpaces = (value: string) => value.replace(/\s/g, ' ');

test('money keeps the original currency and uses the chosen locale', () => {
  assert.equal(normalizeSpaces(formatMoney(2400, 'PLN', 'pl')), '2400 zł');
  assert.equal(normalizeSpaces(formatMoney(2400.5, 'PLN', 'pl')), '2400,50 zł');
  assert.equal(formatMoney(1850, 'USD', 'en'), '$1,850');
  assert.equal(formatMoney(950, 'EUR', 'en'), '€950');
  assert.equal(formatMoney(12.99, 'GBP', 'en'), '£12.99');
});

test('calendar dates keep the local day in different time zones', () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ['America/Los_Angeles', 'Pacific/Kiritimati', 'Europe/Warsaw']) {
      process.env.TZ = timezone;
      assert.equal(localDate(new Date(2026, 9, 7, 0, 15)), '2026-10-07');
      assert.equal(localDate(new Date(2026, 9, 7, 23, 45)), '2026-10-07');
      assert.equal(formatDueDate('2026-10-07', 'en'), 'October 7, 2026');
      assert.equal(formatDueDate('2026-10-07', 'pl'), '7 października 2026');
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('month navigation crosses the year boundary without overflowing a day', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', 1), '2026-02');
  assert.equal(monthLabel('2026-10', 'en'), 'October 2026');
  assert.equal(monthLabel('2026-10', 'pl'), 'październik 2026');
  assert.equal(shiftMonth('0001-01', -1), '0001-01');
});

test('date validation rejects rollover, malformed dates and year zero', () => {
  for (const value of ['2026-02-29', '2026-04-31', '1900-02-29', '2026-13-01', '2026-01-00', '2026-1-1', '0000-01-01', '']) assert.equal(validDate(value), false, value);
  for (const value of ['2028-02-29', '2000-02-29', '2026-01-31', '0001-01-01']) assert.equal(validDate(value), true, value);
});

test('new payment does not invent a first due date', () => {
  assert.equal(newDraft('pl').start_date, '');
  assert.equal(newDraft('pl').currency, 'PLN');
  assert.equal(newDraft('en').currency, 'USD');
  assert.equal(validateDraft(newDraft('pl')).value, null);
});

test('form maps a decimal comma and nullable fields without changing the schedule', () => {
  const result = validateDraft({ ...paymentDraft(payment), name: '  Czynsz  ', amount: '2 400,50' });
  assert.deepEqual(result.errors, {});
  const { id, created_at, updated_at, ...input } = payment;
  assert.ok(id && created_at && updated_at === null);
  assert.deepEqual(result.value, input);
});

test('form enforces API amount, text, enum and date limits', () => {
  const draft = paymentDraft(payment);
  for (const amount of ['0', '-1', 'NaN', 'Infinity', '1e3', '1000000000', '1,200.50', '']) assert.equal(validateDraft({ ...draft, amount }).errors.amount, 'invalidAmount', amount);
  assert.equal(validateDraft({ ...draft, name: ' '.repeat(3) }).errors.name, 'invalidName');
  assert.equal(validateDraft({ ...draft, name: 'a'.repeat(121) }).errors.name, 'invalidName');
  assert.equal(validateDraft({ ...draft, note: 'x'.repeat(501) }).errors.note, 'invalidNote');
  assert.equal(validateDraft({ ...draft, interval_months: '4' }).errors.interval_months, 'invalidChoice');
  assert.equal(validateDraft({ ...draft, category: 'unknown' }).errors.category, 'invalidChoice');
  assert.equal(validateDraft({ ...draft, currency: 'CHF' }).errors.currency, 'invalidChoice');
  assert.equal(validateDraft({ ...draft, end_date: '2026-01-30' }).errors.end_date, 'invalidEnd');
  assert.ok(validateDraft({ ...draft, end_date: payment.start_date }).value);
  for (const interval of ['1', '2', '3', '6', '12']) assert.ok(validateDraft({ ...draft, interval_months: interval }).value);
});

test('one list preserves identity, original amount, yearly intervals and subscription status', () => {
  const rows = paymentRows([{ ...payment, interval_months: 12 }], [{ ...subscription, billing_cycle: 'yearly', auto_renew: false, status: 'cancelled' }]);
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0]?.key, rows[1]?.key);
  assert.equal(rows[0]?.kind, 'payment');
  assert.equal(rows[0]?.amount, 2400.5);
  assert.equal(rows[0]?.interval, 12);
  assert.equal(rows[1]?.kind, 'subscription');
  assert.equal(rows[1]?.plan, 'Premium');
  assert.equal(rows[1]?.currency, 'EUR');
  assert.equal(rows[1]?.interval, 12);
  assert.equal(rows[1]?.renews, false);
  assert.equal(rows[1]?.status, 'cancelled');
  assert.equal(paymentRows([], [{ ...subscription, billing_cycle: 'unknown', renewal_date: null }])[0]?.interval, null);
});
