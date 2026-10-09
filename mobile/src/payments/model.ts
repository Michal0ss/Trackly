import { categories, currencies, intervals, type Category, type Payment, type PaymentInput, type Subscription } from '../api/types.ts';
import type { Language } from '../i18n/language.ts';

const locale = (language: Language) => language === 'pl' ? 'pl-PL' : 'en-US';
const pad = (value: number) => String(value).padStart(2, '0');

export function localDate(date = new Date()): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
}

function calendarDate(value: string): Date {
  const [year = 0, month = 0, day = 1] = value.split('-').map(Number);
  const date = new Date(2000, month - 1, day, 12);
  date.setFullYear(year);
  return date;
}

export function formatDueDate(value: string, language: Language): string {
  return new Intl.DateTimeFormat(locale(language), { day: 'numeric', month: 'long', year: 'numeric' }).format(calendarDate(value));
}

export function monthLabel(value: string, language: Language): string {
  return new Intl.DateTimeFormat(locale(language), { month: 'long', year: 'numeric' }).format(calendarDate(`${value}-01`));
}

export function shiftMonth(value: string, offset: number): string {
  const [year = 0, month = 1] = value.split('-').map(Number);
  const index = Math.min(9999 * 12 - 1, Math.max(12, year * 12 + month - 1 + offset));
  return `${String(Math.floor(index / 12)).padStart(4, '0')}-${pad(index % 12 + 1)}`;
}

export function formatMoney(amount: number, currency: string, language: Language): string {
  return new Intl.NumberFormat(locale(language), {
    style: 'currency', currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2,
  }).format(amount);
}

export type PaymentDraft = { [Key in keyof PaymentInput]: string };
export type FieldErrors = Partial<Record<keyof PaymentInput, 'invalidName' | 'invalidAmount' | 'invalidChoice' | 'invalidDate' | 'invalidEnd' | 'invalidNote' | 'invalidField'>>;

export function newDraft(language: Language): PaymentDraft {
  return { name: '', category: 'other', amount: '', currency: language === 'pl' ? 'PLN' : 'USD', interval_months: '1', start_date: '', end_date: '', note: '' };
}

export function paymentDraft(payment: Payment): PaymentDraft {
  return { name: payment.name, category: payment.category, amount: String(payment.amount), currency: payment.currency, interval_months: String(payment.interval_months), start_date: payment.start_date, end_date: payment.end_date ?? '', note: payment.note ?? '' };
}

export function validateDraft(draft: PaymentDraft): { value: PaymentInput | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const amountText = draft.amount.trim().replace(/[\s\u00a0]/g, '').replace(',', '.');
  const amount = Number(amountText);
  if (!draft.name.trim() || draft.name.length > 120) errors.name = 'invalidName';
  if (!/^\d+(\.\d+)?$/.test(amountText) || !Number.isFinite(amount) || amount <= 0 || amount >= 1_000_000_000) errors.amount = 'invalidAmount';
  if (!categories.some(value => value === draft.category)) errors.category = 'invalidChoice';
  if (!currencies.some(value => value === draft.currency)) errors.currency = 'invalidChoice';
  if (!intervals.some(value => String(value) === draft.interval_months)) errors.interval_months = 'invalidChoice';
  if (!validDate(draft.start_date)) errors.start_date = 'invalidDate';
  if (draft.end_date && !validDate(draft.end_date)) errors.end_date = 'invalidDate';
  else if (draft.end_date && !errors.start_date && draft.end_date < draft.start_date) errors.end_date = 'invalidEnd';
  if (draft.note.length > 500) errors.note = 'invalidNote';
  return {
    errors,
    value: Object.keys(errors).length ? null : {
      name: draft.name.trim(), category: draft.category as PaymentInput['category'], amount, currency: draft.currency as PaymentInput['currency'],
      interval_months: Number(draft.interval_months) as PaymentInput['interval_months'], start_date: draft.start_date,
      end_date: draft.end_date || null, note: draft.note.trim() || null,
    },
  };
}

export const categoryIcons = { rent: 'home', loan: 'credit-card', utilities: 'zap', insurance: 'shield', phone_internet: 'wifi', other: 'circle', subscription: 'repeat' } as const;
export function categoryIcon(category: string) {
  return categoryIcons[category as keyof typeof categoryIcons] ?? categoryIcons.other;
}

export type PaymentRow = {
  key: string;
  kind: 'payment' | 'subscription';
  id: number;
  name: string;
  plan: string | null;
  category: Category | 'subscription';
  amount: number;
  currency: string;
  interval: number | null;
  start: string | null;
  end: string | null;
  status: Subscription['status'] | null;
  renews: boolean;
};

export function paymentRows(payments: Payment[], subscriptions: Subscription[]): PaymentRow[] {
  return [
    ...payments.map((payment): PaymentRow => ({ key: `payment-${payment.id}`, kind: 'payment', id: payment.id, name: payment.name, plan: null, category: payment.category, amount: payment.amount, currency: payment.currency, interval: payment.interval_months, start: payment.start_date, end: payment.end_date, status: null, renews: true })),
    ...subscriptions.map((subscription): PaymentRow => ({ key: `subscription-${subscription.id}`, kind: 'subscription', id: subscription.id, name: subscription.service_name, plan: subscription.plan_name, category: 'subscription', amount: subscription.price, currency: subscription.currency, interval: subscription.billing_cycle === 'monthly' ? 1 : subscription.billing_cycle === 'yearly' ? 12 : null, start: subscription.renewal_date, end: subscription.end_date, status: subscription.status, renews: subscription.auto_renew })),
  ].sort((a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key));
}
