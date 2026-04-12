/**
 * 일해요 (1haeyo) 디자인 토큰
 *
 * 모든 시각적 값은 여기서 관리. 직접 색상/크기 하드코딩 금지.
 * 자세한 설계 원칙은 docs/design.md 참조.
 */

// ─────────────────────────────────────────────────────────────
// 컬러 팔레트
// ─────────────────────────────────────────────────────────────

export const colors = {
  /** Primary: 주황 (워커 역할, 메인 CTA, 활기) */
  primary: {
    50: '#FFF4EE',
    100: '#FFE4D1',
    200: '#FFC7A3',
    300: '#FFA575',
    400: '#FF8549',
    500: '#FF6B35', // ⭐ 메인 브랜드 컬러
    600: '#E85521',
    700: '#C44318',
    800: '#9C3311',
    900: '#6B2208',
  },

  /** Secondary: 깊은 녹색 (구인자 역할, 완료, 신뢰) */
  secondary: {
    50: '#E8F5EE',
    100: '#C5E8D2',
    300: '#5FBA82',
    500: '#2E8B57', // ⭐ 메인 세컨더리
    700: '#1E6139',
    900: '#0F3820',
  },

  /** Neutral: 웜 그레이 (배경, 텍스트, 경계) */
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF9', // 앱 배경
    100: '#F5F5F4',
    200: '#E7E5E4', // 구분선
    300: '#D6D3D1',
    400: '#A8A29E', // placeholder
    500: '#78716C',
    600: '#57534E',
    700: '#44403C', // ⭐ 본문 메인 텍스트
    800: '#292524',
    900: '#1C1917',
  },

  /** Semantic: 상태 표시 */
  semantic: {
    success: '#2E8B57',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#0EA5E9',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// 타이포그래피
// ─────────────────────────────────────────────────────────────

/**
 * Pretendard 폰트 패밀리 (app/_layout.tsx에서 useFonts로 로드).
 *
 * React Native는 fontWeight 숫자를 직접 다루는 것보다
 * fontFamily로 폰트 굵기를 지정하는 게 안드로이드/iOS 일관성에 유리함.
 */
export const fonts = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

/**
 * 시니어 친화 폰트 스케일.
 * 일반 앱보다 한 단계씩 큼. 본문 기본 18pt.
 */
export const typography = {
  display: { fontSize: 40, fontFamily: fonts.bold, lineHeight: 52 },
  titleXL: { fontSize: 32, fontFamily: fonts.bold, lineHeight: 42 },
  titleL: { fontSize: 24, fontFamily: fonts.bold, lineHeight: 32 },
  titleM: { fontSize: 20, fontFamily: fonts.semibold, lineHeight: 28 },
  titleS: { fontSize: 18, fontFamily: fonts.semibold, lineHeight: 26 },

  bodyL: { fontSize: 18, fontFamily: fonts.regular, lineHeight: 27 }, // ⭐ 기본 본문
  bodyM: { fontSize: 16, fontFamily: fonts.regular, lineHeight: 24 },
  bodyS: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 21 },

  buttonL: { fontSize: 18, fontFamily: fonts.semibold, lineHeight: 24 },
  buttonM: { fontSize: 16, fontFamily: fonts.semibold, lineHeight: 22 },

  caption: { fontSize: 14, fontFamily: fonts.medium, lineHeight: 20 },
  tiny: { fontSize: 12, fontFamily: fonts.medium, lineHeight: 16 },
} as const;

// ─────────────────────────────────────────────────────────────
// 간격 (4의 배수)
// ─────────────────────────────────────────────────────────────

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24, // 화면 기본 좌우 패딩
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ─────────────────────────────────────────────────────────────
// 모서리 둥글기
// ─────────────────────────────────────────────────────────────

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// 그림자
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// 터치 영역 (시니어 친화 — 최소 48dp, 권장 56dp)
// ─────────────────────────────────────────────────────────────

export const touchTarget = {
  min: 48,
  recommended: 56,
  primary: 56,
} as const;

// ─────────────────────────────────────────────────────────────
// 모션 duration (ms)
// ─────────────────────────────────────────────────────────────

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
