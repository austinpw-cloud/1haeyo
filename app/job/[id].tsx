/**
 * 일감 상세 화면.
 *
 * 역할에 따라 다른 UI:
 *  - 일손: "지원하기" 버튼
 *  - 사장님(본인 일감): 지원자 리스트
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Briefcase,
  Clock,
  Flame,
  MapPin,
  Wallet,
} from 'lucide-react-native';
import { ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApplicantCard } from '@/features/matching';
import { useRole } from '@/shared/hooks';
import {
  MOCK_EMPLOYER_ID,
  useMockData,
} from '@/shared/store';
import {
  Application,
  CategoryLabel,
} from '@/shared/types';
import {
  Button,
  Card,
  colors,
  radius,
  spacing,
  Text,
} from '@/shared/ui';
import {
  formatDuration,
  formatRelativeTime,
  formatWon,
} from '@/shared/utils';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { role } = useRole();
  const {
    getJob,
    applyToJob,
    getApplicationsForJob,
    getMyApplications,
    updateApplicationStatus,
  } = useMockData();

  const job = getJob(id ?? '');

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text variant="titleM" style={styles.notFoundTitle}>
            일감을 찾을 수 없어요
          </Text>
          <Button variant="outline" size="md" onPress={() => router.back()}>
            돌아가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const totalPay = job.hourlyRate * job.durationHours;
  // "내가 사장님으로 올린 일감인가" 판정
  const isOwnedByMe = job.employerId === MOCK_EMPLOYER_ID;
  // UI 분기: 현재 역할이 결정
  const showEmployerView = role === 'employer' && isOwnedByMe;
  const showWorkerView = role === 'worker';
  const myApplication = getMyApplications().find((a) => a.jobId === job.id);
  const applications = getApplicationsForJob(job.id);

  const handleApply = () => {
    const result = applyToJob(job.id);
    if (!result) {
      Alert.alert('지원 실패', '이미 지원한 일감이거나 지원할 수 없는 상태에요.');
      return;
    }

    if (job.matchingMode === 'instant') {
      Alert.alert(
        '지원했어요 ✓',
        '즉시 호출 모드입니다. 확정되면 알림이 옵니다.'
      );
    } else {
      Alert.alert(
        '지원했어요 ✓',
        '사장님이 확인하면 알림으로 알려드릴게요.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 영역 */}
        <View style={styles.header}>
          {job.urgent && (
            <View style={styles.urgentBadge}>
              <Flame size={14} color={colors.primary[700]} />
              <Text
                variant="caption"
                style={{ color: colors.primary[700], marginLeft: spacing[1] }}
              >
                긴급
              </Text>
            </View>
          )}
          <Text variant="titleL" style={styles.title}>
            {job.title}
          </Text>
          <Text variant="bodyL" color="muted">
            {job.employerName}
          </Text>
        </View>

        {/* 핵심 정보 카드 */}
        <Card style={styles.infoCard}>
          <InfoRow
            icon={<Clock size={20} color={colors.neutral[600]} />}
            label="시작 시각"
            value={formatRelativeTime(job.startAt)}
          />
          <Divider />
          <InfoRow
            icon={<Briefcase size={20} color={colors.neutral[600]} />}
            label="근무 시간"
            value={formatDuration(job.durationHours)}
          />
          <Divider />
          <InfoRow
            icon={<MapPin size={20} color={colors.neutral[600]} />}
            label="장소"
            value={job.location}
          />
          <Divider />
          <InfoRow
            icon={<Wallet size={20} color={colors.neutral[600]} />}
            label="시급"
            value={`${formatWon(job.hourlyRate)} (총 ${formatWon(totalPay)})`}
          />
        </Card>

        {/* 업무 설명 */}
        {job.description && (
          <Card style={styles.descCard}>
            <Text variant="titleS" style={styles.descTitle}>
              업무 설명
            </Text>
            <Text variant="bodyL" color="body">
              {job.description}
            </Text>
          </Card>
        )}

        {/* 매칭 방식 안내 */}
        <Card style={styles.modeCard} elevation="sm">
          <Text variant="bodyM" color="muted">
            매칭 방식
          </Text>
          <Text variant="bodyL" style={{ marginTop: spacing[1] }}>
            {job.matchingMode === 'instant'
              ? '🔥 즉시 호출 · 선착순 자동 매칭'
              : '⏰ 예약 구인 · 사장님이 판정'}
          </Text>
          <Text variant="caption" color="muted" style={{ marginTop: spacing[2] }}>
            카테고리: {CategoryLabel[job.category]} · 필요 인원 {job.requiredCount}명
          </Text>
        </Card>

        {/* 사장님 뷰: 지원자 리스트 */}
        {showEmployerView && (
          <EmployerApplicantList
            applications={applications}
            onAccept={(id) => updateApplicationStatus(id, 'accepted')}
            onReject={(id) => updateApplicationStatus(id, 'rejected')}
          />
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>

      {/* 하단 CTA — 일손 모드에서 지원 버튼 */}
      {showWorkerView && (
        <View style={styles.footer}>
          {myApplication ? (
            <ApplicationStatusBanner application={myApplication} />
          ) : job.status === 'open' || job.status === 'matching' ? (
            <Button variant="primary" size="lg" fullWidth onPress={handleApply}>
              {job.matchingMode === 'instant' ? '지원하고 바로 가기' : '지원하기'}
            </Button>
          ) : (
            <Button variant="outline" size="lg" fullWidth disabled>
              이미 마감된 일감이에요
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <View style={styles.infoText}>
        <Text variant="bodyM" color="muted">
          {label}
        </Text>
        <Text variant="bodyL">{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ApplicationStatusBanner({
  application,
}: {
  application: Application;
}) {
  const text =
    application.status === 'pending'
      ? '지원함 · 판정 대기 중'
      : application.status === 'accepted'
      ? '✅ 채용되었어요!'
      : application.status === 'rejected'
      ? '거절되었어요'
      : application.status === 'auto_cancelled'
      ? '다른 곳 확정으로 자동 취소됨'
      : '만료됨';

  const color =
    application.status === 'accepted'
      ? 'success'
      : application.status === 'rejected' ||
        application.status === 'auto_cancelled'
      ? 'error'
      : 'muted';

  return (
    <View style={styles.statusBanner}>
      <Text variant="titleS" color={color}>
        {text}
      </Text>
    </View>
  );
}

function EmployerApplicantList({
  applications,
  onAccept,
  onReject,
}: {
  applications: Application[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const visible = applications.filter((a) => a.status !== 'expired');

  if (visible.length === 0) {
    return (
      <View style={styles.applicantSection}>
        <Text variant="titleM">지원자 (0)</Text>
        <Card style={styles.emptyApplicants}>
          <Text variant="bodyL" color="muted">
            아직 지원자가 없어요. 지원자가 들어오면 바로 알려드릴게요.
          </Text>
        </Card>
      </View>
    );
  }

  // 정렬: pending 먼저, 그 다음 accepted, 마지막 rejected
  const order = (a: Application) =>
    a.status === 'pending' ? 0 : a.status === 'accepted' ? 1 : 2;
  const sorted = [...visible].sort((a, b) => order(a) - order(b));

  return (
    <View style={styles.applicantSection}>
      <View style={styles.applicantHeader}>
        <Text variant="titleM">지원자 ({visible.length})</Text>
        <Text variant="caption" color="muted">
          들어온 순서대로 판정하세요
        </Text>
      </View>

      {sorted.map((a) => (
        <ApplicantCard
          key={a.id}
          application={a}
          onAccept={() => onAccept(a.id)}
          onReject={() => onReject(a.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    padding: spacing[6],
    gap: spacing[4],
  },
  header: {
    gap: spacing[2],
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    marginBottom: spacing[2],
  },
  title: {
    marginTop: spacing[1],
  },
  infoCard: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[3],
  },
  infoText: {
    flex: 1,
    gap: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  descCard: {
    gap: spacing[3],
  },
  descTitle: {
    marginBottom: spacing[1],
  },
  modeCard: {
    backgroundColor: colors.neutral[100],
  },
  applicantSection: {
    gap: spacing[3],
  },
  applicantHeader: {
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  emptyApplicants: {
    padding: spacing[5],
  },
  statusBanner: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  footer: {
    padding: spacing[6],
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  notFoundTitle: {
    marginBottom: spacing[2],
  },
});
