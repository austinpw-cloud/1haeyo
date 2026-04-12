/**
 * 역할 선택 화면.
 *
 * 로그인 후 "일손 / 사장님" 중 하나 선택.
 * 나중에 언제든 프로필에서 변경 가능.
 */

import { useRouter } from 'expo-router';
import { HandHelping, Store } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRole } from '@/shared/hooks';
import { UserRole } from '@/shared/types';
import { colors, radius, shadows, spacing, Text } from '@/shared/ui';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useRole();

  const choose = (role: UserRole) => {
    setRole(role);
    router.replace(role === 'worker' ? '/(worker)' : '/(employer)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text variant="titleL">어떻게 쓰실 거에요?</Text>
        <Text variant="bodyL" color="muted" style={styles.subtitle}>
          나중에 언제든 바꿀 수 있어요
        </Text>
      </View>

      <View style={styles.cards}>
        <RoleCard
          icon={<HandHelping size={56} color={colors.primary[500]} />}
          title="일하고 싶어요"
          subtitle="내 주변 일감을 찾고"
          accent="일손으로 시작"
          color={colors.primary[500]}
          onPress={() => choose('worker')}
        />

        <RoleCard
          icon={<Store size={56} color={colors.secondary[500]} />}
          title="사람을 찾아요"
          subtitle="우리 가게에 필요한"
          accent="사장님으로 시작"
          color={colors.secondary[500]}
          onPress={() => choose('employer')}
        />
      </View>
    </SafeAreaView>
  );
}

function RoleCard({
  icon,
  title,
  subtitle,
  accent,
  color,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderColor: color },
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {icon}
      <Text variant="bodyM" color="muted" style={styles.cardSubtitle}>
        {subtitle}
      </Text>
      <Text variant="titleL" style={styles.cardTitle}>
        {title}
      </Text>
      <View style={[styles.accent, { backgroundColor: color }]}>
        <Text variant="caption" color="inverse">
          {accent}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing[6],
  },
  header: {
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  cards: {
    flex: 1,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  card: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing[6],
    borderWidth: 2,
    justifyContent: 'center',
    ...shadows.md,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardSubtitle: {
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  cardTitle: {
    marginBottom: spacing[5],
  },
  accent: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
});
