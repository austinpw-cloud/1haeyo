/**
 * 텍스트 입력 컴포넌트.
 *
 * 라벨 + 입력창 + 도움말/에러 세트를 한 번에 제공.
 * 시니어 친화를 위해 높이 56dp, 폰트 18pt.
 */

import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, touchTarget, typography } from './tokens';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** 상단 라벨 */
  label?: string;
  /** 하단 도움말 텍스트 */
  hint?: string;
  /** 에러 메시지 (있으면 빨간 테두리 + 메시지 표시) */
  error?: string;
}

export function Input({
  label,
  hint,
  error,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.semantic.error
    : focused
    ? colors.primary[500]
    : colors.neutral[200];

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="bodyM" color="body" style={styles.label}>
          {label}
        </Text>
      )}

      <TextInput
        style={[styles.input, { borderColor }]}
        placeholderTextColor={colors.neutral[400]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />

      {error ? (
        <Text variant="caption" color="error" style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="muted" style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    marginBottom: spacing[2],
  },
  input: {
    height: touchTarget.primary,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    ...typography.bodyL,
    color: colors.neutral[800],
    backgroundColor: colors.neutral[0],
  },
  message: {
    marginTop: spacing[2],
  },
});
