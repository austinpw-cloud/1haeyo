# 일해요 (1haeyo) — 기술 아키텍처

> 1인 개발 + Claude Code 전제. 모듈화 + 점진적 검증 + 한국 생태계 최적화.
> 구체적인 스프린트별 완료/대기 상태는 [progress.md](progress.md) 참조.

---

## 현재 구현 상태 요약 (2026-04-13)

| 영역 | 상태 | 비고 |
|---|---|---|
| 프로젝트 셋업 | ✅ 완료 | Expo SDK 54, TS strict |
| 모듈화 구조 | ✅ 완료 | features / shared / native |
| 디자인 시스템 | ✅ 완료 | Pretendard + Lucide + 토큰 |
| 공용 컴포넌트 | ✅ 완료 | Button/Card/Input/Text/StarRating |
| 라우팅 | ✅ 완료 | Expo Router, 역할 기반 분기 |
| 역할 시스템 | ✅ 완료 | 일손 / 사장님 + 전환 |
| Supabase 연결 | ✅ 완료 | 프로젝트 생성, 클라이언트 셋업 |
| DB 스키마 | ✅ 완료 | 5 테이블 + RLS 정책 |
| 익명 인증 | ✅ 완료 | Sprint 6에서 카카오로 업그레이드 예정 |
| 일감 CRUD | ✅ Supabase | 실 DB 연동 완료 |
| 지원(Applications) | ✅ Supabase | 실 DB 연동 완료 |
| 매칭 Mode 1/2 | ✅ 완료 | 클라이언트 로직 + DB |
| 10분 판정 타이머 | ✅ 완료 | DB + 클라이언트 타이머 |
| 근무 라이프사이클 | ⚠️ 혼합 | 일감 상태는 DB, 리뷰는 메모리 |
| Realtime 구독 | ⏳ 대기 | Phase 3E |
| 카카오 로그인 (실) | ⏳ 대기 | Sprint 6 |
| 지도 + GPS | ⏳ 대기 | Sprint 7 |
| 결제 (PortOne) | ⏳ 대기 | Sprint 8 |
| 릴리즈 | ⏳ 대기 | Sprint 9 |

---

## 1. 기술 스택 결정

### 최종 선택

| 레이어 | 기술 | 이유 |
|---|---|---|
| **모바일** | Expo Managed Workflow + React Native + TypeScript | 단일 코드베이스, 한국 생태계 지원, Claude Code 적합 |
| **백엔드/DB** | Supabase (PostgreSQL) | Realtime, 인증, 스토리지 통합. Expo 공식 가이드 |
| **인증** | 카카오 로그인 (`react-native-kakao`) + Supabase Auth | 한국 사용자 대부분 카카오 |
| **지도** | 네이버 지도 WebView (MVP) → 네이티브 SDK (v2) | 한국 데이터 정확, 단계적 고도화 |
| **GPS/백그라운드** | `expo-location` + Foreground Service | 배민 수준 추적 가능, 무료 |
| **푸시** | Expo Notifications + FCM | 표준, 안정적 |
| **결제/정산** | PortOne(`@portone/react-native-sdk`) + 토스페이먼츠 | 공식 RN SDK, 한국 PG 통합 |
| **OTA 업데이트** | EAS Update | 런칭 후 기능 변경 90% 커버 |
| **웹 (랜딩)** | Next.js + Vercel | SEO/GEO, 블로그, 마케팅 |
| **배포** | EAS Build + Play Store + App Store | 표준 |

---

## 2. 왜 네이티브앱 (PWA 포기)

### 결정 요인

| 요인 | PWA | 네이티브 앱 |
|---|---|---|
| 한국 시니어 신뢰도 | 낮음 ("왜 앱이 아냐") | 높음 (Play Store) |
| 백그라운드 GPS | 제약 많음 | **배민 수준 가능** |
| 푸시 알림 | iOS 제약 | 완벽 |
| 성능 (시니어 체감) | 버벅일 수 있음 | 부드러움 |
| 결제 연동 | 웹뷰 전환 | 네이티브 매끄러움 |

### 앱스토어 30% 수수료 — 우리는 해당 없음

노동 매칭 = 실물 서비스 거래. 인앱결제 의무 아님. 우버, 카카오택시, 배민과 동일하게 **PG로 자유롭게 결제**. 수수료 3.4%만.

---

## 3. 왜 Expo Managed Workflow

### Expo vs 대안

