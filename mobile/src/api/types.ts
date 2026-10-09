export const categories = ['rent', 'loan', 'utilities', 'insurance', 'phone_internet', 'other'] as const;
export const currencies = ['PLN', 'EUR', 'USD', 'GBP'] as const;
export const intervals = [1, 2, 3, 6, 12] as const;
export type Category = typeof categories[number];
export type Currency = typeof currencies[number];
export type Interval = typeof intervals[number];

export type PaymentInput = {
  name: string;
  category: Category;
  amount: number;
  currency: Currency;
  interval_months: Interval;
  start_date: string;
  end_date: string | null;
  note: string | null;
};

export type Payment = PaymentInput & {
  id: number;
  created_at: string;
  updated_at: string | null;
};

export type Subscription = {
  id: number;
  user_id: number;
  service_name: string;
  plan_name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  status: 'confirmed' | 'cancelled' | 'expired';
  source: string;
  source_url: string;
  auto_renew: boolean;
  created_at: string;
  detected_at: string | null;
};

export type OverviewItem = {
  kind: 'payment' | 'subscription';
  id: number;
  name: string;
  plan_name: string | null;
  category: string;
  amount: number;
  currency: string;
  due_date: string;
};

export type Overview = {
  month: string;
  totals: { currency: string; amount: number }[];
  items: OverviewItem[];
  next: OverviewItem | null;
};
