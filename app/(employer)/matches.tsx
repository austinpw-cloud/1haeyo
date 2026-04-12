/**
 * 매칭 관리 화면 — 내가 올린 일감들의 지원자 판정.
 *
 * Mode 2 (예약 구인): 지원자가 들어온 순서대로 즉시 판정 필요.
 * docs/matching-system.md 참조.
 */

import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ApplicantCard } from '@/features/matching';
import { MOCK_EMPLOYER_ID, useMockData } from '@/shared/store';
import {
  Button,
  colors,
  ScreenHeader,
  spacing,
  Text,
} from '@/shared/ui';
import { formatRelativeTime } from '@/shared/utils';

export default function MatchesScreen() {
  const router = useRouter();
  const { jobs, applications, updateApplicationStatus } = useMockData();

  const pendingGroups = useMemo(() => {
    const myJobs = jobs.filter(
      (j) => j.employerId === MOCK_EMPLOYER_ID && j.status !== 'cancelled'
    );

    return myJobs
      .map((job) => ({
        job,
        pending: applications.filter(
          (a) => a.jobId === job.id && a.status === 'pending'
        ),
      }))
      .filter((g) => g.pending.length > 0);
  }, [jobs, applications]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="매칭 관리" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pendingGroups.length === 0 ? (
          <View style={styles.empty}>
            <Users size={80} color={colors.neutral[300]} strokeWidth={1.5} />
            <Text variant="titleM" style={styles.emptyTitle}>
              대기 중인 지원자가 없어요
            </Text>
            <Text variant="bodyL" color="muted" style={styles.emptySub}>
              일감을 올리면 지원자가 들어올 때{'\n'}여기서 확인하고 선택할 수 있어요
            </Text>
          </View>
        ) : (
          pendingGroups.map(({ job, pending }) => (
            <View key={job.id} style={styles.jobGroup}>
              <View style={styles.jobHead}>
                <Text variant="titleM">{job.title}</Text>
                <Text variant="caption" color="muted">
                  {formatRelativeTime(job.startAt)} · 지원자 {pending.length}명
                </Text>
              </View>

              <View style={styles.applicantList}>
                {pending.map((a) => (
                  <ApplicantCard
                    key={a.id}
                    application={a}
                    onAccept={() => updateApplicationStatus(a.id, 'accepted')}
                    onReject={() => updateApplicationStatus(a.id, 'rejected')}
                  />
                ))}
              </View>

              <View style={styles.jobFooter}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push(`/job/${job.id}`)}
                >
                  일감 상세 보기
                </Button>
              </View>
            </View>
          ))
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
  jobGroup: {
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  jobHead: {
    gap: spacing[1],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  applicantList: {
    gap: spacing[3],
  },
  jobFooter: {
    alignItems: 'flex-start',
    paddingTop: spacing[2],
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
