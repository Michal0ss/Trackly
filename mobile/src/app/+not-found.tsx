import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AppText, BrandHeader, Screen, ScreenTitle } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { colors, fonts } from '@/theme/theme';

export default function NotFoundScreen() {
  const { copy } = useLanguage();
  return (
    <Screen>
      <BrandHeader />
      <ScreenTitle title={copy.notFoundTitle} subtitle={copy.notFoundDescription} />
      <Link href="/" replace asChild>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <AppText style={styles.label}>{copy.backHome}</AppText>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.green, padding: 18, borderRadius: 16, minHeight: 52, alignItems: 'center' },
  label: { fontFamily: fonts.medium, color: colors.greenInk },
  pressed: { opacity: 0.8 },
});
