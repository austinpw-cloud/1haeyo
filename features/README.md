# features/ — 기능별 모듈

일해요의 핵심 비즈니스 로직. **기능 단위로 완결**되어야 함.

## 모듈 목록

| 모듈 | 역할 |
|---|---|
| `auth/` | 카카오 로그인, Supabase Auth 연동, 세션 관리 |
| `profile/` | 사용자 프로필, 이력, 뱃지 |
| `jobs/` | 일감 CRUD (등록/조회/수정/삭제) |
| `matching/` | Mode 1 (즉시 호출) + Mode 2 (예약 구인) 매칭 로직 |
| `location/` | GPS 추적, 지도, 체크인/체크아웃 |
| `payment/` | PortOne 결제, 에스크로, 정산 |
| `review/` | 양방향 별점/리뷰 |
| `penalty/` | 페널티 포인트 시스템 |
| `notification/` | 푸시 알림, 인앱 알림 |

## 원칙

- 각 feature는 `index.ts`로만 외부 노출
- feature끼리 직접 import 금지. shared/ 통해서만
- 화면(screens), 로직(hooks), API, 타입이 feature 안에서 완결

## 폴더 구조 예시

```
features/jobs/
├── screens/
│   ├── JobListScreen.tsx
│   ├── JobDetailScreen.tsx
│   └── JobCreateScreen.tsx
├── components/
│   └── JobCard.tsx
├── hooks/
│   └── useJobs.ts
├── api/
│   └── jobs.api.ts
├── types.ts
└── index.ts
```
