-- ============================================================================
-- 005_rls_policies.sql
-- Row Level Security 정책.
--
-- 핵심 원칙:
--  - 프로필은 본인만 수정, 모두 조회 가능 (공개 정보)
--  - 일감은 모두 조회 가능, 등록/수정은 작성 사장님만
--  - 지원은 본인 지원만 조회/취소, 해당 일감 사장님이 조회 가능
--  - 매칭은 참여자(사장님+일손)만 조회/수정
--  - 리뷰는 모두 조회 가능 (신뢰 시스템이므로 공개), 작성은 매칭 참여자만
-- ============================================================================

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.matches enable row level security;
alter table public.reviews enable row level security;

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────
create policy "프로필 조회는 모두 가능"
  on public.profiles for select
  using (true);

create policy "본인 프로필만 삽입"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "본인 프로필만 수정"
  on public.profiles for update
  using (auth.uid() = id);

-- 본인 프로필은 삭제 불가 (auth.users 삭제 시 cascade로만)

-- ─────────────────────────────────────────────────────────────
-- jobs
-- ─────────────────────────────────────────────────────────────
create policy "일감 조회는 모두 가능"
  on public.jobs for select
  using (true);

create policy "본인만 일감 등록"
  on public.jobs for insert
  with check (auth.uid() = employer_id);

create policy "본인 일감만 수정"
  on public.jobs for update
  using (auth.uid() = employer_id);

create policy "본인 일감만 삭제"
  on public.jobs for delete
  using (auth.uid() = employer_id);

-- ─────────────────────────────────────────────────────────────
-- applications
-- ─────────────────────────────────────────────────────────────
-- 조회:
--   - 본인이 지원한 건
--   - 또는 그 일감의 사장님인 경우
create policy "본인 지원 또는 일감 주인만 조회"
  on public.applications for select
  using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.employer_id = auth.uid()
    )
  );

-- 삽입: 본인으로만 지원 가능
create policy "본인만 지원 가능"
  on public.applications for insert
  with check (auth.uid() = worker_id);

-- 수정: 본인(취소) 또는 사장님(채용/거부)
create policy "본인 또는 일감 주인만 수정"
  on public.applications for update
  using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id
      and jobs.employer_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- matches
-- ─────────────────────────────────────────────────────────────
-- 조회/수정 모두: 해당 매치의 워커 또는 일감 주인
create policy "매칭 참여자만 조회"
  on public.matches for select
  using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = matches.job_id
      and jobs.employer_id = auth.uid()
    )
  );

create policy "매칭 참여자만 생성"
  on public.matches for insert
  with check (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = matches.job_id
      and jobs.employer_id = auth.uid()
    )
  );

create policy "매칭 참여자만 수정"
  on public.matches for update
  using (
    auth.uid() = worker_id
    or exists (
      select 1 from public.jobs
      where jobs.id = matches.job_id
      and jobs.employer_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- reviews
-- ─────────────────────────────────────────────────────────────
-- 조회: 신뢰 시스템이므로 모두 공개
create policy "리뷰 조회는 모두 가능"
  on public.reviews for select
  using (true);

-- 작성: 해당 매치에 참여한 본인만
create policy "매칭 참여자만 리뷰 작성"
  on public.reviews for insert
  with check (
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

-- 리뷰는 수정/삭제 불가 (공정성)
