/**
 * 지원자 카드.
 * 사장님이 판단할 수 있도록 풍부한 프로필 정보를 보여준다.
 *
 * - 아바타, 이름, 나이
 * - 별점 + 근무 횟수
 * - 뱃지들
 * - 자기소개
 * - 최근 리뷰
 * - 채용/거부 액션
 */

import { Check, Clock, Star, User as UserIcon, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useCountdown } from '@/shared/hooks';
import { Application } from '@/shared/types';
import {
  Button,
  colors,
  radius,
  spacing,
  Text,
} from '@/shared/ui';

interface Props {
  application: Application;
  /** 채용/거부 액션 비활성화 (확정된 건 등) */
  actionable?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export function ApplicantCard({
  application,
  actionable = true,
  onAccept,
  onReject,
}: Props) {
  const a = application;
  const isAccepted = a.status === 'accepted';
  const isRejected =
    a.status === 'rejected' || a.status === 'auto_cancelled';
  const isExpired = a.status === 'expired';

  const countdown = useCountdown(
    a.status === 'pending' ? a.judgeDeadline : undefined
  );
  // 1분 이하 남으면 위험, 3분 이하면 경고
  const urgency =
    a.status === 'pending' && a.judgeDeadline
      ? countdown.remainingMs <= 60_000
        ? 'danger'
        : countdown.remainingMs <= 180_000
        ? 'warning'
        : 'normal'
      : 'normal';

  return (
    <View
      style={[
        styles.container,
        (isRejected || isExpired) && styles.containerRejected,
      ]}
    >
      {a.status === 'pending' && a.judgeDeadline && (
        <View
          style={[
            styles.countdown,
            urgency === 'warning' && styles.countdownWarning,
            urgency === 'danger' && styles.countdownDanger,
          ]}
        >
          <Clock
            size={14}
            color={
              urgency === 'danger'
                ? colors.semantic.error
                : urgency === 'warning'
                ? colors.semantic.warning
                : colors.neutral[600]
            }
          />
          <Text
            variant="caption"
            style={{
              marginLeft: spacing[1],
              color:
                urgency === 'danger'
                  ? colors.semantic.error
                  : urgency === 'warning'
                  ? colors.semantic.warning
                  : colors.neutral[700],
            }}
          >
            {countdown.expired
              ? '만료됨'
              : `${countdown.label} 내 판정해주세요`}
          </Text>
        </View>
      )}

      <View style={styles.head}>
        <View style={styles.avatar}>
          <UserIcon size={24} color={colors.neutral[0]} />
        </View>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text variant="titleS">{a.workerName}</Text>
            {a.workerAge !== undefined && (
              <Text variant="bodyM" color="muted" style={styles.age}>
                {a.workerAge}세
              </Text>
            )}
          </View>
          <View style={styles.statsRow}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text variant="bodyM" style={styles.statText}>
              {a.workerRating > 0 ? a.workerRating.toFixed(1) : '신규'}
            </Text>
            <Text variant="bodyM" color="muted" style={styles.statSeparator}>
              ·
            </Text>
            <Text variant="bodyM" color="muted">
              근무 {a.workerJobCount}회
            </Text>
            {a.workerCategoryCount !== undefined &&
              a.workerCategoryCount > 0 && (
                <>
                  <Text variant="bodyM" color="muted" style={styles.statSeparator}>
                    ·
                  </Text>
                  <Text variant="bodyM" color="muted">
                    동일업종 {a.workerCategoryCount}회
                  </Text>
                </>
              )}
          </View>
        </View>
      </View>

      {a.workerBadges.length > 0 && (
        <View style={styles.badgeRow}>
          {a.workerBadges.map((b) => (
            <View key={b} style={styles.badge}>
              <Text variant="caption" style={styles.badgeText}>
                {b}
              </Text>
            </View>
          ))}
        </View>
      )}

      {a.workerIntro && (
        <Text variant="bodyM" color="body" style={styles.intro}>
          “{a.workerIntro}”
        </Text>
      )}

      {a.workerRecentReview && (
        <View style={styles.reviewBox}>
          <Text variant="caption" color="muted" style={styles.reviewLabel}>
            최근 받은 리뷰
          </Text>
          <Text variant="bodyM" color="body">
            {a.workerRecentReview}
          </Text>
        </View>
      )}

      {a.workerAttendance !== undefined && (
        <Text variant="caption" color="muted" style={styles.attendance}>
          출석률 {Math.round(a.workerAttendance * 100)}%
        </Text>
      )}

      {actionable && a.status === 'pending' && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            size="md"
            onPress={onReject}
            leftIcon={<X size={16} color={colors.neutral[700]} />}
            style={styles.actionBtn}
          >
            거부
          </Button>
          <Button
            variant="secondary"
            size="md"
            onPress={onAccept}
            leftIcon={<Check size={16} color={colors.neutral[0]} />}
            style={styles.actionBtn}
          >
            채용하기
          </Button>
        </View>
      )}

      {isAccepted && (
        <View style={styles.resultBanner}>
          <Check size={16} color={colors.secondary[700]} />
          <Text
            variant="bodyM"
            style={{ color: colors.secondary[700], marginLeft: spacing[2] }}
          >
            채용 확정
          </Text>
        </View>
      )}

      {isRejected && (
        <View style={[styles.resultBanner, styles.resultBannerRejected]}>
          <X size={16} color={colors.neutral[500]} />
          <Text
            variant="bodyM"
            color="muted"
            style={{ marginLeft: spacing[2] }}
          >
            거부됨
          </Text>
        </View>
      )}

      {isExpired && (
        <View style={[styles.resultBanner, styles.resultBannerRejected]}>
          <Clock size={16} color={colors.neutral[500]} />
          <Text
            variant="bodyM"
            color="muted"
            style={{ marginLeft: spacing[2] }}
          >
            판정 시간 만료 (자동 거부)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing[5],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  containerRejected: {
    opacity: 0.6,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  countdownWarning: {
    backgroundColor: colors.semantic.warning + '22',
  },
  countdownDanger: {
    backgroundColor: colors.semantic.error + '22',
  },
  head: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    gap: spacing[1],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
  },
  age: {},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statText: {
    marginLeft: spacing[1],
  },
  statSeparator: {
    marginHorizontal: spacing[2],
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  badge: {
    backgroundColor: colors.secondary[100],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  badgeText: {
    color: colors.secondary[700],
  },
  intro: {
    fontStyle: 'italic',
    paddingLeft: spacing[2],
    borderLeftWidth: 2,
    borderLeftColor: colors.neutral[200],
  },
  reviewBox: {
    backgroundColor: colors.neutral[50],
    padding: spacing[3],
    borderRadius: radius.md,
    gap: spacing[1],
  },
  reviewLabel: {
    // just muted
  },
  attendance: {
    // muted caption
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  actionBtn: {
    flex: 1,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[50],
    padding: spacing[3],
    borderRadius: radius.md,
    marginTop: spacing[1],
  },
  resultBannerRejected: {
    backgroundColor: colors.neutral[100],
  },
});
