import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLanguage } from '@/i18n/LanguageProvider';
import { colors, fonts } from '@/theme/theme';

export default function TabsLayout() {
  const { copy } = useLanguage();
  const { bottom } = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.greenSoft,
      tabBarInactiveTintColor: colors.muted,
      tabBarHideOnKeyboard: true,
      tabBarLabelPosition: 'below-icon',
      tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 13 },
      tabBarStyle: {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        height: 58 + 20 * fontScale + bottom,
        paddingTop: 10,
        paddingBottom: Math.max(bottom, 12),
      },
    }}>
      <Tabs.Screen name="index" options={{
        title: copy.overviewTab,
        tabBarAccessibilityLabel: copy.overviewTab,
        tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} aria-hidden />,
      }} />
      <Tabs.Screen name="chat" options={{
        title: copy.chatTab,
        tabBarAccessibilityLabel: copy.chatTab,
        tabBarIcon: ({ color }) => <Feather name="message-circle" size={22} color={color} aria-hidden />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: copy.settingsTab,
        tabBarAccessibilityLabel: copy.settingsTab,
        tabBarIcon: ({ color }) => <Feather name="sliders" size={22} color={color} aria-hidden />,
      }} />
    </Tabs>
  );
}
