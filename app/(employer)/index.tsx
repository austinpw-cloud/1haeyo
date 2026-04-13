/**
 * 사장님 홈 — 내가 올린 일감 리스트.
 */

import { useRouter } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '@/shared/hooks';
import { useMockData } from '@/shared/store';
import { Job, JobStatus } from '@/shared/types';
import {
  Card,
  colors,
  radius,
  ScreenHeader,
  spacing,
  Text,
} from '@/shared/ui';
import { formatRelativeTime, formatWon } from '@/shared/utils';

const statusConfig: Record<
  JobStatus,
  { label: string; bg: string; color: string }
> = {
  open: {
    label: '모집 중',
    bg: colors.semantic.info + '22',
    color: colors.semantic.info,
  },
  matching: {
    label: '매칭 중',
    bg: colors.semantic.warning + '22',
    color: colors.semantic.warning,
  },
  confirmed: {
    label: '확정',
    bg: colors.secondary[100],
    color: colors.secondary[700],
  },
  in_progress: {
    label: '근무 중',
    bg: colors.primary[100],
    color: colors.primary[700],
  },
  completed: {
    label: '완료',
    bg: colors.neutral[100],
    color: colors.neutral[700],
  },
  cancelled: {
    label: '취소',
    bg: colors.semantic.error + '22',
    color: colors.semantic.error,
  },
};

export default function EmployerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { jobs, getApplicationsForJob } = useMockData();

  const myJobs = useMemo(
    () => (user ? jobs.filter((j) => j.employerId === user.id) : []),
    [jobs, user]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader greeting="안녕하세요 🙏" title="내 일감" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {myJobs.length === 0 ? (
          <View style={styles.empty}>
            <Inbox size={80} color={colors.neutral[300]} strokeWidth={1.5} />
            <Text variant="titleM" style={styles.emptyTitle}>
              아직 올린 일감이 없어요
            </Text>
            <Text variant="bodyL" color="muted" style={styles.emptySub}>
              "일감 등록" 탭에서 첫 일감을{'\n'}올려보세요
            </Text>
          </View>
        ) : (
          myJobs.map((job) => (
            <MyJobCard
              key={job.id}
              job={job}
              applicantCount={getApplicationsForJob(job.id).length}
              onPress={() => router.push(`/job/${job.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function MyJobCard({
  job,
  applicantCount,
  onPress,
}: {
  job: Job;
  applicantCount: number;
  onPress: () => void;
}) {
  const cfg = statusConfig[job.status];
  const totalPay = job.hourlyRate * job.durationHours;

  const applicantSummary =
    job.status === 'open' && applicantCount === 0
      ? '지원자 기다리는 중'
      : job.status === 'matching'
      ? `${applicantCount}명 지원 · 판정 필요`
      : job.status === 'confirmed'
      ? '일손 확정됨'
      : `${applicantCount}명 지원 받음`;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text variant="caption" style={{ color: cfg.color }}>
            {cfg.label}
          </Text>
        </View>
        <Text variant="bodyM" color="muted">
          {formatRelativeTime(job.startAt)}
        </Text>
      </View>

      <Text variant="titleM">{job.title}</Text>
      <Text variant="bodyM" color="muted" style={styles.cardSub}>
        {job.location} · {job.durationHours}시간 · {formatWon(totalPay)}
      </Text>

      <View style={styles.divider} />
      <Text variant="bodyM">{applicantSummary}</Text>
    </Card>
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
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing[4],
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
