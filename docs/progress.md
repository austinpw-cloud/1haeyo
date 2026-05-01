# 구현 진행 상황

> 현재 상태 단일 기준. 과거 변경 이력은 하단 **Log** 섹션.
> 전체 기술 설계는 [tech-architecture.md](tech-architecture.md), 매칭 플로우는 [matching-system.md](matching-system.md), 결제/정산 모델은 [payment-model.md](payment-model.md).

최종 업데이트: 2026-04-14

---

## 전체 진행률

```
기반 레이어     ████████████████████  100%
UI/기능 레이어  ████████████████████  100% (모든 화면 구현 + 결제 mock UI)
백엔드 연동     ████████████████████  100% (DB + RLS + Realtime)
외부 통합       ████████░░░░░░░░░░░░   40% (지도 완료, 구글 로그인 완료, 실결제 대기)
릴리즈 준비     ██░░░░░░░░░░░░░░░░░░   10% (EAS 빌드 파이프라인 확보)
```

---

## 완료된 것

### 기반 · UI (Sprint 0~4)
- Expo SDK 54 + TypeScript + Expo Router
- 디자인 시스템 (컬러/타이포/간격/그림자, Pretendard)
- 공용 컴포넌트 (Button, Card, Input, Text, ScreenHeader, StarRating, RoleSwitcher)
- 역할 분리 (worker/employer 탭), 역할 전환
- 일감 CRUD, 매칭 Mode 1/2, 근무 라이프사이클, 양방향 리뷰

### Supabase 백엔드 (Phase 3A~3E)
- Anonymous 인증 + Google OAuth linking (kakao는 비즈 앱 전환 대기)
- DB: `profiles`, `jobs`, `applications`, `matches`, `reviews`, `contracts` + RLS
- Realtime 구독 (4 테이블 + contracts)
- 판정 타이머: 지원 접수 시점부터 10분 (사장님 앱 미접속해도 자동 만료)
- 전역 sweep (15초): 만료 지원자 + 시작 시간 지난 공고 자동 정리

### 지도 / GPS (Sprint 7 1~3)
- 카카오맵 WebView + JS API
- 주소/장소 통합 검색 (카카오 로컬 API)
- 일감 등록 시 좌표 저장
- 체크인 거리 검증 (150m, Haversine)

### 공정성 / 근무 라이프사이클
- 2명 채용 공고 시 requiredCount 도달까지 matching 유지
- 체크아웃 게이트: 근무시간 × 95% 경과 전 비활성, "합의된 조기 종료" 별도 버튼
- 익명 사용자 기본 이름 `사용자 XXXXXX`

### 결제 / 정산 / 근로계약서 (UI/mock)
- 비용 breakdown 카드 (근무 대가 + 플랫폼 10% + PG 3.3% + 총액)
- 전자서명 체크박스 (사장님 등록 + 워커 지원)
- 매칭 확정 시 `contracts` DB 자동 insert + "근로계약 체결됨" 배너
- 근로계약서 모달 (고용노동부 표준양식 기반, 양측 서명 타임스탬프 + 해시 표기)
- 체크아웃 시 `matches.payment_status → 'settled'` + 즉시송금 완료 Alert
- 워커 프로필에 정산 계좌 등록 카드

### 빌드 / 배포
- EAS Build 파이프라인 (Android Preview APK)
- EAS 환경변수로 Supabase/Kakao 키 주입
- 구글 로그인 OAuth (Supabase provider)

---

## 대기 중인 작업

### Sprint 6 — 카카오 로그인 (홀딩)
- 비즈 앱 전환 or "개인정보 동의항목" 검수 통과 필요 (account_email 권한)
- 현재는 **구글 로그인**으로 대체

### Sprint 7 4단계 — 백그라운드 GPS + 실시간 추적
- `expo-location` Foreground Service
- Realtime 채널로 워커 위치 송신
- 사장님 지도에 워커 이동 표시

### Sprint 8 — 실결제 연동
**선행 조건 (사용자 작업)**:
- 사업자등록 + 통신판매업 신고
- PortOne 가입 (추천패키지 22만원 지원)
- 토스페이먼츠 계약 (약 1~2주 심사)

