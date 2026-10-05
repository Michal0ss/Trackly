import Feather from '@expo/vector-icons/Feather';
import Constants from 'expo-constants';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, BrandHeader, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { LanguagePreference } from '@/i18n/language';
import { colors, fonts } from '@/theme/theme';

export default function SettingsScreen() {
  const { copy, preference, setPreference, storageError } = useLanguage();
  const options: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: copy.systemLanguage },
    { value: 'pl', label: copy.polish },
    { value: 'en', label: copy.english },
  ];

  return (
    <Screen>
      <BrandHeader />
      <ScreenTitle title={copy.settingsTitle} subtitle={copy.settingsSubtitle} />
      <View style={sharedStyles.section}>
        <AppText accessibilityRole="header" style={sharedStyles.sectionTitle}>{copy.languageTitle}</AppText>
        <AppText style={sharedStyles.muted}>{copy.languageDescription}</AppText>
        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel={copy.languageTitle}>
          {options.map(({ value, label }, index) => {
            const selected = preference === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                onPress={() => setPreference(value)}
                style={({ pressed }) => [styles.option, index > 0 && styles.separator, selected && styles.selected, pressed && styles.pressed]}
              >
                <AppText style={[styles.optionLabel, selected && styles.selectedLabel]}>{label}</AppText>
                {selected ? <Feather name="check-circle" size={22} color={colors.greenSoft} aria-hidden accessible={false} /> : <View style={styles.radio} />}
              </Pressable>
            );
          })}
        </View>
        {storageError && <AppText accessibilityRole="alert" style={styles.error}>{storageError === 'load' ? copy.loadLanguageError : copy.saveLanguageError}</AppText>}
      </View>
      <View style={sharedStyles.card}>
        <AppText style={sharedStyles.cardTitle}>{copy.aboutTitle}</AppText>
        <AppText style={sharedStyles.muted}>{copy.aboutDescription}</AppText>
      </View>
      <AppText style={styles.version}>Trackly · {copy.version} {Constants.expoConfig?.version}</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 62, paddingVertical: 18, paddingHorizontal: 20 },
  optionLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 18 },
  separator: { borderTopWidth: 1, borderTopColor: colors.border },
  selected: { backgroundColor: colors.greenSurface },
  selectedLabel: { color: colors.greenPale },
  pressed: { opacity: 0.75 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: colors.dim },
  error: { color: colors.error, fontSize: 15, lineHeight: 22 },
  version: { color: colors.dim, textAlign: 'center', fontSize: 14 },
});
