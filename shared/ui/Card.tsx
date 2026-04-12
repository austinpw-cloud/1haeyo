/**
 * Card 컴포넌트 — 공통 카드 UI.
 *
 * 일감 카드, 프로필 카드 등에 쓰임.
 * onPress prop 있으면 Pressable로 동작.
 */

import { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadows, spacing } from './tokens';

export interface CardProps {
  children: ReactNode;
  /** 누를 수 있게 만들기 */
  onPress?: () => void;
  /** 그림자 강도 */
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  /** 내부 패딩. 기본 20px */
  padding?: number;
  /** 외부 스타일 */
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  elevation = 'md',
  padding = spacing[5],
  style,
}: CardProps) {
  const cardStyle = [
    styles.base,
    { padding },
    elevation !== 'none' && shadows[elevation],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
