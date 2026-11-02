import Feather from '@expo/vector-icons/Feather';
import { useState, type Ref } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, TextInput, View, useWindowDimensions, type TextInputInstance } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

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
  const keyboardVisible = useKeyboardState(state => state.isVisible);
  const [contentHeight, setContentHeight] = useState(46);
  const minHeight = Math.max(46, 24 * fontScale + 20);
  const maxHeight = Math.max(minHeight, 120 * fontScale + 20);
  const height = value ? Math.min(maxHeight, Math.max(minHeight, contentHeight)) : minHeight;
  const disabled = busy || locked || !value.trim();

  return <View style={styles.outer}>
    <View style={styles.composer}>
      <TextInput ref={inputRef} accessibilityLabel={copy.chatInput} value={value} onChangeText={onChange}
        placeholder={copy.chatInput} placeholderTextColor={colors.dim} selectionColor={colors.greenSoft}
        editable={!locked} multiline maxLength={2000} submitBehavior="newline" textAlignVertical="top"
        scrollEnabled={contentHeight > maxHeight} onContentSizeChange={event => setContentHeight(event.nativeEvent.contentSize.height)}
        style={[styles.input, { height }]} />
      <View style={styles.actions}>
        {keyboardVisible && <Pressable accessibilityRole="button" accessibilityLabel={copy.chatHideKeyboard} onPress={Keyboard.dismiss}
          style={({ pressed }) => [styles.hide, pressed && styles.pressed]}>
          <Feather name="chevron-down" size={22} color={colors.muted} />
        </Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel={onCancel ? copy.chatStop : busy ? copy.saving : copy.chatSend}
          accessibilityState={{ disabled: !onCancel && disabled, busy: busy && !onCancel }} disabled={!onCancel && disabled} onPress={onCancel ?? onSend}
          style={({ pressed }) => [styles.send, !onCancel && disabled && styles.disabled, pressed && styles.pressed]}>
          {onCancel ? <Feather name="square" size={20} color={colors.greenInk} /> : busy ? <ActivityIndicator color={colors.greenInk} /> : <Feather name="arrow-up" size={22} color={colors.greenInk} />}
        </Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  composer: { width: '100%', maxWidth: 580, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 24, backgroundColor: colors.surface, padding: 8 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 10, fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.text },
  actions: { flexDirection: 'row', alignItems: 'center' },
  hide: { width: 44, height: 46, alignItems: 'center', justifyContent: 'center' },
  send: { width: 46, height: 46, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.green },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.65 },
});
