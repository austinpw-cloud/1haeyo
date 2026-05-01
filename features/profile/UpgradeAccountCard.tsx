/**
 * 익명 계정 → 실 계정(Google/Kakao) 연결 카드.
 * 프로필 화면에 노출. 이미 연결된 계정이면 숨김.
 */

import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  linkGoogleToAnonymous,
  signInWithGoogle,
  supabase,
} from '@/shared/api';
import { useAuth } from '@/shared/hooks';
import {
  Button,
  Card,
  colors,
  radius,
  spacing,
  Text,
} from '@/shared/ui';

export function UpgradeAccountCard() {
  const { isAnonymous } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isAnonymous) return null;

  const handleGoogleUpgrade = async () => {
    setBusy(true);
    try {
      const linkResult = await linkGoogleToAnonymous();
      if (linkResult.ok) {
        Alert.alert(
          '구글 계정 연결 완료 🎉',
          '지금까지의 모든 기록(일감, 지원, 리뷰)이 그대로 유지됩니다.'
        );
        return;
      }
      const isAlreadyLinked =
        linkResult.error?.toLowerCase().includes('already') ?? false;
      if (!isAlreadyLinked) {
        Alert.alert('구글 연결 실패', linkResult.error ?? '다시 시도해주세요.');
        return;
      }
      // 이 기기의 익명 계정은 버리고 기존 구글 계정으로 전환
      await supabase.auth.signOut();
      const signInResult = await signInWithGoogle();
      if (!signInResult.ok) {
        Alert.alert('구글 로그인 실패', signInResult.error ?? '다시 시도해주세요.');
        return;
      }
      Alert.alert(
        '기존 구글 계정으로 로그인했어요',
        '이 구글 계정에 저장돼 있던 기록을 불러왔어요.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleKakaoComingSoon = () => {
    Alert.alert(
      '카카오 로그인 준비 중',
      '곧 지원할 예정이에요.'
    );
  };

  return (
    <Card style={styles.card}>
      <Text variant="titleS">계정 연결하기</Text>
      <Text variant="bodyM" color="muted" style={styles.desc}>
        아직 임시 계정이에요. 계정을 연결하면 기기 바뀌어도
        내 기록이 유지되고 더 안전해요.
      </Text>
      <View style={styles.buttonRow}>
        <Button
          variant="google"
          size="md"
          fullWidth
          onPress={handleGoogleUpgrade}
          loading={busy}
          disabled={busy}
        >
          구글로 연결하기
        </Button>
        <Button
          variant="kakao"
          size="md"
          fullWidth
          onPress={handleKakaoComingSoon}
          disabled={busy}
        >
          카카오로 연결하기 (준비 중)
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },
  desc: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  buttonRow: {
    gap: spacing[2],
  },
});
