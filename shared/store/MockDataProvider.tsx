/**
 * 데이터 스토어.
 *
 * Phase 3D 기준:
 *   ✅ Jobs → Supabase
 *   ✅ Applications → Supabase
 *   ✅ Matches → Supabase
 *   ✅ Reviews → Supabase
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/shared/api';
import {
  expireOverdueJobsDb,
  fetchAllJobs,
  insertJob,
  updateJobStatusDb,
} from '@/features/jobs/api/jobs.api';
import {
  expireOverdueApplicationsDb,
  fetchAllVisibleApplications,
  insertApplication,
  rejectOtherPendingForJob,
  updateApplicationStatusDb,
} from '@/features/matching/api/applications.api';
import {
  checkInMatch,
  checkOutMatch,
  fetchAllVisibleMatches,
  insertMatch,
  Match,
  updatePaymentStatus,
} from '@/features/matching/api/matches.api';
import {
  fetchAllReviews,
  insertReview,
  Review,
  ReviewFrom,
} from '@/features/review/api/reviews.api';
import {
  ContractBody,
  fetchMyContracts,
  insertContract,
  Contract,
} from '@/features/contract';
import { calculateJobPricing } from '@/shared/utils';
import { useAuth } from '@/shared/hooks';
import {
  Application,
  ApplicationStatus,
  Job,
  JobFormInput,
  JobStatus,
} from '@/shared/types';

interface DataContextValue {
  jobs: Job[];
  applications: Application[];
  matches: Match[];
  reviews: Review[];
  contracts: Contract[];
  jobsLoading: boolean;
  jobsError: string | null;

  // Jobs
  createJob: (input: JobFormInput) => Promise<Job>;
  getJob: (id: string) => Job | undefined;
  updateJobStatus: (id: string, status: JobStatus) => Promise<void>;
  refreshJobs: () => Promise<void>;

  // Applications
  applyToJob: (jobId: string) => Promise<Application | null>;
  getApplicationsForJob: (jobId: string) => Application[];
  getMyApplications: () => Application[];
  updateApplicationStatus: (
    id: string,
    status: ApplicationStatus
  ) => Promise<void>;
  refreshApplications: () => Promise<void>;

  /** 마감 초과 지원 + 시작 시간 지난 공고를 일괄 청소. 주기 호출 가능. */
  sweepExpired: () => Promise<void>;

  // Lifecycle (Supabase)
  checkInJob: (jobId: string) => Promise<void>;
  checkOutJob: (jobId: string) => Promise<void>;
  startJob: (jobId: string) => Promise<void>;

  // Reviews (Supabase)
  submitReview: (input: {
    jobId: string;
    from: ReviewFrom;
    rating: number;
    comment?: string;
  }) => Promise<void>;
  getReview: (jobId: string, from: ReviewFrom) => Review | undefined;
}

