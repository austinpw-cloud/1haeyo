# 일해요 (1haeyo)

> **원하면, 바로 일해요**
> 초단기 일자리 실시간 매칭 플랫폼. 시니어 친화.

## 프로젝트 개요

- **브랜드**: `1haeyo` = **일**해요(work) + **원**해요(want)
- **메인 타겟**: 55~70대 시니어 일손, 분당 지역 소상공인 사장님
- **포지션**: 일본 Timee의 한국판 + 시니어 친화 UX + 양방향 신뢰 시스템
- **초기 런칭**: 분당 미금역~야탑역 반경 2km

---

## 문서

### 사업
- [사업 기획서](docs/business-plan.md) — 시장, 경쟁, 수익모델, MVP
- [액션 플랜](docs/action-plan.md) — 지역 분석, 정산, 90일 실행 계획
- [GTM 플랜](docs/gtm-plan.md) — Surfaced 방법론 기반 채널 전략

### 제품/기술
- [매칭 시스템 설계](docs/matching-system.md) — 2가지 매칭 모드, 페널티, 평가
- [기술 아키텍처](docs/tech-architecture.md) — 스택, 모듈 구조, 스프린트
- [디자인 시스템](docs/design.md) — 컬러, 폰트, 컴포넌트, 시니어 UX 원칙
- [구현 진행 상황](docs/progress.md) — 스프린트별 완료/대기 현황

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 모바일 | Expo Managed Workflow + React Native + TypeScript |
| 백엔드/DB | Supabase (예정, 현재 목 데이터) |
| 인증 | 카카오 로그인 (예정) |
| 지도 | 네이버 지도 WebView (예정) |
| GPS | expo-location + Foreground Service (예정) |
| 결제 | PortOne + 토스페이먼츠 (예정) |
| OTA | EAS Update |

---

## 로컬 개발 시작

```bash
# 의존성 설치
npm install --legacy-peer-deps

# 개발 서버 시작
npx expo start

# 실기기: Expo Go 앱으로 QR 스캔
# (폰과 맥이 같은 WiFi여야 함)
```

## 폴더 구조

```
1haeyo/
├── app/                # Expo Router 화면
│   ├── (auth)/         # 로그인/역할 선택
│   ├── (worker)/       # 일손 탭 (주황 테마)
│   ├── (employer)/     # 사장님 탭 (녹색 테마)
│   └── job/[id].tsx    # 일감 상세 (동적 라우트)
│
├── features/           # 기능별 모듈
│   ├── matching/       # ApplicantCard
│   ├── review/         # ReviewModal
│   └── ...
│
├── shared/             # 공용 레이어
│   ├── ui/             # 디자인 토큰 + Button/Card/Input/Text 등
│   ├── hooks/          # useRole, useCountdown
│   ├── store/          # MockDataProvider (목 데이터)
│   ├── types/          # 공용 타입
│   └── utils/          # 포맷 유틸
│
├── native/             # 네이티브 플러그인 래퍼 (예정)
├── supabase/           # DB 스키마 + Edge Functions (예정)
├── assets/             # 폰트, 이미지
└── docs/               # 기획/설계 문서
```

---

## 현재 개발 상태 (2026-04-13)

- ✅ Sprint 0: 프로젝트 셋업 + 디자인 시스템 + 폴더 구조
- ✅ Sprint 1 (mock): 인증/라우팅 + 역할 분리 + 역할 전환
- ✅ Sprint 2 (mock): 일감 CRUD + 지원/채용/거부
- ✅ Sprint 3 (mock): 매칭 Mode 1/2 + 10분 판정 타이머
- ✅ Sprint 4 (mock): 근무 라이프사이클 + 양방향 리뷰
- ✅ **Phase 3A**: Supabase 연결 + 익명 인증
- ✅ **Phase 3B**: Jobs CRUD → Supabase
- ✅ **Phase 3C**: Applications → Supabase
- ⏳ Phase 3D: Matches + Reviews → Supabase
- ⏳ Phase 3E: Realtime 구독
- ⏳ Sprint 6: 카카오 로그인 실제 연동
- ⏳ Sprint 7: 지도 + GPS 실제 연동
- ⏳ Sprint 8: 결제/정산 (PortOne)
- ⏳ Sprint 9: Play Store 베타 릴리즈

상세 내용은 [docs/progress.md](docs/progress.md) 참조.

---

## 라이선스

Private. © 2026 Madeflo.
