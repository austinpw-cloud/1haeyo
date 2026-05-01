/**
 * Applications DB 액세스.
 *
 * 지원은 항상 프로필 조인해서 가져옴 (스냅샷 없을 경우 프로필 현재값 사용).
 */

import { supabase } from '@/shared/api';
import { Application, ApplicationStatus } from '@/shared/types';

interface ApplicationRow {
  id: string;
  job_id: string;
  worker_id: string;
  status: ApplicationStatus;
  snapshot_display_name: string | null;
  snapshot_rating: number | null;
  snapshot_job_count: number | null;
  applied_at: string;
  judge_deadline: string | null;
  judged_at: string | null;
  profiles: {
    display_name: string;
    age: number | null;
    intro: string | null;
    worker_total_rating: number;
    worker_rating_count: number;
    worker_job_count: number;
    worker_attendance_rate: number | null;
  } | null;
}

const SELECT_WITH_PROFILE =
  '*, profiles!applications_worker_id_fkey(display_name, age, intro, worker_total_rating, worker_rating_count, worker_job_count, worker_attendance_rate)';

function rowToApplication(row: ApplicationRow): Application {
  const profile = row.profiles;
  const avgRating =
    profile && profile.worker_rating_count > 0
      ? Number(profile.worker_total_rating) / profile.worker_rating_count
      : 0;

  return {
    id: row.id,
    jobId: row.job_id,
    workerId: row.worker_id,
    workerName:
      row.snapshot_display_name ?? profile?.display_name ?? '알 수 없음',
    workerAge: profile?.age ?? undefined,
    workerRating: row.snapshot_rating ?? avgRating,
    workerJobCount:
      row.snapshot_job_count ?? profile?.worker_job_count ?? 0,
    workerCategoryCount: 0,
    workerAttendance: profile?.worker_attendance_rate ?? undefined,
    workerBadges: [],
    workerIntro: profile?.intro ?? undefined,
    workerRecentReview: undefined,
    status: row.status,
    appliedAt: row.applied_at,
    judgeDeadline: row.judge_deadline ?? undefined,
    judgedAt: row.judged_at ?? undefined,
  };
}

/** 특정 일감의 지원자들 (사장님 용) */
export async function fetchApplicationsByJobId(
  jobId: string
): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT_WITH_PROFILE)
    .eq('job_id', jobId)
    .order('applied_at', { ascending: true });

  if (error) throw error;
  return (data as unknown as ApplicationRow[]).map(rowToApplication);
}

/** 내가 지원한 건들 (일손 용) */
export async function fetchMyApplications(
  workerId: string
): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT_WITH_PROFILE)
    .eq('worker_id', workerId)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as ApplicationRow[]).map(rowToApplication);
}

/** 모든 지원 건 (현재 사용자가 사장님인 일감 + 내가 지원한 것) */
export async function fetchAllVisibleApplications(): Promise<Application[]> {
  // RLS가 자동으로 권한 있는 것만 반환
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT_WITH_PROFILE)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as ApplicationRow[]).map(rowToApplication);
}

/** 일감에 지원 */
export async function insertApplication(
  workerId: string,
  jobId: string
): Promise<Application> {
  // 프로필 스냅샷 + 일감 시작 시간 (판정 마감 계산에 필요)
  const [{ data: profile }, { data: jobRow }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'display_name, worker_total_rating, worker_rating_count, worker_job_count'
      )
      .eq('id', workerId)
      .maybeSingle(),
    supabase.from('jobs').select('start_at').eq('id', jobId).maybeSingle(),
  ]);

  const avgRating =
    profile && profile.worker_rating_count > 0
      ? Number(profile.worker_total_rating) / profile.worker_rating_count
      : 0;

  // 판정 마감 = min(지원 + 10분, 공고 시작 시간)
  // 사장님이 앱에 안 들어와도 자동으로 만료되도록.
  const tenMinLaterMs = Date.now() + 10 * 60 * 1000;
  const startAtMs = jobRow?.start_at
    ? new Date(jobRow.start_at).getTime()
    : tenMinLaterMs;
  const deadlineMs = Math.min(tenMinLaterMs, startAtMs);
  const judgeDeadline = new Date(deadlineMs).toISOString();

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      worker_id: workerId,
      status: 'pending',
      snapshot_display_name: profile?.display_name,
      snapshot_rating: avgRating,
      snapshot_job_count: profile?.worker_job_count ?? 0,
      judge_deadline: judgeDeadline,
    })
    .select(SELECT_WITH_PROFILE)
    .single();

  if (error) throw error;
  return rowToApplication(data as unknown as ApplicationRow);
}

/** 지원 상태 업데이트 (채용/거부) */
export async function updateApplicationStatusDb(
  id: string,
  status: ApplicationStatus
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({
      status,
      judged_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

/**
 * 마감 초과 pending 지원자들 expired 처리.
 * judge_deadline은 지원 시점에 min(지원+10분, 공고 start_at)으로 이미 세팅되어 있음.
 */
export async function expireOverdueApplicationsDb(): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('applications')
    .update({ status: 'expired', judged_at: now })
    .eq('status', 'pending')
    .lt('judge_deadline', now);
  if (error) throw error;
}

/** 채용 시 같은 일감의 다른 pending들 자동 거부 */
export async function rejectOtherPendingForJob(
  jobId: string,
  exceptId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('applications')
    .update({ status: 'rejected', judged_at: now })
    .eq('job_id', jobId)
    .eq('status', 'pending')
    .neq('id', exceptId);
  if (error) throw error;
}
