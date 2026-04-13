/**
 * 프로필 DB 액세스.
 */

import { supabase } from '@/shared/api';

export interface ProfileRow {
  id: string;
  display_name: string;
  intro: string | null;
  active_role: 'worker' | 'employer' | null;
  worker_job_count: number;
  worker_total_rating: number;
  worker_rating_count: number;
  employer_job_count: number;
  employer_total_rating: number;
  employer_rating_count: number;
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

/** 현재 활성 역할 업데이트 */
export async function updateActiveRole(
  userId: string,
  role: 'worker' | 'employer'
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ active_role: role })
    .eq('id', userId);
  if (error) throw error;
}

/** 표시명 업데이트 */
export async function updateDisplayName(
  userId: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId);
  if (error) throw error;
}
