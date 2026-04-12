/**
 * 버튼 컴포넌트.
 *
 * variants:
 *  - primary   : 주황 배경, 흰 글자. 메인 CTA
 *  - secondary : 녹색 배경, 흰 글자. 사장님 메인 CTA
 *  - outline   : 테두리만, 중립 텍스트
 *  - ghost     : 배경 없음, 텍스트만
 *  - kakao     : 카카오 노란색 (로그인 전용)
 *
 * sizes:
 *  - lg (56dp)  : 메인 CTA
 *  - md (48dp)  : 일반
 *  - sm (40dp)  : 보조
 */

import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from './tokens';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'kakao';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** 버튼 텍스트 */
  children: ReactNode;
  /** 시각적 스타일 변형 */
  variant?: ButtonVariant;
  /** 높이 */
  size?: ButtonSize;
  /** 전체 너비로 확장 */
  fullWidth?: boolean;
  /** 로딩 스피너 표시 */
  loading?: boolean;
  /** 좌측 아이콘 */
  leftIcon?: ReactNode;
  /** 우측 아이콘 */
  rightIcon?: ReactNode;
  /** 외부 스타일 오버라이드 */
  style?: StyleProp<ViewStyle>;
}

export function Button({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant].container,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ];

  const textStyle = [
    sizeTextStyles[size],
    variantStyles[variant].text,
    isDisabled && styles.disabledText,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      disabled={isDisabled}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles[variant].text.color as string}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={textStyle}>{children}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing[5],
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  lg: { height: touchTarget.primary },
  md: { height: touchTarget.min },
  sm: { height: 40 },
};

const sizeTextStyles = {
  lg: typography.buttonL,
  md: typography.buttonM,
  sm: typography.caption,
} as const;

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; text: { color: string } }
> = {
  primary: {
    container: { backgroundColor: colors.primary[500] },
    text: { color: colors.neutral[0] },
  },
  secondary: {
    container: { backgroundColor: colors.secondary[500] },
    text: { color: colors.neutral[0] },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.neutral[300],
    },
    text: { color: colors.neutral[700] },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary[500] },
  },
  kakao: {
    container: { backgroundColor: '#FEE500' },
    text: { color: '#191919' },
  },
};
