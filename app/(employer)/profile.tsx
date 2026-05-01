/**
 * 사장님 프로필 화면 — 가게 정보, 별점, 채용 이력.
 * Sprint 7에서 실제 데이터 연동 예정.
 */

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AccountInfo, UpgradeAccountCard } from '@/features/profile';
import { supabase } from '@/shared/api';
import { useRole } from '@/shared/hooks';
import {
  Button,
  Card,
  colors,
  ScreenHeader,
  spacing,
  Text,
} from '@/shared/ui';

export default function EmployerProfileScreen() {
  const router = useRouter();
  const { clearRole } = useRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearRole();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="프로필" />

      <AccountInfo />

      <Text variant="bodyL" color="muted" style={styles.ratingLine}>
        ⭐ 아직 평가 없음
      </Text>

      <Card style={styles.statsRow} elevation="none">
        <Stat value="0" label="채용 횟수" />
        <Stat value="-" label="정산 속도" />
        <Stat value="0" label="단골 일손" />
      </Card>

      <UpgradeAccountCard />

      <View style={styles.footer}>
        <Button variant="outline" size="lg" fullWidth onPress={handleLogout}>
          로그아웃
        </Button>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text variant="titleL">{value}</Text>
      <Text variant="bodyM" color="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  ratingLine: {
    textAlign: 'center',
    marginVertical: spacing[5],
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing[6],
    paddingVertical: spacing[6],
    marginBottom: spacing[8],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  footer: {
    paddingHorizontal: spacing[6],
    marginTop: 'auto',
    paddingBottom: spacing[6],
  },
});
