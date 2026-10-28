import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError } from '../src/api/client.ts';
import type { Overview } from '../src/api/types.ts';
import { createSnapshotLoader, type SnapshotState } from '../src/payments/refresh.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function setup() {
  let state: SnapshotState = { data: null, today: '2026-10-26', error: null, loading: false };
  const requests: { month: string; signal?: AbortSignal; result: ReturnType<typeof deferred<Overview>> }[] = [];
  const loader = createSnapshotLoader({
    overview: (month, _today, signal) => {
      const result = deferred<Overview>();
      requests.push({ month, signal, result });
      return result.promise;
    },
    payments: async () => [],
    subscriptions: async () => [],
  }, '2026-10', change => { state = change(state); });
  return { loader, requests, state: () => state };
}

const overview = (month: string): Overview => ({ month, items: [], totals: [], next: null });

test('a late response for the previous month cannot replace the selected month', async () => {
  const { loader, requests, state } = setup();
  const october = loader.refresh();
  loader.selectMonth('2026-11');
  const november = loader.refresh();
  assert.equal(requests[0]?.signal?.aborted, true);
  requests[1]!.result.resolve(overview('2026-11'));
  await november;
  requests[0]!.result.resolve(overview('2026-10'));
  await october;
  assert.equal(state().data?.overview.month, '2026-11');
  assert.equal(state().loading, false);
});

test('finishing a write refreshes the currently selected month instead of the month at submit time', async () => {
  const { loader, requests, state } = setup();
  const write = deferred<void>();
  const save = async () => { await write.promise; await loader.refresh(); };
  const saving = save();
  loader.selectMonth('2026-11');
  write.resolve();
  await write.promise;
  assert.equal(requests[0]?.month, '2026-11');
  requests[0]!.result.resolve(overview('2026-11'));
  await saving;
  assert.equal(state().data?.overview.month, '2026-11');
});

test('an old failed request cannot clear the current loading state or report a false error', async () => {
  const { loader, requests, state } = setup();
  const old = loader.refresh();
  const current = loader.refresh();
  requests[0]!.result.reject(new ApiError('timeout'));
  await old;
  assert.equal(state().loading, true);
  assert.equal(state().error, null);
  requests[1]!.result.resolve(overview('2026-10'));
  await current;
  assert.equal(state().loading, false);
});

test('an expired session cancels outstanding reads and stays disconnected until a successful refresh', async () => {
  const { loader, requests, state } = setup();
  const pending = loader.refresh();
  loader.expire(new ApiError('unauthorized'));
  requests[0]!.result.resolve(overview('2026-10'));
  await pending;
  assert.equal(state().data, null);
  assert.equal(state().error?.kind, 'unauthorized');
  assert.equal(state().loading, false);
  const retry = loader.refresh();
  assert.equal(state().error?.kind, 'unauthorized');
  requests[1]!.result.reject(new ApiError('network'));
  await retry;
  assert.equal(state().data, null);
  assert.equal(state().error?.kind, 'unauthorized');
  const recovered = loader.refresh();
  requests[2]!.result.resolve(overview('2026-10'));
  await recovered;
  assert.equal(state().error, null);
  assert.equal(state().data?.overview.month, '2026-10');
});

test('failed refresh preserves the last snapshot and reports stale data', async () => {
  const { loader, requests, state } = setup();
  const first = loader.refresh();
  requests[0]!.result.resolve(overview('2026-10'));
  await first;
  const next = loader.refresh();
  requests[1]!.result.reject(new ApiError('network'));
  await next;
  assert.equal(state().data?.overview.month, '2026-10');
  assert.equal(state().error?.kind, 'network');
  assert.equal(state().loading, false);
  assert.equal(requests[1]?.signal?.aborted, true);
});

test('a refresh rejected by authentication clears the snapshot', async () => {
  const { loader, requests, state } = setup();
  const first = loader.refresh();
  requests[0]!.result.resolve(overview('2026-10'));
  await first;
  const next = loader.refresh();
  requests[1]!.result.reject(new ApiError('unauthorized'));
  await next;
  assert.equal(state().data, null);
  assert.equal(state().error?.kind, 'unauthorized');
  assert.equal(state().loading, false);
});

test('a cancelled loader cannot update an unmounted screen', async () => {
  const { loader, requests, state } = setup();
  const pending = loader.refresh();
  loader.cancel();
  const before = state();
  requests[0]!.result.resolve(overview('2026-10'));
  await pending;
  assert.equal(requests[0]?.signal?.aborted, true);
  assert.equal(state(), before);
});
