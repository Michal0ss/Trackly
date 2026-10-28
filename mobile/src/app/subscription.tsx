import { useLocalSearchParams } from 'expo-router';

import { AppText, Screen } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { BackButton, ConnectionState, DataError, LoadingPayments } from '@/payments/components';
import { EntryForm } from '@/payments/EntryForm';
import { usePayments } from '@/payments/PaymentsProvider';
import { subscriptionDraft } from '@/payments/subscriptions';

export default function SubscriptionScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const { copy } = useLanguage();
  const { connected, data, loading, error } = usePayments();
  const id = Number(idParam);
  const subscription = data?.subscriptions.find(item => item.id === id && item.source === 'manual');
  if (!connected) return <Screen><BackButton /><ConnectionState /></Screen>;
  if (!Number.isSafeInteger(id) || id <= 0 || !subscription) {
    return <Screen><BackButton />{loading ? <LoadingPayments /> : error ? <DataError /> : <AppText>{copy.missingSubscription}</AppText>}</Screen>;
  }
  return <EntryForm key={id} id={id} subscription={subscription} initial={subscriptionDraft(subscription)} />;
}
