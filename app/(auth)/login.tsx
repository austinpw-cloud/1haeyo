/**
 * 로그인 화면 (플레이스홀더).
 *
 * Sprint 1에서 카카오 로그인 연동 예정.
 * 지금은 버튼 누르면 역할 선택 화면으로 이동.
 */

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, colors, spacing, Text } from '@/shared/ui';

export default function LoginScreen() {
  const router = useRouter();

  const handleKakaoLogin = () => {
    // TODO: 카카오 로그인 (Sprint 1)
    router.replace('/(auth)/role-select');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text variant="display" color="inverse">일해요</Text>
        <Text variant="titleS" color="inverse" style={styles.slogan}>
          원하면, 바로 일해요
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          variant="kakao"
          size="lg"
          fullWidth
          onPress={handleKakaoLogin}
        >
          카카오로 시작하기
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
  notice: {
    marginTop: spacing[4],
    opacity: 0.8,
    textAlign: 'center',
  },
});
