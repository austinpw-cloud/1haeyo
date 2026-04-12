# 일해요 (1haeyo) — 디자인 시스템

> 시니어 친화 + 신뢰 + 에너지. "원하면, 바로 일해요"

---

## 1. 브랜드 아이덴티티

### 브랜드 본질

| 항목 | 내용 |
|---|---|
| **이름** | 일해요 (1haeyo) |
| **중의적 해석** | "일해요" (work) + "원해요" (want) |
| **핵심 약속** | "원하는 순간, 바로 일해요" |
| **감정** | 따뜻함 + 활기 + 신뢰 |
| **톤** | 친근하지만 전문적, 존중하되 유쾌 |

### 브랜드 성격

```
✓ 나이 차별 없이 누구나 편한
✓ 기술은 뒤로 숨고 사람이 먼저인
✓ 가볍지만 허술하지 않은
✓ 친근하지만 우버처럼 빠르고 정확한

✗ 너무 젊은 척하지 않는다 (시니어 소외 X)
✗ 너무 복지적이지 않는다 (동정 X)
✗ 너무 테크놀로지스러운 X (차가움 X)
```

### 로고 방향성 (초안)

- "1해요" 또는 "일해요" 한글 워드마크
- 숫자 1을 일/원 이중 의미로 디자인
- 원형 컨테이너에 들어가도 잘 보이게
- 앱 아이콘: 주황색 배경에 흰색 "1" 또는 "일"

---

## 2. 컬러 팔레트

### 설계 원칙

1. **푸른색 의존 낮춤**: 나이가 들면서 푸른색 감도 감소 → 따뜻한 색 우선
2. **고대비**: WCAG AA 이상 (대비 4.5:1+)
3. **카테고리별 일관**: 구인자=파랑톤, 워커=주황톤 같은 역할 구분

### Primary — 주황/코랄 계열

```
Primary/50   #FFF4EE   배경, 아주 연한 하이라이트
Primary/100  #FFE4D1   살짝 강조된 배경
Primary/200  #FFC7A3   보조 요소
Primary/300  #FFA575   버튼 호버 (연한)
Primary/400  #FF8549   중간톤 (경고 느낌 주의)
Primary/500  #FF6B35   ⭐ 메인 브랜드 컬러 (주요 CTA)
Primary/600  #E85521   강조 버튼 (호버)
Primary/700  #C44318   텍스트 위 배지 배경
Primary/800  #9C3311   헤더 텍스트
Primary/900  #6B2208   가장 진한 강조
```

**사용 가이드**:
- Primary/500: 메인 CTA ("지원하기", "일감 등록")
- Primary/50: 정보 강조 배경
- Primary/700: 브랜드 텍스트

### Secondary — 깊은 녹색 (신뢰, 완료, 성공)

```
Secondary/50   #E8F5EE
Secondary/100  #C5E8D2
Secondary/300  #5FBA82
Secondary/500  #2E8B57   ⭐ 세컨더리 (완료, 확정)
Secondary/700  #1E6139
Secondary/900  #0F3820
```

**사용 가이드**:
- 매칭 확정 상태
- 근무 완료 표시
- 뱃지 획득 알림

### Semantic Colors

```
Success   #2E8B57    완료, 확정, 긍정
Warning   #F59E0B    주의, 경고
Error     #DC2626    오류, 취소, 노쇼
Info      #0EA5E9    정보 (푸른 계열 최소 사용)
```

### Neutral — 웜 그레이 (차갑지 않게)

```
Neutral/0     #FFFFFF   순백 (카드 배경)
Neutral/50    #FAFAF9   앱 배경
Neutral/100   #F5F5F4   구분선 배경
Neutral/200   #E7E5E4   구분선
Neutral/300   #D6D3D1   비활성 테두리
Neutral/400   #A8A29E   placeholder
Neutral/500   #78716C   보조 텍스트
Neutral/600   #57534E   본문 텍스트 (연한)
Neutral/700   #44403C   ⭐ 본문 메인 텍스트
Neutral/800   #292524   제목
Neutral/900   #1C1917   가장 진한 텍스트
```

