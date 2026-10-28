import type { ManualSubscriptionInput, Subscription } from '../api/types.ts';
import { validateDraft, type FieldErrors, type PaymentDraft } from './model.ts';

export type SubscriptionFieldErrors = FieldErrors & { plan_name?: 'invalidPlan' | 'invalidField' };

export function subscriptionDraft(subscription: Subscription): PaymentDraft {
  return {
    name: subscription.service_name, category: 'other', amount: String(subscription.price), currency: subscription.currency,
    interval_months: subscription.billing_cycle === 'monthly' ? '1' : subscription.billing_cycle === 'yearly' ? '12' : '',
    start_date: subscription.start_date ?? '', end_date: subscription.end_date ?? '', note: '',
  };
}

export function validateSubscriptionDraft(draft: PaymentDraft, plan: string): { value: ManualSubscriptionInput | null; errors: SubscriptionFieldErrors } {
  const validation = validateDraft(draft);
  const errors: SubscriptionFieldErrors = { ...validation.errors };
  if (!['1', '12'].includes(draft.interval_months)) errors.interval_months = 'invalidChoice';
  if (plan.length > 120) errors.plan_name = 'invalidPlan';
  const payment = validation.value;
  return {
    errors,
    value: payment && Object.keys(errors).length === 0 ? {
      service_name: payment.name, plan_name: plan.trim(), price: payment.amount, currency: payment.currency,
      billing_cycle: payment.interval_months === 1 ? 'monthly' : 'yearly', start_date: payment.start_date, end_date: payment.end_date,
    } : null,
  };
}

export function subscriptionErrorFields(fields: string[]): SubscriptionFieldErrors {
  const mapping = { service_name: 'name', price: 'amount', currency: 'currency', billing_cycle: 'interval_months', start_date: 'start_date', end_date: 'end_date', plan_name: 'plan_name' } as const;
  const errors: SubscriptionFieldErrors = {};
  for (const field of fields) {
    const target = mapping[field as keyof typeof mapping];
    if (target) errors[target] = 'invalidField';
  }
  return errors;
}
