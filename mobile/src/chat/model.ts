import type { Language } from '../i18n/language.ts';
import type { Copy } from '../i18n/translations.ts';
import { formatDueDate, formatMoney, monthLabel } from '../payments/model.ts';
import type { ChatResponse, Confirmation, EntryDraft, ResolvedEntry, SavedEntry } from './types.ts';

export function chatReply(response: ChatResponse, copy: Copy, language: Language): string {
  const result = response.result;
  if (result.kind === 'proposal') {
    if (response.entry) return copy.chatReview;
    const labels = { name: copy.nameLabel, category: copy.categoryLabel, amount: copy.amountLabel, currency: copy.currencyLabel, interval_months: copy.intervalLabel, first_due: copy.startLabel, until: copy.endLabel };
    return `${copy.chatMissing} ${response.needs.map(field => labels[field]).join(', ')}. ${copy.chatFollowupHint}`;
  }
  if (result.kind === 'clarify') return result.reason === 'multiple_entries' ? copy.chatOneAtATime : copy.chatSpecify;
  if (result.kind === 'not_supported') {
    if (result.reason === 'test_message') return copy.chatTestHelp;
    if (result.reason === 'one_off') return copy.chatOneOff;
    if (result.reason === 'edit_by_chat' || result.reason === 'delete_by_chat') return copy.chatUseList;
    return copy.chatUnsupported;
  }
  const overview = response.overview;
  if (!overview) return copy.serverError;
  if (result.question === 'next_due') {
    const item = overview.next;
    return item ? `${copy.chatNext} ${item.name}, ${formatMoney(item.amount, item.currency, language)}, ${formatDueDate(item.due_date, language)}.` : copy.noUpcoming;
  }
  const total = overview.totals.map(item => formatMoney(item.amount, item.currency, language)).join(' + ');
  return `${result.question === 'subscriptions_total' ? copy.chatSubscriptionTotal : copy.monthTotal} (${monthLabel(overview.month, language)}): ${total || copy.noMonthPayments}`;
}

export function draftFromEntry(entry: ResolvedEntry): EntryDraft {
  const parts = (value: string) => { const [year = 0, month = 0, day = 0] = value.split('-').map(Number); return { year, month, day }; };
  return { kind: entry.kind, name: entry.name, category: entry.category, amount: entry.amount, currency: entry.currency, interval_months: entry.interval_months, first_due: parts(entry.start_date), until: entry.end_date ? parts(entry.end_date) : null, duration_months: null, plan_name: entry.plan_name, note: entry.note };
}

export function createConfirmation(request: Confirmation, send: (request: Confirmation) => Promise<SavedEntry>) {
  const snapshot: Confirmation = JSON.parse(JSON.stringify(request));
  let pending: Promise<SavedEntry> | null = null;
  let saved: SavedEntry | null = null;
  return () => {
    if (saved) return Promise.resolve(saved);
    if (pending) return pending;
    pending = send(snapshot).then(value => { saved = value; return value; }).finally(() => { pending = null; });
    return pending;
  };
}
