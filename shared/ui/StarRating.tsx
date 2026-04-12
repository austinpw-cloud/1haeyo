/**
 * 별점 선택/표시 컴포넌트.
 * onChange 제공 시 탭해서 별점 변경 가능.
 * onChange 없으면 읽기 전용 표시.
 */

import { Star } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from './tokens';

interface Props {
  value: number; // 0~5
  onChange?: (next: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 32 }: Props) {
  const readonly = !onChange;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange?.(n)}
            disabled={readonly}
            hitSlop={8}
          >
            <Star
              size={size}
              color={filled ? '#FFB800' : colors.neutral[300]}
              fill={filled ? '#FFB800' : 'transparent'}
              strokeWidth={1.5}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});
