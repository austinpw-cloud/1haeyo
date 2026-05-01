/**
 * 일감 등록 화면.
 * 사장님이 새 일감을 등록하는 폼.
 *
 * Sprint 2 - 목 데이터 저장까지 구현.
 * 추후 Supabase 연동 + 지도 기반 장소 선택 예정.
 */

import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PricingBreakdown } from '@/features/jobs/components/PricingBreakdown';
import { StartDateTimePicker } from '@/features/jobs/components/StartDateTimePicker';
import { AddressPicker, AddressSelection } from '@/features/location';
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
import { calculateJobPricing, formatWon } from '@/shared/utils';

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

const durationOptions = [1, 2, 3, 4, 5, 6];

/** 초기 폼 기본값 생성기 (리셋에도 사용) */
function buildDefaults() {
  // 지금 + 1시간을 정시로 올림 (StartDateTimePicker 규칙과 일치)
  const startAt = new Date(Date.now() + 60 * 60 * 1000);
  if (startAt.getMinutes() > 0 || startAt.getSeconds() > 0) {
    startAt.setHours(startAt.getHours() + 1, 0, 0, 0);
  } else {
    startAt.setMinutes(0, 0, 0);
  }
  return {
    title: '',
    category: 'serving' as JobCategory,
    address: null as AddressSelection | null,
    startAt,
    duration: 2,
    hourlyRate: '15000',
    requiredCount: '1',
    urgent: false,
    contractConsent: false,
  };
}

export default function CreateJobScreen() {
  const router = useRouter();
  const { createJob } = useMockData();

  const defaults = useMemo(() => buildDefaults(), []);
  const [title, setTitle] = useState(defaults.title);
  const [category, setCategory] = useState<JobCategory>(defaults.category);
  const [address, setAddress] = useState<AddressSelection | null>(
    defaults.address
  );
  const [startAt, setStartAt] = useState<Date>(defaults.startAt);
  const [duration, setDuration] = useState(defaults.duration);
  const [hourlyRate, setHourlyRate] = useState(defaults.hourlyRate);
  const [requiredCount, setRequiredCount] = useState(defaults.requiredCount);
  const [urgent, setUrgent] = useState(defaults.urgent);
  const [contractConsent, setContractConsent] = useState(
    defaults.contractConsent
  );

  const resetForm = () => {
    const d = buildDefaults();
    setTitle(d.title);
    setCategory(d.category);
    setAddress(d.address);
    setStartAt(d.startAt);
    setDuration(d.duration);
    setHourlyRate(d.hourlyRate);
    setRequiredCount(d.requiredCount);
    setUrgent(d.urgent);
    setContractConsent(d.contractConsent);
  };

  const pricing = useMemo(() => {
    const rate = parseInt(hourlyRate, 10) || 0;
    return calculateJobPricing(rate, duration);
  }, [hourlyRate, duration]);
  const totalPay = pricing.workerPay;

  const isValid =
    title.trim().length > 0 &&
    !!address &&
    parseInt(hourlyRate, 10) >= 10030 &&
    parseInt(requiredCount, 10) >= 1 &&
    contractConsent;

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isValid) {
      if (!contractConsent) {
        Alert.alert(
          '근로계약 동의 필요',
          '아래 근로계약 조건 확인 체크박스를 눌러주세요.'
        );
        return;
      }
      Alert.alert('입력 확인', '모든 칸을 채워주세요. 시급은 최저임금(10,030원) 이상이어야 해요.');
      return;
    }

    // 시작 시간이 과거면 막기
    if (startAt.getTime() <= Date.now()) {
      Alert.alert(
        '시작 시간 확인',
        '시작 시간이 지금보다 이전이에요. 앞으로의 시간으로 설정해 주세요.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const job = await createJob({
        title: title.trim(),
        category,
        location: address!.name || address!.address,
        locationLat: address!.lat,
        locationLng: address!.lng,
        startAt: startAt.toISOString(),
        durationHours: duration,
        hourlyRate: parseInt(hourlyRate, 10),
        requiredCount: parseInt(requiredCount, 10),
        urgent,
      });

      resetForm();
      Alert.alert(
        '등록 완료',
        `"${job.title}" 일감이 등록되었어요.`,
        [{ text: '확인', onPress: () => router.replace('/(employer)') }]
      );
    } catch (e) {
      Alert.alert(
        '등록 실패',
        e instanceof Error ? e.message : '잠시 후 다시 시도해주세요.'
      );
    } finally {
      setSubmitting(false);
    }
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

        <View style={styles.labelGroup}>
          <AddressPicker
            label="장소"
            value={address ?? undefined}
            onChange={setAddress}
            hint="가게 이름이나 주소를 검색해서 선택해 주세요"
          />
        </View>

        <LabelGroup label="언제 필요해요?">
          <StartDateTimePicker value={startAt} onChange={setStartAt} />
          {(() => {
            const hoursUntil =
              (startAt.getTime() - Date.now()) / (1000 * 60 * 60);
            if (hoursUntil > 0 && hoursUntil <= 3) {
              return (
                <View style={styles.instantNotice}>
                  <Text variant="caption" style={styles.instantNoticeText}>
                    3시간 이내는 즉시 호출 모드 — 선착순 자동 매칭됩니다
                  </Text>
                </View>
              );
            }
            return null;
          })()}
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

        {/* 결제 금액 breakdown */}
        <View style={styles.pricingBox}>
          <PricingBreakdown pricing={pricing} />
        </View>

        {/* 근로계약 동의 체크박스 (전자서명) */}
        <Pressable
          style={[
            styles.consentBox,
            contractConsent && styles.consentBoxActive,
          ]}
          onPress={() => setContractConsent((v) => !v)}
        >
          <View
            style={[
              styles.checkbox,
              contractConsent && styles.checkboxActive,
            ]}
          >
            {contractConsent ? (
              <Text variant="titleS" color="inverse">
                ✓
              </Text>
            ) : null}
          </View>
          <View style={styles.consentTextBox}>
            <Text variant="bodyL" color="body">
              근로계약 조건 확인하고 등록합니다
            </Text>
            <Text variant="caption" color="muted" style={styles.consentHint}>
              체크 후 결제하면 사장님의 전자서명이 됩니다. 워커가 지원하면
              양측 서명이 결합된 근로계약서가 자동 체결돼요.
            </Text>
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
          disabled={!isValid || submitting}
          loading={submitting}
        >
          {`${formatWon(pricing.total)} 결제하고 등록`}
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
  pricingBox: {
    marginTop: spacing[4],
  },
  consentBox: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    marginTop: spacing[4],
    backgroundColor: colors.neutral[0],
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.neutral[200],
  },
  consentBoxActive: {
    borderColor: colors.secondary[500],
    backgroundColor: colors.secondary[50],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.secondary[500],
    borderColor: colors.secondary[500],
  },
  consentTextBox: {
    flex: 1,
    gap: spacing[1],
  },
  consentHint: {
    lineHeight: 18,
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
