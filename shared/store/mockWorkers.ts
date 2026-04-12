/**
 * 목(mock) 워커 프로필 풀.
 *
 * 사장님이 지원자 받을 때 자동으로 들어오는 가짜 경쟁자들.
 * 다양한 연령대, 별점, 경력을 보여줘 "선택의 경험"을 시뮬레이션.
 */

export interface MockWorkerProfile {
  id: string;
  name: string;
  age: number;
  rating: number;
  jobCount: number;
  categoryCount: Record<string, number>; // category -> count
  attendance: number;
  badges: string[];
  intro: string;
  recentReview?: string;
}

export const mockWorkerPool: MockWorkerProfile[] = [
  {
    id: 'worker_kim',
    name: '김영수',
    age: 67,
    rating: 4.8,
    jobCount: 47,
    categoryCount: { serving: 32, cafe: 8 },
    attendance: 0.98,
    badges: ['홀서빙 마스터', '정시 출근왕'],
    intro: '은퇴 후 식당에서 10년 경험. 손님 응대 자신 있어요.',
    recentReview: '시간 꼭 지키시고 일처리가 깔끔하세요. 또 부르고 싶어요.',
  },
  {
    id: 'worker_lee',
    name: '이미숙',
    age: 58,
    rating: 4.6,
    jobCount: 28,
    categoryCount: { kitchen: 15, cleaning: 10 },
    attendance: 0.95,
    badges: ['청소 전문가'],
    intro: '주방 보조, 청소 자신 있어요. 성실하게 일합니다.',
    recentReview: '꼼꼼하시고 밝으세요. 주방이 깨끗해졌어요.',
  },
  {
    id: 'worker_park',
    name: '박준혁',
    age: 34,
    rating: 4.3,
    jobCount: 12,
    categoryCount: { cafe: 8, convenience: 3 },
    attendance: 0.92,
    badges: [],
    intro: '퇴근 후 주말 세컨잡 중. 카페/편의점 경험 있습니다.',
    recentReview: '밝고 손님들한테 잘 응대해요.',
  },
  {
    id: 'worker_choi',
    name: '최순자',
    age: 62,
    rating: 4.9,
    jobCount: 63,
    categoryCount: { serving: 40, kitchen: 18 },
    attendance: 1.0,
    badges: ['홀서빙 마스터', '주방보조 숙련자', '정시 출근왕', '우수 일손'],
    intro: '분당에서만 5년, 식당 여러 곳에서 단골로 부름 받아요.',
    recentReview: '정말 든든해요. 우리 가게 성수기마다 모시고 있어요.',
  },
  {
    id: 'worker_jung',
    name: '정대호',
    age: 45,
    rating: 4.1,
    jobCount: 8,
    categoryCount: { logistics: 6 },
    attendance: 0.88,
    badges: [],
    intro: '체력 좋고 물류 경험 있어요. 당일 대타도 가능합니다.',
    recentReview: '힘 쓰는 일 잘하세요.',
  },
  {
    id: 'worker_han',
    name: '한지영',
    age: 29,
    rating: 4.5,
    jobCount: 15,
    categoryCount: { cafe: 12, event: 3 },
    attendance: 0.93,
    badges: ['카페 숙련자'],
    intro: '카페 바리스타 3년 경력. 주말/평일 오전 가능해요.',
    recentReview: '라떼아트도 잘 하시고 손님한테 친절해요.',
  },
];

/** 카테고리 관련성이 높은 워커를 우선 샘플링 */
export function sampleCompetitorWorkers(
  category: string,
  count: number,
  excludeIds: string[] = []
): MockWorkerProfile[] {
  const available = mockWorkerPool.filter((w) => !excludeIds.includes(w.id));

  // 해당 카테고리 경험 있는 사람이 먼저 오도록 정렬
  const sorted = [...available].sort((a, b) => {
    const aCount = a.categoryCount[category] ?? 0;
    const bCount = b.categoryCount[category] ?? 0;
    return bCount - aCount;
  });

  return sorted.slice(0, count);
}
