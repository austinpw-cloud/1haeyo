/**
 * MVP 목(mock) 데이터 스토어.
 *
 * Supabase 붙이기 전까지 앱 내 메모리에서 일감/지원을 관리한다.
 * 실제 DB 붙일 때는 여기 hooks를 react-query 기반으로 교체 예정.
 */

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Application,
  ApplicationStatus,
  Job,
  JobFormInput,
  JobStatus,
} from '@/shared/types';
import {
  MockWorkerProfile,
  sampleCompetitorWorkers,
} from './mockWorkers';
import { generateSeedApplications, generateSeedJobs } from './seed';

// 로그인 대신 MVP에서 쓰는 가짜 "현재 사용자" ID.
//
// 중요: 같은 사람이 두 역할을 모두 쓸 수 있어도, 역할이 다르면 서로 다른 정체성으로 취급한다.
// (사장님 모드에서 올린 일감을 일손 모드에서 볼 때는 "남의 일감"처럼 보여야 함)
export const MOCK_EMPLOYER_ID = 'employer-me';
export const MOCK_WORKER_ID = 'worker-me';
export const MOCK_CURRENT_WORKER_NAME = '테스트 일손';
export const MOCK_CURRENT_EMPLOYER_NAME = '테스트 가게';

/** 테스트 유저의 워커 프로필 (데모가 풍부해 보이도록) */
const MOCK_CURRENT_WORKER_PROFILE = {
  name: MOCK_CURRENT_WORKER_NAME,
  age: 62,
  rating: 4.7,
  jobCount: 34,
  attendance: 0.97,
  badges: ['홀서빙 마스터', '정시 출근왕'],
  intro: '은퇴 후 분당에서 여러 가게 단골 일손입니다.',
  recentReview: '항상 제시간에 오시고 손님한테 친절하세요.',
};

interface MockDataContextValue {
  jobs: Job[];
  applications: Application[];

  /** 새 일감 등록 (사장님 측) */
  createJob: (input: JobFormInput) => Job;
  /** 일감 상세 조회 */
  getJob: (id: string) => Job | undefined;
  /** 일감 상태 변경 */
  updateJobStatus: (id: string, status: JobStatus) => void;

  /** 일감에 지원 (일손 측) */
  applyToJob: (jobId: string) => Application | null;
  /** 특정 일감의 지원자들 */
  getApplicationsForJob: (jobId: string) => Application[];
  /** 내가 지원한 건들 */
  getMyApplications: () => Application[];
  /** 지원 상태 변경 (채용/거부) */
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;

  /**
   * 사장님이 판정 화면을 열었음을 알림.
   * 해당 일감의 pending 지원자들 중 아직 deadline 없는 건에
   * 10분 판정 마감 시각을 세팅한다.
   */
  markApplicantsViewed: (jobId: string) => void;
  /** 마감 초과한 pending 지원자 자동 expired 처리 */
  expireOverdueApplications: () => void;

  // --- 근무 라이프사이클 ---

  /** 일손 측: 현장 도착 → 체크인 */
  checkInJob: (jobId: string) => void;
  /** 양측: 근무 완료 → 체크아웃 */
  checkOutJob: (jobId: string) => void;
  /** 리뷰 저장 (양방향) */
  submitReview: (input: {
    jobId: string;
    from: 'worker' | 'employer';
    rating: number;
    comment?: string;
  }) => void;
  /** 특정 일감에 대한 리뷰 조회 */
  getReview: (
    jobId: string,
    from: 'worker' | 'employer'
  ) => Review | undefined;
  /** 일감 시작 시각 도달 시 in_progress로 (데모용 수동 트리거) */
  startJob: (jobId: string) => void;
}

export interface Review {
  id: string;
  jobId: string;
  from: 'worker' | 'employer';
  rating: number; // 1~5
  comment?: string;
  createdAt: string;
}

const MockDataContext = createContext<MockDataContextValue | null>(null);

