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

| 레이어 | 기술 | 상태 |
|---|---|---|
| 모바일 | Expo Managed Workflow + React Native + TypeScript | ✅ |
| 백엔드/DB | Supabase + RLS + Realtime | ✅ |
| 인증 | Google OAuth (카카오는 비즈 앱 전환 후) | ✅ / ⏳ |
| 지도 | 카카오맵 WebView + JS API | ✅ |
| GPS | expo-location (foreground 체크인 검증) | ✅ 기본 완료 / 4단계 백그라운드 추적 ⏳ |
| 결제 | PortOne + 토스페이먼츠 | ⏳ UI mock 완료, 실연동은 사업자등록 후 |
| 배포 | EAS Build (Android Preview APK) | ✅ |
| OTA | EAS Update | ⏳ 예정 |

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
│   ├── jobs/           # 일감 CRUD + 가격 breakdown + 시작시간 picker
│   ├── matching/       # 지원/매칭/체크인·아웃 (applications, matches)
│   ├── location/       # 카카오맵 WebView + 주소검색 + GPS 거리 검증
│   ├── review/         # 양방향 리뷰 모달
│   ├── contract/       # 전자 근로계약서 (표준양식 + 해시)
│   └── profile/        # 계정 정보 + 계좌 등록 + 업그레이드 카드
│
├── shared/             # 공용 레이어
│   ├── api/            # supabase 클라이언트, OAuth 래퍼
│   ├── ui/             # 디자인 토큰 + 공용 컴포넌트
│   ├── hooks/          # useAuth, useRole, useCountdown
│   ├── store/          # MockDataProvider (전역 상태 + Realtime 구독)
│   ├── types/          # 공용 타입
│   └── utils/          # 포맷, 가격 계산
│
├── supabase/
│   └── schema/         # 6개 테이블 + RLS + Realtime publication (_all.sql)
│
├── assets/             # 폰트, 이미지
└── docs/               # 기획·설계·진행 문서
```

---

## 현재 개발 상태 (2026-04-14)

- ✅ Sprint 0~4: 기반, UI, 목 데이터 라이프사이클 (등록/지원/매칭/체크인/리뷰)
- ✅ **Phase 3A~3E**: Supabase 전체 연동 (인증 + 6개 테이블 + Realtime)
- ✅ **Sprint 7 1~3단계**: 카카오맵 + 주소 검색 + 체크인 거리 검증
- ✅ **구글 로그인 실연동** (Supabase OAuth)
- ✅ **공정성 게이팅**: 판정 타이머(지원 접수 기준), 채용 플로우(requiredCount 유지), 체크아웃 게이트(95% 경과)
- ✅ **결제/정산/근로계약 UI mock**: 비용 breakdown, 전자서명 체크박스, 계약 자동 체결, 즉시송금, 계좌 등록
- ✅ **EAS Build**: Android Preview APK 파이프라인
- ⏳ Sprint 6: 카카오 로그인 (비즈 앱 전환 대기)
- ⏳ Sprint 7 4단계: 백그라운드 GPS + 실시간 추적
- ⏳ Sprint 8: 실결제 (PortOne + 토스페이먼츠) — 사업자등록 선행
- ⏳ Sprint 9: 페널티/평판 시스템
- ⏳ Sprint 10: 근로계약서 공인 서명 (PASS/KISA)
- ⏳ Sprint 11: Play Store 릴리즈

상세 내용은 [docs/progress.md](docs/progress.md), 결제 모델은 [docs/payment-model.md](docs/payment-model.md) 참조.

---

## 라이선스

Private. © 2026 Madeflo.
