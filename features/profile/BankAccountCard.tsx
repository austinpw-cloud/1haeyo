/**
 * 워커 은행 계좌 등록 카드.
 * 근무 완료 시 즉시 송금 받을 계좌 정보.
 */

import { Landmark } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { supabase } from '@/shared/api';
import { useAuth } from '@/shared/hooks';
import {
  Button,
  Card,
  colors,
  Input,
  radius,
  spacing,
  Text,
} from '@/shared/ui';

const BANKS = [
  '농협은행',
  'KB국민은행',
  '우리은행',
  '신한은행',
  '하나은행',
  'IBK기업은행',
  '토스뱅크',
  '카카오뱅크',
  'SC제일은행',
  '부산은행',
  '대구은행',
  '경남은행',
  '광주은행',
  '전북은행',
  'MG새마을금고',
  '신협',
];

export function BankAccountCard() {
  const { user } = useAuth();
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('bank_name, bank_account_number, bank_account_holder')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setBankName(data.bank_name ?? '');
        setAccountNumber(data.bank_account_number ?? '');
        setHolder(data.bank_account_holder ?? '');
        setHasSaved(!!data.bank_name && !!data.bank_account_number);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!bankName || !accountNumber.trim() || !holder.trim()) {
      Alert.alert('입력 확인', '은행, 계좌번호, 예금주 모두 입력해주세요.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        bank_name: bankName,
        bank_account_number: accountNumber.trim(),
        bank_account_holder: holder.trim(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      Alert.alert('저장 실패', error.message);
      return;
    }
    setHasSaved(true);
    Alert.alert('저장 완료', '근무 완료 시 이 계좌로 즉시 송금됩니다.');
  };

  if (loading) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Landmark size={18} color={colors.secondary[700]} />
        <Text variant="titleS">정산 계좌</Text>
        {hasSaved && (
          <Text variant="caption" color="success" style={styles.savedBadge}>
            ✓ 저장됨
          </Text>
        )}
      </View>
      <Text variant="caption" color="muted" style={styles.desc}>
        근무 완료 시 이 계좌로 즉시 송금됩니다. 본인 명의 계좌만 등록해 주세요.
      </Text>

      <View style={styles.field}>
        <Text variant="bodyM" color="body" style={styles.fieldLabel}>
          은행
        </Text>
        <Pressable
          style={styles.bankSelector}
          onPress={() => setPicking((v) => !v)}
        >
          <Text variant="bodyL" color={bankName ? 'body' : 'subtle'}>
            {bankName || '은행을 선택해주세요'}
          </Text>
        </Pressable>
        {picking && (
          <View style={styles.bankGrid}>
            {BANKS.map((b) => (
              <Pressable
                key={b}
                style={[
                  styles.bankChip,
                  bankName === b && styles.bankChipSelected,
                ]}
                onPress={() => {
                  setBankName(b);
                  setPicking(false);
                }}
              >
                <Text
                  variant="bodyM"
                  color={bankName === b ? 'inverse' : 'body'}
                >
                  {b}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Input
        label="계좌번호"
        placeholder="- 없이 숫자만"
        keyboardType="number-pad"
        value={accountNumber}
        onChangeText={setAccountNumber}
      />
      <Input
        label="예금주"
        placeholder="본인 실명"
        value={holder}
        onChangeText={setHolder}
      />

      <Button
        variant="primary"
        size="md"
        fullWidth
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.saveButton}
      >
        {hasSaved ? '계좌 정보 업데이트' : '계좌 등록하기'}
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  savedBadge: {
    marginLeft: 'auto',
  },
  desc: {
    lineHeight: 18,
  },
  field: {
    gap: spacing[2],
  },
  fieldLabel: {},
  bankSelector: {
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.neutral[0],
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  bankChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  bankChipSelected: {
    backgroundColor: colors.secondary[500],
  },
  saveButton: {
    marginTop: spacing[2],
  },
});
