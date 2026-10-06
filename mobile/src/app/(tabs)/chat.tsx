import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { AppText, BrandHeader, IconTile, Notice, Screen, ScreenTitle, sharedStyles } from '@/components/ui';
import { useLanguage } from '@/i18n/LanguageProvider';
import { colors, fonts } from '@/theme/theme';

export default function ChatScreen() {
  const { copy } = useLanguage();

  return (
    <Screen>
      <BrandHeader />
      <ScreenTitle title={copy.chatTitle} subtitle={copy.chatSubtitle} />
      <View style={styles.conversation}>
        <IconTile name="message-circle" />
        <AppText style={styles.exampleLabel}>{copy.chatExampleLabel}</AppText>
        <View style={styles.bubble}>
          <AppText style={styles.example}>{copy.chatExample}</AppText>
        </View>
        <AppText style={sharedStyles.muted}>{copy.chatExplanation}</AppText>
      </View>
      <View style={styles.composer} accessibilityLabel={copy.chatUnavailable} accessibilityState={{ disabled: true }} aria-disabled accessible>
        <AppText style={styles.placeholder}>{copy.chatInput}</AppText>
        <View style={styles.send}><Feather name="arrow-up" size={20} color={colors.dim} aria-hidden /></View>
      </View>
      <Notice>{copy.chatNotice}</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  conversation: { gap: 22, paddingVertical: 16 },
  exampleLabel: { color: colors.muted, fontSize: 15 },
  bubble: { alignSelf: 'flex-end', maxWidth: '90%', backgroundColor: colors.green, padding: 20, borderRadius: 24, borderBottomRightRadius: 6 },
  example: { color: colors.greenInk, fontFamily: fonts.medium, fontSize: 20, lineHeight: 28 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingLeft: 20, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  placeholder: { flex: 1, color: colors.dim },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
});
