-- ============================================================================
-- _all.sql — 전체 스키마 한 번에 실행용
--
-- Supabase Dashboard → SQL Editor 에 이 파일 전체 복붙 → Run.
--
-- 구성:
--   1. profiles (사용자 프로필)
--   2. jobs (일감)
--   3. applications (지원)
--   4. matches + reviews (매칭 근무 기록 + 양방향 리뷰)
--   5. RLS 정책
-- ============================================================================

-- ============================================================================
-- 1. profiles
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  kakao_id text unique,
  display_name text not null,
  phone text,
  profile_image_url text,
  intro text,
  age int,
  active_role text check (active_role in ('worker', 'employer')),
  worker_total_rating numeric default 0,
  worker_rating_count int default 0,
  worker_job_count int default 0,
  worker_attendance_rate numeric,
  worker_penalty_points int default 0,
  worker_penalty_until timestamptz,
  employer_total_rating numeric default 0,
  employer_rating_count int default 0,
  employer_job_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_kakao_id on public.profiles(kakao_id);

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', '이름없음')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2. jobs
-- ============================================================================

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (
    category in (
      'serving', 'kitchen', 'cafe', 'convenience',
      'logistics', 'event', 'cleaning', 'other'
    )
  ),
  location_address text not null,
  location_lat double precision,
  location_lng double precision,
  start_at timestamptz not null,
  duration_hours numeric(4,2) not null check (duration_hours > 0),
  hourly_rate int not null check (hourly_rate >= 10030),
  required_count int not null default 1 check (required_count > 0),
  urgent boolean default false,
  matching_mode text not null check (matching_mode in ('instant', 'scheduled')),
  status text not null default 'open' check (
    status in ('draft', 'open', 'matching', 'confirmed', 'in_progress', 'completed', 'cancelled')
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_jobs_employer_id on public.jobs(employer_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_start_at on public.jobs(start_at);
create index if not exists idx_jobs_location on public.jobs(location_lat, location_lng);

drop trigger if exists set_updated_at on public.jobs;
create trigger set_updated_at
  before update on public.jobs
  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- 3. applications
-- ============================================================================

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'rejected', 'auto_cancelled', 'expired')
  ),
  snapshot_display_name text,
  snapshot_rating numeric,
  snapshot_job_count int,
  applied_at timestamptz default now(),
  judge_deadline timestamptz,
  judged_at timestamptz,
  unique (job_id, worker_id)
);

create index if not exists idx_applications_job_id on public.applications(job_id);
create index if not exists idx_applications_worker_id on public.applications(worker_id);
create index if not exists idx_applications_status on public.applications(status);

-- ============================================================================
-- 4. matches + reviews
-- ============================================================================

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  checked_in_at timestamptz,
  checked_in_lat double precision,
  checked_in_lng double precision,
  checked_out_at timestamptz,
  checked_out_lat double precision,
  checked_out_lng double precision,
  payment_amount int,
  payment_status text default 'pending' check (
    payment_status in ('pending', 'escrow', 'settled', 'refunded')
  ),
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by in ('worker', 'employer', 'mutual', 'system')),
  cancellation_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (application_id)
);

create index if not exists idx_matches_job_id on public.matches(job_id);
create index if not exists idx_matches_worker_id on public.matches(worker_id);

drop trigger if exists set_updated_at on public.matches;
create trigger set_updated_at
  before update on public.matches
  for each row execute function public.tg_set_updated_at();

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  from_role text not null check (from_role in ('worker', 'employer')),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  category_ratings jsonb,
  created_at timestamptz default now(),
  unique (match_id, from_role)
);

create index if not exists idx_reviews_match_id on public.reviews(match_id);
create index if not exists idx_reviews_reviewee_id on public.reviews(reviewee_id);

-- ============================================================================
-- 5. RLS 정책
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.matches enable row level security;
alter table public.reviews enable row level security;

-- profiles
drop policy if exists "프로필 조회는 모두 가능" on public.profiles;
create policy "프로필 조회는 모두 가능"
  on public.profiles for select using (true);

drop policy if exists "본인 프로필만 삽입" on public.profiles;
create policy "본인 프로필만 삽입"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "본인 프로필만 수정" on public.profiles;
create policy "본인 프로필만 수정"
  on public.profiles for update using (auth.uid() = id);

-- jobs
drop policy if exists "일감 조회는 모두 가능" on public.jobs;
create policy "일감 조회는 모두 가능"
  on public.jobs for select using (true);

drop policy if exists "본인만 일감 등록" on public.jobs;
create policy "본인만 일감 등록"
  on public.jobs for insert with check (auth.uid() = employer_id);

drop policy if exists "본인 일감만 수정" on public.jobs;
create policy "본인 일감만 수정"
  on public.jobs for update using (auth.uid() = employer_id);

drop policy if exists "본인 일감만 삭제" on public.jobs;
create policy "본인 일감만 삭제"
  on public.jobs for delete using (auth.uid() = employer_id);

-- applications
drop policy if exists "본인 지원 또는 일감 주인만 조회" on public.applications;
create policy "본인 지원 또는 일감 주인만 조회"
  on public.applications for select using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.employer_id = auth.uid()
    )
  );

drop policy if exists "본인만 지원 가능" on public.applications;
create policy "본인만 지원 가능"
  on public.applications for insert with check (auth.uid() = worker_id);

drop policy if exists "본인 또는 일감 주인만 수정" on public.applications;
create policy "본인 또는 일감 주인만 수정"
  on public.applications for update using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.employer_id = auth.uid()
    )
  );

-- matches
drop policy if exists "매칭 참여자만 조회" on public.matches;
create policy "매칭 참여자만 조회"
  on public.matches for select using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = matches.job_id
      and jobs.employer_id = auth.uid()
    )
  );

drop policy if exists "매칭 참여자만 생성" on public.matches;
create policy "매칭 참여자만 생성"
  on public.matches for insert with check (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = matches.job_id
      and jobs.employer_id = auth.uid()
    )
  );

drop policy if exists "매칭 참여자만 수정" on public.matches;
create policy "매칭 참여자만 수정"
  on public.matches for update using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = matches.job_id
      and jobs.employer_id = auth.uid()
    )
  );

-- reviews
drop policy if exists "리뷰 조회는 모두 가능" on public.reviews;
create policy "리뷰 조회는 모두 가능"
  on public.reviews for select using (true);

drop policy if exists "매칭 참여자만 리뷰 작성" on public.reviews;
create policy "매칭 참여자만 리뷰 작성"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.matches
      where matches.id = reviews.match_id
      and (
        matches.worker_id = auth.uid()
        or exists (
          select 1 from public.jobs
          where jobs.id = matches.job_id
          and jobs.employer_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- 완료. 테이블 5개 + RLS 정책 설치됨.
-- ============================================================================
