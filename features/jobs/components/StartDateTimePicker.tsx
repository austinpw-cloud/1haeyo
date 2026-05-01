/**
 * 시작 날짜/시간 선택 컴포넌트.
 *
 * 규칙 (시니어 친화 + 공정성):
 *  - 분 단위 없음. 모든 일감은 정시(00분) 시작.
 *  - 최소 시작 = 지금 + 1시간, 정시로 올림.
 *  - 오늘 날짜에서 이미 지난 시간은 UI에서 숨김.
 *  - 날짜 프리셋: 오늘 / 내일 / 모레 / 직접 선택 (네이티브 달력, 오늘 이후만).
 *  - 시간: 모든 유효 시간을 칩 그리드로. 네이티브 time picker 사용 안 함 (분 단위 노출 방지).
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  colors,
  radius,
  spacing,
  Text,
  touchTarget,
} from '@/shared/ui';

interface Props {
  value: Date;
  onChange: (next: Date) => void;
}

export function StartDateTimePicker({ value, onChange }: Props) {
  const [dateOpen, setDateOpen] = useState(false);

  // 최소 선택 가능 시각: 지금+1시간을 정시로 올림
  const minHourly = useMemo(() => {
    const m = new Date(Date.now() + 60 * 60 * 1000);
    if (m.getMinutes() > 0 || m.getSeconds() > 0) {
      m.setHours(m.getHours() + 1, 0, 0, 0);
    } else {
      m.setMinutes(0, 0, 0);
    }
    return m;
  }, []);

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const valueDay = startOfDay(value);

  // 선택된 날짜에서 사용 가능한 시작 시간 목록 (0~23)
  const availableHours = useMemo(() => {
    const result: number[] = [];
    const isToday = valueDay.getTime() === today.getTime();
    const minHour = isToday ? minHourly.getHours() : 0;
    const maxHour = 23;
    for (let h = minHour; h <= maxHour; h++) {
      result.push(h);
    }
    return result;
  }, [valueDay, today, minHourly]);

  const setDate = (d: Date) => {
    const next = new Date(value);
    next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    next.setSeconds(0, 0);
    // 날짜 바꿀 때 기존 시간이 새 날짜의 최소보다 작으면 최소값으로
    const isToday = startOfDay(next).getTime() === today.getTime();
    const minHour = isToday ? minHourly.getHours() : 0;
    if (next.getHours() < minHour) {
      next.setHours(minHour, 0, 0, 0);
    } else {
      next.setMinutes(0, 0, 0);
    }
    onChange(next);
  };

  const setHour = (hour: number) => {
    const next = new Date(value);
    next.setHours(hour, 0, 0, 0);
    onChange(next);
  };

  const isSameDay = (a: Date, b: Date) => a.getTime() === b.getTime();

  // 오늘 선택 가능한 시간이 하나도 없으면 오늘 칩 비활성
  const todayHasAnyHour = minHourly.getHours() <= 23 && minHourly.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text variant="titleM" color="body">
          {formatDateTime(value)}
        </Text>
      </View>

      {/* 날짜 */}
      <Text variant="bodyM" color="muted" style={styles.label}>
        날짜
      </Text>
      <View style={styles.chipRow}>
        <DateChip
          label="오늘"
          selected={isSameDay(valueDay, today)}
          disabled={!todayHasAnyHour}
          onPress={() => setDate(today)}
        />
        <DateChip
          label="내일"
          selected={isSameDay(valueDay, tomorrow)}
          onPress={() => setDate(tomorrow)}
        />
        <DateChip
          label="모레"
          selected={isSameDay(valueDay, dayAfter)}
          onPress={() => setDate(dayAfter)}
        />
        <Pressable style={styles.customChip} onPress={() => setDateOpen(true)}>
          <Calendar size={16} color={colors.neutral[700]} />
          <Text variant="bodyM" color="body">
            직접 선택
          </Text>
        </Pressable>
      </View>

      {/* 시간 — 정시만, 분 단위 없음 */}
      <Text variant="bodyM" color="muted" style={[styles.label, styles.timeLabel]}>
        시간 (정시만 선택 가능)
      </Text>
      {availableHours.length === 0 ? (
        <View style={styles.noneBox}>
          <Text variant="bodyM" color="muted">
            오늘 선택 가능한 시간이 없어요. 내일 이후로 선택해 주세요.
          </Text>
        </View>
      ) : (
        <View style={styles.chipRow}>
          {availableHours.map((h) => {
            const selected = value.getHours() === h && value.getMinutes() === 0;
            return (
              <DateChip
                key={h}
                label={hourLabel(h)}
                selected={selected}
                onPress={() => setHour(h)}
              />
            );
          })}
        </View>
      )}

      {dateOpen && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={today}
          onChange={(event, selected) => {
            setDateOpen(false);
            if (event.type === 'set' && selected) setDate(selected);
          }}
        />
      )}
    </View>
  );
}

function DateChip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        selected && { backgroundColor: colors.secondary[500] },
        disabled && styles.chipDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        variant="bodyM"
        color={selected ? 'inverse' : disabled ? 'subtle' : 'body'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function hourLabel(h: number): string {
  if (h === 0) return '밤 12시';
  if (h < 6) return `새벽 ${h}시`;
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return '낮 12시';
  if (h < 18) return `오후 ${h - 12}시`;
  if (h < 22) return `저녁 ${h - 12}시`;
  return `밤 ${h - 12}시`;
}

function formatDateTime(d: Date): string {
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  let dayLabel: string;
  if (diffDays === 0) dayLabel = '오늘';
  else if (diffDays === 1) dayLabel = '내일';
  else if (diffDays === 2) dayLabel = '모레';
  else dayLabel = `${d.getMonth() + 1}월 ${d.getDate()}일`;

  return `${dayLabel} · ${hourLabel(d.getHours())}`;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  summary: {
    backgroundColor: colors.neutral[0],
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.secondary[100],
    marginBottom: spacing[2],
  },
  label: {
    marginBottom: spacing[1],
  },
  timeLabel: {
    marginTop: spacing[3],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    minHeight: touchTarget.min - 4,
    justifyContent: 'center',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    minHeight: touchTarget.min - 4,
  },
  noneBox: {
    padding: spacing[4],
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
  },
});
