import { useLocalSearchParams } from 'expo-router';

import { AppText, Screen } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { BackButton, ConnectionState, DataError, LoadingPayments } from '@/payments/components';
import { EntryForm } from '@/payments/EntryForm';
import { usePayments } from '@/payments/PaymentsProvider';
import { newDraft, paymentDraft } from '@/payments/model';

export default function PaymentScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();
  const { copy, language } = useLanguage();
  const { connected, data, loading, error } = usePayments();
  const id = idParam === undefined ? undefined : Number(idParam);
  const payment = data?.payments.find(item => item.id === id);
  if (!connected) return <Screen><BackButton /><ConnectionState /></Screen>;
  if (idParam !== undefined && (!Number.isSafeInteger(id) || !id || !payment)) {
    return <Screen><BackButton />{loading ? <LoadingPayments /> : error ? <DataError /> : <AppText>{copy.missingPayment}</AppText>}</Screen>;
  }
  return <EntryForm key={id ?? 'new'} id={id} initial={payment ? paymentDraft(payment) : newDraft(language)} />;
}
