# 구현 진행 상황

> 스프린트별 완료/대기 현황 트래킹.
> 전체 기술 설계는 [tech-architecture.md](tech-architecture.md), 매칭 플로우는 [matching-system.md](matching-system.md) 참조.

최종 업데이트: 2026-04-13

---

## 전체 진행률

```
기반 레이어     ████████████████████  100%
UI/기능 레이어  ████████████████████  100% (목 데이터로 검증 완료)
백엔드 연동     █████████████░░░░░░░   65% (Jobs/Applications DB화 완료)
외부 통합       ░░░░░░░░░░░░░░░░░░░░    0% (카카오/지도/결제)
릴리즈 준비     ░░░░░░░░░░░░░░░░░░░░    0%
```

---

## Sprint 0 — 프로젝트 셋업 ✅ 완료

- Expo SDK 54 + TypeScript
- 모듈화 폴더 구조 (features, shared, native, supabase)
- TypeScript strict + 절대 경로 import (`@/shared/*`)
- 디자인 토큰 (컬러/타이포/간격/그림자)
- Pretendard 폰트 통합
- Lucide 아이콘
- 공용 컴포넌트 (Button, Card, Input, Text, ScreenHeader, StarRating, RoleSwitcher)
- Git 저장소 + GitHub Private Repo

---

## Sprint 1 (mock) — 인증/라우팅 ✅ 완료

- Expo Router + 라우팅 구조
- 로그인 화면 (카카오 버튼 UI)
- 역할 선택 화면 (일손 / 사장님)
- 일손/사장님 탭 그룹 (주황/녹색 테마)
- RoleSwitcher (역할 전환 토글)
- RoleProvider (React Context)

---

## Sprint 2 (mock) — 일감 CRUD ✅ 완료

- MockDataProvider (메모리 스토어)
- 일감 등록 폼
- 리스트 + 상세 화면
- 상태 전환 API

---

## Sprint 3 (mock) — 매칭 시스템 ✅ 완료

- Mode 1 (즉시 호출) 자동 확정
- Mode 2 (예약 구인) 판정 기반
- 자동 경쟁자 시뮬레이션 (~~Phase 3C에서 제거됨~~)
- 10분 판정 타이머 (사장님 화면 진입 기준)
- 자동 만료 처리
- 풍부한 지원자 카드

---

## Sprint 4 (mock) — 근무 라이프사이클 ✅ 완료

- confirmed → in_progress → completed
- 체크인/체크아웃
- 양방향 리뷰 모달
- StarRating 컴포넌트

---

## Phase 3A — Supabase 인증 ✅ 완료 (2026-04-13)

- Supabase 프로젝트 생성 (Seoul region)
- Project URL + publishable key → `.env` (gitignored)
- `@supabase/supabase-js` + `@react-native-async-storage/async-storage` 설치
- `shared/api/supabase.ts` 클라이언트
- AsyncStorage로 세션 영속화
- **Anonymous Sign-Ins** 활성화 (Manual linking도 ON)
- `shared/hooks/useAuth.tsx` — AuthProvider + useAuth
- 앱 시작 시 자동 익명 로그인
- SupabaseStatusBadge 디버그 배지 (`sprint 6`에서 제거 예정)

**확인**:
- `auth.users` 테이블에 `is_anonymous=true` 유저 생성
- `public.profiles` 테이블에 트리거로 자동 프로필 생성

---

## Phase 3B — Jobs → Supabase ✅ 완료 (2026-04-13)

- DB 스키마 전체 마이그레이션 실행 (5 테이블 + RLS)
- `features/jobs/api/jobs.api.ts` — Supabase 쿼리 래핑
- `fetchAllJobs`, `fetchJobById`, `insertJob`, `updateJobStatusDb`
- MockDataProvider 내부에서 Jobs 관련 메서드만 Supabase로 전환
- createJob → async, 호출부 await 적용
- employer_id 필터링을 MOCK_EMPLOYER_ID → user.id로 교체
- 자동 경쟁자 시뮬레이션 제거 (실 DB라 불필요)

**확인**:
- 일감 등록 시 Supabase jobs 테이블에 저장
- 앱 재시작해도 유지
- 양쪽 역할에서 조회 가능

---

## Phase 3C — Applications → Supabase ✅ 완료 (2026-04-13)

- `features/matching/api/applications.api.ts`
  - `fetchApplicationsByJobId`, `fetchMyApplications`, `fetchAllVisibleApplications`
  - `insertApplication` (프로필 스냅샷 포함)
  - `updateApplicationStatusDb`, `markApplicationsViewedDb`
  - `expireOverdueApplicationsDb`, `rejectOtherPendingForJob`
- MockDataProvider의 Applications 메서드 전환
- applyToJob → async, 호출부 await 적용
- Mode 1/2 매칭 로직은 유지 (클라이언트 사이드)
- 채용 시 같은 일감의 다른 pending들 자동 거부 (DB에서)

