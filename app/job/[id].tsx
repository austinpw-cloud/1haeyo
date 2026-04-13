/**
 * 일감 상세 화면.
 *
 * 역할/상태에 따라 CTA가 다름:
 *  - 일손 + open/matching: 지원하기
 *  - 일손 + confirmed (채용됨): 체크인
 *  - 일손/사장님 + in_progress: 체크아웃
 *  - 일손/사장님 + completed: 리뷰 남기기
 *  - 사장님 + matching: 지원자 판정 (인라인)
 */

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import {
  Briefcase,
  Clock,
  Flame,
  MapPin,
  Wallet,
} from 'lucide-react-native';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApplicantCard } from '@/features/matching';
import { ReviewModal } from '@/features/review';
import { useAuth, useRole } from '@/shared/hooks';
import { useMockData } from '@/shared/store';
import { Application, CategoryLabel } from '@/shared/types';
import {
  Button,
  Card,
  colors,
  radius,
  spacing,
  StarRating,
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
  const { user } = useAuth();
  const {
    getJob,
    applyToJob,
    getApplicationsForJob,
    getMyApplications,
    updateApplicationStatus,
    markApplicantsViewed,
    expireOverdueApplications,
    checkInJob,
    checkOutJob,
    submitReview,
    getReview,
  } = useMockData();

  const [reviewOpen, setReviewOpen] = useState(false);

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
  const isOwnedByMe = !!user && job.employerId === user.id;
  const showEmployerView = role === 'employer' && isOwnedByMe;
  const showWorkerView = role === 'worker';
  const myApplication = getMyApplications().find((a) => a.jobId === job.id);
  const applications = getApplicationsForJob(job.id);

  // 해당 일손이 채용된 상태인가 (라이프사이클 액션 표시 조건)
  const iAmHiredWorker = myApplication?.status === 'accepted';

  // 사장님이 이 화면에 들어온 순간 → 판정 10분 타이머
  useFocusEffect(
    useCallback(() => {
      if (showEmployerView && job) {
        markApplicantsViewed(job.id);
      }
    }, [showEmployerView, job?.id, markApplicantsViewed])
  );

  useEffect(() => {
    if (!showEmployerView) return;
    const interval = setInterval(() => {
      expireOverdueApplications();
    }, 5000);
    return () => clearInterval(interval);
  }, [showEmployerView, expireOverdueApplications]);

  const handleApply = async () => {
    try {
      const result = await applyToJob(job.id);
      if (!result) {
        Alert.alert('지원 실패', '이미 지원했거나 지원할 수 없는 상태에요.');
        return;
      }
      if (job.matchingMode === 'instant') {
        Alert.alert('지원했어요 ✓', '즉시 호출 모드입니다. 확정되면 알림이 옵니다.');
      } else {
        Alert.alert('지원했어요 ✓', '사장님이 확인하면 알림으로 알려드릴게요.');
      }
    } catch (e) {
      Alert.alert(
        '지원 실패',
        e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.'
      );
    }
  };

  const handleCheckIn = () => {
    Alert.alert(
      '현장 도착했나요?',
      '체크인하면 사장님한테 도착 알림이 가고 근무가 시작됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '체크인',
          onPress: () => {
            checkInJob(job.id);
          },
        },
      ]
    );
  };

  const handleCheckOut = () => {
    Alert.alert('근무 완료하시겠어요?', '체크아웃하면 정산이 시작됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '체크아웃',
        onPress: () => {
          checkOutJob(job.id);
          setReviewOpen(true);
        },
      },
    ]);
  };

  const handleOpenReview = () => setReviewOpen(true);

  const handleSubmitReview = (rating: number, comment: string) => {
    const from = role === 'worker' ? 'worker' : 'employer';
    submitReview({ jobId: job.id, from, rating, comment });
    setReviewOpen(false);
    Alert.alert('고마워요 🙏', '리뷰가 저장되었어요.');
  };

  // 현재 사용자가 이 일감에 대해 리뷰를 이미 남겼나
  const myReview = getReview(
    job.id,
    role === 'worker' ? 'worker' : 'employer'
  );

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

        {/* 상태 배너 (확정된 이후 라이프사이클 상태 강조) */}
        {(job.status === 'confirmed' ||
          job.status === 'in_progress' ||
          job.status === 'completed') && (
          <LifecycleBanner status={job.status} />
        )}

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

        {/* 매칭 방식 (매칭 전만 노출) */}
        {(job.status === 'open' || job.status === 'matching') && (
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
        )}

        {/* 리뷰 (완료된 경우) */}
        {job.status === 'completed' && (
          <CompletedReviewSection
            workerReview={getReview(job.id, 'worker')}
            employerReview={getReview(job.id, 'employer')}
            myRole={role === 'worker' ? 'worker' : 'employer'}
            onWriteReview={handleOpenReview}
            myReviewExists={!!myReview}
          />
        )}

        {/* 사장님 뷰: 지원자 리스트 */}
        {showEmployerView &&
          (job.status === 'open' || job.status === 'matching') && (
            <EmployerApplicantList
              applications={applications}
              onAccept={(id) => updateApplicationStatus(id, 'accepted')}
              onReject={(id) => updateApplicationStatus(id, 'rejected')}
            />
          )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>

      {/* 하단 CTA */}
      <BottomCTA
        job={job}
        role={role}
        showWorkerView={showWorkerView}
        showEmployerView={showEmployerView}
        myApplication={myApplication}
        iAmHiredWorker={iAmHiredWorker}
        myReviewExists={!!myReview}
        onApply={handleApply}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onOpenReview={handleOpenReview}
      />

      <ReviewModal
        visible={reviewOpen}
        mode={role === 'worker' ? 'worker' : 'employer'}
        jobTitle={job.title}
        counterpartName={
          role === 'worker'
            ? job.employerName
            : applications.find((a) => a.status === 'accepted')?.workerName ?? '일손'
        }
        onSubmit={handleSubmitReview}
        onClose={() => setReviewOpen(false)}
      />
    </View>
  );
}

