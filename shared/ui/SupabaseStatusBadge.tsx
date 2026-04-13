/**
 * Supabase 연결 + 로그인 상태 배지 (개발용 디버그).
 * Sprint 6 카카오 로그인 연동 후 제거 예정.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { checkSupabaseConnection } from '@/shared/api';
import { useAuth } from '@/shared/hooks';
import { colors, radius, spacing } from './tokens';
import { Text } from './Text';

export function SupabaseStatusBadge() {
  const { user, isLoading, error, isAnonymous } = useAuth();
  const [connOk, setConnOk] = useState<boolean | null>(null);

  useEffect(() => {
    checkSupabaseConnection().then((res) => setConnOk(res.ok));
  }, []);

  if (isLoading) {
    return (
      <Badge bg={colors.neutral[100]} color={colors.neutral[600]}>
        연결 확인 중...
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge
        bg={colors.semantic.error + '22'}
        color={colors.semantic.error}
      >
        ⚠ 로그인 실패: {error}
      </Badge>
    );
  }

  if (connOk === false) {
    return (
      <Badge
        bg={colors.semantic.error + '22'}
        color={colors.semantic.error}
      >
        ⚠ Supabase 연결 실패
      </Badge>
    );
  }

  if (user) {
    return (
      <Badge
        bg={colors.secondary[100]}
        color={colors.secondary[700]}
      >
        ✓ {isAnonymous ? '익명 로그인됨' : '로그인됨'} · {user.id.slice(0, 8)}
      </Badge>
    );
  }

  return (
    <Badge bg={colors.neutral[100]} color={colors.neutral[600]}>
      로그인 안됨
    </Badge>
  );
}

function Badge({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" style={{ color }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
});
