-- ============================================================================
-- 002_jobs.sql
-- 일감 테이블.
-- 사장님이 등록하는 초단기 일자리 공고.
-- ============================================================================

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,

  -- 공고 내용
  title text not null,
  description text,
  category text not null check (
    category in (
      'serving', 'kitchen', 'cafe', 'convenience',
      'logistics', 'event', 'cleaning', 'other'
    )
  ),

  -- 위치
  location_address text not null,
  location_lat double precision,
  location_lng double precision,

  -- 시간
  start_at timestamptz not null,
  duration_hours numeric(4,2) not null check (duration_hours > 0),

  -- 임금
  hourly_rate int not null check (hourly_rate >= 10030),  -- 2026 최저임금 기준
  required_count int not null default 1 check (required_count > 0),

  urgent boolean default false,

  -- 매칭
  matching_mode text not null check (matching_mode in ('instant', 'scheduled')),
  status text not null default 'open' check (
    status in ('draft', 'open', 'matching', 'confirmed', 'in_progress', 'completed', 'cancelled')
  ),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 인덱스
create index idx_jobs_employer_id on public.jobs(employer_id);
create index idx_jobs_status on public.jobs(status);
create index idx_jobs_start_at on public.jobs(start_at);
-- 위치 기반 쿼리를 위한 복합 인덱스 (나중에 PostGIS 쓰면 업그레이드)
create index idx_jobs_location on public.jobs(location_lat, location_lng);

create trigger set_updated_at
  before update on public.jobs
  for each row execute function public.tg_set_updated_at();

comment on table public.jobs is '사장님이 등록하는 일감 공고';