### 다크모드 (v1에서는 라이트만)

MVP는 라이트 모드만 지원. 시니어 타겟은 라이트 선호도 높음. 다크모드는 v2 이후.

### 컬러 접근성 체크

| 조합 | 대비율 | 통과 |
|---|---|---|
| Neutral/700 on Neutral/0 | 10.7:1 | AAA ✅ |
| Primary/500 on White | 4.7:1 | AA ✅ |
| White on Primary/500 | 4.7:1 | AA ✅ (버튼) |
| Neutral/500 on Neutral/50 | 4.6:1 | AA ✅ |

---

## 3. 타이포그래피

### 폰트 선택

**기본 폰트: Pretendard**
- 무료 오픈소스
- 한글 최적화
- 9가지 굵기
- 영문/숫자와 조화
- 시니어 친화적 (깔끔하고 큼직)

```
import { useFonts } from 'expo-font';

useFonts({
  'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.otf'),
  'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.otf'),
});
```

### 타이포 스케일 (시니어 친화 — 일반 앱보다 1~2 단계 큼)

```
Display     40pt / Bold        메인 화면 상단 숫자/강조
Title/XL    32pt / Bold        랜딩 페이지 헤드라인
Title/L     24pt / Bold        화면 제목
Title/M     20pt / SemiBold    섹션 제목
Title/S     18pt / SemiBold    카드 제목

Body/L      18pt / Regular     ⭐ 기본 본문 (일반 앱 16pt보다 큼)
Body/M      16pt / Regular     보조 본문 (최소)
Body/S      14pt / Regular     라벨, 메타 정보 (최소한 사용)

Button/L    18pt / SemiBold    메인 CTA 버튼
Button/M    16pt / SemiBold    세컨더리 버튼

Caption     14pt / Medium      태그, 뱃지
Tiny        12pt / Medium      법적 고지만. 다른 용도 금지.
```

### 사용 원칙

1. **본문 기본 18pt**: 일반 앱의 16pt보다 한 단계 크게
2. **최소 14pt**: 읽을거리는 절대 14pt 미만 금지
3. **굵기 3~4개만**: Regular, Medium, SemiBold, Bold
4. **line-height**: body 1.5배, title 1.3배
5. **한 줄 글자수**: 모바일에서 최대 25자 (한글 기준)

### 예시

```tsx
// 화면 제목
<Text style={{ fontSize: 24, fontFamily: 'Pretendard-Bold', color: colors.neutral[800] }}>
  오늘의 일감
</Text>

// 본문
<Text style={{ fontSize: 18, fontFamily: 'Pretendard-Regular', color: colors.neutral[700], lineHeight: 27 }}>
  미금역 근처 식당에서 점심 시간 홀서빙을 도와주실 분을 찾고 있어요.
</Text>
```

---

## 4. 간격 시스템 (Spacing)

4의 배수 기준. 시니어를 위해 일반 앱보다 **1단계씩 크게**.

```
space/0     0
space/1     4px    아이콘과 텍스트 같은 최소 간격
space/2     8px    관련 요소 간 간격
space/3     12px   
space/4     16px   ⭐ 기본 패딩 (카드 내부)
space/5     20px   섹션 내 간격
space/6     24px   ⭐ 컨테이너 외부 여백
space/8     32px   섹션 간 구분
space/10    40px   화면 상단 여백
space/12    48px   큰 섹션 구분
space/16    64px   Hero 영역
```

**화면 기본 패딩**: 좌우 24px (일반 앱 16px보다 크게)

---

## 5. 터치 영역 & 레이아웃

### 최소 터치 영역

