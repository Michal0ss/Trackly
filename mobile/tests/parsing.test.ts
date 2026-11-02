import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../src/api/client.ts';
import { createParsingTask } from '../src/chat/parsing.ts';
import type { ChatRequest, ChatResponse } from '../src/chat/types.ts';

const request: ChatRequest = { text: 'Czynsz 2400 zł', language: 'pl', today: '2026-10-30', default_currency: 'PLN', context: [], draft: null };
const response: ChatResponse = { mode: 'test', result: { kind: 'question', question: 'month_total' }, needs: [], entry: null, proposal_id: null, overview: { month: '2026-10', totals: [], items: [], next: null } };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function observe() {
  const replies: ChatResponse[] = [];
  const failures: ApiError[] = [];
  const finishes: boolean[] = [];
  return { replies, failures, finishes, callbacks: {
    reply: (value: ChatResponse) => { replies.push(value); },
    failed: (error: ApiError) => { failures.push(error); },
    settled: () => { finishes.push(true); },
  } };
}

test('cancelling aborts the transport and releases the composer immediately', () => {
  const task = createParsingTask();
  const pending = deferred<ChatResponse>();
  const state = observe();
  let signal!: AbortSignal;
  task.run(request, async (_request, value) => { signal = value; return pending.promise; }, state.callbacks);
  task.cancel();
  task.cancel();
  assert.equal(signal.aborted, true);
  assert.deepEqual(state.failures.map(error => error.kind), ['cancelled']);
  assert.equal(state.finishes.length, 1);
  assert.equal(state.replies.length, 0);
});

test('a late cancelled response cannot replace a newer reply or unlock its pending request', async () => {
  const task = createParsingTask();
  const old = deferred<ChatResponse>();
  const next = deferred<ChatResponse>();
  const firstState = observe();
  const secondState = observe();
  task.run(request, () => old.promise, firstState.callbacks);
  task.cancel();
  assert.equal(task.run({ ...request, text: 'Netflix 49 zł co miesiąc' }, () => next.promise, secondState.callbacks), true);
  old.resolve(response);
  await old.promise;
  assert.equal(firstState.replies.length, 0);
  assert.equal(firstState.finishes.length, 1);
  assert.equal(secondState.finishes.length, 0);
  assert.equal(task.run(request, async () => response, observe().callbacks), false);
  next.resolve(response);
  await next.promise;
  assert.deepEqual(secondState.replies, [response]);
  assert.equal(secondState.finishes.length, 1);
});

test('a late transport failure after cancellation is ignored', async () => {
  const task = createParsingTask();
  const pending = deferred<ChatResponse>();
  const state = observe();
  task.run(request, () => pending.promise, state.callbacks);
  task.cancel();
  pending.reject(new ApiError('network'));
  await pending.promise.catch(() => undefined);
  assert.deepEqual(state.failures.map(error => error.kind), ['cancelled']);
  assert.equal(state.finishes.length, 1);
});

test('unmounting aborts outstanding parsing without updating the old conversation', async () => {
  const task = createParsingTask();
  const pending = deferred<ChatResponse>();
  const state = observe();
  let signal!: AbortSignal;
  task.run(request, (_request, value) => { signal = value; return pending.promise; }, state.callbacks);
  task.dispose();
  pending.resolve(response);
  await pending.promise;
  assert.equal(signal.aborted, true);
  assert.deepEqual(state.replies, []);
  assert.deepEqual(state.failures, []);
  assert.deepEqual(state.finishes, []);
});

test('double sending does not start another request and real errors remain retryable', async () => {
  const task = createParsingTask();
  const pending = deferred<ChatResponse>();
  const state = observe();
  let calls = 0;
  const parse = () => { calls++; return pending.promise; };
  assert.equal(task.run(request, parse, state.callbacks), true);
  assert.equal(task.run(request, parse, state.callbacks), false);
  assert.equal(calls, 1);
  pending.reject(new ApiError('timeout'));
  await pending.promise.catch(() => undefined);
  assert.deepEqual(state.failures.map(error => error.kind), ['timeout']);
  assert.equal(state.finishes.length, 1);
  assert.equal(task.run(request, async () => response, state.callbacks), true);
  await Promise.resolve();
  assert.deepEqual(state.replies, [response]);
});

test('unexpected parsing errors never expose private exception details', async () => {
  const task = createParsingTask();
  const state = observe();
  task.run(request, async () => { throw new Error('private-server-details'); }, state.callbacks);
  await Promise.resolve();
  assert.equal(state.failures[0]?.kind, 'server');
  assert.equal(state.finishes.length, 1);
  assert.equal(JSON.stringify(state.failures).includes('private-server-details'), false);
});
