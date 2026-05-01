/**
 * 로그인한 계정 정보 카드.
 * 구글/카카오 연결 상태 + 이메일 + 이름 표시.
 */

import { Image, StyleSheet, View } from 'react-native';
import { useAuth } from '@/shared/hooks';
import { colors, radius, spacing, Text } from '@/shared/ui';

export function AccountInfo() {
  const { user, isAnonymous } = useAuth();
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const name =
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    user.email?.split('@')[0] ||
    '익명 사용자';
  const email = user.email;
  const avatar = (metadata.avatar_url as string | undefined) || undefined;

  // 연결된 provider 식별 (첫 번째 non-anonymous identity)
  const identities = user.identities ?? [];
  const providers = identities
    .map((i) => i.provider)
    .filter((p): p is string => !!p);
  const providerLabel = isAnonymous
    ? '임시 계정 (미연결)'
    : providers.includes('google')
    ? 'Google 연결됨'
    : providers.includes('kakao')
    ? 'Kakao 연결됨'
    : providers[0]
    ? `${providers[0]} 연결됨`
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarFallback]}>
            <Text variant="titleL" color="inverse">
              {name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.textBox}>
          <Text variant="titleM" numberOfLines={1}>
            {name}
          </Text>
          {email ? (
            <Text variant="bodyM" color="muted" numberOfLines={1}>
              {email}
            </Text>
          ) : null}
          {providerLabel ? (
            <Text variant="caption" color="subtle" style={styles.provider}>
              {providerLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
    gap: spacing[1],
  },
  provider: {
    marginTop: spacing[1],
  },
});
