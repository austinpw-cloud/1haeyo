/**
 * 일감 결제 비용 계산.
 *
 * 사장님이 지불하는 총액 = 근무 대가 + 플랫폼 수수료 + PG 정산 수수료.
 * 각 항목은 사용자에게 투명하게 공시되어야 함.
 *
 * docs/payment-model.md 참조.
 */

/** 플랫폼 수수료율 — 런칭 0%/10%/15% 단계적 상향. MVP는 10% 기본. */
export const PLATFORM_FEE_RATE = 0.1;

/** PG 정산 수수료율 — 토스페이먼츠 카드 기준 약 3.3%. */
export const PG_FEE_RATE = 0.033;

export interface JobPricing {
  /** 근무 대가 (워커 실수령 전 총액. 시급 × 시간) */
  workerPay: number;
  /** 플랫폼 수수료 */
  platformFee: number;
  /** PG 정산 수수료 (토스페이먼츠 등) */
  pgFee: number;
  /** 사장님 총 지출 */
  total: number;

  /** 요율 정보 (공시용) */
  platformFeeRate: number;
  pgFeeRate: number;
}

/**
 * 시급과 근무 시간으로 총액 breakdown 계산.
 * 수수료는 근무 대가 기준으로 계산 (원 단위 반올림).
 */
export function calculateJobPricing(
  hourlyRate: number,
  durationHours: number,
  platformFeeRate: number = PLATFORM_FEE_RATE,
  pgFeeRate: number = PG_FEE_RATE
): JobPricing {
  const workerPay = Math.round(hourlyRate * durationHours);
  const platformFee = Math.round(workerPay * platformFeeRate);
  const pgFee = Math.round(workerPay * pgFeeRate);
  const total = workerPay + platformFee + pgFee;

  return {
    workerPay,
    platformFee,
    pgFee,
    total,
    platformFeeRate,
    pgFeeRate,
  };
}

/** 원화 천단위 포맷 */
export function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** 퍼센트 표시 (3.3 → "3.3%") */
export function formatRate(rate: number): string {
  const pct = rate * 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}
