/**
 * Jobs DB 액세스 레이어.
 * Supabase 쿼리를 래핑해 도메인 타입으로 변환.
 */

import { supabase } from '@/shared/api';
import { Job, JobCategory, JobFormInput, JobStatus, MatchingMode } from '@/shared/types';

/** DB row 타입 (profiles 조인 포함) */
interface JobRow {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  category: JobCategory;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  start_at: string;
  duration_hours: number;
  hourly_rate: number;
  required_count: number;
  urgent: boolean;
  matching_mode: MatchingMode;
  status: JobStatus;
  created_at: string;
  profiles: { display_name: string } | null;
}

const SELECT_WITH_EMPLOYER = '*, profiles!jobs_employer_id_fkey(display_name)';

/** DB row → 도메인 Job */
function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    employerId: row.employer_id,
    employerName: row.profiles?.display_name ?? '알 수 없음',
    title: row.title,
    description: row.description ?? undefined,
    category: row.category,
    location: row.location_address,
    // distance는 GPS 연동 후 클라이언트에서 계산
    startAt: row.start_at,
    durationHours: Number(row.duration_hours),
    hourlyRate: row.hourly_rate,
    requiredCount: row.required_count,
    urgent: row.urgent,
    matchingMode: row.matching_mode,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** 모든 일감 조회 (필요 시 필터 추가) */
export async function fetchAllJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(SELECT_WITH_EMPLOYER)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as JobRow[]).map(rowToJob);
}

/** 단일 일감 조회 */
export async function fetchJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(SELECT_WITH_EMPLOYER)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToJob(data as unknown as JobRow);
}

/** 일감 등록 */
export async function insertJob(
  userId: string,
  input: JobFormInput
): Promise<Job> {
  const now = new Date();
  const start = new Date(input.startAt);
  const hoursUntilStart =
    (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  const matchingMode: MatchingMode =
    hoursUntilStart <= 3 ? 'instant' : 'scheduled';

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      employer_id: userId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      location_address: input.location,
      start_at: input.startAt,
      duration_hours: input.durationHours,
      hourly_rate: input.hourlyRate,
      required_count: input.requiredCount,
      urgent: input.urgent,
      matching_mode: matchingMode,
      status: 'open',
    })
    .select(SELECT_WITH_EMPLOYER)
    .single();

  if (error) throw error;
  return rowToJob(data as unknown as JobRow);
}

/** 일감 상태 변경 */
export async function updateJobStatusDb(
  id: string,
  status: JobStatus
): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}
