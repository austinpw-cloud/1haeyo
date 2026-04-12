/**
 * Text 컴포넌트 — 타이포 토큰 기반 wrapper.
 *
 * React Native 기본 Text에 variant prop만 추가.
 * <Text variant="titleL">제목</Text> 처럼 쓰면 토큰 자동 적용.
 */

import {
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
} from 'react-native';
import { colors, typography } from './tokens';

export type TextVariant = keyof typeof typography;

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'body'
  | 'muted'
  | 'subtle'
  | 'inverse'
  | 'error'
  | 'success';

export interface TextProps extends RNTextProps {
  /** 타이포 스케일. 기본 bodyL (본문) */
  variant?: TextVariant;
  /** 의미 기반 컬러 */
  color?: TextColor;
}

export function Text({
  variant = 'bodyL',
  color = 'body',
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        colorStyles[color],
        style,
      ]}
      {...rest}
    />
  );
}

const colorStyles = StyleSheet.create({
  primary: { color: colors.primary[500] },
  secondary: { color: colors.secondary[500] },
  body: { color: colors.neutral[700] },
  muted: { color: colors.neutral[500] },
  subtle: { color: colors.neutral[400] },
  inverse: { color: colors.neutral[0] },
  error: { color: colors.semantic.error },
  success: { color: colors.semantic.success },
});
