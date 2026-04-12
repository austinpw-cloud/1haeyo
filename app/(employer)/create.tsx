/**
 * 일감 등록 화면.
 * 사장님이 새 일감을 등록하는 폼.
 *
 * Sprint 2 - 목 데이터 저장까지 구현.
 * 추후 Supabase 연동 + 지도 기반 장소 선택 예정.
 */

import { useRouter } from 'expo-router';
import { Clock, Flame } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMockData } from '@/shared/store';
import { CategoryLabel, JobCategory } from '@/shared/types';
import {
  Button,
  colors,
  Input,
  radius,
  ScreenHeader,
  spacing,
  Text,
  touchTarget,
} from '@/shared/ui';
import { formatWon } from '@/shared/utils';

const categories: JobCategory[] = [
  'serving',
  'kitchen',
  'cafe',
  'convenience',
  'logistics',
  'event',
  'cleaning',
  'other',
];

type StartPreset = 'now1' | 'now3' | 'today' | 'tomorrow' | 'week';

const startPresets: { id: StartPreset; label: string; hoursOffset: number }[] = [
  { id: 'now1', label: '1시간 후', hoursOffset: 1 },
  { id: 'now3', label: '3시간 후', hoursOffset: 3 },
  { id: 'today', label: '오늘 저녁', hoursOffset: 6 },
  { id: 'tomorrow', label: '내일 오전', hoursOffset: 20 },
  { id: 'week', label: '이번 주', hoursOffset: 72 },
];

const durationOptions = [1, 2, 3, 4, 5, 6];

export default function CreateJobScreen() {
  const router = useRouter();
  const { createJob } = useMockData();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<JobCategory>('serving');
  const [location, setLocation] = useState('');
  const [startPreset, setStartPreset] = useState<StartPreset>('now3');
  const [duration, setDuration] = useState(2);
  const [hourlyRate, setHourlyRate] = useState('15000');
  const [requiredCount, setRequiredCount] = useState('1');
  const [urgent, setUrgent] = useState(false);

  const totalPay = useMemo(() => {
    const rate = parseInt(hourlyRate, 10) || 0;
    return rate * duration;
  }, [hourlyRate, duration]);

  const isValid =
    title.trim().length > 0 &&
    location.trim().length > 0 &&
    parseInt(hourlyRate, 10) >= 10030 &&
    parseInt(requiredCount, 10) >= 1;

  const handleSubmit = () => {
    if (!isValid) {
      Alert.alert('입력 확인', '모든 칸을 채워주세요. 시급은 최저임금(10,030원) 이상이어야 해요.');
      return;
    }

    const preset = startPresets.find((p) => p.id === startPreset)!;
    const startAt = new Date();
    startAt.setHours(startAt.getHours() + preset.hoursOffset);

    const job = createJob({
      title: title.trim(),
      category,
      location: location.trim(),
      startAt: startAt.toISOString(),
      durationHours: duration,
      hourlyRate: parseInt(hourlyRate, 10),
      requiredCount: parseInt(requiredCount, 10),
      urgent,
    });

    Alert.alert(
      '등록 완료',
      `"${job.title}" 일감이 등록되었어요.`,
      [{ text: '확인', onPress: () => router.replace('/(employer)') }]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="일감 등록"
        subtitle="언제, 어디서, 어떤 일손이 필요한지 알려주세요"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="일감 제목"
          placeholder="예: 점심 시간 홀서빙"
          value={title}
          onChangeText={setTitle}
          maxLength={40}
        />

        <LabelGroup label="업종">
          <View style={styles.chipRow}>
            {categories.map((c) => (
              <Chip
                key={c}
                selected={category === c}
                onPress={() => setCategory(c)}
              >
                {CategoryLabel[c]}
              </Chip>
            ))}
          </View>
        </LabelGroup>

        <Input
          label="장소"
          placeholder="예: 미금역 OO식당"
          value={location}
          onChangeText={setLocation}
          hint="나중에 지도로 선택할 수 있게 바뀔 거에요"
        />

        <LabelGroup label="언제 필요해요?">
          <View style={styles.chipRow}>
            {startPresets.map((p) => (
              <Chip
                key={p.id}
                selected={startPreset === p.id}
                onPress={() => setStartPreset(p.id)}
              >
                {p.label}
              </Chip>
            ))}
          </View>
          {(startPreset === 'now1' || startPreset === 'now3') && (
            <View style={styles.instantNotice}>
              <Clock size={14} color={colors.semantic.warning} />
              <Text variant="caption" style={styles.instantNoticeText}>
                3시간 이내는 즉시 호출 모드 — 선착순 자동 매칭됩니다
              </Text>
            </View>
          )}
        </LabelGroup>

        <LabelGroup label="근무 시간 (시간)">
          <View style={styles.chipRow}>
            {durationOptions.map((h) => (
              <Chip
                key={h}
                selected={duration === h}
                onPress={() => setDuration(h)}
              >
                {h}시간
              </Chip>
            ))}
          </View>
        </LabelGroup>

        <Input
          label="시급 (원)"
          placeholder="15000"
          value={hourlyRate}
          onChangeText={setHourlyRate}
          keyboardType="numeric"
          hint={`총 지급액: ${formatWon(totalPay)}`}
        />

        <Input
          label="필요 인원"
          placeholder="1"
          value={requiredCount}
          onChangeText={setRequiredCount}
          keyboardType="numeric"
        />

        <Pressable
          style={[styles.urgentToggle, urgent && styles.urgentToggleOn]}
          onPress={() => setUrgent((v) => !v)}
        >
          <Flame
            size={20}
            color={urgent ? colors.primary[500] : colors.neutral[400]}
          />
          <View style={styles.urgentTextBox}>
            <Text variant="titleS" color={urgent ? 'primary' : 'muted'}>
              긴급 표시
            </Text>
            <Text variant="caption" color="muted">
              일손 목록에서 상단 노출됩니다
            </Text>
          </View>
          <View
            style={[
              styles.toggleBox,
              { backgroundColor: urgent ? colors.primary[500] : colors.neutral[300] },
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                { transform: [{ translateX: urgent ? 20 : 0 }] },
              ]}
            />
          </View>
        </Pressable>

        <View style={{ height: spacing[8] }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={handleSubmit}
          disabled={!isValid}
        >
          일감 등록하기
        </Button>
      </View>
    </View>
  );
}

function LabelGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.labelGroup}>
      <Text variant="bodyM" color="body" style={styles.groupLabel}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Chip({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        selected && { backgroundColor: colors.secondary[500] },
      ]}
      onPress={onPress}
    >
      <Text
        variant="bodyM"
        color={selected ? 'inverse' : 'body'}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
  },
  labelGroup: {
    marginBottom: spacing[4],
  },
  groupLabel: {
    marginBottom: spacing[2],
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
  instantNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.semantic.warning + '15',
    borderRadius: radius.md,
  },
  instantNoticeText: {
    color: colors.semantic.warning,
    flex: 1,
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[5],
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  urgentToggleOn: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  urgentTextBox: {
    flex: 1,
    gap: spacing[1],
  },
  toggleBox: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neutral[0],
  },
  footer: {
    padding: spacing[6],
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
});
