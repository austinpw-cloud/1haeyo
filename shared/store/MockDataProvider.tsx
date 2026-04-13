/**
 * 데이터 스토어.
 *
 * Phase 3C 진행 중:
 *   ✅ Jobs → Supabase
 *   ✅ Applications → Supabase
 *   ⏳ Matches/Reviews → 메모리 (Phase 3D에서 전환)
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  fetchAllJobs,
  insertJob,
  updateJobStatusDb,
} from '@/features/jobs/api/jobs.api';
import {
  expireOverdueApplicationsDb,
  fetchAllVisibleApplications,
  insertApplication,
  markApplicationsViewedDb,
  rejectOtherPendingForJob,
  updateApplicationStatusDb,
} from '@/features/matching/api/applications.api';
import { useAuth } from '@/shared/hooks';
import {
  Application,
  ApplicationStatus,
  Job,
  JobFormInput,
  JobStatus,
} from '@/shared/types';

export interface Review {
  id: string;
  jobId: string;
  from: 'worker' | 'employer';
  rating: number;
  comment?: string;
  createdAt: string;
}

interface DataContextValue {
  jobs: Job[];
  applications: Application[];
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

  markApplicantsViewed: (jobId: string) => Promise<void>;
  expireOverdueApplications: () => Promise<void>;

  // Lifecycle (아직 메모리)
  checkInJob: (jobId: string) => Promise<void>;
  checkOutJob: (jobId: string) => Promise<void>;
  submitReview: (input: {
    jobId: string;
    from: 'worker' | 'employer';
    rating: number;
    comment?: string;
  }) => void;
  getReview: (jobId: string, from: 'worker' | 'employer') => Review | undefined;
  startJob: (jobId: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // --- Jobs: Supabase ---

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
      // 조용히 실패 (로딩 UI는 아직 없음)
    }
  }, []);

  // 인증 완료 후 최초 로드
  useEffect(() => {
    if (!authLoading && user) {
      refreshJobs();
      refreshApplications();
    }
  }, [authLoading, user, refreshJobs, refreshApplications]);

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

  // --- Applications: Supabase ---

  const applyToJob = useCallback(
    async (jobId: string): Promise<Application | null> => {
      if (!user) return null;

      // 이미 지원했는지 로컬 체크 (unique 제약이 DB에도 있음)
      const existing = applications.find(
        (a) => a.jobId === jobId && a.workerId === user.id
      );
      if (existing) return null;

      const job = jobs.find((j) => j.id === jobId);
      if (!job) return null;

      try {
        const application = await insertApplication(user.id, jobId);
        setApplications((prev) => [application, ...prev]);

        // 일감 상태를 matching으로
        await updateJobStatusDb(jobId, 'matching').catch(() => {});
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId && j.status === 'open'
              ? { ...j, status: 'matching' }
              : j
          )
        );

        // Mode 1 즉시 확정
        if (job.matchingMode === 'instant') {
          setTimeout(async () => {
            await updateApplicationStatusDb(application.id, 'accepted').catch(
              () => {}
            );
            await updateJobStatusDb(jobId, 'confirmed').catch(() => {});
            setApplications((prev) =>
              prev.map((a) =>
                a.id === application.id
                  ? {
                      ...a,
                      status: 'accepted',
                      judgedAt: new Date().toISOString(),
                    }
                  : a
              )
            );
            setJobs((prev) =>
              prev.map((j) =>
                j.id === jobId ? { ...j, status: 'confirmed' } : j
              )
            );
          }, 800);
        }

        return application;
      } catch {
        return null;
      }
    },
    [user, applications, jobs]
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

      // 채용 시 같은 일감의 다른 pending 자동 거부
      if (status === 'accepted') {
        await rejectOtherPendingForJob(target.jobId, id);
      }

      // 로컬 state 업데이트
      setApplications((prev) => {
        const judgedAt = new Date().toISOString();
        return prev.map((a) => {
          if (a.id === id) return { ...a, status, judgedAt };
          if (
            status === 'accepted' &&
            a.jobId === target.jobId &&
            a.status === 'pending'
          ) {
            return { ...a, status: 'rejected' as const, judgedAt };
          }
          return a;
        });
      });

      // 채용 시 일감 confirmed로
      if (status === 'accepted') {
        await updateJobStatusDb(target.jobId, 'confirmed').catch(() => {});
        setJobs((prev) =>
          prev.map((j) =>
            j.id === target.jobId ? { ...j, status: 'confirmed' } : j
          )
        );
      }
    },
    [applications]
  );

  const markApplicantsViewed = useCallback(async (jobId: string) => {
    await markApplicationsViewedDb(jobId).catch(() => {});
    const deadline = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    setApplications((prev) =>
      prev.map((a) =>
        a.jobId === jobId && a.status === 'pending' && !a.judgeDeadline
          ? { ...a, judgeDeadline: deadline }
          : a
      )
    );
  }, []);

  const expireOverdueApplications = useCallback(async () => {
    await expireOverdueApplicationsDb().catch(() => {});
    const now = Date.now();
    setApplications((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (
          a.status === 'pending' &&
          a.judgeDeadline &&
          new Date(a.judgeDeadline).getTime() <= now
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

  // --- Lifecycle: 아직 메모리 (Phase 3D에서 전환) ---

  const checkInJob = useCallback(async (jobId: string) => {
    await updateJobStatusDb(jobId, 'in_progress').catch(() => {});
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && j.status === 'confirmed'
          ? { ...j, status: 'in_progress' }
          : j
      )
    );
  }, []);

  const checkOutJob = useCallback(async (jobId: string) => {
    await updateJobStatusDb(jobId, 'completed').catch(() => {});
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && j.status === 'in_progress'
          ? { ...j, status: 'completed' }
          : j
      )
    );
  }, []);

  const submitReview = useCallback(
    ({
      jobId,
      from,
      rating,
      comment,
    }: {
      jobId: string;
      from: 'worker' | 'employer';
      rating: number;
      comment?: string;
    }) => {
      setReviews((prev) => {
        const filtered = prev.filter(
          (r) => !(r.jobId === jobId && r.from === from)
        );
        return [
          ...filtered,
          {
            id: `review_${Date.now()}_${from}`,
            jobId,
            from,
            rating,
            comment,
            createdAt: new Date().toISOString(),
          },
        ];
      });
    },
    []
  );

  const getReview = useCallback(
    (jobId: string, from: 'worker' | 'employer') =>
      reviews.find((r) => r.jobId === jobId && r.from === from),
    [reviews]
  );

  const startJob = useCallback(async (jobId: string) => {
    await updateJobStatusDb(jobId, 'in_progress').catch(() => {});
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && j.status === 'confirmed'
          ? { ...j, status: 'in_progress' }
          : j
      )
    );
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      jobs,
      applications,
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
      markApplicantsViewed,
      expireOverdueApplications,
      checkInJob,
      checkOutJob,
      submitReview,
      getReview,
      startJob,
    }),
    [
      jobs,
      applications,
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
      markApplicantsViewed,
      expireOverdueApplications,
      checkInJob,
      checkOutJob,
      submitReview,
      getReview,
      startJob,
    ]
  );

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
