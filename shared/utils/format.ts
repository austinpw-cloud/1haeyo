/**
 * 포맷팅 유틸.
 */

/** 시급/금액을 "15,000원" 형식으로 */
export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** 시작 시각을 상대적 표현으로. "4시간 후", "내일 오전" 등 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 0) {
    return '지난 일감';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 후`;
  }
  if (diffHours < 24) {
    return `${diffHours}시간 후`;
  }

  // 오늘/내일/모레 판단
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor(
    (target.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );

  const hour = target.getHours();
  const ampm = hour < 12 ? '오전' : '오후';
  const display12h = hour % 12 === 0 ? 12 : hour % 12;
  const minutes = target.getMinutes();
  const timeLabel =
    minutes === 0
      ? `${ampm} ${display12h}시`
      : `${ampm} ${display12h}시 ${minutes}분`;

  if (daysDiff === 1) return `내일 ${timeLabel}`;
  if (daysDiff === 2) return `모레 ${timeLabel}`;
  if (daysDiff <= 6) return `${daysDiff}일 후 ${timeLabel}`;

  // 1주 이상이면 "M월 D일" 표시
  const month = target.getMonth() + 1;
  const date = target.getDate();
  return `${month}월 ${date}일 ${timeLabel}`;
}

/** 근무 시간을 "2시간" 형식으로 */
export function formatDuration(hours: number): string {
  return `${hours}시간`;
}

/** 거리 표시 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/** 일감 총액 계산 + 포맷 */
export function calculateTotalPay(hourlyRate: number, hours: number): string {
  return formatWon(hourlyRate * hours);
}
