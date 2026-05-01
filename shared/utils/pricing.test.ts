import {
  calculateJobPricing,
  formatKRW,
  formatRate,
  PG_FEE_RATE,
  PLATFORM_FEE_RATE,
} from './pricing';

describe('calculateJobPricing', () => {
  it('시급 10,000원 × 4시간 — 기본 요율로 breakdown 계산', () => {
    const p = calculateJobPricing(10_000, 4);
    expect(p.workerPay).toBe(40_000);
    expect(p.platformFee).toBe(4_000);
    expect(p.pgFee).toBe(1_320);
    expect(p.total).toBe(45_320);
    expect(p.platformFeeRate).toBe(PLATFORM_FEE_RATE);
    expect(p.pgFeeRate).toBe(PG_FEE_RATE);
  });

  it('소수점 시간 — workerPay 원 단위 반올림', () => {
    const p = calculateJobPricing(12_345, 1.5);
    expect(p.workerPay).toBe(Math.round(12_345 * 1.5));
    expect(p.total).toBe(p.workerPay + p.platformFee + p.pgFee);
  });

  it('런칭 0% 수수료 모드 — platformFee 0이지만 PG 수수료는 살아있음', () => {
    const p = calculateJobPricing(10_000, 2, 0, PG_FEE_RATE);
    expect(p.platformFee).toBe(0);
    expect(p.pgFee).toBeGreaterThan(0);
    expect(p.total).toBe(p.workerPay + p.pgFee);
  });

  it('15% 인상 시나리오 — 수수료 비율이 정확히 반영', () => {
    const p = calculateJobPricing(10_000, 1, 0.15, 0);
    expect(p.platformFee).toBe(1_500);
    expect(p.total).toBe(11_500);
  });
});

describe('formatKRW', () => {
  it('천 단위 콤마 + 원 suffix', () => {
    expect(formatKRW(1_234_567)).toBe('1,234,567원');
    expect(formatKRW(0)).toBe('0원');
  });
});

describe('formatRate', () => {
  it('정수 요율은 소수점 없이', () => {
    expect(formatRate(0.1)).toBe('10%');
    expect(formatRate(0.15)).toBe('15%');
  });

  it('소수 요율은 소수 첫째 자리까지', () => {
    expect(formatRate(0.033)).toBe('3.3%');
  });
});
