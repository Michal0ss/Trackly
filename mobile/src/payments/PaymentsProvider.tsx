import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { ApiError } from '@/api/client';
import { developmentApi } from '@/api/session';
import type { Overview, Payment, PaymentInput, Subscription } from '@/api/types';
import { localDate } from '@/payments/model';

type Snapshot = { overview: Overview; payments: Payment[]; subscriptions: Subscription[] };
type PaymentsContextValue = {
  month: string;
  setMonth: (month: string) => void;
  today: string;
  data: Snapshot | null;
  loading: boolean;
  connected: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
  save: (value: PaymentInput, id?: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

const PaymentsContext = createContext<PaymentsContextValue | null>(null);

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const [api] = useState(developmentApi);
  const [today, setToday] = useState(localDate);
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(api));
  const [error, setError] = useState<ApiError | null>(null);
  const active = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!api) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    try {
      const [overview, payments, subscriptions] = await Promise.all([
        api.overview(month, localDate(), controller.signal),
        api.payments(controller.signal),
        api.subscriptions(controller.signal),
      ]);
      if (!controller.signal.aborted) {
        setData({ overview, payments, subscriptions });
        setToday(localDate());
      }
    } catch (cause) {
      if (controller.signal.aborted) return;
      const failure = cause instanceof ApiError ? cause : new ApiError('server');
      setError(failure);
      if (failure.kind === 'unauthorized') setData(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [api, month]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void refresh(); });
    return () => { cancelled = true; active.current?.abort(); };
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const timer = setInterval(() => { if (localDate() !== today) void refresh(); }, 60000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [refresh, today]);

  async function mutate(action: () => Promise<unknown>) {
    if (!api) throw new ApiError('unauthorized');
    try {
      await action();
    } catch (cause) {
      if (cause instanceof ApiError && cause.kind === 'unauthorized') { setData(null); setError(cause); }
      throw cause;
    }
    await refresh();
  }

  return <PaymentsContext.Provider value={{
    month, setMonth, today, data, loading, error, connected: Boolean(api) && error?.kind !== 'unauthorized', refresh,
    save: (value, id) => mutate(() => api!.save(value, id)),
    remove: id => mutate(() => api!.remove(id)),
  }}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentsContext);
  if (!context) throw new Error('PaymentsProvider is required');
  return context;
}
