/**
 * 근로계약서 DB 액세스.
 *
 * 사장님 서명(일감 등록 시) + 워커 서명(지원 시) 결합 → 매칭 확정 순간 계약 체결.
 * 변조 방지 해시 포함.
 */

import { supabase } from '@/shared/api';

export interface ContractBody {
  employer_name: string;
  worker_name: string;
  job_id: string;
  job_title: string;
  location: string;
  start_at: string;
  duration_hours: number;
  hourly_rate: number;
  worker_pay: number;
  platform_fee: number;
  pg_fee: number;
  total_amount: number;
  created_at: string;
}

export interface Contract {
  id: string;
  jobId: string;
  employerId: string;
  workerId: string;
  employerSignedAt: string;
  workerSignedAt?: string;
  contractBody: ContractBody;
  contentHash: string;
  legalStatus: 'simple_consent' | 'certified_identity' | 'notarized';
  createdAt: string;
}

interface ContractRow {
  id: string;
  job_id: string;
  employer_id: string;
  worker_id: string;
  employer_signed_at: string;
  worker_signed_at: string | null;
  contract_body: ContractBody;
  content_hash: string;
  legal_status: 'simple_consent' | 'certified_identity' | 'notarized';
  created_at: string;
}

function rowToContract(row: ContractRow): Contract {
  return {
    id: row.id,
    jobId: row.job_id,
    employerId: row.employer_id,
    workerId: row.worker_id,
    employerSignedAt: row.employer_signed_at,
    workerSignedAt: row.worker_signed_at ?? undefined,
    contractBody: row.contract_body,
    contentHash: row.content_hash,
    legalStatus: row.legal_status,
    createdAt: row.created_at,
  };
}

/**
 * 간단한 해시 생성 (MVP — crypto 모듈 없이 결정론적 해시).
 * 실제 법적 제출 시에는 SHA-256 + 서버 타임스탬프 필요.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function buildContentHash(
  body: ContractBody,
  employerSignedAt: string,
  workerSignedAt?: string
): string {
  const payload = JSON.stringify({ body, employerSignedAt, workerSignedAt });
  return simpleHash(payload);
}

export async function insertContract(input: {
  jobId: string;
  employerId: string;
  workerId: string;
  contractBody: ContractBody;
}): Promise<Contract | null> {
  const now = new Date().toISOString();
  const hash = buildContentHash(input.contractBody, now, now);
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      job_id: input.jobId,
      employer_id: input.employerId,
      worker_id: input.workerId,
      employer_signed_at: now,
      worker_signed_at: now,
      contract_body: input.contractBody,
      content_hash: hash,
      legal_status: 'simple_consent',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return null; // 이미 존재
    throw error;
  }
  return rowToContract(data as ContractRow);
}

export async function fetchContractByJobWorker(
  jobId: string,
  workerId: string
): Promise<Contract | null> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('job_id', jobId)
    .eq('worker_id', workerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToContract(data as ContractRow);
}

export async function fetchMyContracts(
  userId: string
): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .or(`employer_id.eq.${userId},worker_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ContractRow[]).map(rowToContract);
}
