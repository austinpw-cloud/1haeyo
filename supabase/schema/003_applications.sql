-- ============================================================================
-- 003_applications.sql
-- 지원 테이블. 일손이 일감에 지원한 건.
-- 한 일감에 여러 일손이 지원할 수 있음.
-- 같은 일손이 같은 일감에 중복 지원은 불가 (unique 제약).
-- ============================================================================

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,

  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'rejected', 'auto_cancelled', 'expired')
  ),

  -- 지원 시 스냅샷 (이후 프로필 변경돼도 지원 당시 정보 보존)
  snapshot_display_name text,
  snapshot_rating numeric,
  snapshot_job_count int,

  applied_at timestamptz default now(),

  -- 사장님이 판정 화면 연 시점부터 10분 카운트 (Mode 2)
  judge_deadline timestamptz,
  judged_at timestamptz,

  unique (job_id, worker_id)
);

-- 인덱스
create index idx_applications_job_id on public.applications(job_id);
create index idx_applications_worker_id on public.applications(worker_id);
create index idx_applications_status on public.applications(status);

comment on table public.applications is '일감에 대한 지원 내역';
