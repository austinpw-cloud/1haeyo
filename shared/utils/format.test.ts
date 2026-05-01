import {
  calculateTotalPay,
  formatDistance,
  formatDuration,
  formatRelativeTime,
  formatWon,
} from './format';

describe('formatWon', () => {
  it('천 단위 콤마 + 원 suffix', () => {
    expect(formatWon(15_000)).toBe('15,000원');
    expect(formatWon(0)).toBe('0원');
  });
});

describe('formatDuration', () => {
  it('숫자에 "시간" 붙이기', () => {
    expect(formatDuration(2)).toBe('2시간');
    expect(formatDuration(0.5)).toBe('0.5시간');
  });
});

describe('formatDistance', () => {
  it('1km 미만은 미터로 반올림', () => {
    expect(formatDistance(0.45)).toBe('450m');
    expect(formatDistance(0.999)).toBe('999m');
  });

  it('1km 이상은 소수 1자리 km', () => {
    expect(formatDistance(1)).toBe('1.0km');
    expect(formatDistance(2.34)).toBe('2.3km');
  });
});

describe('calculateTotalPay', () => {
  it('시급 × 시간 → 콤마 포맷 원화', () => {
    expect(calculateTotalPay(10_000, 4)).toBe('40,000원');
  });
});

describe('formatRelativeTime', () => {
  // 분기 검증을 위한 고정 기준 시각
  const NOW = new Date('2026-05-01T12:00:00+09:00');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('과거 시각은 "지난 일감"', () => {
    const past = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(past)).toBe('지난 일감');
  });

  it('1시간 미만 미래는 "N분 후"', () => {
    const in30m = new Date(NOW.getTime() + 30 * 60 * 1000).toISOString();
    expect(formatRelativeTime(in30m)).toBe('30분 후');
  });

  it('당일 1~23시간 후는 "N시간 후"', () => {
    const in3h = new Date(NOW.getTime() + 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(in3h)).toBe('3시간 후');
  });

  it('내일 — "내일 오전/오후 H시" (24시간 이상 차이 + 캘린더 day+1)', () => {
    const tomorrow1pm = new Date('2026-05-02T13:00:00+09:00').toISOString();
    expect(formatRelativeTime(tomorrow1pm)).toBe('내일 오후 1시');
  });

  it('모레 — "모레 ..."', () => {
    const dayAfter = new Date('2026-05-03T15:30:00+09:00').toISOString();
    expect(formatRelativeTime(dayAfter)).toBe('모레 오후 3시 30분');
  });

  it('1주 이상 후 — "M월 D일 ..."', () => {
    const farFuture = new Date('2026-05-15T18:00:00+09:00').toISOString();
    expect(formatRelativeTime(farFuture)).toBe('5월 15일 오후 6시');
  });
});
