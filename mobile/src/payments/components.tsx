import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import type { ApiError } from '@/api/client';
import type { OverviewItem } from '@/api/types';
import { AppText, IconTile, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { Copy } from '@/i18n/translations';
import { usePayments } from '@/payments/PaymentsProvider';
import { categoryIcon, formatDueDate, formatMoney, type PaymentRow } from '@/payments/model';
import { colors, fonts } from '@/theme/theme';

export function Action({ label, onPress, disabled = false, secondary = false, danger = false }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.action, secondary && styles.secondary, danger && styles.secondary, (pressed || disabled) && styles.dimmed]}>
    <AppText style={[styles.actionText, (secondary || danger) && styles.secondaryText, danger && styles.danger]}>{label}</AppText>
  </Pressable>;
}

export function BackButton({ disabled = false }: { disabled?: boolean }) {
  const { copy } = useLanguage();
  return <View style={styles.back}><Action label={copy.back} disabled={disabled} secondary onPress={() => router.canGoBack() ? router.back() : router.replace('/')} /></View>;
}

export function useDataRefresh() {
  const { loading, refresh } = usePayments();
  return <RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.greenSoft} colors={[colors.green]} />;
}

export function errorText(error: ApiError, copy: Copy) {
  const keys = { network: 'offlineError', timeout: 'timeoutError', unauthorized: 'sessionExpired', validation: 'validationError', notFound: 'missingPayment', server: 'serverError', cancelled: 'serverError' } as const;
  return copy[keys[error.kind]];
}

export function ConnectionState() {
  const { copy } = useLanguage();
  const { error } = usePayments();
  return <View style={sharedStyles.card}>
    <IconTile name="link" />
    <AppText accessibilityRole="header" style={sharedStyles.cardTitle}>{copy.notConnected}</AppText>
    <AppText style={sharedStyles.muted}>{error?.kind === 'unauthorized' ? copy.sessionExpired : copy.notConnectedDescription}</AppText>
  </View>;
}

export function DataError({ stale = false }: { stale?: boolean }) {
  const { copy } = useLanguage();
  const { error, loading, refresh } = usePayments();
  if (!error || error.kind === 'unauthorized') return null;
  return <View style={sharedStyles.card} accessibilityLiveRegion="polite">
    <AppText style={styles.danger}>{errorText(error, copy)}</AppText>
    {stale && <AppText style={sharedStyles.muted}>{copy.staleData}</AppText>}
    <Action label={copy.retry} onPress={() => void refresh()} disabled={loading} secondary />
  </View>;
}

export function LoadingPayments() {
  const { copy } = useLanguage();
  return <View style={sharedStyles.section} accessibilityRole="progressbar" accessibilityLabel={copy.loading} accessibilityState={{ busy: true }}>
    <ActivityIndicator color={colors.greenSoft} />
    <AppText style={sharedStyles.muted}>{copy.loading}</AppText>
    {[0, 1, 2].map(key => <View key={key} style={styles.placeholder} aria-hidden />)}
  </View>;
}

export function intervalLabel(interval: number | null, copy: Copy): string {
  const key = ({ 1: 'every1', 2: 'every2', 3: 'every3', 6: 'every6', 12: 'every12' } as const)[interval as 1 | 2 | 3 | 6 | 12];
  return key ? copy[key] : copy.unknownInterval;
}

export function categoryLabel(category: string, copy: Copy): string {
  const keys = { rent: 'categoryRent', loan: 'categoryLoan', utilities: 'categoryUtilities', insurance: 'categoryInsurance', phone_internet: 'categoryPhone', other: 'categoryOther', subscription: 'categorySubscription' } as const;
  return copy[keys[category as keyof typeof keys] ?? 'categoryOther'];
}

export function PaymentCard({ item }: { item: OverviewItem | PaymentRow }) {
  const { copy, language } = useLanguage();
  const editable = item.kind === 'payment';
  const plan = 'plan_name' in item ? item.plan_name : item.plan;
  const contents = <>
    <View style={styles.cardHeading}>
      <IconTile name={categoryIcon(item.category)} />
      <View style={styles.cardName}>
        <AppText style={sharedStyles.cardTitle}>{item.name}</AppText>
        {!!plan && <AppText style={styles.small}>{plan}</AppText>}
        <AppText style={styles.small}>{categoryLabel(item.category, copy)}</AppText>
      </View>
      {editable && <Feather name="chevron-right" color={colors.muted} size={20} aria-hidden accessible={false} />}
    </View>
    <AppText style={styles.amount}>{formatMoney(item.amount, item.currency, language)}</AppText>
    {'due_date' in item ? <AppText>{formatDueDate(item.due_date, language)}</AppText> : <>
      <AppText>{intervalLabel(item.interval, copy)}</AppText>
      <AppText style={styles.small}>{item.start ? `${item.kind === 'payment' ? copy.firstDue : copy.renewalDue}: ${formatDueDate(item.start, language)}` : copy.unknownDate}</AppText>
      {!!item.end && <AppText style={styles.small}>{copy.endsOn} {formatDueDate(item.end, language)}</AppText>}
      {item.status === 'cancelled' && <AppText style={styles.small}>{copy.cancelled}</AppText>}
      {item.status === 'expired' && <AppText style={styles.small}>{copy.expired}</AppText>}
      {item.status === 'confirmed' && !item.renews && <AppText style={styles.small}>{copy.noRenewal}</AppText>}
    </>}
    {!editable && <AppText style={styles.small}>{copy.readOnlySubscription}</AppText>}
  </>;
  if (!editable) return <View style={sharedStyles.card}>{contents}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${copy.editPayment}: ${item.name}, ${formatMoney(item.amount, item.currency, language)}`}
    onPress={() => router.push({ pathname: '/payment', params: { id: item.id } })}
    style={({ pressed }) => [sharedStyles.card, pressed && styles.dimmed]}>{contents}</Pressable>;
}

const styles = StyleSheet.create({
  action: { minHeight: 48, backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  actionText: { color: colors.greenInk, fontFamily: fonts.medium, textAlign: 'center' },
  secondaryText: { color: colors.text },
  danger: { color: colors.error },
  dimmed: { opacity: 0.55 },
  back: { alignSelf: 'flex-start', paddingTop: 16 },
  cardHeading: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  cardName: { flex: 1, gap: 2 },
  amount: { fontFamily: fonts.heading, fontSize: 23, lineHeight: 32 },
  small: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  placeholder: { height: 92, backgroundColor: colors.surfaceRaised, borderRadius: 18 },
});