**구현 범위**:
- PortOne + 토스페이먼츠 연동
- 에스크로 선결제 (mock → 실결제)
- 즉시송금 API (mock → 실제 송금)
- 휴업수당 계산 + 자동 지급
- 취소/환불 자동 처리

### Sprint 9 — 페널티 / 평판 시스템
- 워커 페널티 포인트제 (지각/노쇼/취소)
- 사장님 응답 지연 평판 하락 (현재 expired 기록만 남음)
- 리뷰 → 프로필 집계 DB 트리거

### Sprint 10 — 법적 강화
- 근로계약서 PASS/카카오/토스 인증 서명 (`legal_status = 'certified_identity'`)
- KISA 공인 타임스탬프 (`legal_status = 'notarized'`)
- PDF 생성 (expo-print)
- 근로감독관 제출 포맷
- 산재보험 연동

### Sprint 11 — 릴리즈 준비
- 아이콘 · 스플래시 정식 제작
- 개인정보 처리방침 · 이용약관 검토
- Play Store 내부 테스트
- iOS 빌드 (Apple Developer 계정 필요)

---

## 환경

- **Supabase**: `nbjpivywvpvmwsltscai.supabase.co` (Seoul)
- **DB**: 6 테이블 (profiles/jobs/applications/matches/reviews/contracts) + RLS + Realtime
- **인증**: Anonymous + Google OAuth (Kakao 대기)
- **지도**: 카카오맵 JS API (REST + JavaScript 키)
- **빌드**: EAS Preview APK (`ilhaeyo` scheme)
- **스키마 원본**: `supabase/schema/_all.sql` (신규 환경 부트스트랩용 — 개별 번호 파일들을 합친 것)

---

## 남은 기술 부채

| 항목 | 메모 |
|---|---|
| MockDataProvider 이름 | DataProvider로 리네임 예정 |
| MOCK_EMPLOYER_ID / MOCK_WORKER_ID export | 호환성 유지용. 정리 필요 |
| 자동 경쟁자 시뮬레이션 제거 | 다중 유저 테스트는 2기기/2계정으로 |
| 리뷰 → 프로필 집계 | DB 트리거로 worker_total_rating/rating_count 갱신 필요 |
| 사장님 방치 평판 | Sprint 9 페널티와 함께 구현 |
| 체크인 게이트 | 시작 30분 전부터만, 지각·노쇼 페널티. Sprint 9. |
| Kakao 로그인 | 비즈 앱 전환 후 재개 |

---

## Log

### 2026-04-14
- 결제/정산/근로계약 UI mock 선구현: 비용 breakdown, 전자서명 체크박스, 계약 자동 체결, 즉시송금 mock, 계좌 등록.
- DB: `contracts` 테이블 추가 + 결제/수수료 필드 + 워커 계좌 필드 (`008_contracts_and_payout.sql`).
- `_all.sql`에 006/007/008 병합 (신규 환경 한 번에 부트스트랩 가능).
- 체크인 위치 검증 race 수정: `useCurrentLocation.refresh()`가 point 반환.
- 매칭 확정 시 `insertContract` 자동 실행 (양측 서명 + 해시 포함).
- checkout 시 `matches.payment_status = 'settled'` 전환.
- 프로필 화면 중복 카드 제거 (AccountInfo로 일원화).
- README / tech-architecture 상태 갱신.

### 2026-04-13
- Phase 3A~3E 완료 (Supabase 인증/Jobs/Applications/Matches/Reviews/Realtime).
- Sprint 7 1~3단계 (카카오맵 WebView + 주소 검색 + 체크인 거리 검증).
- 판정 타이머 기준을 "지원 접수 시점"으로 변경 (사장님 앱 미접속 무한 pending 구멍 수정).
- 채용 플로우: requiredCount 도달까지 matching 유지.
- 체크아웃 게이트 (근무시간 × 95% 경과).
- 익명 로그인 기본 이름 `사용자 XXXXXX`.
- 구글 로그인 실연동 (Supabase OAuth + identity 충돌 fallback).
- EAS Build 파이프라인 구축 (Android Preview APK).
- 스킴 `1haeyo` → `ilhaeyo` 변경 (RFC 호환).

### 2026-04-12
- Sprint 0~4 mock 완료. UI/UX 검증.