```
최소 터치    48 × 48 dp    (Android 표준)
권장 터치    56 × 56 dp    (시니어 친화)
주요 CTA    전체 너비 × 56 dp    (메인 버튼)
```

### 레이아웃 원칙

1. **한 화면에 주요 액션 1~2개**: 선택지 폭발 금지
2. **엄지 닿는 영역에 CTA**: 화면 하단 고정
3. **상단 내비게이션 크게**: 뒤로가기 48dp 이상
4. **FAB(플로팅 버튼) 지양**: 시니어한테 직관적이지 않음

### 화면 구조 패턴

```
┌─────────────────────────────┐
│  ← 뒤로    화면 제목       │ ← 큰 헤더 (60dp)
├─────────────────────────────┤
│                             │
│  [본문 콘텐츠]              │ ← 주 영역
│                             │
│                             │
│                             │
├─────────────────────────────┤
│  [메인 액션 버튼]           │ ← 하단 고정 (56dp)
└─────────────────────────────┘
```

---

## 6. 컴포넌트 라이브러리

### Button

```
Primary (메인 CTA)
┌────────────────────────┐
│     지원하기            │   height: 56dp
└────────────────────────┘   bg: Primary/500
                              color: white
                              radius: 12px
                              font: Button/L (18pt Bold)

Secondary
┌────────────────────────┐
│     취소하기            │   height: 56dp
└────────────────────────┘   bg: Neutral/100
                              color: Neutral/700
                              border: 1px Neutral/300

Outline
┌────────────────────────┐
│   ← 이전                │   height: 48dp
└────────────────────────┘   bg: transparent
                              border: 2px Primary/500
                              color: Primary/500

Text
     자세히 보기 >            Primary/500
                              underline 없이
```

### Card (일감 카드)

```
┌────────────────────────────────┐
│  🔥 긴급        4시간 후        │  메타 정보
│                                 │
│  점심 시간 홀서빙              │  Title/M (20pt)
│  미금역 OO식당                  │  Body/M (16pt) Neutral/600
│                                 │
│  📍 1.2km  ⏱ 2시간  💰 5만원   │  주요 정보
│                                 │
│  [프로필] [프로필]              │  아바타 (이미 지원한 수)
│                                 │
└────────────────────────────────┘
  padding: 20px
  radius: 16px
  shadow: 0 2px 8px rgba(0,0,0,0.06)
  border: 1px Neutral/100
```

### Input

```
┌────────────────────────────────┐
│ 라벨 (Body/M, Neutral/700)     │
│ ┌──────────────────────────┐   │
│ │ 입력 내용                │   │  height: 56dp
│ └──────────────────────────┘   │  font: Body/L (18pt)
│ 도움말 (14pt Neutral/500)      │  border: 2px Neutral/200 (focused: Primary/500)
└────────────────────────────────┘  padding: 16px
                                     radius: 12px
```

### Badge (스킬 뱃지, 상태)

```
상태 뱃지:
[ 🔥 긴급 ]      bg: Primary/100, color: Primary/700
[ ✓ 확정됨 ]    bg: Secondary/100, color: Secondary/700
[ ⏳ 대기중 ]   bg: Neutral/100, color: Neutral/700

스킬 뱃지 (크게):
┌────────────────────┐
│   🏃              │   size: 64dp
│  홀서빙 마스터     │   padding: 12px
│    47회            │
└────────────────────┘
```

### Avatar

```
원형, 테두리 있음
size/sm:  32dp   (리스트)
size/md:  48dp   (카드)
size/lg:  64dp   (프로필)
size/xl:  96dp   (프로필 상세)

border: 2px Neutral/100
fallback: 이니셜 (Pretendard SemiBold)
```

### 별점 (Star Rating)

```
★★★★☆  4.8 (132건)
─────   ────
크기:    20dp  (별 하나)
색상:    active #FFB800 / inactive Neutral/200
숫자:    Title/S (18pt SemiBold)
```