| 대안 | 평가 |
|---|---|
| **Bare React Native** | 네이티브 유연성 ↑, 초기 설정 복잡. MVP 불필요 |
| **Flutter** | 한국 생태계(카카오/네이버/PortOne) 공식 지원 부족 |
| **Native (Kotlin+Swift)** | 두 번 개발. MVP 단계에서 불가능 |
| **Capacitor** | 웹 기반, 네이티브 느낌 부족 |

### Expo Managed 장점

1. **한국 생태계 완전 지원** — 카카오, 네이버맵, PortOne 모두 OK
2. **EAS Update** — JS 변경은 심사 없이 즉시 배포
3. **Development Build** — 네이티브 모듈 추가해도 Managed 유지
4. **Ejection 가능** — 필요 시 언제든 Bare로 전환
5. **Claude Code 최적** — TS + React + Expo 조합 매우 잘 다룸

### Expo의 제약 (MVP에서 문제 없음)

- Expo Go에서는 백그라운드 GPS 안 됨 → Development Build 필수
- 네이티브 모듈 변경 시 재빌드 필요 → EAS Build로 해결
- 번들 크기 50~80MB → 시니어 시장에서 문제 없음

---

## 4. 모듈화 아키텍처

### 폴더 구조

```
1haeyo/
├── app/                          # Expo Router (라우팅)
│   ├── (auth)/                   # 인증 전 화면
│   ├── (worker)/                 # 워커 전용 탭
│   ├── (employer)/               # 구인자 전용 탭
│   └── _layout.tsx
│
├── features/                     # 기능별 모듈 (핵심)
│   ├── auth/
│   │   ├── screens/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   ├── profile/
│   ├── jobs/
│   ├── matching/                 # Mode 1, Mode 2 로직
│   │   ├── screens/
│   │   ├── hooks/
│   │   │   ├── useInstantMatch.ts   # Mode 1
│   │   │   └── useScheduledMatch.ts # Mode 2
│   │   ├── api/
│   │   └── state-machine.ts
│   ├── location/                 # GPS, 지도, 체크인
│   ├── payment/                  # PortOne 정산
│   ├── review/                   # 별점, 뱃지
│   ├── penalty/                  # 페널티 시스템
│   └── notification/             # 푸시
│
├── shared/                       # 공용 레이어
│   ├── api/
│   │   ├── supabase.ts           # Supabase 클라이언트
│   │   └── realtime.ts
│   ├── ui/                       # 디자인 시스템
│   │   ├── Button.tsx
│   │   ├── Text.tsx              # 시니어 친화 (16pt+)
│   │   ├── Card.tsx
│   │   └── tokens.ts             # 색상, 간격, 폰트
│   ├── hooks/                    # 범용 훅
│   ├── utils/
│   └── types/                    # 공용 타입
│
├── native/                       # 네이티브 플러그인 래퍼
│   ├── kakao/                    # 카카오 로그인, 공유
│   ├── maps/                     # 네이버/카카오맵
│   └── portone/                  # 결제
│
├── supabase/                     # 백엔드
│   ├── schema/                   # DB 마이그레이션
│   │   ├── 001_users.sql
│   │   ├── 002_jobs.sql
│   │   ├── 003_applications.sql
│   │   ├── 004_matches.sql
│   │   ├── 005_reviews.sql
│   │   ├── 006_penalties.sql
│   │   └── 007_payments.sql
│   └── functions/                # Edge Functions
│       ├── match-job/            # 매칭 알고리즘
│       ├── notify/               # 푸시 발송
│       ├── settle/               # 정산 처리
│       └── penalty-calc/         # 페널티 계산
│
├── config/                       # 환경 설정
│   ├── app.config.ts             # Expo 설정
│   └── env.ts
│
└── docs/                         # 문서 (이미 있음)
```

### 모듈화 원칙

1. **Feature-based**: 기능 단위로 완결. `jobs/`만 수정해도 다른 기능 영향 없음
2. **Layer separation**: `features/` → `shared/` → `native/` 단방향 의존
3. **명시적 export**: 각 feature는 `index.ts`로만 외부 노출
4. **타입 안전성**: TypeScript strict 모드
5. **테스트 가능**: 각 feature에 자체 테스트 디렉터리

### 의존성 흐름

```
app/ (화면 라우팅)
  ↓
features/ (비즈니스 로직)
  ↓
shared/ (공통 UI/유틸)
  ↓
native/ (플랫폼 통합)
```

**역방향 금지**. shared가 feature를 import하면 안 됨.

---

## 5. 데이터 모델 (Supabase 스키마)

### 핵심 테이블

