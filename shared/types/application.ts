/**
 * 지원(Application) 타입.
 *
 * docs/matching-system.md 상태머신 참조.
 * 워커가 일감에 지원한 단건.
 */

export type ApplicationStatus =
  | 'pending' // 구인자 판정 대기
  | 'accepted' // 채용됨
  | 'rejected' // 거부됨
  | 'auto_cancelled' // 워커가 다른 곳 확정되어 자동 취소
  | 'expired'; // 구인자 판정 시간 초과

/** 지원 시점의 워커 프로필 스냅샷 (denormalized) */
export interface Application {
  id: string;
  jobId: string;

  workerId: string;
  workerName: string;
  /** 나이 (선택 표시) */
  workerAge?: number;
  /** 종합 별점 0~5 */
  workerRating: number;
  /** 총 근무 완료 횟수 */
  workerJobCount: number;
  /** 해당 업종 근무 횟수 (예: 홀서빙 몇 회) */
  workerCategoryCount?: number;
  /** 출석률 (0~1) */
  workerAttendance?: number;
  /** 스킬 뱃지 */
  workerBadges: string[];
  /** 한 줄 자기소개 */
  workerIntro?: string;
  /** 최근 받은 대표 리뷰 */
  workerRecentReview?: string;

  status: ApplicationStatus;

  /** 지원 시각 */
  appliedAt: string;
  /**
   * 구인자 판정 마감 시각 (Mode 2).
   * 사장님이 "지원자 확인" 화면을 연 시점부터 10분 카운트.
   * 아직 안 열었으면 undefined.
   */
  judgeDeadline?: string;
  /** 판정 완료 시각 */
  judgedAt?: string;
}