// --- 하위 컴포넌트 ---

function LifecycleBanner({
  status,
}: {
  status: 'confirmed' | 'in_progress' | 'completed';
}) {
  const config = {
    confirmed: {
      emoji: '🎉',
      label: '매칭 확정',
      desc: '근무 시작 시간에 맞춰 현장에 도착해 체크인해 주세요',
      bg: colors.secondary[50],
      color: colors.secondary[700],
    },
    in_progress: {
      emoji: '💪',
      label: '근무 중',
      desc: '근무가 끝나면 체크아웃해 주세요',
      bg: colors.primary[50],
      color: colors.primary[700],
    },
    completed: {
      emoji: '✅',
      label: '근무 완료',
      desc: '양쪽에 리뷰를 남겨주시면 고마워요',
      bg: colors.neutral[100],
      color: colors.neutral[700],
    },
  }[status];

  return (
    <View style={[styles.lifecycleBanner, { backgroundColor: config.bg }]}>
      <Text variant="titleM" style={{ color: config.color }}>
        {config.emoji} {config.label}
      </Text>
      <Text variant="bodyM" color="body" style={styles.lifecycleDesc}>
        {config.desc}
      </Text>
    </View>
  );
}

function BottomCTA({
  job,
  role,
  showWorkerView,
  showEmployerView,
  myApplication,
  iAmHiredWorker,
  myReviewExists,
  onApply,
  onCheckIn,
  onCheckOut,
  onOpenReview,
}: {
  job: ReturnType<typeof useMockData>['jobs'][number];
  role: 'worker' | 'employer' | null;
  showWorkerView: boolean;
  showEmployerView: boolean;
  myApplication: Application | undefined;
  iAmHiredWorker: boolean;
  myReviewExists: boolean;
  onApply: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onOpenReview: () => void;
}) {
  // 일손 모드
  if (showWorkerView) {
    // 채용된 일감 — 라이프사이클에 따라 다른 CTA
    if (iAmHiredWorker) {
      if (job.status === 'confirmed') {
        return (
          <View style={styles.footer}>
            <Button variant="primary" size="lg" fullWidth onPress={onCheckIn}>
              현장 도착 · 체크인
            </Button>
          </View>
        );
      }
      if (job.status === 'in_progress') {
        return (
          <View style={styles.footer}>
            <Button variant="primary" size="lg" fullWidth onPress={onCheckOut}>
              근무 완료 · 체크아웃
            </Button>
          </View>
        );
      }
      if (job.status === 'completed') {
        return (
          <View style={styles.footer}>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onPress={onOpenReview}
              disabled={myReviewExists}
            >
              {myReviewExists ? '리뷰 작성 완료' : '사장님 리뷰 남기기'}
            </Button>
          </View>
        );
      }
    }

    // 지원했지만 아직 결과 대기 or 채용 외 상태
    if (myApplication) {
      return (
        <View style={styles.footer}>
          <ApplicationStatusBanner application={myApplication} />
        </View>
      );
    }

    // 아직 지원 전
    if (job.status === 'open' || job.status === 'matching') {
      return (
        <View style={styles.footer}>
          <Button variant="primary" size="lg" fullWidth onPress={onApply}>
            {job.matchingMode === 'instant' ? '지원하고 바로 가기' : '지원하기'}
          </Button>
        </View>
      );
    }

    // 그 외 (마감)
    return (
      <View style={styles.footer}>
        <Button variant="outline" size="lg" fullWidth disabled>
          이미 마감된 일감이에요
        </Button>
      </View>
    );
  }

  // 사장님 모드 라이프사이클 액션
  if (showEmployerView) {
    if (job.status === 'in_progress') {
      return (
        <View style={styles.footer}>
          <Button variant="secondary" size="lg" fullWidth onPress={onCheckOut}>
            근무 완료 처리
          </Button>
        </View>
      );
    }
    if (job.status === 'completed') {
      return (
        <View style={styles.footer}>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={onOpenReview}
            disabled={myReviewExists}
          >
            {myReviewExists ? '리뷰 작성 완료' : '일손 리뷰 남기기'}
          </Button>
        </View>
      );
    }
  }

  return null;
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

function CompletedReviewSection({
  workerReview,
  employerReview,
  myRole,
  onWriteReview,
  myReviewExists,
}: {
  workerReview?: ReturnType<typeof useMockData>['jobs'][number] extends never
    ? never
    : ReturnType<ReturnType<typeof useMockData>['getReview']>;
  employerReview?: ReturnType<typeof useMockData>['jobs'][number] extends never
    ? never
    : ReturnType<ReturnType<typeof useMockData>['getReview']>;
  myRole: 'worker' | 'employer';
  onWriteReview: () => void;
  myReviewExists: boolean;
}) {
  return (
    <Card style={styles.reviewSection}>
      <Text variant="titleS">리뷰</Text>
      <View style={styles.reviewItem}>
        <Text variant="bodyM" color="muted">
          일손 → 사장님
        </Text>
        {workerReview ? (
          <>
            <StarRating value={workerReview.rating} size={18} />
            {workerReview.comment && (
              <Text variant="bodyM" color="body" style={styles.reviewComment}>
                "{workerReview.comment}"
              </Text>
            )}
          </>
        ) : (
          <Text variant="bodyM" color="subtle">
            {myRole === 'worker' && !myReviewExists
              ? '아직 작성 안 함 — 아래 버튼으로 작성해 주세요'
              : '아직 리뷰를 안 남기셨어요'}
          </Text>
        )}
      </View>

      <View style={styles.reviewDivider} />

      <View style={styles.reviewItem}>
        <Text variant="bodyM" color="muted">
          사장님 → 일손
        </Text>
        {employerReview ? (
          <>
            <StarRating value={employerReview.rating} size={18} />
            {employerReview.comment && (
              <Text variant="bodyM" color="body" style={styles.reviewComment}>
                "{employerReview.comment}"
              </Text>
            )}
          </>
        ) : (
          <Text variant="bodyM" color="subtle">
            {myRole === 'employer' && !myReviewExists
              ? '아직 작성 안 함 — 아래 버튼으로 작성해 주세요'
              : '아직 리뷰를 안 남기셨어요'}
          </Text>
        )}
      </View>
    </Card>
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
  lifecycleBanner: {
    padding: spacing[5],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  lifecycleDesc: {},
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
  reviewSection: {
    gap: spacing[4],
  },
  reviewItem: {
    gap: spacing[2],
  },
  reviewComment: {
    fontStyle: 'italic',
    marginTop: spacing[2],
  },
  reviewDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
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
