/**
 * 앱 전체 루트 레이아웃.
 * 모든 화면의 최상위 래퍼.
 */

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RoleProvider } from '@/shared/hooks';
import { MockDataProvider } from '@/shared/store';

// 폰트 로드 완료 전에 스플래시 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <RoleProvider>
      <MockDataProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(worker)" />
            <Stack.Screen name="(employer)" />
            <Stack.Screen
              name="job/[id]"
              options={{ headerShown: true, title: '일감 상세' }}
            />
          </Stack>
        </SafeAreaProvider>
      </MockDataProvider>
    </RoleProvider>
  );
}
