-- 009_fk_indexes.sql
-- Add missing foreign-key indexes to avoid sequential scans on join paths.
-- See commit.show audit (2026-05-01): vibe_concerns.db_indexes flagged
-- application_id and reviewer_id as unindexed FKs.

create index if not exists idx_matches_application_id
  on public.matches(application_id);

create index if not exists idx_reviews_reviewer_id
  on public.reviews(reviewer_id);

create index if not exists idx_reviews_job_id
  on public.reviews(job_id);