const DataContext = createContext<DataContextValue | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  // sweepExpired가 매번 새로 만들어지기 때문에 interval에 직접 넣지 않고 ref로
  const sweepExpiredRef = useRef<(() => Promise<void>) | null>(null);

  // --- Jobs ---

  const refreshJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const data = await fetchAllJobs();
      setJobs(data);
    } catch (e) {
      setJobsError(e instanceof Error ? e.message : '일감 조회 실패');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const refreshApplications = useCallback(async () => {
    try {
      const data = await fetchAllVisibleApplications();
      setApplications(data);
    } catch {
      // 조용히 실패
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    try {
      const data = await fetchAllVisibleMatches();
      setMatches(data);
    } catch {
      // 조용히 실패
    }
  }, []);

  const refreshReviews = useCallback(async () => {
    try {
      const data = await fetchAllReviews();
      setReviews(data);
    } catch {
      // 조용히 실패
    }
  }, []);

  const refreshContracts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchMyContracts(user.id);
      setContracts(data);
    } catch {
      // 조용히 실패
    }
  }, [user]);

  // 인증 완료 후 최초 로드
  useEffect(() => {
    if (!authLoading && user) {
      refreshJobs();
      refreshApplications();
      refreshMatches();
      refreshReviews();
      refreshContracts();
    }
  }, [
    authLoading,
    user,
    refreshJobs,
    refreshApplications,
    refreshMatches,
    refreshReviews,
    refreshContracts,
  ]);

  // 전역 주기 sweep — 앱 열려있는 동안 15초마다 만료 처리
  useEffect(() => {
    if (authLoading || !user) return;
    const tick = () => {
      sweepExpiredRef.current?.();
    };
    tick(); // 바로 한 번
    const interval = setInterval(tick, 15_000);
    return () => clearInterval(interval);
  }, [authLoading, user]);

  /*
   * Realtime 구독.
   * 4개 테이블의 모든 변경(INSERT/UPDATE/DELETE)을 감지해 refresh.
   * RLS가 적용되므로 권한 있는 row의 변경만 수신.
   * 중복 이벤트를 막기 위해 debounce 300ms.
   */
  useEffect(() => {
    if (authLoading || !user) return;

    const schedule = (fn: () => Promise<void>) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          fn().catch(() => {});
        }, 300);
      };
    };

    const onJobsChange = schedule(refreshJobs);
    const onApplicationsChange = schedule(refreshApplications);
    const onMatchesChange = schedule(refreshMatches);
    const onReviewsChange = schedule(refreshReviews);
    const onContractsChange = schedule(refreshContracts);

    const channel = supabase
      .channel(`data_sync_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('[RT jobs]', payload.eventType, (payload.new as { id?: string })?.id);
          onJobsChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        (payload) => {
          console.log('[RT applications]', payload.eventType);
          onApplicationsChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('[RT matches]', payload.eventType);
          onMatchesChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        (payload) => {
          console.log('[RT reviews]', payload.eventType);
          onReviewsChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contracts' },
        (payload) => {
          console.log('[RT contracts]', payload.eventType);
          onContractsChange();
        }
      )
      .subscribe((status, err) => {
        console.log('[RT status]', status, err?.message ?? '');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    authLoading,
    user,
    refreshJobs,
    refreshApplications,
    refreshMatches,
    refreshReviews,
    refreshContracts,
  ]);

  const createJob = useCallback(
    async (input: JobFormInput): Promise<Job> => {
      if (!user) throw new Error('로그인 필요');
      const job = await insertJob(user.id, input);
      setJobs((prev) => [job, ...prev]);
      return job;
    },
    [user]
  );

  const getJob = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs]
  );

  const updateJobStatus = useCallback(
    async (id: string, status: JobStatus) => {
      await updateJobStatusDb(id, status);
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    },
    []
  );

  // --- Applications ---

  /** accept된 application에 대해 match를 보장 (있으면 재활용) */
  const ensureMatch = useCallback(
    async (application: Application): Promise<Match | null> => {
      try {
        const match = await insertMatch({
          jobId: application.jobId,
          workerId: application.workerId,
          applicationId: application.id,
        });
        setMatches((prev) => {
          const exists = prev.find((m) => m.id === match.id);
          return exists ? prev : [match, ...prev];
        });
        return match;
      } catch {
        return null;
      }
    },
    []
  );

  /**
   * 매칭 확정 시 근로계약서 자동 생성 (멱등).
   * 양측 서명 = 사장님 일감 등록 시 체크 + 워커 지원 시 체크.
   */
  const ensureContract = useCallback(
    async (application: Application, job: Job): Promise<Contract | null> => {
      try {
        const pricing = calculateJobPricing(
          job.hourlyRate,
          job.durationHours
        );
        const body: ContractBody = {
          employer_name: job.employerName,
          worker_name: application.workerName,
          job_id: job.id,
          job_title: job.title,
          location: job.location,
          start_at: job.startAt,
          duration_hours: job.durationHours,
          hourly_rate: job.hourlyRate,
          worker_pay: pricing.workerPay,
          platform_fee: pricing.platformFee,
          pg_fee: pricing.pgFee,
          total_amount: pricing.total,
          created_at: new Date().toISOString(),
        };
        const contract = await insertContract({
          jobId: job.id,
          employerId: job.employerId,
          workerId: application.workerId,
          contractBody: body,
        });
        if (contract) {
          setContracts((prev) => {
            if (prev.find((c) => c.id === contract.id)) return prev;
            return [contract, ...prev];
          });
        }
        return contract;
      } catch {
        return null;
      }
    },
    []
  );

  const applyToJob = useCallback(
    async (jobId: string): Promise<Application | null> => {
      if (!user) return null;

      const existing = applications.find(
        (a) => a.jobId === jobId && a.workerId === user.id
      );
      if (existing) return null;

      const job = jobs.find((j) => j.id === jobId);
      if (!job) return null;

      try {
        const application = await insertApplication(user.id, jobId);
        setApplications((prev) => [application, ...prev]);

        await updateJobStatusDb(jobId, 'matching').catch(() => {});
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId && j.status === 'open'
              ? { ...j, status: 'matching' }
              : j
          )
        );

        // Mode 1: 즉시 확정 — 단 필요 인원 대비 현재 accepted 수 체크해서
        //   아직 미달이면 job은 matching 유지 (다른 지원자도 자동 확정 대기)
        if (job.matchingMode === 'instant') {
          setTimeout(async () => {
            await updateApplicationStatusDb(application.id, 'accepted').catch(
              () => {}
            );
            const accepted: Application = {
              ...application,
              status: 'accepted',
              judgedAt: new Date().toISOString(),
            };
            setApplications((prev) =>
              prev.map((a) => (a.id === application.id ? accepted : a))
            );

            // 이 지원 포함 accepted 수 계산 (refs 최신 state 근사: 방금 insert된 application만 추가됨)
            const currentlyAccepted = applications.filter(
              (a) => a.jobId === jobId && a.status === 'accepted'
            ).length + 1;
            const isFull = currentlyAccepted >= (job.requiredCount ?? 1);

            if (isFull) {
              await updateJobStatusDb(jobId, 'confirmed').catch(() => {});
              setJobs((prev) =>
                prev.map((j) =>
                  j.id === jobId ? { ...j, status: 'confirmed' } : j
                )
              );
            }
            await ensureMatch(accepted);
            await ensureContract(accepted, job);
          }, 800);
        }

        return application;
      } catch {
        return null;
      }
    },
    [user, applications, jobs, ensureMatch, ensureContract]
  );

  const getApplicationsForJob = useCallback(
    (jobId: string) => applications.filter((a) => a.jobId === jobId),
    [applications]
  );

  const getMyApplications = useCallback(
    () =>
      user
        ? applications.filter((a) => a.workerId === user.id)
        : [],
    [applications, user]
  );

  const updateApplicationStatus = useCallback(
    async (id: string, status: ApplicationStatus) => {
      const target = applications.find((a) => a.id === id);
      if (!target) return;

      await updateApplicationStatusDb(id, status);

      const judgedAt = new Date().toISOString();
      const updatedTarget: Application = { ...target, status, judgedAt };

      // 채용 시 필요 인원 대비 현재 accepted 수 체크
      const job = jobs.find((j) => j.id === target.jobId);
      const requiredCount = job?.requiredCount ?? 1;
      const currentlyAccepted = applications.filter(
        (a) => a.jobId === target.jobId && a.status === 'accepted'
      ).length;
      const newAcceptedCount =
        status === 'accepted' ? currentlyAccepted + 1 : currentlyAccepted;
      const isFullyFilled = newAcceptedCount >= requiredCount;

      // 인원 다 찼을 때만 남은 pending 자동 거부 + 공고 confirmed
      if (status === 'accepted' && isFullyFilled) {
        await rejectOtherPendingForJob(target.jobId, id);
      }

      setApplications((prev) =>
        prev.map((a) => {
          if (a.id === id) return updatedTarget;
          if (
            status === 'accepted' &&
            isFullyFilled &&
            a.jobId === target.jobId &&
            a.status === 'pending'
          ) {
            return { ...a, status: 'rejected' as const, judgedAt };
          }
          return a;
        })
      );

      if (status === 'accepted') {
        if (isFullyFilled) {
          // 인원 충족 → 공고 confirmed
          await updateJobStatusDb(target.jobId, 'confirmed').catch(() => {});
          setJobs((prev) =>
            prev.map((j) =>
              j.id === target.jobId ? { ...j, status: 'confirmed' } : j
            )
          );
        }
        // 미달이면 공고는 matching 유지 — 나머지 지원자 대기
        await ensureMatch(updatedTarget);
        if (job) await ensureContract(updatedTarget, job);
      }
    },
    [applications, jobs, ensureMatch, ensureContract]
  );

  /**
   * 주기 sweep — 두 가지 일괄 정리:
   *  1) judge_deadline 지난 pending 지원자 → expired
   *  2) start_at 지난 open/matching 공고 → cancelled
   * 사장님/일손 상관없이 앱이 열려있으면 계속 돈다.
   */
  const sweepExpired = useCallback(async () => {
    await Promise.all([
      expireOverdueApplicationsDb().catch(() => {}),
      expireOverdueJobsDb().catch(() => {}),
    ]);
    const now = Date.now();
    const expiredJobIds = new Set<string>();
    setJobs((prev) => {
      let changed = false;
      const next = prev.map((j) => {
        if (
          (j.status === 'open' || j.status === 'matching') &&
          new Date(j.startAt).getTime() <= now
        ) {
          changed = true;
          expiredJobIds.add(j.id);
          return { ...j, status: 'cancelled' as const };
        }
        return j;
      });
      return changed ? next : prev;
    });
    setApplications((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (
          a.status === 'pending' &&
          (expiredJobIds.has(a.jobId) ||
            (a.judgeDeadline &&
              new Date(a.judgeDeadline).getTime() <= now))
        ) {
          changed = true;
          return {
            ...a,
            status: 'expired' as const,
            judgedAt: new Date().toISOString(),
          };
        }
        return a;
      });
      return changed ? next : prev;
    });
  }, []);

  // --- Lifecycle ---

  /** 해당 job의 match를 확보 (없으면 accepted application으로부터 생성) */
  const getOrCreateMatchForJob = useCallback(
    async (jobId: string): Promise<Match | null> => {
      const existing = matches.find((m) => m.jobId === jobId);
      if (existing) return existing;

      const accepted = applications.find(
        (a) => a.jobId === jobId && a.status === 'accepted'
      );
      if (!accepted) return null;

      return ensureMatch(accepted);
    },
    [matches, applications, ensureMatch]
  );

  const checkInJob = useCallback(
    async (jobId: string) => {
      const match = await getOrCreateMatchForJob(jobId);
      if (match) {
        await checkInMatch(match.id).catch(() => {});
        const checkedInAt = new Date().toISOString();
        setMatches((prev) =>
          prev.map((m) =>
            m.id === match.id ? { ...m, checkedInAt } : m
          )
        );
      }
      await updateJobStatusDb(jobId, 'in_progress').catch(() => {});
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId && j.status === 'confirmed'
            ? { ...j, status: 'in_progress' }
            : j
        )
      );
    },
    [getOrCreateMatchForJob]
  );

  const checkOutJob = useCallback(
    async (jobId: string) => {
      const match = await getOrCreateMatchForJob(jobId);
      if (match) {
        await checkOutMatch(match.id).catch(() => {});
        // Mock 즉시 송금: payment_status를 settled로 전환
        await updatePaymentStatus(match.id, 'settled').catch(() => {});
        const checkedOutAt = new Date().toISOString();
        setMatches((prev) =>
          prev.map((m) =>
            m.id === match.id
              ? { ...m, checkedOutAt, paymentStatus: 'settled' }
              : m
          )
        );
      }
      await updateJobStatusDb(jobId, 'completed').catch(() => {});
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId && j.status === 'in_progress'
            ? { ...j, status: 'completed' }
            : j
        )
      );
    },
    [getOrCreateMatchForJob]
  );

  // legacy alias — confirmed → in_progress 전이
  const startJob = checkInJob;

  // --- Reviews ---

  const submitReview = useCallback(
    async ({
      jobId,
      from,
      rating,
      comment,
    }: {
      jobId: string;
      from: ReviewFrom;
      rating: number;
      comment?: string;
    }) => {
      if (!user) return;

      const match = await getOrCreateMatchForJob(jobId);
      if (!match) return;

      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;

      const reviewerId = user.id;
      const revieweeId =
        from === 'worker' ? job.employerId : match.workerId;

      const saved = await insertReview({
        matchId: match.id,
        jobId,
        from,
        reviewerId,
        revieweeId,
        rating,
        comment,
      }).catch(() => null);

      if (saved) {
        setReviews((prev) => {
          const filtered = prev.filter(
            (r) => !(r.matchId === match.id && r.from === from)
          );
          return [saved, ...filtered];
        });
      }
    },
    [user, jobs, getOrCreateMatchForJob]
  );

  const getReview = useCallback(
    (jobId: string, from: ReviewFrom) =>
      reviews.find((r) => r.jobId === jobId && r.from === from),
    [reviews]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      jobs,
      applications,
      matches,
      reviews,
      contracts,
      jobsLoading,
      jobsError,
      createJob,
      getJob,
      updateJobStatus,
      refreshJobs,
      applyToJob,
      getApplicationsForJob,
      getMyApplications,
      updateApplicationStatus,
      refreshApplications,
      sweepExpired,
      checkInJob,
      checkOutJob,
      submitReview,
      getReview,
      startJob,
    }),
    [
      jobs,
      applications,
      matches,
      reviews,
      contracts,
      jobsLoading,
      jobsError,
      createJob,
      getJob,
      updateJobStatus,
      refreshJobs,
      applyToJob,
      getApplicationsForJob,
      getMyApplications,
      updateApplicationStatus,
      refreshApplications,
      sweepExpired,
      checkInJob,
      checkOutJob,
      submitReview,
      getReview,
      startJob,
    ]
  );

  // ref 동기화
  useEffect(() => {
    sweepExpiredRef.current = sweepExpired;
  }, [sweepExpired]);

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export function useMockData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error(
      'useMockData는 MockDataProvider 내부에서만 사용할 수 있습니다.'
    );
  }
  return ctx;
}