```sql
-- users: 사용자 (워커/구인자 공용)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  kakao_id TEXT UNIQUE,
  name TEXT,
  role TEXT CHECK (role IN ('worker', 'employer', 'both')),
  phone TEXT,
  profile_image TEXT,
  total_rating NUMERIC DEFAULT 0,
  rating_count INT DEFAULT 0,
  penalty_points INT DEFAULT 0,
  penalty_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- jobs: 일감
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  employer_id UUID REFERENCES users,
  title TEXT,
  description TEXT,
  category TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_address TEXT,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  hourly_rate INT,
  required_count INT DEFAULT 1,
  status TEXT CHECK (status IN ('draft','open','matching','confirmed','in_progress','completed','cancelled')),
  matching_mode TEXT CHECK (matching_mode IN ('instant','scheduled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- applications: 지원
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs,
  worker_id UUID REFERENCES users,
  status TEXT CHECK (status IN ('pending','accepted','rejected','auto_cancelled','expired')),
  applied_at TIMESTAMP DEFAULT NOW(),
  judged_at TIMESTAMP,
  judge_deadline TIMESTAMP,  -- Mode 2의 10분 타이머
  UNIQUE(job_id, worker_id)
);

-- matches: 확정된 매칭
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs,
  worker_id UUID REFERENCES users,
  checked_in_at TIMESTAMP,
  checked_out_at TIMESTAMP,
  status TEXT CHECK (status IN ('confirmed','in_progress','completed','cancelled')),
  cancelled_by TEXT CHECK (cancelled_by IN ('worker','employer','mutual','system')),
  confirmed_at TIMESTAMP DEFAULT NOW()
);

-- reviews: 양방향 평가
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches,
  reviewer_id UUID REFERENCES users,
  reviewee_id UUID REFERENCES users,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  tags JSONB,  -- 카테고리별 평가
  created_at TIMESTAMP DEFAULT NOW()
);

-- badges: 스킬 뱃지
CREATE TABLE badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  badge_type TEXT,
  granted_at TIMESTAMP DEFAULT NOW()
);

-- penalties: 페널티 로그
CREATE TABLE penalties (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  points INT,
  reason TEXT,
  match_id UUID REFERENCES matches,
  created_at TIMESTAMP DEFAULT NOW()
);

-- payments: 정산
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches,
  amount INT,
  platform_fee INT,
  pg_fee INT,
  worker_amount INT,
  status TEXT CHECK (status IN ('escrow','settled','refunded')),
  portone_tx_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- location_tracks: GPS 추적 (임시)
CREATE TABLE location_tracks (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches,
  worker_id UUID REFERENCES users,
  lat NUMERIC,
  lng NUMERIC,
  recorded_at TIMESTAMP DEFAULT NOW()
);
-- 30일 후 자동 삭제 (Supabase cron)
```

### Realtime 구독 전략

Supabase Realtime으로 매칭 상태 실시간 동기화:

```typescript
// 구인자: 내 일감에 새 지원자 왔는지
supabase.channel('my-jobs')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'applications',
    filter: `job_id=eq.${jobId}`
  }, handleNewApplication)
  .subscribe()

// 워커: 내 지원이 확정/거부됐는지
supabase.channel('my-applications')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'applications',
    filter: `worker_id=eq.${userId}`
  }, handleApplicationUpdate)
  .subscribe()

// 구인자: 워커 실시간 위치
supabase.channel(`match-location-${matchId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'location_tracks',
    filter: `match_id=eq.${matchId}`
  }, updateWorkerPosition)
  .subscribe()
```

---

## 6. GPS 백그라운드 추적 (배민 수준)

### 구현 방식

**Android**:
```typescript
await Location.startLocationUpdatesAsync(BACKGROUND_TASK, {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 30000,  // 30초마다
  distanceInterval: 50, // 50m 이동 시
  foregroundService: {
    notificationTitle: "일해요",
    notificationBody: "일터로 이동 중입니다",
    notificationColor: "#FF6B35",
  },
});
```

Foreground Service + 지속 알림 → OS가 앱을 죽이지 못함. 배민 라이더 앱과 동일.

**iOS**:
```json
// app.config.ts
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["location", "fetch"],
      "NSLocationAlwaysAndWhenInUseUsageDescription": "일감 위치까지 가는 동안 사장님이 확인할 수 있도록 위치 정보가 필요합니다."
    }
  }
}
```

백그라운드 모드 + "항상 허용" 권한 → 화면 꺼진 상태에서도 추적.

### 추적 라이프사이클

```
매칭 확정
  ↓
Foreground Service 시작 + 지속 알림 표시
  ↓
GPS 좌표 30초마다 서버 전송 (Supabase)
  ↓
