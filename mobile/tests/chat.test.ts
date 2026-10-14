import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError, createApi } from '../src/api/client.ts';
import { chatReply, createConfirmation, draftFromEntry } from '../src/chat/model.ts';
import type { ChatRequest, ChatResponse, Confirmation, ResolvedEntry, SavedEntry } from '../src/chat/types.ts';
import { translations } from '../src/i18n/translations.ts';

const entry: ResolvedEntry = { kind: 'payment', name: 'Czynsz', category: 'rent', amount: 2400, currency: 'PLN', interval_months: 1, start_date: '2026-10-31', end_date: null, note: null, plan_name: null };
const confirmation: Confirmation = { proposal_id: 'f7b70d88-bbc4-4cc1-a8c2-81ad4c219c7b', entry };

test('simultaneous confirmation clicks send one request and later clicks reuse the result', async () => {
  let complete!: (value: SavedEntry) => void;
  let calls = 0;
  const confirm = createConfirmation(confirmation, async () => { calls++; return new Promise(resolve => { complete = resolve; }); });
  const first = confirm();
  const second = confirm();
  assert.equal(calls, 1);
  assert.equal(first, second);
  complete({ kind: 'payment', id: 123 });
  assert.deepEqual(await first, { kind: 'payment', id: 123 });
  assert.deepEqual(await confirm(), { kind: 'payment', id: 123 });
  assert.equal(calls, 1);
});

test('a lost confirmation response can be retried with exactly the same key and payload', async () => {
  const mutable = structuredClone(confirmation);
  const requests: Confirmation[] = [];
  const confirm = createConfirmation(mutable, async value => {
    requests.push(structuredClone(value));
    if (requests.length === 1) throw new ApiError('network');
    return { kind: 'payment', id: 123 };
  });
  await assert.rejects(confirm(), error => error instanceof ApiError && error.kind === 'network');
  mutable.entry.amount = 9999;
  mutable.proposal_id = 'different';
  await confirm();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(requests[1]?.entry.amount, 2400);
  assert.equal(requests[1]?.proposal_id, confirmation.proposal_id);
});

test('parsing uses the phone date and prior draft but never calls the confirmation endpoint', async () => {
  const paths: string[] = [];
  const draft = draftFromEntry(entry);
  const request: ChatRequest = { text: 'Co miesiąc', language: 'pl', today: '2026-10-10', default_currency: 'PLN', context: ['Czynsz 2400 zł'], draft };
  const api = createApi('http://localhost:8000', 'test-only', async (url, options) => {
    paths.push(String(url));
    assert.deepEqual(JSON.parse(String(options?.body)), request);
    assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-only');
    return Response.json({ mode: 'test', result: { kind: 'proposal', draft, missing: [] }, needs: [], entry, proposal_id: confirmation.proposal_id, overview: null });
  });
  await api.parseChat(request);
  assert.deepEqual(paths, ['http://localhost:8000/api/assistant/parse']);
});

test('chat status errors are mapped without leaking upstream messages or retrying writes', async () => {
  for (const [status, kind] of [[409, 'conflict'], [429, 'limited'], [503, 'unavailable'], [504, 'timeout']] as const) {
    let calls = 0;
    const api = createApi('http://localhost:8000', 'test-only', async () => { calls++; return Response.json({ detail: 'private-provider-details' }, { status }); });
    await assert.rejects(api.confirmChat(confirmation), error => error instanceof ApiError && error.kind === kind && !error.message.includes('private'));
    assert.equal(calls, 1);
  }
});

test('question replies show only backend totals and keep currencies separate', () => {
  const response: ChatResponse = { mode: 'test', result: { kind: 'question', question: 'month_total' }, needs: [], entry: null, proposal_id: null, overview: { month: '2026-10', totals: [{ currency: 'PLN', amount: 2400 }, { currency: 'EUR', amount: 950 }], items: [], next: null } };
  const reply = chatReply(response, translations.pl, 'pl');
  assert.match(reply, /2.?400/);
  assert.match(reply, /950/);
  assert.match(reply, /\+/);
  assert.doesNotMatch(reply, /3350|3.?350/);
});

test('draft corrections preserve the date, currency and optional end condition', () => {
  const draft = draftFromEntry({ ...entry, amount: 950, currency: 'EUR', end_date: '2027-02-28' });
  assert.deepEqual(draft.first_due, { year: 2026, month: 10, day: 31 });
  assert.deepEqual(draft.until, { year: 2027, month: 2, day: 28 });
  assert.equal(draft.currency, 'EUR');
  assert.equal(draft.amount, 950);
  assert.equal(draft.duration_months, null);
});

test('missing dates are requested before a proposal is presented as ready', () => {
  const draft = { ...draftFromEntry(entry), first_due: { year: null, month: null, day: 31 } };
  const response: ChatResponse = { mode: 'test', result: { kind: 'proposal', draft, missing: [] }, needs: ['first_due'], entry: null, proposal_id: null, overview: null };
  const reply = chatReply(response, translations.pl, 'pl');
  assert.match(reply, /Pierwszy termin/);
  assert.notEqual(reply, translations.pl.chatReview);
});
