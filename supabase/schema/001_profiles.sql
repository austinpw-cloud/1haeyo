-- ============================================================================
-- 001_profiles.sql
-- 사용자 프로필 테이블.
-- Supabase auth.users 를 확장하는 public.profiles 테이블.
-- 한 사람이 worker/employer 두 역할 모두 가능 (active_role로 현재 모드 관리).
-- ============================================================================

-- 프로필 테이블
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  -- 로그인 관련
  kakao_id text unique,

  -- 표시 정보
  display_name text not null,
  phone text,
  profile_image_url text,
  intro text,
  age int,

  -- 현재 활성 역할 (single-user dual-role 전환용)
  active_role text check (active_role in ('worker', 'employer')),

  -- 일손(worker)으로서의 누적 지표 (캐시)
  worker_total_rating numeric default 0,
  worker_rating_count int default 0,
  worker_job_count int default 0,
  worker_attendance_rate numeric, -- 0.00~1.00
  worker_penalty_points int default 0,
  worker_penalty_until timestamptz,

  -- 사장님(employer)으로서의 누적 지표 (캐시)
  employer_total_rating numeric default 0,
  employer_rating_count int default 0,
  employer_job_count int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 인덱스
create index idx_profiles_kakao_id on public.profiles(kakao_id);

-- updated_at 자동 갱신 트리거 함수 (재사용될 예정)
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- auth.users 생성 시 자동으로 profiles 생성하는 트리거
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
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on table public.profiles is '사용자 프로필 (auth.users 확장)';
