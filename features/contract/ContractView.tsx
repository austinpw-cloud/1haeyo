/**
 * 근로계약서 표시 컴포넌트.
 * 고용노동부 표준양식 기반. 양측 서명 시각 + 해시 포함.
 *
 * 실제 PDF 생성은 Sprint 8 후반(expo-print)에 추가.
 */

import { FileText } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, Text } from '@/shared/ui';
import { formatKRW } from '@/shared/utils';
import type { Contract } from './api/contracts.api';

interface Props {
  contract: Contract;
}

export function ContractView({ contract }: Props) {
  const body = contract.contractBody;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <FileText size={20} color={colors.secondary[700]} />
        <Text variant="titleL" style={styles.title}>
          근로계약서
        </Text>
      </View>

      <Text variant="caption" color="muted" style={styles.legal}>
        근로기준법 제17조에 따른 표준근로계약서 (일해요 전자양식)
      </Text>

      <Section title="1. 근로자 · 사용자">
        <Row label="사용자 (사업주)" value={body.employer_name} />
        <Row label="근로자" value={body.worker_name} />
      </Section>

      <Section title="2. 근로 조건">
        <Row label="업무 내용" value={body.job_title} />
        <Row label="근무 장소" value={body.location} />
        <Row label="근로 시작 시각" value={formatKST(body.start_at)} />
        <Row label="근로 시간" value={`${body.duration_hours}시간`} />
      </Section>

      <Section title="3. 임금">
        <Row label="시급" value={formatKRW(body.hourly_rate)} />
        <Row label="지급 총액" value={formatKRW(body.worker_pay)} highlight />
        <Row
          label="지급 방식"
          value="근무 완료 후 즉시 (토스페이먼츠 송금)"
        />
      </Section>

      <Section title="4. 기타">
        <Text variant="bodyM" color="body" style={styles.clause}>
          본 계약은 전자문서 및 전자거래 기본법 제4조, 전자서명법(2020)에 따라
          종이 계약서와 동일한 효력을 갖습니다.
        </Text>
        <Text variant="bodyM" color="body" style={styles.clause}>
          근로자는 근로기준법 제17조에 따라 본 계약서 사본을 교부받습니다
          (앱 내 "내 계약서"에서 언제든 조회 가능).
        </Text>
      </Section>

      <Section title="5. 서명">
        <Row
          label="사용자 서명"
          value={`${body.employer_name} · ${formatKST(contract.employerSignedAt)}`}
        />
        <Row
          label="근로자 서명"
          value={
            contract.workerSignedAt
              ? `${body.worker_name} · ${formatKST(contract.workerSignedAt)}`
              : '서명 대기 중'
          }
        />
      </Section>

      <View style={styles.footer}>
        <Text variant="caption" color="subtle">
          계약 식별 해시: {contract.contentHash}
        </Text>
        <Text variant="caption" color="subtle">
          법적 상태: {legalStatusLabel(contract.legalStatus)}
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="titleS" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text variant="bodyM" color="muted" style={styles.rowLabel}>
        {label}
      </Text>
      <Text
        variant={highlight ? 'titleM' : 'bodyL'}
        style={[styles.rowValue, highlight && { color: colors.secondary[700] }]}
      >
        {value}
      </Text>
    </View>
  );
}

function formatKST(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function legalStatusLabel(status: Contract['legalStatus']): string {
  switch (status) {
    case 'simple_consent':
      return '단순 전자서명 (앱 내 체크박스 동의)';
    case 'certified_identity':
      return '본인 인증 동반 서명 (PASS/카카오/토스)';
    case 'notarized':
      return 'KISA 타임스탬프 공인 서명';
  }
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing[6],
    gap: spacing[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {},
  legal: {
    marginTop: -spacing[2],
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    color: colors.secondary[700],
  },
  sectionBody: {
    gap: spacing[2],
    padding: spacing[4],
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
  },
  row: {
    gap: spacing[1],
  },
  rowLabel: {},
  rowValue: {},
  clause: {
    lineHeight: 22,
  },
  footer: {
    gap: spacing[1],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.neutral[100],
  },
});
