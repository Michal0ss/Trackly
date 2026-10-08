import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, BrandHeader, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Action, ConnectionState, DataError, LoadingPayments, PaymentCard, useDataRefresh } from '@/payments/components';
import { usePayments } from '@/payments/PaymentsProvider';
import { formatMoney, monthLabel, shiftMonth } from '@/payments/model';
import { colors, fonts } from '@/theme/theme';

export default function OverviewScreen() {
  const { copy, language } = useLanguage();
  const { month, setMonth, today, data, connected, loading, refresh } = usePayments();
  const overview = data?.overview.month === month ? data.overview : null;
  const refreshControl = useDataRefresh();

  return <Screen refreshControl={connected ? refreshControl : undefined}>
    <BrandHeader />
    <ScreenTitle title={copy.overviewTitle} subtitle={copy.overviewSubtitle} />
    {!connected ? <ConnectionState /> : <>
      <Action label={copy.addPayment} onPress={() => router.push('/payment')} />
      <View style={styles.monthCard}>
        <View style={styles.monthHeading}>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.previousMonth} style={styles.arrow} onPress={() => setMonth(shiftMonth(month, -1))}>
            <Feather name="chevron-left" size={22} color={colors.greenPale} aria-hidden />
          </Pressable>
          <AppText accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.month}>{monthLabel(month, language)}</AppText>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.nextMonth} style={styles.arrow} onPress={() => setMonth(shiftMonth(month, 1))}>
            <Feather name="chevron-right" size={22} color={colors.greenPale} aria-hidden />
          </Pressable>
        </View>
        <View style={styles.monthBody}>
          <AppText style={sharedStyles.muted}>{copy.monthTotal}</AppText>
          {overview ? overview.totals.length ? overview.totals.map(total => <AppText key={total.currency} style={styles.total}>{formatMoney(total.amount, total.currency, language)}</AppText>) : <AppText style={styles.total}>{copy.noTotal}</AppText> : <AppText style={sharedStyles.muted}>{loading ? copy.loading : copy.serverError}</AppText>}
          <AppText style={styles.small}>{copy.plannedExplanation}</AppText>
          {month !== today.slice(0, 7) && <Action secondary label={copy.currentMonth} onPress={() => setMonth(today.slice(0, 7))} />}
        </View>
        <View style={styles.cardAccent} />
      </View>
      <DataError stale={Boolean(overview)} />
      {loading && !overview ? <LoadingPayments /> : overview && <>
        <View style={sharedStyles.section}>
          <AppText accessibilityRole="header" style={sharedStyles.sectionTitle}>{copy.upcomingTitle}</AppText>
          <AppText style={styles.small}>{copy.nextFromToday}</AppText>
          {overview.next ? <PaymentCard item={overview.next} /> : <AppText style={sharedStyles.muted}>{copy.noUpcoming}</AppText>}
        </View>
        <View style={sharedStyles.section}>
          <AppText accessibilityRole="header" style={sharedStyles.sectionTitle}>{copy.thisMonth}</AppText>
          {overview.items.length ? overview.items.map(item => <PaymentCard key={`${item.kind}-${item.id}`} item={item} />) : <AppText style={sharedStyles.muted}>{copy.noMonthPayments}</AppText>}
        </View>
      </>}
      <Action secondary label={copy.allPayments} onPress={() => router.push('/payments')} />
      <Action secondary label={copy.refresh} disabled={loading} onPress={() => void refresh()} />
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  monthCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  monthHeading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 7, backgroundColor: colors.greenSurface },
  arrow: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  month: { flex: 1, textAlign: 'center', color: colors.greenPale, fontFamily: fonts.medium, textTransform: 'capitalize' },
  monthBody: { padding: 22, gap: 12 },
  total: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 36, letterSpacing: -0.7 },
  small: { fontSize: 15, lineHeight: 23, color: colors.muted },
  cardAccent: { alignSelf: 'flex-start', width: 64, height: 3, marginLeft: 22, backgroundColor: colors.green },
});
