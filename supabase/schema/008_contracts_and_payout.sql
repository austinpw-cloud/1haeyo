-- ============================================================================
-- 008_contracts_and_payout.sql
--
-- 전자 근로계약서 (`contracts`) + 워커 계좌 정보 + 일감 결제/수수료 필드.
-- docs/payment-model.md 참조.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. 프로필에 은행 계좌 정보 (워커 정산용)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_holder text;

-- ─────────────────────────────────────────────────────────────
-- 2. jobs 테이블에 결제/수수료 필드
-- ─────────────────────────────────────────────────────────────
alter table public.jobs
  add column if not exists platform_fee_rate numeric default 0.10, -- 플랫폼 10%
  add column if not exists pg_fee_rate numeric default 0.033,      -- PG 3.3%
  add column if not exists worker_pay int,                         -- 워커 지급액
  add column if not exists platform_fee int,                       -- 플랫폼 수수료
  add column if not exists pg_fee int,                             -- PG 수수료
  add column if not exists total_amount_charged int,               -- 사장님 총 지출
  add column if not exists escrow_status text default 'pending' check (
    escrow_status in ('pending', 'held', 'released', 'refunded')
  );

-- ─────────────────────────────────────────────────────────────
-- 3. 근로계약서 테이블
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  employer_id uuid not null references public.profiles(id) on delete cascade,
  worker_id uuid not null references public.profiles(id) on delete cascade,

  -- 서명 메타데이터 (사장님은 일감 등록 시 체크, 워커는 지원 시 체크)
  employer_signed_at timestamptz not null default now(),
  employer_signed_ip text,
  employer_signed_device text,

  worker_signed_at timestamptz,
  worker_signed_ip text,
  worker_signed_device text,

  -- 계약 조건 스냅샷 (매칭 확정 시점 기준)
  contract_body jsonb not null,
  -- 예: {
  --   "employer_name": "...",
  --   "worker_name": "...",
  --   "job_title": "...",
  --   "location": "...",
  --   "start_at": "...",
  --   "duration_hours": 2,
  --   "hourly_rate": 15000,
  --   "worker_pay": 30000,
  --   "platform_fee": 3000,
  --   "created_at": "..."
  -- }

  -- 변조 방지: contract_body + 서명 메타의 SHA-256
  content_hash text not null,

  -- 법적 상태: 2단계에서 PASS/KISA 연동 시 활용
  legal_status text default 'simple_consent' check (
    legal_status in ('simple_consent', 'certified_identity', 'notarized')
  ),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (job_id, worker_id)
);

create index if not exists idx_contracts_job_id on public.contracts(job_id);
create index if not exists idx_contracts_worker_id on public.contracts(worker_id);
create index if not exists idx_contracts_employer_id on public.contracts(employer_id);

create trigger set_updated_at
  before update on public.contracts
  for each row execute function public.tg_set_updated_at();

comment on table public.contracts is '전자 근로계약서. 양측 전자서명 + 변조 방지 해시.';

-- ─────────────────────────────────────────────────────────────
-- 4. RLS — 계약서는 양측(사장님/워커)만 조회, 플랫폼만 수정
-- ─────────────────────────────────────────────────────────────
alter table public.contracts enable row level security;

create policy "계약 당사자만 조회"
  on public.contracts for select
  using (auth.uid() = employer_id or auth.uid() = worker_id);

create policy "계약 당사자만 생성"
  on public.contracts for insert
  with check (auth.uid() = employer_id or auth.uid() = worker_id);

-- 생성 후 수정 불가 (변조 방지). 서명 업데이트는 서버 측 service role만.
create policy "본인 서명만 업데이트"
  on public.contracts for update
  using (auth.uid() = employer_id or auth.uid() = worker_id);

-- Realtime publication에도 등록 (계약 체결 실시간 반영용)
alter publication supabase_realtime add table public.contracts;
alter table public.contracts replica identity full;
