/**
 * 일감 등록 시 비용 breakdown 카드.
 * 근무 대가 + 플랫폼 수수료 + PG 수수료 = 사장님 총 지출.
 * 모든 항목을 투명하게 표시 (docs/payment-model.md).
 */

import { Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, Text } from '@/shared/ui';
import {
  formatKRW,
  formatRate,
  JobPricing,
} from '@/shared/utils';

interface Props {
  pricing: JobPricing;
}

export function PricingBreakdown({ pricing }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Wallet size={18} color={colors.secondary[700]} />
        <Text variant="titleS" style={{ color: colors.secondary[700] }}>
          결제 금액 안내
        </Text>
      </View>

      <LineItem
        label="근무 대가 (워커 지급)"
        value={formatKRW(pricing.workerPay)}
      />
      <LineItem
        label={`플랫폼 수수료 (${formatRate(pricing.platformFeeRate)})`}
        value={formatKRW(pricing.platformFee)}
        hint="일해요 서비스 이용료"
      />
      <LineItem
        label={`결제 수수료 (${formatRate(pricing.pgFeeRate)})`}
        value={formatKRW(pricing.pgFee)}
        hint="토스페이먼츠 정산 수수료"
      />

      <View style={styles.divider} />

      <View style={styles.totalRow}>
        <Text variant="titleS">총 결제액</Text>
        <Text variant="titleL" style={{ color: colors.secondary[700] }}>
          {formatKRW(pricing.total)}
        </Text>
      </View>

      <Text variant="caption" color="muted" style={styles.escrowNotice}>
        일감 등록 시 위 금액이 에스크로로 예치됩니다. 근무 완료 후 워커에게 즉시
        송금되고, 일감이 취소되면 전액 환불됩니다.
      </Text>
    </View>
  );
}

function LineItem({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={styles.lineItem}>
      <View style={styles.labelBox}>
        <Text variant="bodyM" color="body">
          {label}
        </Text>
        {hint ? (
          <Text variant="caption" color="subtle">
            {hint}
          </Text>
        ) : null}
      </View>
      <Text variant="bodyL">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[5],
    borderRadius: radius.lg,
    backgroundColor: colors.secondary[50],
    borderWidth: 1,
    borderColor: colors.secondary[100],
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  labelBox: {
    flex: 1,
    gap: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.secondary[100],
    marginVertical: spacing[1],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  escrowNotice: {
    marginTop: spacing[2],
    lineHeight: 18,
  },
});