구인자 화면 실시간 업데이트 (Realtime)
  ↓
일터 50m 진입 (Geofencing)
  ↓
자동 체크인 제안
  ↓
체크인 완료 → GPS 추적 중단 (배터리 절약)
  ↓
근무 완료 체크아웃
  ↓
Foreground Service 종료
```

### 스케일업 시

월 매칭 1만 건 돌파 + 배터리 이슈 발생 시 `react-native-background-geolocation` (TransistorSoft) 도입 검토. $899 앱당 일회성.

---

## 7. 인증 & 보안

### 카카오 로그인 플로우

```
[앱에서 카카오 로그인 버튼 탭]
  ↓
react-native-kakao → 카카오톡 앱 전환 or 웹뷰 로그인
  ↓
카카오 access_token + id_token 반환
  ↓
Supabase Edge Function으로 전송
  ↓
Edge Function이 카카오 ID 검증 + Supabase Auth 세션 생성
  ↓
Supabase JWT 반환 → 앱에서 저장
  ↓
이후 모든 API 호출에 JWT 첨부
```

### Row Level Security (RLS)

Supabase RLS로 테이블 수준 권한 제어:

```sql
-- 워커는 본인 지원만 조회
CREATE POLICY "Workers see own applications"
ON applications FOR SELECT
USING (worker_id = auth.uid());

-- 구인자는 본인 일감의 지원만 조회
CREATE POLICY "Employers see applications to their jobs"
ON applications FOR SELECT
USING (job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid()));
```

---

## 8. 결제 & 정산

### PortOne 통합

```typescript
import { PortOne } from '@portone/react-native-sdk';

const result = await PortOne.requestPayment({
  storeId: STORE_ID,
  channelKey: TOSS_CHANNEL_KEY,
  paymentId: `match_${matchId}_${Date.now()}`,
  orderName: `일해요 - ${jobTitle}`,
  totalAmount: totalAmount,
  currency: 'KRW',
  payMethod: 'CARD',  // 또는 'EASY_PAY' 카카오페이, 토스페이
  customer: { fullName, phoneNumber, email },
});

if (result.code === 'success') {
  // Edge Function으로 매칭 확정 + 에스크로 생성
  await supabase.functions.invoke('settle-escrow', { ... });
}
```

### 정산 플로우

```
매칭 확정 시점
  ↓
구인자 PortOne 결제 (에스크로 상태)
  ↓
근무 완료 + 양쪽 확인
  ↓
Supabase Edge Function: settle
  ├── 플랫폼 수수료 차감 (15%)
  ├── PG 수수료 (3.4%)
  └── 워커 계좌 이체 (PortOne Transfer API)
  ↓
