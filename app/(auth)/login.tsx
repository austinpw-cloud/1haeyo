/**
 * 로그인 화면.
 *
 * 기본: Google 로그인 (Supabase OAuth).
 * 카카오 로그인은 준비 중 (비즈 앱 전환 후 활성화 예정).
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  linkGoogleToAnonymous,
  signInWithGoogle,
  supabase,
} from '@/shared/api';
import { useAuth } from '@/shared/hooks';
import { Button, colors, spacing, Text } from '@/shared/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { user, isAnonymous } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleGoogleLogin = async () => {
    setBusy(true);
    try {
      // 1차: 익명이면 link 시도 (기존 데이터 보존)
      if (user && isAnonymous) {
        const linkResult = await linkGoogleToAnonymous();
        if (linkResult.ok) {
          router.replace('/(auth)/role-select');
          return;
        }
        // 이미 연결된 identity라면 익명 로그아웃 + 기존 구글 계정으로 로그인
        const isAlreadyLinked =
          linkResult.error?.toLowerCase().includes('already') ?? false;
        if (!isAlreadyLinked) {
          Alert.alert('구글 로그인 실패', linkResult.error ?? '다시 시도해주세요.');
          return;
        }
        await supabase.auth.signOut();
      }

      // 2차: 신규 또는 폴백 — 기존 구글 계정으로 signIn
      const signInResult = await signInWithGoogle();
      if (!signInResult.ok) {
        Alert.alert('구글 로그인 실패', signInResult.error ?? '다시 시도해주세요.');
        return;
      }
      router.replace('/(auth)/role-select');
    } finally {
      setBusy(false);
    }
  };

  const handleKakaoComingSoon = () => {
    Alert.alert(
      '카카오 로그인 준비 중',
      '곧 지원할 예정이에요. 지금은 구글 로그인으로 시작해 주세요.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text variant="display" color="inverse">
          일해요
        </Text>
        <Text variant="titleS" color="inverse" style={styles.slogan}>
          원하면, 바로 일해요
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          variant="google"
          size="lg"
          fullWidth
          onPress={handleGoogleLogin}
          loading={busy}
          disabled={busy}
          style={styles.buttonSpacing}
        >
          구글로 시작하기
        </Button>

        <Button
          variant="kakao"
          size="lg"
          fullWidth
          onPress={handleKakaoComingSoon}
          disabled={busy}
        >
          카카오로 시작하기 (준비 중)
        </Button>

        <Text variant="caption" color="inverse" style={styles.notice}>
          시작하면 이용약관과 개인정보처리방침에 동의한 것으로 간주됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[6],
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slogan: {
    marginTop: spacing[3],
    opacity: 0.9,
  },
  footer: {
    paddingBottom: spacing[6],
  },
  buttonSpacing: {
    marginBottom: spacing[3],
  },
  notice: {
    marginTop: spacing[4],
    opacity: 0.8,
    textAlign: 'center',
  },
});