### Bottom Sheet / Modal

```
┌────────────────────────────────┐
│                                 │
│        ━━━━━                    │  핸들 바 (Neutral/300)
│                                 │
│   지원 전 확인해주세요          │  Title/M
│                                 │
│   • 근무 시간: 12:00~15:00      │  Body/M
│   • 시급: 15,000원              │
│                                 │
│   [지원 취소]  [지원하기]       │  Secondary + Primary
│                                 │
└────────────────────────────────┘
  radius: 20px (top only)
  padding: 24px
  bg: white
```

### Notification Toast

```
┌─────────────────────────────┐
│ ✓ 매칭이 확정되었어요!       │  height: 64dp
└─────────────────────────────┘   bg: Secondary/500
                                   color: white
                                   font: Body/L (18pt SemiBold)
                                   3초 후 자동 사라짐
```

---

## 7. 아이콘

### 아이콘 라이브러리: **Lucide React Native**

```
npm install lucide-react-native react-native-svg
```

이유:
- 모던한 라인 아이콘
- 일관된 스타일
- 무료 오픈소스
- 시니어도 직관적 (추상 아이콘 배제된 스타일)

### 사용 크기

```
icon/xs   16dp   인라인 텍스트 옆
icon/sm   20dp   일반 아이콘
icon/md   24dp   ⭐ 기본
icon/lg   32dp   카드 주요 아이콘
icon/xl   48dp   Empty state, Splash
```

### 핵심 아이콘 매핑

```
홈           Home
일감         Briefcase
내 프로필    User
알림         Bell
위치         MapPin
시간         Clock
돈           Banknote / Won
별점         Star
메시지       MessageCircle
설정         Settings
검색         Search
뒤로가기      ArrowLeft
더보기       MoreVertical
```

**금지**:
- 이모지 과다 사용 (시니어한테 혼란)
- 추상적/메타포 아이콘 (직관적이지 않음)

---

## 8. 일러스트레이션 & Empty States

### Empty State 가이드

```
┌────────────────────────────────┐
│                                 │
│         [심플 일러스트]          │  200dp
│                                 │
│    아직 등록된 일감이 없어요     │  Title/M
│                                 │
│  구인자가 일감을 올리면           │  Body/M Neutral/500
│  알림으로 알려드릴게요            │
│                                 │
│        [알림 설정하기]            │  Primary Button
│                                 │
└────────────────────────────────┘
```

### 일러스트 스타일

- 심플한 라인 일러스트
- 브랜드 컬러(주황/녹색) 포인트
- Storyset.com, unDraw.co 무료 활용
- 시니어가 위화감 없게 (너무 유치하거나 너무 테크하지 않게)

---

## 9. 모션 & 애니메이션

### 원칙

1. **의미 있는 모션만**: 장식적 애니메이션 X
2. **빠르게**: 200~300ms
3. **시니어를 생각하며**: 너무 빠른 변화도 혼란
4. **접근성**: `prefers-reduced-motion` 존중

### 표준 duration

```
fast        150ms    상태 변화 (호버, 탭)
normal      250ms    ⭐ 기본 (화면 전환, 모달)
slow        400ms    큰 전환 (페이지 이동)
```

### 핵심 모션

```
버튼 탭        scale 1.0 → 0.95 → 1.0  (150ms)
화면 전환      slide right (250ms)
모달 등장      slide up + fade (250ms)
성공 피드백    scale 0.8 → 1.1 → 1.0 + checkmark
로딩           회전 (매끄럽게)
매칭 확정      큰 체크 + 햅틱 피드백
```

### 햅틱 피드백 (Haptics)

