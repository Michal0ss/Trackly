import type { Category, Currency, Interval, Overview, PaymentInput } from '../api/types.ts';
import type { Language } from '../i18n/language.ts';

export type DateParts = { year: number | null; month: number | null; day: number | null };
export type EntryDraft = {
  kind: 'payment' | 'subscription';
  name: string | null;
  category: Category | 'subscription' | null;
  amount: number | null;
  currency: Currency | null;
  interval_months: Interval | null;
  first_due: DateParts | null;
  until: DateParts | null;
  duration_months: number | null;
  plan_name: string | null;
};
export type Missing = 'name' | 'category' | 'amount' | 'currency' | 'interval_months' | 'first_due' | 'until';
export type ParseResult =
  | { kind: 'proposal'; draft: EntryDraft; missing: Missing[] }
  | { kind: 'question'; question: 'month_total' | 'next_due' | 'subscriptions_total' }
  | { kind: 'clarify'; reason: 'entry_type' | 'multiple_entries' }
  | { kind: 'not_supported'; reason: string };
export type ResolvedEntry = Omit<PaymentInput, 'category'> & { kind: 'payment' | 'subscription'; category: Category | 'subscription'; plan_name: string | null };
export type ChatRequest = { text: string; language: Language; today: string; default_currency: Currency; context: string[]; draft: EntryDraft | null };
export type ChatResponse = { mode: 'test'; result: ParseResult; needs: Missing[]; entry: ResolvedEntry | null; proposal_id: string | null; overview: Overview | null };
export type Confirmation = { proposal_id: string; entry: ResolvedEntry };
export type SavedEntry = { kind: 'payment' | 'subscription'; id: number };
