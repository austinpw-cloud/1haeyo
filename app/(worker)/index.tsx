/**
 * 일손 홈 — 내 주변 일감 리스트.
 *
 * Mock: jobs 스토어에서 'open' 또는 'matching' 상태의 일감만 노출.
 * Sprint 3에서 Supabase + GPS 거리 필터 연동 예정.
 */

import { useRouter } from 'expo-router';
import { Clock, Flame, MapPin, Wallet } from 'lucide-react-native';
import { ReactNode, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useMockData } from '@/shared/store';
import { Job } from '@/shared/types';
import {
  Card,
  colors,
  radius,
  ScreenHeader,
  spacing,
  Text,
} from '@/shared/ui';
import {
  formatDuration,
  formatRelativeTime,
  formatWon,
} from '@/shared/utils';

export default function WorkerHomeScreen() {
  const router = useRouter();
  const { jobs } = useMockData();

  const availableJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.status === 'open' || j.status === 'matching')
        // 긴급 먼저, 그 다음 최근 등록 순
        .sort((a, b) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [jobs]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader greeting="안녕하세요 👋" title="오늘의 일감" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {availableJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onPress={() => router.push(`/job/${job.id}`)}
          />
        ))}

        <View style={styles.placeholder}>
          <Text variant="bodyM" color="subtle" style={styles.placeholderText}>
            내 주변 일감이 실시간으로 표시됩니다
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function JobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const totalPay = job.hourlyRate * job.durationHours;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        {job.urgent ? (
          <View style={styles.urgentBadge}>
            <Flame size={14} color={colors.primary[700]} />
            <Text
              variant="caption"
              style={{ color: colors.primary[700], marginLeft: spacing[1] }}
            >
              긴급
            </Text>
          </View>
        ) : (
          <View />
        )}
        <Text variant="bodyM" color="muted">
          {formatRelativeTime(job.startAt)}
        </Text>
      </View>

      <Text variant="titleM">{job.title}</Text>
      <Text variant="bodyM" color="muted" style={styles.cardSub}>
        {job.employerName} · {job.location}
      </Text>

      <View style={styles.cardMeta}>
        {job.distance && (
          <MetaItem icon={<MapPin size={16} color={colors.neutral[600]} />}>
            {job.distance}
          </MetaItem>
        )}
        <MetaItem icon={<Clock size={16} color={colors.neutral[600]} />}>
          {formatDuration(job.durationHours)}
        </MetaItem>
        <MetaItem icon={<Wallet size={16} color={colors.neutral[600]} />}>
          {formatWon(totalPay)}
        </MetaItem>
      </View>
    </Card>
  );
}

function MetaItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text variant="bodyM" style={{ marginLeft: spacing[1] }}>
        {children}
      </Text>
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
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  cardSub: {
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    marginTop: spacing[4],
    padding: spacing[6],
    alignItems: 'center',
  },
  placeholderText: {
    textAlign: 'center',
  },
});