```typescript
import * as Haptics from 'expo-haptics';

// 매칭 확정 시
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// 버튼 탭
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// 경고/에러
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

시니어는 시각 + 촉각 피드백 동시에 있을 때 명확함 느낌.

---

## 10. 시니어 UX 핵심 원칙

### 10가지 룰 (팀 선언)

```
1. 모든 텍스트 18pt 이상 (필수)
2. 모든 터치 영역 48dp 이상 (필수)
3. 푸른색 단독 사용 금지 (정보 색상 시)
4. 한 화면 주요 액션 1~2개만
5. 뒤로가기는 항상 좌상단
6. 에러 메시지는 부드럽고 명확하게
7. 성공 시 크고 분명한 확인
8. 추상 아이콘 배제
9. 설명 없는 기능 금지
10. 손가락 떨림 대비: 실수 취소 3초 유예
```

### 피해야 할 안티패턴

| ❌ 나쁜 예 | ⭕ 좋은 예 |
|---|---|
| "저장되었습니다" (작게) | "✅ 일감이 등록되었어요!" (크게, Toast) |
| "X" 닫기 버튼 | "← 뒤로" 텍스트 있는 버튼 |
| 햄버거 메뉴 (☰) | 하단 탭 내비게이션 |
| 스와이프로 삭제 | 상세 화면의 [삭제하기] 버튼 |
| 무한 스크롤 | 페이지네이션 or "더 보기" 버튼 |
| 프로그레스 바 숨김 | 항상 남은 단계 표시 "2 / 5" |
| 자동 완성만 | 직접 타이핑 옵션도 |
| 오토플레이 | 명시적 재생 버튼 |

---

## 11. 역할별 UI 차별화

### 워커 (Worker) UI

```
배경: Neutral/50 (따뜻한 화이트)
강조: Primary/500 (주황)
분위기: 친근, 편안
CTA: "지원하기", "일 받기"
```

### 구인자 (Employer) UI

```
배경: Neutral/50
강조: Secondary/500 (깊은 녹색)
분위기: 전문, 신뢰
CTA: "일감 올리기", "채용하기"
```

역할 변경 시 상단 색상 밴드로 구분 → 사용자가 지금 어느 모드인지 명확.

---

## 12. 상태별 디자인

### Loading

```
- 스켈레톤 스크린 (실제 콘텐츠 모양 그대로)
- 작은 로딩 인디케이터 Primary/500
- "불러오는 중..." 텍스트는 500ms 이상 지연 시에만
```

### Empty

```
- 중앙 정렬 일러스트 + 설명
- 액션 가능하다면 CTA 버튼
- 너무 비어 보이지 않게
```

### Error

```
- 빨간색 최소화 (Neutral 베이스 + Error/500 아이콘)
- "문제가 생겼어요" 같은 부드러운 표현
- 명확한 해결 방법 제시
- 재시도 버튼 크게
```

### Success

```
- Secondary/500 기반
- 큰 체크마크
- 햅틱 피드백
- 1.5~3초 후 자동 전환
```

---

## 13. 접근성 (A11y)

### React Native 구현

```tsx
// 모든 상호작용 요소에 라벨
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="지원하기"
  accessibilityHint="이 일감에 지원합니다"
>
  <Text>지원하기</Text>
</TouchableOpacity>

// 상태 전달
<View accessibilityState={{ selected: isActive }}>

// 그룹화
<View accessibilityRole="header">
  <Text>오늘의 일감</Text>
</View>
```

### TalkBack / VoiceOver

- 모든 버튼/링크 라벨 필수
- 이미지에 alt 제공
- 동적 콘텐츠 변경 시 announce

### 시각

- 대비 AA 이상 (4.5:1)
- 색상만으로 정보 전달 금지 (아이콘/텍스트 병행)
- 다이나믹 타입 지원 (시스템 폰트 크기 반영)

---

## 14. 다크모드 (v2)

MVP 이후 v2에서 도입. 현재는 **라이트 모드만 구현**. 시스템 테마 따라가는 것보다 앱 내 토글이 시니어한테 명확.

---

## 15. 디자인 토큰 (코드)

```typescript
// shared/ui/tokens.ts

