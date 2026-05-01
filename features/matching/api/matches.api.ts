/**
 * Matches DB 액세스.
 *
 * `matches`는 accepted 지원 건의 근무 진행 기록.
 * - 지원자가 accepted되면 match row 생성 (best-effort, 실패하면 check-in 시 재시도)
 * - 체크인/아웃 시간·좌표 기록
 * - 취소 사유 기록
 */

import { supabase } from '@/shared/api';

export interface Match {
  id: string;
  jobId: string;
  workerId: string;
  applicationId: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
  cancelledBy?: 'worker' | 'employer' | 'mutual' | 'system';
  cancellationReason?: string;
  paymentStatus: 'pending' | 'escrow' | 'settled' | 'refunded';
  createdAt: string;
}

interface MatchRow {
  id: string;
  job_id: string;
  worker_id: string;
  application_id: string;
  checked_in_at: string | null;
  checked_in_lat: number | null;
  checked_in_lng: number | null;
  checked_out_at: string | null;
  checked_out_lat: number | null;
  checked_out_lng: number | null;
  payment_amount: number | null;
  payment_status: 'pending' | 'escrow' | 'settled' | 'refunded';
  cancelled_at: string | null;
  cancelled_by: 'worker' | 'employer' | 'mutual' | 'system' | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

function rowToMatch(row: MatchRow): Match {
  return {
    id: row.id,
    jobId: row.job_id,
    workerId: row.worker_id,
    applicationId: row.application_id,
    checkedInAt: row.checked_in_at ?? undefined,
    checkedOutAt: row.checked_out_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    cancelledBy: row.cancelled_by ?? undefined,
    cancellationReason: row.cancellation_reason ?? undefined,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  };
}

/** 현재 사용자가 볼 수 있는 모든 매칭. RLS가 자동 필터. */
export async function fetchAllVisibleMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as MatchRow[]).map(rowToMatch);
}

/** 특정 job의 확정 match (있으면) */
export async function fetchMatchByJobId(jobId: string): Promise<Match | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('job_id', jobId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToMatch(data as MatchRow);
}

/**
 * 매칭 레코드 생성.
 * accepted 시 자동 호출. 이미 있으면 조용히 기존 것 반환 (idempotent).
 */
export async function insertMatch(input: {
  jobId: string;
  workerId: string;
  applicationId: string;
}): Promise<Match> {
  // 이미 있으면 그대로 반환
  const { data: existing } = await supabase
    .from('matches')
    .select('*')
    .eq('application_id', input.applicationId)
    .maybeSingle();

  if (existing) return rowToMatch(existing as MatchRow);

  const { data, error } = await supabase
    .from('matches')
    .insert({
      job_id: input.jobId,
      worker_id: input.workerId,
      application_id: input.applicationId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return rowToMatch(data as MatchRow);
}

/** 체크인: 시간 기록 (좌표는 GPS 붙이면서 확장) */
export async function checkInMatch(
  matchId: string,
  location?: { lat: number; lng: number }
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_lat: location?.lat ?? null,
      checked_in_lng: location?.lng ?? null,
    })
    .eq('id', matchId);
  if (error) throw error;
}

/** 체크아웃 */
export async function checkOutMatch(
  matchId: string,
  location?: { lat: number; lng: number }
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      checked_out_at: new Date().toISOString(),
      checked_out_lat: location?.lat ?? null,
      checked_out_lng: location?.lng ?? null,
    })
    .eq('id', matchId);
  if (error) throw error;
}

/** 매칭 취소 */
export async function cancelMatch(
  matchId: string,
  by: 'worker' | 'employer' | 'mutual' | 'system',
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      cancelled_at: new Date().toISOString(),
      cancelled_by: by,
      cancellation_reason: reason ?? null,
    })
    .eq('id', matchId);
  if (error) throw error;
}

/** 정산 상태 업데이트 (체크아웃 후 즉시송금 트리거 시 호출) */
export async function updatePaymentStatus(
  matchId: string,
  status: 'pending' | 'escrow' | 'settled' | 'refunded'
): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ payment_status: status })
    .eq('id', matchId);
  if (error) throw error;
}
