/**
 * 특정 목표 시각까지 카운트다운.
 *
 * 반환값:
 *  - remainingMs: 남은 밀리초 (0 이하면 만료)
 *  - expired: 만료 여부
 *  - label: "9:32" 같은 표시 문자열
 */

import { useEffect, useState } from 'react';

export interface CountdownResult {
  remainingMs: number;
  expired: boolean;
  label: string;
}

export function useCountdown(deadlineIso: string | undefined): CountdownResult {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadlineIso) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadlineIso]);

  if (!deadlineIso) {
    return { remainingMs: 0, expired: false, label: '' };
  }

  const deadline = new Date(deadlineIso).getTime();
  const remainingMs = Math.max(0, deadline - now);
  const expired = remainingMs <= 0;

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return { remainingMs, expired, label };
}
