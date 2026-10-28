import type { PaymentRow } from './model.ts';

export type PaymentKindFilter = 'all' | PaymentRow['kind'];

function searchable(value: string): string {
  return value.toLocaleLowerCase('pl-PL').normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l');
}

export function filterPayments(rows: PaymentRow[], query: string, kind: PaymentKindFilter, currency: string): PaymentRow[] {
  const words = searchable(query).trim().split(/\s+/).filter(Boolean);
  return rows.filter(row => (kind === 'all' || row.kind === kind)
    && (currency === 'all' || row.currency === currency)
    && words.every(word => searchable(`${row.name} ${row.plan ?? ''}`).includes(word)));
}
