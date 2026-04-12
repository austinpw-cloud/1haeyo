/**
 * MVP용 시드 데이터.
 * 앱 시작 시 홈 화면에 보여줄 샘플 일감들.
 */

import { Application, Job } from '@/shared/types';

function hoursFromNow(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

export function generateSeedJobs(): Job[] {
  return [
    {
      id: 'seed_1',
      employerId: 'employer_seed_1',
      employerName: '미금 칼국수',
      title: '점심 시간 홀서빙',
      description: '점심 피크 타임에 홀서빙 도와주실 분을 찾고 있어요.',
      category: 'serving',
      location: '미금역 OO식당',
      distance: '1.2km',
      startAt: hoursFromNow(2),
      durationHours: 2,
      hourlyRate: 15000,
      requiredCount: 1,
      urgent: true,
      matchingMode: 'instant',
      status: 'open',
      createdAt: hoursFromNow(-1),
    },
    {
      id: 'seed_2',
      employerId: 'employer_seed_2',
      employerName: '야탑 스타벅스',
      title: '카페 오픈 보조',
      description: '아침에 오픈 준비와 커피 추출 보조를 도와주세요.',
      category: 'cafe',
      location: '야탑역 스타벅스',
      distance: '800m',
      startAt: hoursFromNow(18),
      durationHours: 3,
      hourlyRate: 15000,
      requiredCount: 1,
      urgent: false,
      matchingMode: 'scheduled',
      status: 'open',
      createdAt: hoursFromNow(-3),
    },
    {
      id: 'seed_3',
      employerId: 'employer_seed_3',
      employerName: '서현 물류센터',
      title: '택배 분류 작업',
      description: '오후 시간 택배 분류 작업입니다. 간단한 체력 일이에요.',
      category: 'logistics',
      location: '서현역 근처',
      distance: '2.5km',
      startAt: hoursFromNow(30),
      durationHours: 4,
      hourlyRate: 12000,
      requiredCount: 2,
      urgent: false,
      matchingMode: 'scheduled',
      status: 'open',
      createdAt: hoursFromNow(-5),
    },
  ];
}

export function generateSeedApplications(): Application[] {
  return [];
}
