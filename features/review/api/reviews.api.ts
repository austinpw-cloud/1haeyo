/**
 * Reviews DB 액세스.
 *
 * 리뷰는 match 단위로 작성 (match_id FK).
 * 한 매치당 방향(worker/employer)별로 하나씩만.
 * 수정/삭제 불가 (공정성).
 */

import { supabase } from '@/shared/api';

export type ReviewFrom = 'worker' | 'employer';

export interface Review {
  id: string;
  matchId: string;
  jobId: string;
  from: ReviewFrom;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  match_id: string;
  job_id: string;
  from_role: ReviewFrom;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  category_ratings: Record<string, number> | null;
  created_at: string;
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    matchId: row.match_id,
    jobId: row.job_id,
    from: row.from_role,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
  };
}

/** 현재 사용자가 볼 수 있는 모든 리뷰 (공개 정책이므로 전체) */
export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ReviewRow[]).map(rowToReview);
}

/** 특정 job의 리뷰들 (양방향 최대 2개) */
export async function fetchReviewsByJobId(jobId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('job_id', jobId);

  if (error) throw error;
  return (data as ReviewRow[]).map(rowToReview);
}

/**
 * 리뷰 작성.
 * 한 매치당 같은 방향 리뷰는 하나만 — unique 제약에 걸리면 조용히 무시.
 */
export async function insertReview(input: {
  matchId: string;
  jobId: string;
  from: ReviewFrom;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      match_id: input.matchId,
      job_id: input.jobId,
      from_role: input.from,
      reviewer_id: input.reviewerId,
      reviewee_id: input.revieweeId,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .select('*')
    .single();

  if (error) {
    // unique 제약(중복 리뷰) — 이미 작성된 거라 실패해도 UI상 동일
    if (error.code === '23505') return null;
    throw error;
  }
  return rowToReview(data as ReviewRow);
}
