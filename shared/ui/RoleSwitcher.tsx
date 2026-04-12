/**
 * 역할 전환 토글.
 * 각 탭 그룹 상단에 표시되어 현재 모드를 알려주고,
 * 탭하면 반대 역할로 전환한다.
 */

import { useRouter } from 'expo-router';
import { ArrowLeftRight, HandHelping, Store } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRole } from '@/shared/hooks';
import { RoleLabel, UserRole } from '@/shared/types';
import { colors, radius, spacing } from './tokens';
import { Text } from './Text';

export function RoleSwitcher() {
  const router = useRouter();
  const { role, setRole } = useRole();

  if (!role) {
    return null;
  }

  const switchTo: UserRole = role === 'worker' ? 'employer' : 'worker';
  const badgeColor =
    role === 'worker' ? colors.primary[500] : colors.secondary[500];

  const Icon = role === 'worker' ? HandHelping : Store;

  const handleSwitch = () => {
    setRole(switchTo);
    router.replace(switchTo === 'worker' ? '/(worker)' : '/(employer)');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Icon size={14} color={colors.neutral[0]} />
        <Text variant="caption" color="inverse" style={styles.badgeText}>
          {RoleLabel[role]} 모드
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.switchButton,
          pressed && styles.switchButtonPressed,
        ]}
        onPress={handleSwitch}
      >
        <ArrowLeftRight size={14} color={colors.neutral[600]} />
        <Text variant="bodyM" color="muted" style={styles.switchText}>
          {RoleLabel[switchTo]}으로 전환
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  badgeText: {
    // spacing is in gap
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  switchButtonPressed: {
    opacity: 0.6,
  },
  switchText: {
    textDecorationLine: 'underline',
  },
});
