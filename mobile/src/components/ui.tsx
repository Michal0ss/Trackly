import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps, ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, type TextProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/i18n/LanguageProvider';
import { colors, fonts } from '@/theme/theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function BrandHeader() {
  const { copy } = useLanguage();
  return (
    <View style={styles.brandHeader}>
      <Image
        source={require('../../assets/wordmark.png')}
        style={styles.wordmark}
        resizeMode="contain"
        accessibilityLabel="Trackly"
        accessibilityRole="image"
      />
      <View style={styles.previewBadge}>
        <View style={styles.dot} />
        <AppText style={styles.previewText}>{copy.preview}</AppText>
      </View>
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.headingBlock}>
      <AppText accessibilityRole="header" style={styles.title}>{title}</AppText>
      <AppText style={styles.subtitle}>{subtitle}</AppText>
    </View>
  );
}

export function IconTile({ name }: { name: ComponentProps<typeof Feather>['name'] }) {
  return (
    <View style={styles.iconTile} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Feather name={name} size={23} color={colors.greenPale} />
    </View>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.notice}>
      <Feather name="info" size={16} color={colors.dim} aria-hidden accessible={false} />
      <AppText style={styles.noticeText}>{children}</AppText>
    </View>
  );
}

export const sharedStyles = StyleSheet.create({
  section: { gap: 16 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 26 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    gap: 12,
  },
  cardTitle: { fontFamily: fonts.medium, fontSize: 19, lineHeight: 26 },
  muted: { color: colors.muted, fontSize: 17, lineHeight: 25 },
});

const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: colors.text },
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 580, alignSelf: 'center', gap: 28 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 16 },
  wordmark: { width: 103, height: 37 },
  previewBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.greenSoft },
  previewText: { fontSize: 13, lineHeight: 19, color: colors.muted },
  headingBlock: { gap: 12 },
  title: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 42, letterSpacing: -1.1 },
  subtitle: { color: colors.muted, fontSize: 18, lineHeight: 26 },
  iconTile: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.greenSurface, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.muted },
});
