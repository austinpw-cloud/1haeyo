/**
 * 일손 프로필 화면 — 내 정보, 별점, 뱃지, 근무 이력.
 * Sprint 7에서 실제 데이터 + 뱃지 시스템 연동 예정.
 */

import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  AccountInfo,
  BankAccountCard,
  UpgradeAccountCard,
} from '@/features/profile';
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

export default function WorkerProfileScreen() {
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

      <ScrollView showsVerticalScrollIndicator={false}>
      <AccountInfo />

      <Text variant="bodyL" color="muted" style={styles.ratingLine}>
        ⭐ 아직 평가 없음
      </Text>

      <Card style={styles.statsRow} elevation="none">
        <Stat value="0" label="근무 횟수" />
        <Stat value="-" label="출석률" />
        <Stat value="0" label="뱃지" />
      </Card>

      <UpgradeAccountCard />

      <BankAccountCard />

      <View style={styles.footer}>
        <Button variant="outline" size="lg" fullWidth onPress={handleLogout}>
          로그아웃
        </Button>
      </View>
      </ScrollView>
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
