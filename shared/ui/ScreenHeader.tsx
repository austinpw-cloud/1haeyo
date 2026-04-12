/**
 * 화면 상단 헤더 (제목 + 부제).
 * 탭 화면 상단에 공통으로 쓰임.
 */

import { StyleSheet, View } from 'react-native';
import { spacing } from './tokens';
import { Text } from './Text';

export interface ScreenHeaderProps {
  /** 작은 인사말 (ex: "안녕하세요 👋") */
  greeting?: string;
  /** 화면 제목 */
  title: string;
  /** 제목 아래 부제 */
  subtitle?: string;
}

export function ScreenHeader({ greeting, title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {greeting && (
        <Text variant="bodyL" color="muted" style={styles.greeting}>
          {greeting}
        </Text>
      )}
      <Text variant="titleL" color="body">
        {title}
      </Text>
      {subtitle && (
        <Text variant="bodyL" color="muted" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  greeting: {
    marginBottom: spacing[1],
  },
  subtitle: {
    marginTop: spacing[1],
  },
});