정산 완료
```

---

## 9. 지도 전략

### MVP: WebView + 네이버 지도 JavaScript API

```typescript
// WebView로 네이버 지도 HTML 로드
// 단순 지도 표시 + 마커 + 현재 위치
// 장점: 빠른 구현, 비용 0원 (일 30만 호출 무료)
// 단점: 네이티브 지도 대비 성능 약간 떨어짐
```

### v2: 네이티브 지도 SDK 전환

월 매칭 1,000건 돌파 시 네이티브로 전환:
- 성능 개선
- 오프라인 기능
- 고급 애니메이션

---

## 10. 개발 스프린트 현황

실제 진행된 순서는 원래 계획과 약간 다름. **UI/UX를 목 데이터로 먼저 완성하고, 백엔드는 나중에 통합**하는 전략으로 바뀜. 사용자 검증이 빠른 순서.

| Sprint | 영역 | 상태 | 산출물 |
|---|---|---|---|
| 0 | 프로젝트 셋업 + 디자인 시스템 | ✅ 완료 | Expo, 토큰, 폰트, 공용 컴포넌트 |
| 1 (mock) | 인증/라우팅 + 역할 분리 | ✅ 완료 | 로그인 UI, 역할 선택, 탭 구조 |
| 2 (mock) | 일감 CRUD | ✅ 완료 | 등록 폼, 리스트, 상세 |
| 3 (mock) | 매칭 Mode 1/2 + 10분 타이머 | ✅ 완료 | 자동 매칭, 선착순, 판정 타이머 |
| 4 (mock) | 근무 라이프사이클 + 리뷰 | ✅ 완료 | 체크인/아웃, 양방향 리뷰 |
| 5 | Supabase 연동 | ⏳ 대기 | 목 데이터 → 실제 DB |
| 6 | 카카오 로그인 실연동 | ⏳ 대기 | SDK 통합, Auth 세션 |
| 7 | 지도 + GPS 백그라운드 | ⏳ 대기 | 네이버맵, Foreground Service |
| 8 | 결제/정산 (PortOne) | ⏳ 대기 | 에스크로, 자동 정산 |
| 9 | 페널티 시스템 | ⏳ 대기 | 포인트 누적, 휴업수당 |
| 10 | 릴리즈 준비 | ⏳ 대기 | 아이콘/스플래시/스토어 |

상세 체크리스트는 [progress.md](progress.md) 참조.

### 왜 UI 먼저였나

원래 계획은 Sprint 0에 Supabase부터 붙이는 거였지만:
- 실기기에서 **보이고 눌리는 것**을 빨리 만들어야 방향 검증이 됨
- 매칭 플로우처럼 UX가 핵심인 기능은 코드보다 **직접 써봐야** 설계 구멍 발견
- Supabase 없이도 목 데이터로 전체 플로우 시뮬레이션 가능
- 타입 정의가 이미 DB 스키마와 1:1 매핑되어 Supabase 연동은 어댑터 교체 수준


---

## 11. 런칭 후 업데이트 유연성

### OTA (EAS Update) — 즉시 배포

- 매칭 알고리즘 변경
- 페널티 룰 조정
- UI/UX 개선
- 버그 수정 (JS 레벨)
- 새 화면 추가 (기존 네이티브 모듈로 가능한 경우)

### 새 빌드 필요 — 심사 1~3일

- 새 네이티브 모듈 (예: 생체 인증 추가)
- Expo SDK 업그레이드
- 권한 추가
- 아이콘/스플래시 변경

**예상: 변경의 90%는 OTA, 10%만 재빌드**

---

## 12. 비용 구조

### 개발 단계 (런칭 전)

| 항목 | 비용 |
|---|---|
| Expo 계정 | $0 |
| Supabase Free | $0 |
| Vercel (랜딩) | $0 |
| Apple Developer | $99/년 |
| Google Developer | $25 일회성 |
| 도메인 | ~$15/년 |
| **합계** | **약 $140 초기** |

### 런칭 후 (MAU 100~1000)

| 항목 | 월 비용 |
|---|---|
| Supabase Free | $0 (MAU 5만 이하) |
| EAS Build Free | $0 (30 builds/월) |
| EAS Update Free | $0 (MAU 1,000 이하) |
| FCM | $0 |
| 네이버맵 | $0 (일 30만 호출) |
| Expo Push | $0 |
| **합계** | **$0/월** |

### 스케일업 (MAU 5,000+)

| 항목 | 월 비용 |
|---|---|
| Supabase Pro | $25 |
| EAS Production plan | $99 (필요 시) |
| 네이버맵 유료 구간 | 사용량 기반 |
| **합계** | **$30~200/월** |

---

## 13. 리스크 & 대응

| 리스크 | 대응 |
|---|---|
| 네이버/카카오맵 RN SDK 불안정 | MVP는 WebView. 검증 후 네이티브 전환 |
| iOS 강제 종료 시 GPS 끊김 | Foreground Service + "앱 안 닫기" 메시지 강조. 배민도 동일 제약 |
| Expo Go 제약 | Development Build 필수 사용 |
| 카카오/PortOne API 변경 | 모듈화로 해당 모듈만 수정 |
| 스토어 심사 지연 | EAS Update로 대부분 우회. 심사는 월 1~2회만 |
| Supabase 스케일링 | 1만 MAU 전에 Pro 전환 |
| 결제 버그 | 테스트 모드에서 충분히 검증 후 실결제 오픈 |

---

## 14. 핵심 원칙

1. **한 번에 한 모듈**: 하나 끝내고 검증한 다음 다음 모듈
2. **Feature-based**: 기능 단위로 완결, 의존성 최소화
3. **테스트 가능**: 각 feature 독립 테스트
4. **점진적 고도화**: MVP → 검증 → 고도화 (WebView → 네이티브 지도 같이)
5. **한국 시장 우선**: 카카오/네이버/PortOne 생태계 완전 활용
6. **시니어 우선 UX**: 16pt+ 폰트, 3탭 이내, 명확한 색상
7. **실용적 판단**: "이론적 최고"가 아닌 "지금 최선"

---

## 15. 다음 단계

이 기술 아키텍처 문서가 확정되면:

1. Expo 프로젝트 초기 셋업 (Sprint 0)
2. Supabase 프로젝트 생성 + 스키마 마이그레이션
3. 카카오 개발자 앱 등록
4. PortOne 가입
5. Sprint 1부터 순차 진행
