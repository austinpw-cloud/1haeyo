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
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  distanceMeters,
  KakaoMapView,
  useCurrentLocation,
} from '@/features/location';
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
  calculateJobPricing,
  formatDuration,
  formatKRW,
  formatRelativeTime,
  formatWon,
} from '@/shared/utils';
import { ContractView, type Contract } from '@/features/contract';
import { FileText } from 'lucide-react-native';

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
    checkInJob,
    checkOutJob,
    submitReview,
    getReview,
    refreshJobs,
    refreshApplications,
    matches,
    contracts,
  } = useMockData();

  // 화면 포커스 시 fresh fetch — Realtime 놓친 이벤트 대응 안전장치
  useFocusEffect(
    useCallback(() => {
      refreshJobs();
      refreshApplications();
    }, [refreshJobs, refreshApplications])
  );

  const [reviewOpen, setReviewOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const { point: currentLocation, refresh: refreshLocation } =
    useCurrentLocation(false);

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

  // 이 일감과 연관된 match (worker는 자기 것, employer는 확정된 첫 건)
  const myMatch = user
    ? matches.find((m) => m.jobId === job.id && m.workerId === user.id)
    : undefined;
  const jobMatch = matches.find((m) => m.jobId === job.id);
  const relevantMatch = showWorkerView ? myMatch : jobMatch;

  // 체크아웃 게이트: 체크인 + 근무시간 × 95% 경과 후 활성
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (job.status !== 'in_progress') return;
    const iv = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(iv);
  }, [job.status]);

  const { canCheckOut, remainingMs } = useMemo(() => {
    if (!relevantMatch?.checkedInAt) {
      return { canCheckOut: false, remainingMs: 0 };
    }
    const unlockMs =
      new Date(relevantMatch.checkedInAt).getTime() +
      job.durationHours * 0.95 * 60 * 60 * 1000;
    const remain = Math.max(0, unlockMs - Date.now());
    return { canCheckOut: remain === 0, remainingMs: remain };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantMatch?.checkedInAt, job.durationHours, tick]);

  // 판정 타이머는 Provider에서 전역 sweep으로 처리 — 이 화면엔 별도 로직 없음

  const handleApply = async () => {
    // 근로계약 동의 확인 (워커 전자서명 수집)
    Alert.alert(
      '근로계약 조건 확인',
      `이 일감에 지원하면 아래 조건으로 근로계약에 동의하는 것으로 간주됩니다.\n\n• 근무: ${
        job.title
      }\n• 시간: ${job.durationHours}시간\n• 시급: ${formatWon(
        job.hourlyRate
      )}\n• 지급: ${formatWon(
        job.hourlyRate * job.durationHours
      )} (근무 완료 후 즉시 송금)\n\n계속하시겠어요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '동의하고 지원',
          onPress: async () => {
            try {
              const result = await applyToJob(job.id);
              if (!result) {
                Alert.alert('지원 실패', '이미 지원했거나 지원할 수 없는 상태에요.');
                return;
              }
              if (job.matchingMode === 'instant') {
                Alert.alert(
                  '지원 완료 ✓',
                  '즉시 호출 모드입니다. 매칭 확정 시 근로계약서가 자동 체결되고 알림이 옵니다.'
                );
              } else {
                Alert.alert(
                  '지원 완료 ✓',
                  '사장님 확인 후 매칭 확정되면 근로계약서가 자동 체결되고 알림이 옵니다.'
                );
              }
            } catch (e) {
              Alert.alert(
                '지원 실패',
                e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.'
              );
            }
          },
        },
      ]
    );
  };

  const handleCheckIn = async () => {
    // 위치 검증 (일감에 좌표가 있을 때만)
    if (job.locationLat != null && job.locationLng != null) {
      const myLoc = currentLocation ?? (await refreshLocation());
      if (!myLoc) {
        Alert.alert(
          '위치 확인이 필요해요',
          '위치 권한을 허용해 주세요. 현장 도착 확인에 사용됩니다.'
        );
        return;
      }
      const dist = distanceMeters(myLoc, {
        lat: job.locationLat,
        lng: job.locationLng,
      });
      if (dist > 150) {
        Alert.alert(
          '아직 현장 근처가 아니에요',
          `가게까지 약 ${Math.round(dist)}m 남았어요. 현장에 도착한 뒤에 체크인해 주세요.`
        );
        return;
      }
    }

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
    Alert.alert('근무 완료하시겠어요?', '체크아웃하면 워커 계좌로 즉시 송금됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '체크아웃 · 즉시 송금',
        onPress: async () => {
          await checkOutJob(job.id);
          // Mock: 실제 토스페이먼츠 즉시송금 API 연동은 Sprint 8
          const pricing = calculateJobPricing(job.hourlyRate, job.durationHours);
          Alert.alert(
            '💸 즉시 송금 완료',
            `워커 계좌로 ${formatKRW(
              pricing.workerPay
            )} 송금되었어요.\n\n(현재 테스트 모드 — 실결제는 Sprint 8에서 연동 예정)`,
            [{ text: '리뷰 남기기', onPress: () => setReviewOpen(true) }]
          );
        },
      },
    ]);
  };

  const handleEarlyCheckOut = () => {
    Alert.alert(
      '합의된 조기 종료인가요?',
      '사장님과 합의되지 않은 조기 종료는 평판에 영향을 줄 수 있어요. 계속하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '조기 종료',
          style: 'destructive',
          onPress: () => {
            checkOutJob(job.id);
            setReviewOpen(true);
          },
        },
      ]
    );
  };

  const handleOpenReview = () => setReviewOpen(true);

  const handleSubmitReview = async (rating: number, comment: string) => {
    const from = role === 'worker' ? 'worker' : 'employer';
    try {
      await submitReview({ jobId: job.id, from, rating, comment });
      setReviewOpen(false);
      Alert.alert('고마워요 🙏', '리뷰가 저장되었어요.');
    } catch {
      Alert.alert('리뷰 저장 실패', '잠시 후 다시 시도해주세요.');
    }
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

        {/* 근로계약 체결됨 배너 */}
        {(job.status === 'confirmed' ||
          job.status === 'in_progress' ||
          job.status === 'completed') &&
          (iAmHiredWorker || showEmployerView) && (
            <Pressable
              style={styles.contractBanner}
              onPress={() => setContractOpen(true)}
            >
              <FileText size={20} color={colors.secondary[700]} />
              <View style={styles.contractBannerText}>
                <Text variant="titleS" style={{ color: colors.secondary[700] }}>
                  근로계약 체결됨
                </Text>
                <Text variant="caption" color="muted">
                  탭해서 근로계약서 전체 조건 확인
                </Text>
              </View>
            </Pressable>
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

        {/* 위치 지도 */}
        {job.locationLat != null && job.locationLng != null && (
          <View style={styles.mapBox}>
            <KakaoMapView
              center={{ lat: job.locationLat, lng: job.locationLng }}
              marker={{ lat: job.locationLat, lng: job.locationLng }}
              interactive={false}
              height={200}
            />
          </View>
        )}

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
        canCheckOut={canCheckOut}
        remainingMs={remainingMs}
        onApply={handleApply}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onEarlyCheckOut={handleEarlyCheckOut}
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

      {/* 근로계약서 모달 */}
      <Modal
        visible={contractOpen}
        animationType="slide"
        onRequestClose={() => setContractOpen(false)}
      >
        <View style={styles.contractModal}>
          <View style={styles.contractModalHeader}>
            <Text variant="titleM">근로계약서</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setContractOpen(false)}
            >
              닫기
            </Button>
          </View>
          <ContractView
            contract={
              contracts.find((c) => c.jobId === job.id) ??
              buildLiveContract(job, applications, user?.id)
            }
          />
        </View>
      </Modal>
    </View>
  );
}

/** 화면 표시용 라이브 계약서 (DB 저장 전 MVP). 매칭 확정 시점 데이터로 생성. */
function buildLiveContract(
  job: ReturnType<typeof useMockData>['jobs'][number],
  applications: Application[],
  userId: string | undefined
): Contract {
  const accepted = applications.find((a) => a.status === 'accepted');
  const pricing = calculateJobPricing(job.hourlyRate, job.durationHours);
  const now = new Date().toISOString();
  return {
    id: `live-${job.id}`,
    jobId: job.id,
    employerId: job.employerId,
    workerId: accepted?.workerId ?? userId ?? '',
    employerSignedAt: job.createdAt,
    workerSignedAt: accepted?.appliedAt,
    contractBody: {
      employer_name: job.employerName,
      worker_name: accepted?.workerName ?? '-',
      job_id: job.id,
      job_title: job.title,
      location: job.location,
      start_at: job.startAt,
      duration_hours: job.durationHours,
      hourly_rate: job.hourlyRate,
      worker_pay: pricing.workerPay,
      platform_fee: pricing.platformFee,
      pg_fee: pricing.pgFee,
      total_amount: pricing.total,
      created_at: now,
    },
    contentHash: `${job.id.substring(0, 8)}-live`,
    legalStatus: 'simple_consent',
    createdAt: now,
  };
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
  canCheckOut,
  remainingMs,
  onApply,
  onCheckIn,
  onCheckOut,
  onEarlyCheckOut,
  onOpenReview,
}: {
  job: ReturnType<typeof useMockData>['jobs'][number];
  role: 'worker' | 'employer' | null;
  showWorkerView: boolean;
  showEmployerView: boolean;
  myApplication: Application | undefined;
  iAmHiredWorker: boolean;
  myReviewExists: boolean;
  canCheckOut: boolean;
  remainingMs: number;
  onApply: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onEarlyCheckOut: () => void;
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
        if (canCheckOut) {
          return (
            <View style={styles.footer}>
              <Button variant="primary" size="lg" fullWidth onPress={onCheckOut}>
                근무 완료 · 체크아웃
              </Button>
            </View>
          );
        }
        return (
          <View style={[styles.footer, styles.footerStack]}>
            <Button variant="primary" size="lg" fullWidth disabled>
              근무 완료까지 {formatRemaining(remainingMs)} 남았어요
            </Button>
            <Button
              variant="outline"
              size="md"
              fullWidth
              onPress={onEarlyCheckOut}
            >
              합의된 조기 종료
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
      if (canCheckOut) {
        return (
          <View style={styles.footer}>
            <Button variant="secondary" size="lg" fullWidth onPress={onCheckOut}>
              근무 완료 처리
            </Button>
          </View>
        );
      }
      return (
        <View style={[styles.footer, styles.footerStack]}>
          <Button variant="secondary" size="lg" fullWidth disabled>
            근무 종료까지 {formatRemaining(remainingMs)} 남았어요
          </Button>
          <Button
            variant="outline"
            size="md"
            fullWidth
            onPress={onEarlyCheckOut}
          >
            합의된 조기 종료 처리
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

/** 남은 시간을 한국어로 포맷 ("1시간 23분", "45분") */
function formatRemaining(ms: number): string {
  const totalMin = Math.max(1, Math.ceil(ms / 60_000));
  if (totalMin < 60) return `${totalMin}분`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
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
  mapBox: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  contractBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[100],
  },
  contractBannerText: {
    flex: 1,
    gap: spacing[1],
  },
  contractModal: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  contractModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
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
  footerStack: {
    gap: spacing[2],
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
