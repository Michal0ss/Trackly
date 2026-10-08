import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, IconTile, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Action, BackButton, ConnectionState, DataError, LoadingPayments, PaymentCard, useDataRefresh } from '@/payments/components';
import { usePayments } from '@/payments/PaymentsProvider';
import { paymentRows } from '@/payments/model';

export default function PaymentsScreen() {
  const { copy } = useLanguage();
  const { data, connected, loading, refresh } = usePayments();
  const rows = data ? paymentRows(data.payments, data.subscriptions) : [];
  const refreshControl = useDataRefresh();
  return <Screen refreshControl={connected ? refreshControl : undefined}>
    <BackButton />
    <ScreenTitle title={copy.allPayments} subtitle={copy.allPaymentsDescription} />
    {!connected ? <ConnectionState /> : <>
      <Action label={copy.addPayment} onPress={() => router.push('/payment')} />
      <DataError stale={Boolean(data)} />
      {loading && !data ? <LoadingPayments /> : data && (rows.length ? rows.map(item => <PaymentCard key={item.key} item={item} />) : <View style={sharedStyles.card}>
        <IconTile name="layers" />
        <AppText style={sharedStyles.cardTitle}>{copy.paymentsEmpty}</AppText>
        <AppText style={sharedStyles.muted}>{copy.paymentsDescription}</AppText>
      </View>)}
      <Action secondary label={copy.refresh} disabled={loading} onPress={() => void refresh()} />
    </>}
  </Screen>;
}
