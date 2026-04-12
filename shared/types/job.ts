/**
 * 일감(Job) 관련 타입.
 *
 * docs/matching-system.md 상태머신 참조.
 */

/** 일감 상태 (매칭 진행 과정) */
export type JobStatus =
  | 'open' // 공고 게시, 지원 대기
  | 'matching' // 지원자 있음, 판정 중 (Mode 2) 또는 확정 전
  | 'confirmed' // 워커 확정, 출근 대기
  | 'in_progress' // 근무 중
  | 'completed' // 근무 완료
  | 'cancelled'; // 취소

/** 매칭 모드 */
export type MatchingMode =
  | 'instant' // 즉시 호출 (3시간 이내) — 선착순 자동 확정
  | 'scheduled'; // 예약 구인 (3시간 이상) — 구인자 판정

/** 일감 카테고리 (초기 프리셋) */
export type JobCategory =
  | 'serving' // 홀서빙
  | 'kitchen' // 주방보조
  | 'cafe' // 카페
  | 'convenience' // 편의점
  | 'logistics' // 물류
  | 'event' // 이벤트
  | 'cleaning' // 청소
  | 'other'; // 기타

export const CategoryLabel: Record<JobCategory, string> = {
  serving: '홀서빙',
  kitchen: '주방보조',
  cafe: '카페',
  convenience: '편의점',
  logistics: '물류',
  event: '이벤트',
  cleaning: '청소',
  other: '기타',
};

export interface Job {
  /** 고유 ID */
  id: string;
  /** 등록한 사장님 ID */
  employerId: string;
  /** 사장님 표시명 (가게명) */
  employerName: string;

  title: string;
  description?: string;
  category: JobCategory;

  /** 장소 표시명 (예: "미금역 OO식당") */
  location: string;
  /** 거리 표시 (mock: "1.2km") — 실제로는 GPS 계산 */
  distance?: string;

  /** 시작 시각 (ISO string) */
  startAt: string;
  /** 근무 시간 (시간 단위) */
  durationHours: number;
  /** 시급 (원) */
  hourlyRate: number;
  /** 필요 인원 수 */
  requiredCount: number;

  /** 긴급 여부 (UI 강조용) */
  urgent: boolean;

  matchingMode: MatchingMode;
  status: JobStatus;

  /** 등록 시각 */
  createdAt: string;
}

/** 일감 등록 폼 입력값 */
export interface JobFormInput {
  title: string;
  category: JobCategory;
  location: string;
  startAt: string;
  durationHours: number;
  hourlyRate: number;
  requiredCount: number;
  urgent: boolean;
  description?: string;
}
