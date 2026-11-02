import Feather from '@expo/vector-icons/Feather';
import { TopTabs } from 'expo-router/js-top-tabs';
import { Platform, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/i18n/LanguageProvider';
import { TabBar, TabBarHeightContext } from '@/navigation/TabBar';
import { colors } from '@/theme/theme';

export default function TabsLayout() {
  const { copy } = useLanguage();
  const { bottom } = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  return (
    <TabBarHeightContext.Provider value={58 + 20 * fontScale + bottom}>
      <TopTabs tabBarPosition="bottom" tabBar={props => <TabBar {...props} />} initialLayout={{ width }} keyboardDismissMode="on-drag" backBehavior="history" screenOptions={{
        swipeEnabled: Platform.OS !== 'web',
        animationEnabled: !reducedMotion,
        lazyPreloadDistance: 1,
        sceneStyle: { backgroundColor: colors.background },
      }}>
        <TopTabs.Screen name="index" options={{
          title: copy.overviewTab,
          tabBarAccessibilityLabel: copy.overviewTab,
          tabBarIcon: ({ focused }) => <Feather name="grid" size={22} color={focused ? colors.greenSoft : colors.muted} aria-hidden />,
        }} />
        <TopTabs.Screen name="chat" options={{
          title: copy.chatTab,
          tabBarAccessibilityLabel: copy.chatTab,
          tabBarIcon: ({ focused }) => <Feather name="message-circle" size={22} color={focused ? colors.greenSoft : colors.muted} aria-hidden />,
        }} />
        <TopTabs.Screen name="settings" options={{
          title: copy.settingsTab,
          tabBarAccessibilityLabel: copy.settingsTab,
          tabBarIcon: ({ focused }) => <Feather name="sliders" size={22} color={focused ? colors.greenSoft : colors.muted} aria-hidden />,
        }} />
      </TopTabs>
    </TabBarHeightContext.Provider>
  );
}
