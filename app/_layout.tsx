import { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold, Cairo_800ExtraBold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initStorage } from '../services/storage';
import Animated, { FadeIn, FadeOut, withRepeat, withTiming, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'login',
};

// --- Polished Typewriter Component ---
function TypewriterEffect({ text, onFinished }: { text: string; onFinished: () => void }) {
  const [displayText, setDisplayText] = useState('');
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    // Cursor blinking effect
    cursorOpacity.value = withRepeat(withTiming(0, { duration: 500 }), -1, true);

    let index = 0;
    const interval = setInterval(() => {
      setDisplayText(text.substring(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setTimeout(onFinished, 1500); // 1.5 seconds wait after completion
      }
    }, 90); // Perfect typing speed
    
    return () => clearInterval(interval);
  }, [text]);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <View style={styles.splashContainer}>
      <View style={styles.textRow}>
        <Text style={styles.splashText}>{displayText}</Text>
        <Animated.View style={[styles.cursor, animatedCursorStyle]} />
      </View>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  
  const [fontsLoaded, error] = useFonts({
    Cairo: Cairo_400Regular,
    CairoSemiBold: Cairo_600SemiBold,
    CairoBold: Cairo_700Bold,
    CairoExtraBold: Cairo_800ExtraBold,
  });

  const [isAppInitialized, setIsAppInitialized] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // 1. Initial Setup
  useEffect(() => {
    async function prepare() {
      try {
        await initStorage();
        setIsAppInitialized(true);
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  // 2. Hide System Splash when Fonts & Storage ready
  useEffect(() => {
    if (fontsLoaded && isAppInitialized) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, isAppInitialized]);

  // 3. Navigation Logic (Only after Intro and Auth Check)
  useEffect(() => {
    if (showIntro || !isAppInitialized || !fontsLoaded) return;

    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('mstore_auth_user');
        const inTabs = segments[0] === '(tabs)';
        const inLogin = segments[0] === 'login';

        if (!token && inTabs) {
          router.replace('/login');
        } else if (token && inLogin) {
          router.replace('/(tabs)');
        }
        setIsAuthChecked(true);
      } catch (e) {
        console.warn(e);
      }
    };

    checkAuth();
  }, [showIntro, isAppInitialized, fontsLoaded, segments[0]]);

  // --- RENDERING STRATEGY ---

  // While fonts are loading, show nothing (system splash is up)
  if (!fontsLoaded || !isAppInitialized) {
    return null;
  }

  // Show our custom typewriter intro
  if (showIntro) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <StatusBar style="dark" />
        <TypewriterEffect 
          text="Smart Warehouse" 
          onFinished={() => setShowIntro(false)} 
        />
      </View>
    );
  }

  // Final Application Stack
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  splashText: {
    fontFamily: 'CairoBold',
    fontSize: 26,
    color: '#1d1d1f',
  },
  cursor: {
    width: 3,
    height: 30,
    backgroundColor: '#0071e3',
    borderRadius: 2,
  }
});
