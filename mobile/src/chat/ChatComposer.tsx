import Feather from '@expo/vector-icons/Feather';
import { useState, type Ref } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View, useWindowDimensions, type TextInputInstance } from 'react-native';

import { useLanguage } from '@/i18n/LanguageProvider';
import { colors, fonts } from '@/theme/theme';

export function ChatComposer({ value, onChange, onSend, onCancel, busy, locked, inputRef }: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  busy: boolean;
  locked: boolean;
  inputRef: Ref<TextInputInstance>;
}) {
  const { copy } = useLanguage();
  const { fontScale } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState(46);
  const minHeight = Math.max(46, 24 * fontScale + 20);
  const maxHeight = Math.max(minHeight, 120 * fontScale + 20);
  const web = Platform.OS === 'web';
  const disabled = busy || locked || !value.trim();

  return <View style={styles.outer}>
    <View style={styles.composer}>
      <TextInput ref={inputRef} accessibilityLabel={copy.chatInput} value={value} onChangeText={onChange}
        placeholder={copy.chatInput} placeholderTextColor={colors.dim} selectionColor={colors.greenSoft}
        editable={!locked} multiline maxLength={2000} submitBehavior="newline" textAlignVertical="top"
        onContentSizeChange={web ? event => setContentHeight(event.nativeEvent.contentSize.height) : undefined}
        style={[styles.input, { minHeight, maxHeight }, web && { height: value ? Math.min(maxHeight, Math.max(minHeight, contentHeight)) : minHeight }]} />
      <Pressable accessibilityRole="button" accessibilityLabel={onCancel ? copy.chatStop : busy ? copy.saving : copy.chatSend}
        accessibilityState={{ disabled: !onCancel && disabled, busy: busy && !onCancel }} disabled={!onCancel && disabled} onPress={onCancel ?? onSend}
        style={({ pressed }) => [styles.send, !onCancel && disabled && styles.disabled, pressed && styles.pressed]}>
        {onCancel ? <Feather name="square" size={20} color={colors.greenInk} /> : busy ? <ActivityIndicator color={colors.greenInk} /> : <Feather name="arrow-up" size={22} color={colors.greenInk} />}
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  composer: { width: '100%', maxWidth: 580, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 24, backgroundColor: colors.surface, padding: 8 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 10, fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.text },
  send: { width: 46, height: 46, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.green },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.65 },
});
