import type { Overview, Payment, PaymentInput, Subscription } from './types.ts';

export type ErrorKind = 'unauthorized' | 'network' | 'timeout' | 'validation' | 'notFound' | 'server' | 'cancelled';

export class ApiError extends Error {
  readonly kind: ErrorKind;
  readonly fields: string[];

  constructor(kind: ErrorKind, fields: string[] = []) {
    super(kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.fields = fields;
  }
}

export function validationFields(body: unknown): string[] {
  if (!body || typeof body !== 'object' || !('detail' in body) || !Array.isArray(body.detail)) return [];
  return [...new Set(body.detail.flatMap((error: unknown) => {
    if (!error || typeof error !== 'object' || !('loc' in error) || !Array.isArray(error.loc)) return [];
    return typeof error.loc[1] === 'string' ? [error.loc[1]] : [];
  }))];
}

export function createApi(baseUrl: string, token: string, fetcher: typeof fetch = fetch, timeoutMs = 12000) {
  const base = baseUrl.replace(/\/+$/, '');

  async function request<T>(path: string, method = 'GET', body?: PaymentInput, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    if (signal?.aborted) throw new ApiError('cancelled');
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const response = await fetcher(`${base}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        redirect: 'error',
      });
      if (response.status === 401 || response.status === 403) throw new ApiError('unauthorized');
      if (response.status === 404) throw new ApiError('notFound');
      if (response.status === 422) {
        const details: unknown = await response.json().catch(() => null);
        throw new ApiError('validation', validationFields(details));
      }
      if (!response.ok) throw new ApiError('server');
      return await response.json() as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (signal?.aborted) throw new ApiError('cancelled');
      if (timedOut) throw new ApiError('timeout');
      throw new ApiError(error instanceof SyntaxError ? 'server' : 'network');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }
  }

  return {
    overview: (month: string, today: string, signal?: AbortSignal) => request<Overview>(`/api/overview?${new URLSearchParams({ month, today })}`, 'GET', undefined, signal),
    payments: (signal?: AbortSignal) => request<Payment[]>('/api/payments', 'GET', undefined, signal),
    subscriptions: (signal?: AbortSignal) => request<Subscription[]>('/api/subscriptions', 'GET', undefined, signal),
    payment: (id: number, signal?: AbortSignal) => request<Payment>(`/api/payments/${id}`, 'GET', undefined, signal),
    save: (value: PaymentInput, id?: number) => request<Payment>(id ? `/api/payments/${id}` : '/api/payments', id ? 'PUT' : 'POST', value),
    remove: (id: number) => request<{ message: string }>(`/api/payments/${id}`, 'DELETE'),
  };
}

export type Api = ReturnType<typeof createApi>;