**확인**:
- 지원 시 Supabase applications 테이블에 row 생성
- 앱 재시작해도 내 지원 이력 유지
- RLS로 본인 + 일감 주인만 조회 가능

---

## Phase 3D — Matches + Reviews → Supabase ⏳ 다음 진행

| 항목 | 비고 |
|---|---|
| `features/matching/api/matches.api.ts` | 체크인/아웃, 취소 사유 등 |
| `features/review/api/reviews.api.ts` | 양방향 리뷰 저장/조회 |
| matches 테이블은 이미 DB에 있음 | 스키마 완성됨 |
| reviews 테이블은 이미 DB에 있음 | 스키마 완성됨 |
| MockDataProvider의 리뷰 state 제거 | 모두 DB로 |
| 일감 완료 시 match 레코드 생성 로직 추가 | application_id와 연결 |

---

## Phase 3E — Realtime 구독 ⏳ 대기

- Supabase Realtime 채널
- 새 지원자 들어올 때 사장님 화면 즉시 갱신
- 지원 상태 변경 시 일손 화면 즉시 갱신
- 워커 위치 스트리밍 (Sprint 7에서 GPS와 연동)

---

## Sprint 6 — 카카오 로그인 실연동 ⏳ 대기

- 카카오 개발자 앱 등록
- `react-native-kakao` 설정
- 익명 계정 → 카카오 계정 linking (manual linking 활용)
- 기존 데이터 유지하며 업그레이드
- SupabaseStatusBadge 제거

---

## Sprint 7 — 지도 + GPS ⏳ 대기

> 설계: 1~3단계는 독립적, 4단계는 Supabase Realtime 필요.

- 1단계: 네이버 지도 WebView + 내 위치
- 2단계: 일감 등록 시 주소 선택 + 좌표 저장
- 3단계: 거리 기반 필터 + 체크인 검증
- 4단계: 백그라운드 GPS + 실시간 추적 (Foreground Service)

---

## Sprint 8 — 결제/정산 ⏳ 대기

- PortOne + 토스페이먼츠
- 에스크로 결제
- 자동 정산
- 휴업수당 계산

---

## Sprint 9 — 릴리즈 준비 ⏳ 대기

- 아이콘 + 스플래시
- 개인정보 처리방침
- Play Store 내부 테스트

---

## 현재 남은 기술 부채

| 항목 | 메모 |
|---|---|
| MockDataProvider 이름 | Phase 3D 이후 DataProvider로 리네임 예정 |
| MOCK_EMPLOYER_ID / MOCK_WORKER_ID export | 더 이상 사용 안 하지만 호환성 위해 남아있음. 정리 필요 |
| SupabaseStatusBadge (프로필 화면) | Sprint 6 카카오 로그인 후 제거 |
| 자동 경쟁자 시뮬레이션 | 제거됨. 다중 유저 테스트는 2기기 or 2계정 필요 |
| Reviews 데이터 in-memory | Phase 3D에서 DB로 |
| 일감 생성 시 matching_mode 계산 | 클라이언트 사이드에서 결정됨. DB 트리거로 이동 고려 |

---

## Supabase 환경

- **Project URL**: `https://nbjpivywvpvmwsltscai.supabase.co`
- **Project Ref**: `nbjpivywvpvmwsltscai`
- **Region**: Northeast Asia (Seoul)
- **Key 타입**: Publishable key (신규 형식)
- **키 저장**: `.env` (gitignored), `EXPO_PUBLIC_` 접두사로 클라이언트 노출
- **DB 테이블**: `profiles`, `jobs`, `applications`, `matches`, `reviews` (모두 RLS 활성)
- **Auth**: Anonymous Sign-ins 활성화, Manual linking 활성화
- **스키마 SQL 원본**: `supabase/schema/_all.sql`

---

## 의사결정 기록

### 최근 결정 (Phase 3)

- **익명 로그인으로 시작** — 카카오 로그인은 Sprint 6. 지금은 기능 테스트 우선.
- **Mock state + Supabase 혼용 기간 허용** — 한 번에 다 바꾸지 않고 단계적 전환
- **RLS는 켜서 시작** — 마이그레이션 하면서 보안 구멍 안 만드는 게 나중이 편함
- **자동 경쟁자 제거** — 실 DB에선 가짜 user_id 만들기 어려움. Mock 유지하면 혼란만 가중

### 지속되는 원칙

- 단일 앱 + 역할 전환 (일손 / 사장님)
- 네이티브 앱 (PWA X)
- 표현은 한국어 UI / 영어 코드
- 10분 판정 타이머는 사장님 화면 진입 기준
- 시니어 친화 (18pt+, 48dp+, 푸른색 최소)

---

## 다음 할 일

1. Phase 3D: Matches + Reviews → Supabase
2. Phase 3E: Realtime 구독
3. 지도 1~3단계 (Sprint 7 일부)
4. Supabase 인프라 최적화 (인덱스, 함수)
5. 카카오 로그인 (Sprint 6)
