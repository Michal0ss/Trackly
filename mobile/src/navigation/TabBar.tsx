import { createContext, useContext } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';
import { useKeyboardState, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { colors, fonts } from '@/theme/theme';

export const TabBarHeightContext = createContext(0);
export const useTabBarHeight = () => useContext(TabBarHeightContext);

export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: MaterialTopTabBarProps) {
  const height = useTabBarHeight();
  const { progress } = useReanimatedKeyboardAnimation();
  const keyboardVisible = useKeyboardState(state => state.isVisible);
  const keyboardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: progress.value * height }] }));

  return <Animated.View style={[styles.bar, { height, paddingBottom: Math.max(insets.bottom, 12), paddingLeft: insets.left, paddingRight: insets.right }, keyboardStyle]}
    accessibilityRole="tablist" accessibilityElementsHidden={keyboardVisible} importantForAccessibility={keyboardVisible ? 'no-hide-descendants' : 'auto'}>
    {state.routes.map((route, index) => {
      const options = descriptors[route.key]?.options;
      const focused = index === state.index;
      const color = focused ? colors.greenSoft : colors.muted;
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={options?.tabBarAccessibilityLabel ?? options?.title}
        accessibilityState={{ selected: focused }} aria-selected={focused} onPress={() => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!event.defaultPrevented) { Keyboard.dismiss(); navigateToTab(route.key); }
        }} onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
        style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
        <View aria-hidden>{options?.tabBarIcon?.({ focused, color })}</View>
        <AppText style={[styles.label, { color }]}>{options?.title ?? route.name}</AppText>
      </Pressable>;
    })}
  </Animated.View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