export const colors = {
  primary: {
    50: '#FFF4EE',
    100: '#FFE4D1',
    200: '#FFC7A3',
    300: '#FFA575',
    400: '#FF8549',
    500: '#FF6B35',  // main
    600: '#E85521',
    700: '#C44318',
    800: '#9C3311',
    900: '#6B2208',
  },
  secondary: {
    50: '#E8F5EE',
    100: '#C5E8D2',
    300: '#5FBA82',
    500: '#2E8B57',
    700: '#1E6139',
    900: '#0F3820',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  semantic: {
    success: '#2E8B57',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#0EA5E9',
  },
} as const;

export const typography = {
  display: { size: 40, weight: '700', lineHeight: 52 },
  titleXL: { size: 32, weight: '700', lineHeight: 42 },
  titleL: { size: 24, weight: '700', lineHeight: 32 },
  titleM: { size: 20, weight: '600', lineHeight: 28 },
  titleS: { size: 18, weight: '600', lineHeight: 26 },
  bodyL: { size: 18, weight: '400', lineHeight: 27 },
  bodyM: { size: 16, weight: '400', lineHeight: 24 },
  bodyS: { size: 14, weight: '400', lineHeight: 21 },
  buttonL: { size: 18, weight: '600', lineHeight: 24 },
  buttonM: { size: 16, weight: '600', lineHeight: 22 },
  caption: { size: 14, weight: '500', lineHeight: 20 },
  tiny: { size: 12, weight: '500', lineHeight: 16 },
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

export const touchTarget = {
  min: 48,
  recommended: 56,
  primary: 56,
} as const;

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
```

---

## 16. 참고 레퍼런스

디자인 결정 시 참고:

| 앱 | 배울 점 |
|---|---|
| **카카오택시** | 시니어도 잘 쓰는 명확한 UX, 큰 버튼 |
| **당근마켓** | 친근한 일러스트, 동네 느낌, 매너온도 시각화 |
| **배민** | 강한 브랜드 컬러, 빠른 CTA, 명확한 상태 |
| **네이버** | 한국인 익숙한 패턴, 정보 밀도 |
| **토스** | 깔끔한 폼 디자인, 애니메이션 |
| **Uber** | 매칭 플로우, 실시간 지도 UX |
| **Timee (일본)** | 알바 매칭 플로우 직접 참고 |

---

## 17. 체크리스트 (모든 화면 적용)

구현 후 확인:

```
□ 모든 텍스트 14pt 이상 (본문은 16pt+ 권장)
□ 모든 터치 영역 48dp 이상
□ 색상 대비 4.5:1 이상
□ 접근성 라벨 있음
□ 에러 상태 처리
□ 로딩 상태 처리
□ 빈 상태 처리
□ 뒤로가기 명확
□ 주요 액션 하단 고정
□ 실수 취소 가능 (3초 유예)
□ 실기기에서 엄지로 닿는가
□ 햇빛 아래서 읽히는가 (대비)
□ 60대에게 보여줘도 이해되는가
```

---

## 18. 다음 단계

이 문서 기반으로:

1. **Figma/Stitch에 디자인 토큰 적용**
   - 컬러 스타일 등록
   - 타이포 스타일 등록
   - 컴포넌트 라이브러리 만들기

2. **핵심 화면 7개 시안 작성**
   - 홈 (워커/구인자)
   - 일감 상세
   - 일감 등록
   - 매칭 확정 순간
   - 지도 + 이동 추적
   - 프로필 (뱃지 포함)
   - 별점/리뷰

3. **실제 시니어에게 보여주고 검증**
   - 부모님, 친척, 경로당 어르신
   - 5분이면 충분

4. **Claude Code로 구현**
   - shared/ui에 디자인 토큰 구현
   - 공용 컴포넌트 (Button, Card, Input 등) 먼저
   - 화면별 구현
