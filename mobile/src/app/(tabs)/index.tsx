import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { AppText, BrandHeader, IconTile, Notice, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { formatMonth } from '@/i18n/language';
import { colors, fonts } from '@/theme/theme';

export default function OverviewScreen() {
  const { copy, language } = useLanguage();

  return (
    <Screen>
      <BrandHeader />
      <ScreenTitle title={copy.overviewTitle} subtitle={copy.overviewSubtitle} />
      <View style={styles.monthCard}>
        <View style={styles.monthHeading}>
          <Feather name="calendar" size={18} color={colors.greenPale} aria-hidden accessible={false} />
          <AppText style={styles.month}>{formatMonth(new Date(), language)}</AppText>
        </View>
        <View style={styles.monthBody}>
          <AppText style={styles.totalLabel}>{copy.monthTotal}</AppText>
          <AppText style={styles.total}>{copy.noTotal}</AppText>
          <AppText style={sharedStyles.muted}>{copy.monthExplanation}</AppText>
        </View>
        <View style={styles.cardAccent} />
      </View>
      <View style={sharedStyles.section}>
        <AppText accessibilityRole="header" style={sharedStyles.sectionTitle}>{copy.upcomingTitle}</AppText>
        <View style={styles.upcoming}>
          <IconTile name="clock" />
          <View style={styles.upcomingCopy}>
            <AppText style={sharedStyles.cardTitle}>{copy.upcomingEmpty}</AppText>
            <AppText style={sharedStyles.muted}>{copy.upcomingDescription}</AppText>
          </View>
        </View>
      </View>
      <View style={sharedStyles.section}>
        <AppText accessibilityRole="header" style={sharedStyles.sectionTitle}>{copy.paymentsTitle}</AppText>
        <View style={sharedStyles.card}>
          <IconTile name="layers" />
          <AppText style={sharedStyles.cardTitle}>{copy.paymentsEmpty}</AppText>
          <AppText style={sharedStyles.muted}>{copy.paymentsDescription}</AppText>
        </View>
      </View>
      <Notice>{copy.overviewNotice}</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  monthHeading: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 22, paddingVertical: 15, backgroundColor: colors.greenSurface },
  month: { color: colors.greenPale, fontFamily: fonts.medium, textTransform: 'capitalize' },
  monthBody: { padding: 22, gap: 12 },
  totalLabel: { fontSize: 14, lineHeight: 21, color: colors.muted },
  total: { fontFamily: fonts.heading, fontSize: 25, lineHeight: 34, letterSpacing: -0.7 },
  cardAccent: { alignSelf: 'flex-start', width: 64, height: 3, marginLeft: 22, backgroundColor: colors.green },
  upcoming: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  upcomingCopy: { flex: 1, gap: 6 },
});
