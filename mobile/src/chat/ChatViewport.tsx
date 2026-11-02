import Feather from '@expo/vector-icons/Feather';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { KeyboardChatScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { useLanguage } from '@/i18n/LanguageProvider';
import { useTabBarHeight } from '@/navigation/TabBar';
import { colors } from '@/theme/theme';

import { createScrollFollow, isNearEnd } from './scroll';

export type ChatViewportHandle = { revealLatest: () => void; reset: () => void };

export function ChatViewport({ children, composer, revision, hasMessages, active, ref }: {
  children: ReactNode;
  composer: ReactNode;
  revision: unknown;
  hasMessages: boolean;
  active: boolean;
  ref: Ref<ChatViewportHandle>;
}) {
  const { copy } = useLanguage();
  const tabBarHeight = useTabBarHeight();
  const reducedMotion = useReducedMotion();
  const scroll = useRef<ScrollViewInstance>(null);
  const [follow] = useState(createScrollFollow);
  const [awayFromEnd, setAwayFromEnd] = useState(false);
  const [composerHeight, setComposerHeight] = useState(88);
  const padding = useSharedValue(88);
  const frame = useRef<number | null>(null);
  const native = Platform.OS !== 'web';
  const List = native ? KeyboardChatScrollView : ScrollView;

  const scheduleScroll = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (follow.takeScroll()) scroll.current?.scrollToEnd({ animated: !reducedMotion });
    });
  }, [follow, reducedMotion]);

  const revealLatest = useCallback(() => {
    follow.reveal();
    scheduleScroll();
  }, [follow, scheduleScroll]);

  useImperativeHandle(ref, () => ({
    revealLatest,
    reset() { follow.reset(); scroll.current?.scrollTo({ y: 0, animated: false }); },
  }), [follow, revealLatest]);

  useLayoutEffect(() => {
    if (!hasMessages) return;
    follow.contentChanged();
    scheduleScroll();
  }, [revision, hasMessages, follow, scheduleScroll]);

  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);

  const endVisible = useCallback((visible: boolean) => {
    follow.endVisible(visible);
    setAwayFromEnd(!visible);
  }, [follow]);

  return <View style={styles.page}>
    <List ref={scroll} style={styles.page} contentContainerStyle={[styles.scroll, !native && { paddingBottom: composerHeight + 24 }]}
      keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : native ? 'on-drag' : 'none'}
      directionalLockEnabled scrollEventThrottle={16}
      {...(native ? { offset: tabBarHeight, extraContentPadding: padding, keyboardLiftBehavior: 'whenAtEnd' as const, freeze: !active, onEndVisible: endVisible } : {
        onScroll: (event: { nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number }; contentSize: { height: number } } }) => {
          const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
          endVisible(isNearEnd(contentOffset.y, layoutMeasurement.height, contentSize.height));
        },
      })}
      onScrollBeginDrag={() => follow.beginDrag()} onScrollEndDrag={() => { follow.endDrag(); scheduleScroll(); }}
      onContentSizeChange={() => { if (hasMessages) scheduleScroll(); }}>
      {children}
    </List>
    <KeyboardStickyView enabled={native && active} offset={{ opened: tabBarHeight }} style={styles.footer}>
      {hasMessages && awayFromEnd && <Pressable accessibilityRole="button" accessibilityLabel={copy.chatLatest} onPress={revealLatest}
        style={({ pressed }) => [styles.latest, pressed && styles.pressed]}>
        <Feather name="arrow-down" size={22} color={colors.greenSoft} />
      </Pressable>}
      <View onLayout={event => { const height = event.nativeEvent.layout.height; padding.value = height; setComposerHeight(height); }}>
        {composer}
      </View>
    </KeyboardStickyView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  latest: { position: 'absolute', bottom: '100%', right: 20, marginBottom: 12, width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
});
