import { ApiError, type Api } from '../api/client.ts';
import type { Overview, Payment, Subscription } from '../api/types.ts';
import { localDate } from './model.ts';

type Snapshot = { overview: Overview; payments: Payment[]; subscriptions: Subscription[] };
export type SnapshotState = { data: Snapshot | null; loading: boolean; error: ApiError | null; today: string };

export function createSnapshotLoader(api: Pick<Api, 'overview' | 'payments' | 'subscriptions'>, initialMonth: string, update: (change: (state: SnapshotState) => SnapshotState) => void) {
  let month = initialMonth;
  let active: AbortController | null = null;

  function cancel() {
    active?.abort();
    active = null;
  }

  function expire(error: ApiError) {
    cancel();
    update(state => ({ ...state, data: null, error, loading: false }));
  }

  async function refresh() {
    cancel();
    const controller = new AbortController();
    active = controller;
    const today = localDate();
    update(state => ({ ...state, loading: true, error: state.error?.kind === 'unauthorized' ? state.error : null }));
    try {
      const [overview, payments, subscriptions] = await Promise.all([
        api.overview(month, today, controller.signal),
        api.payments(controller.signal),
        api.subscriptions(controller.signal),
      ]);
      if (active === controller) update(() => ({ data: { overview, payments, subscriptions }, today, error: null, loading: false }));
    } catch (cause) {
      if (active !== controller) return;
      const error = cause instanceof ApiError ? cause : new ApiError('server');
      if (error.kind === 'unauthorized') expire(error);
      else update(state => ({ ...state, error: state.error?.kind === 'unauthorized' ? state.error : error, loading: false }));
    } finally {
      if (active === controller) cancel();
    }
  }

  return {
    refresh, cancel, expire,
    selectMonth(value: string) {
      if (month !== value) cancel();
      month = value;
    },
  };
}
