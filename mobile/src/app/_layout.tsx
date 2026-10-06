import Feather from '@expo/vector-icons/Feather';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { SourceSans3_400Regular } from '@expo-google-fonts/source-sans-3/400Regular';
import { SourceSans3_600SemiBold } from '@expo-google-fonts/source-sans-3/600SemiBold';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { LanguageProvider, useLanguage } from '@/i18n/LanguageProvider';
import { colors } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.greenSoft,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
  },
};

function Navigation() {
  const { ready, language } = useLanguage();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_800ExtraBold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    ...Feather.font,
  });
  const loaded = ready && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <LanguageProvider><Navigation /></LanguageProvider>;
}
