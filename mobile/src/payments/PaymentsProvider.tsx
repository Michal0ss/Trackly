import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { ApiError } from '@/api/client';
import { developmentApi } from '@/api/session';
import type { ManualSubscriptionInput, PaymentInput } from '@/api/types';
import type { ChatRequest, ChatResponse, Confirmation, SavedEntry } from '@/chat/types';
import { localDate } from '@/payments/model';
import { createSnapshotLoader, type SnapshotState } from '@/payments/refresh';

type PaymentsContextValue = SnapshotState & {
  month: string;
  setMonth: (month: string) => void;
  connected: boolean;
  refresh: () => Promise<void>;
  save: (value: PaymentInput, id?: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  saveSubscription: (id: number, value: ManualSubscriptionInput) => Promise<void>;
  removeSubscription: (id: number) => Promise<void>;
  parseChat: (value: ChatRequest, signal?: AbortSignal) => Promise<ChatResponse>;
  confirmChat: (value: Confirmation) => Promise<SavedEntry>;
};

const PaymentsContext = createContext<PaymentsContextValue | null>(null);

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const [api] = useState(developmentApi);
  const [snapshot, setSnapshot] = useState<SnapshotState>(() => ({ today: localDate(), data: null, loading: Boolean(api), error: null }));
  const [month, setMonth] = useState(() => localDate().slice(0, 7));
  const [loader] = useState(() => api ? createSnapshotLoader(api, month, setSnapshot) : null);
  const refresh = useCallback(async () => { await loader?.refresh(); }, [loader]);
  const { today, error } = snapshot;

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) void refresh(); });
    return () => { cancelled = true; loader?.cancel(); };
  }, [refresh, loader, month]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const timer = setInterval(() => { if (localDate() !== today) void refresh(); }, 60000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [refresh, today]);

  async function access<T>(action: () => Promise<T>) {
    if (!api) throw new ApiError('unauthorized');
    try {
      return await action();
    } catch (cause) {
      if (cause instanceof ApiError && cause.kind === 'unauthorized') loader?.expire(cause);
      throw cause;
    }
  }

  async function mutate(action: () => Promise<unknown>) {
    await access(action);
    await refresh();
  }

  return <PaymentsContext.Provider value={{
    ...snapshot, month, setMonth: value => { loader?.selectMonth(value); setMonth(value); },
    connected: Boolean(api) && error?.kind !== 'unauthorized', refresh,
    save: (value, id) => mutate(() => api!.save(value, id)),
    remove: id => mutate(() => api!.remove(id)),
    saveSubscription: (id, value) => mutate(() => api!.saveSubscription(id, value)),
    removeSubscription: id => mutate(() => api!.removeSubscription(id)),
    parseChat: (value, signal) => access(() => api!.parseChat(value, signal)),
    confirmChat: async value => {
      const saved = await access(() => api!.confirmChat(value));
      await refresh();
      return saved;
    },
  }}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  const context = useContext(PaymentsContext);
  if (!context) throw new Error('PaymentsProvider is required');
  return context;
}