/** 워커 프로필 → Application 필드 매핑 */
function profileToApplicationFields(
  profile: Pick<
    MockWorkerProfile,
    'name' | 'age' | 'rating' | 'jobCount' | 'attendance' | 'badges' | 'intro' | 'recentReview'
  > & { categoryCount?: Record<string, number> },
  category: string
) {
  return {
    workerName: profile.name,
    workerAge: profile.age,
    workerRating: profile.rating,
    workerJobCount: profile.jobCount,
    workerCategoryCount: profile.categoryCount?.[category] ?? 0,
    workerAttendance: profile.attendance,
    workerBadges: profile.badges,
    workerIntro: profile.intro,
    workerRecentReview: profile.recentReview,
  };
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(generateSeedJobs);
  const [applications, setApplications] = useState<Application[]>(
    generateSeedApplications
  );
  const [reviews, setReviews] = useState<Review[]>([]);

  const createJob = useCallback((input: JobFormInput): Job => {
    const now = new Date();
    const start = new Date(input.startAt);
    const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

    const job: Job = {
      id: `job_${Date.now()}`,
      employerId: MOCK_EMPLOYER_ID,
      employerName: MOCK_CURRENT_EMPLOYER_NAME,
      title: input.title,
      description: input.description,
      category: input.category,
      location: input.location,
      startAt: input.startAt,
      durationHours: input.durationHours,
      hourlyRate: input.hourlyRate,
      requiredCount: input.requiredCount,
      urgent: input.urgent,
      matchingMode: hoursUntilStart <= 3 ? 'instant' : 'scheduled',
      status: 'open',
      createdAt: now.toISOString(),
    };
    setJobs((prev) => [job, ...prev]);

    // Mode 2(예약 구인) 데모: 1~3초 후 자동 경쟁 지원자 2명 들어오게 함.
    // 사장님이 "선택의 경험"을 볼 수 있도록 시뮬레이션.
    if (job.matchingMode === 'scheduled') {
      const competitors = sampleCompetitorWorkers(job.category, 2);
      competitors.forEach((profile, idx) => {
        setTimeout(() => {
          const applyNow = new Date();
          const newApp: Application = {
            id: `app_auto_${job.id}_${profile.id}`,
            jobId: job.id,
            workerId: profile.id,
            ...profileToApplicationFields(profile, job.category),
            status: 'pending',
            appliedAt: applyNow.toISOString(),
          };
          setApplications((prev) => [newApp, ...prev]);
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id && j.status === 'open'
                ? { ...j, status: 'matching' }
                : j
            )
          );
        }, (idx + 1) * 1500);
      });
    }

    return job;
  }, []);

  const getJob = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs]
  );

  const updateJobStatus = useCallback(
    (id: string, status: JobStatus) => {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    },
    []
  );

  const applyToJob = useCallback(
    (jobId: string): Application | null => {
      // 이미 지원했는지 체크
      const existing = applications.find(
        (a) => a.jobId === jobId && a.workerId === MOCK_WORKER_ID
      );
      if (existing) {
        return null;
      }

      const job = jobs.find((j) => j.id === jobId);
      if (!job) {
        return null;
      }

      const now = new Date();
      const application: Application = {
        id: `app_${Date.now()}`,
        jobId,
        workerId: MOCK_WORKER_ID,
        ...profileToApplicationFields(
          { ...MOCK_CURRENT_WORKER_PROFILE, categoryCount: {} },
          job.category
        ),
        status: 'pending',
        appliedAt: now.toISOString(),
      };
      setApplications((prev) => [application, ...prev]);

      // 일감 상태를 matching으로 변경
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'matching' } : j))
      );

      // Mode 1 (즉시 호출): 자동으로 첫 지원자 확정
      if (job.matchingMode === 'instant') {
        setTimeout(() => {
          setApplications((prev) =>
            prev.map((a) =>
              a.id === application.id
                ? { ...a, status: 'accepted', judgedAt: new Date().toISOString() }
                : a
            )
          );
          setJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: 'confirmed' } : j))
          );
        }, 800);
      }

      return application;
    },
    [applications, jobs]
  );

  const getApplicationsForJob = useCallback(
    (jobId: string) =>
      applications.filter((a) => a.jobId === jobId),
    [applications]
  );

  const getMyApplications = useCallback(
    () =>
      applications.filter((a) => a.workerId === MOCK_WORKER_ID),
    [applications]
  );

  const updateApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus) => {
      setApplications((prev) => {
        const target = prev.find((a) => a.id === id);
        if (!target) return prev;

        const next = prev.map((a) => {
          if (a.id === id) {
            return { ...a, status, judgedAt: new Date().toISOString() };
          }
          // 같은 일감의 다른 pending 지원자는 거부 처리 (인원 1명 기준)
          if (
            status === 'accepted' &&
            a.jobId === target.jobId &&
            a.status === 'pending'
          ) {
            return { ...a, status: 'rejected' as const, judgedAt: new Date().toISOString() };
          }
          return a;
        });

        // 채용 확정 시 해당 일감 status를 confirmed로
        if (status === 'accepted') {
          setJobs((jobsPrev) =>
            jobsPrev.map((j) =>
              j.id === target.jobId ? { ...j, status: 'confirmed' } : j
            )
          );
        }

        return next;
      });
    },
    []
  );

  const markApplicantsViewed = useCallback((jobId: string) => {
    const deadline = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    setApplications((prev) =>
      prev.map((a) =>
        a.jobId === jobId && a.status === 'pending' && !a.judgeDeadline
          ? { ...a, judgeDeadline: deadline }
          : a
      )
    );
  }, []);

  const checkInJob = useCallback((jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && j.status === 'confirmed'
          ? { ...j, status: 'in_progress' }
          : j
      )
    );
  }, []);

  const checkOutJob = useCallback((jobId: string) => {
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
        // 같은 방향 중복 방지: 기존 게 있으면 덮어씀
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

  const startJob = useCallback((jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && j.status === 'confirmed'
          ? { ...j, status: 'in_progress' }
          : j
      )
    );
  }, []);

  const expireOverdueApplications = useCallback(() => {
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
          return { ...a, status: 'expired' as const, judgedAt: new Date().toISOString() };
        }
        return a;
      });
      return changed ? next : prev;
    });
  }, []);

  const value = useMemo<MockDataContextValue>(
    () => ({
      jobs,
      applications,
      createJob,
      getJob,
      updateJobStatus,
      applyToJob,
      getApplicationsForJob,
      getMyApplications,
      updateApplicationStatus,
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
      createJob,
      getJob,
      updateJobStatus,
      applyToJob,
      getApplicationsForJob,
      getMyApplications,
      updateApplicationStatus,
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
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) {
    throw new Error(
      'useMockData는 MockDataProvider 내부에서만 사용할 수 있습니다.'
    );
  }
  return ctx;
}
