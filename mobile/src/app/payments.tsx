import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, IconTile, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Action, BackButton, ConnectionState, DataError, LoadingPayments, PaymentCard, useDataRefresh } from '@/payments/components';
import { usePayments } from '@/payments/PaymentsProvider';
import { paymentRows } from '@/payments/model';
import { filterPayments, type PaymentKindFilter } from '@/payments/filters';
import { colors, fonts } from '@/theme/theme';

function Filters({ label, options, selected, onChange }: { label: string; options: { value: string; label: string }[]; selected: string; onChange: (value: string) => void }) {
  return <View style={styles.group}>
    <AppText>{label}</AppText>
    <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
        accessibilityState={{ checked: selected === option.value }} aria-checked={selected === option.value}
        onPress={() => onChange(option.value)} style={[styles.choice, selected === option.value && styles.selected]}>
        <AppText>{option.label}</AppText>
      </Pressable>)}
    </View>
  </View>;
}

export default function PaymentsScreen() {
  const { copy } = useLanguage();
  const { data, connected, loading, refresh } = usePayments();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<PaymentKindFilter>('all');
  const [currency, setCurrency] = useState('all');
  const rows = data ? paymentRows(data.payments, data.subscriptions) : [];
  const visibleRows = filterPayments(rows, query, kind, currency);
  const filtered = Boolean(query || kind !== 'all' || currency !== 'all');
  const clearFilters = () => { setQuery(''); setKind('all'); setCurrency('all'); };
  const refreshControl = useDataRefresh();
  return <Screen refreshControl={connected ? refreshControl : undefined}>
    <BackButton />
    <ScreenTitle title={copy.allPayments} subtitle={copy.allPaymentsDescription} />
    {!connected ? <ConnectionState /> : <>
      <Action label={copy.addPayment} onPress={() => router.push('/payment')} />
      <DataError stale={Boolean(data)} />
      {data && rows.length > 0 && <View style={styles.filters}>
        <TextInput accessibilityLabel={copy.searchPayments} value={query} onChangeText={setQuery} maxLength={240}
          placeholder={copy.searchPayments} placeholderTextColor={colors.dim} selectionColor={colors.greenSoft} style={styles.search}
          autoCorrect={false} autoCapitalize="none" returnKeyType="search" />
        <Filters label={copy.filterKind} options={[{ value: 'all', label: copy.filterAll }, { value: 'payment', label: copy.filterPayments }, { value: 'subscription', label: copy.filterSubscriptions }]} selected={kind} onChange={value => setKind(value as PaymentKindFilter)} />
        <Filters label={copy.currencyLabel} options={[{ value: 'all', label: copy.filterAllCurrencies }, ...[...new Set([...rows.map(row => row.currency), ...(currency === 'all' ? [] : [currency])])].sort().map(value => ({ value, label: value }))]} selected={currency} onChange={setCurrency} />
        <AppText style={sharedStyles.muted} accessibilityLiveRegion="polite">{copy.filterCount.replace('{visible}', String(visibleRows.length)).replace('{total}', String(rows.length))}</AppText>
        {filtered && <Action label={copy.clearFilters} secondary onPress={clearFilters} />}
      </View>}
      {loading && !data ? <LoadingPayments /> : data && (rows.length ? visibleRows.length ? visibleRows.map(item => <PaymentCard key={item.key} item={item} />) : <View style={sharedStyles.card}>
        <IconTile name="search" />
        <AppText style={sharedStyles.cardTitle}>{copy.noFilterResults}</AppText>
        <AppText style={sharedStyles.muted}>{copy.noFilterResultsHint}</AppText>
      </View> : <View style={sharedStyles.card}>
        <IconTile name="layers" />
        <AppText style={sharedStyles.cardTitle}>{copy.paymentsEmpty}</AppText>
        <AppText style={sharedStyles.muted}>{copy.paymentsDescription}</AppText>
      </View>)}
      <Action secondary label={copy.refresh} disabled={loading} onPress={() => void refresh()} />
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  filters: { gap: 18 },
  group: { gap: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 48, justifyContent: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  selected: { borderColor: colors.green, backgroundColor: colors.greenSurface },
  search: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, color: colors.text, fontFamily: fonts.body, fontSize: 18, minHeight: 52, paddingHorizontal: 16, paddingVertical: 12 },
});
