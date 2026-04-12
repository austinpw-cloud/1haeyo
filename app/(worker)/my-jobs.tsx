/**
 * 일손 내 일 화면 — 내가 지원한 일감 + 확정된 일감 내역.
 */

import { useRouter } from 'expo-router';
import { Briefcase } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useMockData } from '@/shared/store';
import { Application, ApplicationStatus } from '@/shared/types';
import {
  Card,
  colors,
  radius,
  ScreenHeader,
  spacing,
  Text,
} from '@/shared/ui';
import { formatRelativeTime, formatWon } from '@/shared/utils';

const statusLabel: Record<ApplicationStatus, { text: string; color: string }> = {
  pending: { text: '판정 대기 중', color: colors.semantic.warning },
  accepted: { text: '✓ 채용됨', color: colors.semantic.success },
  rejected: { text: '거절됨', color: colors.semantic.error },
  auto_cancelled: { text: '자동 취소', color: colors.neutral[500] },
  expired: { text: '만료됨', color: colors.neutral[500] },
};

export default function WorkerMyJobsScreen() {
  const router = useRouter();
  const { getMyApplications, getJob } = useMockData();
  const myApps = getMyApplications();

  const items = useMemo(
    () =>
      myApps
        .map((app) => ({ app, job: getJob(app.jobId) }))
        .filter((x): x is { app: Application; job: NonNullable<ReturnType<typeof getJob>> } => !!x.job)
        .sort(
          (a, b) =>
            new Date(b.app.appliedAt).getTime() - new Date(a.app.appliedAt).getTime()
        ),
    [myApps, getJob]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="내 일" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Briefcase size={80} color={colors.neutral[300]} strokeWidth={1.5} />
            <Text variant="titleM" style={styles.emptyTitle}>
              아직 지원한 일감이 없어요
            </Text>
            <Text variant="bodyL" color="muted" style={styles.emptySub}>
              홈에서 마음에 드는 일감에{'\n'}지원해보세요
            </Text>
          </View>
        ) : (
          items.map(({ app, job }) => {
            const cfg = statusLabel[app.status];
            const totalPay = job.hourlyRate * job.durationHours;
            return (
              <Card
                key={app.id}
                style={styles.card}
                onPress={() => router.push(`/job/${job.id}`)}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}
                  >
                    <Text variant="caption" style={{ color: cfg.color }}>
                      {cfg.text}
                    </Text>
                  </View>
                  <Text variant="bodyM" color="muted">
                    {formatRelativeTime(job.startAt)}
                  </Text>
                </View>

                <Text variant="titleM">{job.title}</Text>
                <Text variant="bodyM" color="muted" style={styles.cardSub}>
                  {job.employerName} · {job.location}
                </Text>
                <Text variant="bodyM">
                  {job.durationHours}시간 · {formatWon(totalPay)}
                </Text>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    flexGrow: 1,
  },
  card: {
    marginBottom: spacing[4],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  cardSub: {
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
  },
  emptyTitle: {
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  emptySub: {
    textAlign: 'center',
  },
});
