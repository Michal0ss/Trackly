import { ApiError } from '../api/client.ts';
import type { ChatRequest, ChatResponse } from './types.ts';

type Callbacks = {
  reply: (response: ChatResponse) => void;
  failed: (error: ApiError) => void;
  settled: () => void;
};
type Parse = (request: ChatRequest, signal: AbortSignal) => Promise<ChatResponse>;
type Task = { controller: AbortController; callbacks: Callbacks };

export function createParsingTask() {
  let active: Task | null = null;

  function stop(notify: boolean) {
    if (!active) return;
    const task = active;
    active = null;
    task.controller.abort();
    if (notify) {
      task.callbacks.failed(new ApiError('cancelled'));
      task.callbacks.settled();
    }
  }

  return {
    run(request: ChatRequest, parse: Parse, callbacks: Callbacks) {
      if (active) return false;
      const task = { controller: new AbortController(), callbacks };
      active = task;
      void (async () => {
        try {
          const response = await parse(request, task.controller.signal);
          if (active === task) callbacks.reply(response);
        } catch (cause) {
          if (active === task) callbacks.failed(cause instanceof ApiError ? cause : new ApiError('server'));
        } finally {
          if (active === task) {
            active = null;
            callbacks.settled();
          }
        }
      })();
      return true;
    },
    cancel() { stop(true); },
    dispose() { stop(false); },
  };
}
