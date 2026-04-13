-- ============================================================================
-- 004_matches_and_reviews.sql
-- 매칭 라이프사이클 + 리뷰.
--
-- matches: 확정된 매칭의 체크인/체크아웃 기록
-- reviews: 양방향 리뷰 (일손 <-> 사장님)
-- ============================================================================

-- 매칭 (확정된 지원 건의 근무 진행 기록)
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,

  -- 체크인/아웃
  checked_in_at timestamptz,
  checked_in_lat double precision,
  checked_in_lng double precision,

  checked_out_at timestamptz,
  checked_out_lat double precision,
  checked_out_lng double precision,

  -- 정산
  payment_amount int,
  payment_status text default 'pending' check (
    payment_status in ('pending', 'escrow', 'settled', 'refunded')
  ),

  -- 취소
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by in ('worker', 'employer', 'mutual', 'system')),
  cancellation_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (application_id)
);

create index idx_matches_job_id on public.matches(job_id);
create index idx_matches_worker_id on public.matches(worker_id);

create trigger set_updated_at
  before update on public.matches
  for each row execute function public.tg_set_updated_at();

comment on table public.matches is '확정된 매칭의 근무 진행 기록';

-- 리뷰 (양방향)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,

  -- 리뷰 방향: worker → employer 또는 employer → worker
  from_role text not null check (from_role in ('worker', 'employer')),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,

  rating int not null check (rating between 1 and 5),
  comment text,

  -- 카테고리별 평가 (JSON): {punctuality: 5, skill: 4, attitude: 5}
  category_ratings jsonb,

  created_at timestamptz default now(),

  -- 한 매치당 같은 방향 리뷰는 하나만
  unique (match_id, from_role)
);

create index idx_reviews_match_id on public.reviews(match_id);
create index idx_reviews_reviewee_id on public.reviews(reviewee_id);

comment on table public.reviews is '매칭 완료 후 양방향 리뷰';
