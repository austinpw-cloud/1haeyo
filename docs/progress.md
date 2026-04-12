# 구현 진행 상황

> 스프린트별 완료/대기 현황 트래킹.
> 전체 기술 설계는 [tech-architecture.md](tech-architecture.md), 매칭 플로우는 [matching-system.md](matching-system.md) 참조.

최종 업데이트: 2026-04-12

---

## 전체 진행률 (MVP 기준)

```
기반 레이어     ████████████████████  100%
기능 레이어     ████████████░░░░░░░░   60% (목 데이터 기준)
백엔드 연동     ░░░░░░░░░░░░░░░░░░░░    0% (Supabase 대기)
외부 통합       ░░░░░░░░░░░░░░░░░░░░    0% (카카오/지도/결제)
릴리즈 준비     ░░░░░░░░░░░░░░░░░░░░    0%
```

---

## Sprint 0 — 프로젝트 셋업 ✅ 완료

| 항목 | 상태 |
|---|---|
| Expo SDK 54 + TypeScript 프로젝트 생성 | ✅ |
| 모듈화 폴더 구조 (features, shared, native, supabase) | ✅ |
| TypeScript strict + 절대 경로 import (`@/shared/*`) | ✅ |
| 디자인 토큰 (컬러/타이포/간격/그림자) | ✅ |
| Pretendard 폰트 통합 (Regular/Medium/SemiBold/Bold) | ✅ |
| Lucide 아이콘 설치 | ✅ |
| 공용 컴포넌트 (Button, Card, Input, Text, ScreenHeader) | ✅ |
| Git 저장소 초기화 + GitHub Private Repo 생성 | ✅ |

**파일**: `shared/ui/tokens.ts`, `app/_layout.tsx`, `assets/fonts/*`

---

## Sprint 1 (mock) — 인증/라우팅 + 역할 분리 ✅ 완료

| 항목 | 상태 | 비고 |
|---|---|---|
| Expo Router 설치 + 라우팅 구조 | ✅ | |
| 로그인 화면 (카카오 버튼 UI) | ✅ | 실제 SDK는 Sprint 6에서 |
| 역할 선택 화면 (일손 / 사장님) | ✅ | |
| 일손 탭 그룹 (홈/내일/프로필) | ✅ | 주황 테마 |
| 사장님 탭 그룹 (내일감/등록/매칭/프로필) | ✅ | 녹색 테마 |
| 역할 전환 토글 (RoleSwitcher) | ✅ | |
| 역할 상태 관리 (RoleProvider) | ✅ | React Context |

**핵심 파일**: `app/(auth)/*`, `app/(worker)/*`, `app/(employer)/*`, `shared/hooks/useRole.tsx`, `shared/ui/RoleSwitcher.tsx`

---

## Sprint 2 (mock) — 일감 CRUD ✅ 완료

| 항목 | 상태 |
|---|---|
| 목 데이터 스토어 (MockDataProvider) | ✅ |
| 시드 일감 3개 (칼국수/카페/물류) | ✅ |
| 일감 등록 폼 (제목/업종/장소/시간/시급/긴급) | ✅ |
| 사장님 홈 — 내 일감 리스트 | ✅ |
| 일손 홈 — 주변 일감 리스트 (긴급 정렬) | ✅ |
| 일감 상세 화면 (`/job/[id]`) | ✅ |
| 일감 상태 변경 API | ✅ |

**핵심 파일**: `shared/store/MockDataProvider.tsx`, `app/(employer)/create.tsx`, `app/job/[id].tsx`

---

## Sprint 3 (mock) — 매칭 시스템 ✅ 완료

| 항목 | 상태 |
|---|---|
| Mode 1 (즉시 호출) — 선착순 자동 확정 | ✅ |
| Mode 2 (예약 구인) — 구인자 판정 | ✅ |
| 자동 경쟁자 시뮬레이션 (1.5/3초 후 2명) | ✅ |
| 지원자 자동 취소 (한 명 채용 시 나머지 거부) | ✅ |
| 10분 판정 타이머 (사장님 화면 진입 기준) | ✅ |
| 타이머 경고 단계 (3분 이하 노랑, 1분 이하 빨강) | ✅ |
| 자동 만료 처리 (5초마다 체크) | ✅ |
| 풍부한 지원자 카드 (뱃지/리뷰/자기소개) | ✅ |
| 목 워커 풀 (6명, 다양한 프로필) | ✅ |

**핵심 파일**: `shared/store/mockWorkers.ts`, `shared/hooks/useCountdown.tsx`, `features/matching/ApplicantCard.tsx`

---

## Sprint 4 (mock) — 근무 라이프사이클 ✅ 완료

| 항목 | 상태 |
|---|---|
| 상태 전환 (confirmed → in_progress → completed) | ✅ |
| 일손 체크인 버튼 | ✅ |
| 일손/사장님 체크아웃 버튼 | ✅ |
| 라이프사이클 배너 (상태별 안내) | ✅ |
| 리뷰 모달 (별점 + 코멘트) | ✅ |
| 양방향 리뷰 시스템 (일손 ↔ 사장님) | ✅ |
| 완료 후 리뷰 섹션 표시 | ✅ |
| StarRating 컴포넌트 (선택/읽기전용) | ✅ |

**핵심 파일**: `features/review/ReviewModal.tsx`, `shared/ui/StarRating.tsx`, `app/job/[id].tsx`

---

## Sprint 5 — Supabase 연동 ⏳ 대기

> 백엔드 실연동. 목 데이터 → 실제 DB.

| 항목 | 상태 |
|---|---|
| Supabase 프로젝트 생성 | ⏳ |
| 스키마 마이그레이션 (users/jobs/applications/reviews) | ⏳ |
| Supabase 클라이언트 셋업 | ⏳ |
| Row Level Security (RLS) 정책 | ⏳ |
| Realtime 구독 (매칭 상태 동기화) | ⏳ |
| MockDataProvider → Supabase 호출로 교체 | ⏳ |

**준비된 것**: 타입 정의는 이미 DB 스키마와 거의 1:1 매핑됨. `shared/types/*`

---

## Sprint 6 — 카카오 로그인 실제 연동 ⏳ 대기

| 항목 | 상태 |
|---|---|
| 카카오 개발자 앱 등록 | ⏳ |
| `react-native-kakao` 설정 | ⏳ |
| iOS URL Types / Info.plist | ⏳ |
| Android Manifest / key hash | ⏳ |
| Supabase Auth와 카카오 토큰 연결 | ⏳ |
| AsyncStorage에 세션 영속화 | ⏳ |

---

## Sprint 7 — 지도 + GPS ⏳ 대기

| 항목 | 상태 |
|---|---|
| 네이버 지도 WebView 통합 (MVP) | ⏳ |
| 일감 위치 마커 표시 | ⏳ |
| 위치 권한 UX (항상 허용 안내) | ⏳ |
| Foreground Service (Android) | ⏳ |
| 백그라운드 GPS 추적 (배민 수준) | ⏳ |
| 지오펜싱 자동 체크인 | ⏳ |

---

## Sprint 8 — 결제/정산 ⏳ 대기

| 항목 | 상태 |
|---|---|
| PortOne 가입 + 토스페이먼츠 연동 | ⏳ |
| `@portone/react-native-sdk` 설정 | ⏳ |
| 에스크로 결제 (매칭 확정 시) | ⏳ |
| 근무 완료 후 자동 정산 | ⏳ |
| 정산 내역 화면 | ⏳ |
| 일용직 근로계약서 자동 생성 | ⏳ |
| 휴업수당 자동 계산 | ⏳ |

---

## Sprint 9 — 릴리즈 준비 ⏳ 대기

| 항목 | 상태 |
|---|---|
| 아이콘 + 스플래시 이미지 | ⏳ |
| 개인정보 처리방침 페이지 | ⏳ |
| 이용약관 페이지 | ⏳ |
| Play Store 내부 테스트 | ⏳ |
| Play Store 출시 | ⏳ |
| App Store 제출 (후순위) | ⏳ |

---

## 알려진 제약/기술부채

| 항목 | 메모 |
|---|---|
| 목 데이터는 앱 재시작 시 초기화 | Supabase 전환 시 해결 |
| iOS 카카오 로그인 UI만 있음 | Sprint 6 |
| 지도 표시 없음 (텍스트만) | Sprint 7 |
| 결제 없음 (상태만 변경) | Sprint 8 |
| 푸시 알림 없음 (Alert로 대체) | Sprint 7~8 시점 |
| 폰트 크기/색상 접근성 테스트 미수행 | 실제 시니어 유저 피드백 필요 |

---

## 의사결정 기록

### 결정된 것

- **단일 앱 + 역할 전환** (별도 앱 X) — 시니어 허들 최소화
- **사장님 / 일손** 표현 (employer/worker 아님) — 한국적 친근함
- **네이티브 앱** (PWA X) — Play Store 신뢰도 + 푸시 안정성
- **Expo Managed** — 단일 코드베이스, Claude Code 적합
- **Pretendard 폰트** — 한글 최적화 무료 오픈소스
- **주황/녹색 역할 테마** — 현재 모드 명확히 구분
- **10분 판정 타이머 (사장님 화면 진입 기준)** — 일손 입장에선 타이머 노출 X

### 대기 중 결정

- Capacitor 전환 시점 (현재 Expo Managed 유지)
- 유료 GPS 라이브러리 도입 시점 (현재 expo-location)
- 웹 대시보드 사장님용 추가 여부 (MVP는 모바일만)

---

## 다음에 할 일

사용자 합의된 순서:

1. (작업 중) 문서 업데이트 ← 지금
2. Supabase 연동 (Sprint 5)
3. 카카오 로그인 실연동 (Sprint 6)
4. 지도 + GPS (Sprint 7)
5. 결제 (Sprint 8)
6. 릴리즈 준비 (Sprint 9)
