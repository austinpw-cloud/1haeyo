/**
 * 근무 완료 후 양방향 리뷰 작성 모달.
 * 역할(일손/사장님)에 따라 물어보는 질문이 다름.
 */

import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Button,
  colors,
  radius,
  spacing,
  StarRating,
  Text,
  typography,
} from '@/shared/ui';

interface Props {
  visible: boolean;
  mode: 'worker' | 'employer';
  jobTitle: string;
  counterpartName: string;
  onSubmit: (rating: number, comment: string) => void;
  onClose: () => void;
}

export function ReviewModal({
  visible,
  mode,
  jobTitle,
  counterpartName,
  onSubmit,
  onClose,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const isWorker = mode === 'worker'; // 일손이 사장님을 평가

  const heading = isWorker
    ? '사장님은 어떠셨나요?'
    : '일손은 어떠셨나요?';
  const hint = isWorker
    ? '근무 환경, 업무 명확도, 친절도 등을 평가해 주세요'
    : '근태, 업무 태도, 일머리 등을 평가해 주세요';

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment.trim());
    setRating(0);
    setComment('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text variant="titleL">{heading}</Text>
            <Text variant="bodyM" color="muted" style={styles.sub}>
              {jobTitle} · {counterpartName}
            </Text>

            <View style={styles.ratingBox}>
              <StarRating value={rating} onChange={setRating} size={40} />
              <Text variant="bodyM" color="muted" style={styles.ratingLabel}>
                {rating === 0
                  ? '별을 탭하여 평가해 주세요'
                  : rating <= 2
                  ? '아쉬웠어요'
                  : rating <= 3
                  ? '괜찮았어요'
                  : rating <= 4
                  ? '좋았어요'
                  : '최고였어요'}
              </Text>
            </View>

            <Text variant="bodyM" color="body" style={styles.commentLabel}>
              한 줄 후기 (선택)
            </Text>
            <Text variant="caption" color="muted" style={styles.commentHint}>
              {hint}
            </Text>
            <TextInput
              style={styles.textarea}
              placeholder="자세한 후기를 남겨주세요"
              placeholderTextColor={colors.neutral[400]}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={200}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button variant="outline" size="lg" onPress={onClose} style={{ flex: 1 }}>
              나중에
            </Button>
            <Button
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              disabled={rating === 0}
              style={{ flex: 2 }}
            >
              리뷰 제출
            </Button>
          </View>
        </View>

        <Pressable style={styles.touchOutside} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  touchOutside: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  sheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing[3],
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  sub: {
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  ratingBox: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    backgroundColor: colors.neutral[50],
    borderRadius: radius.lg,
    marginBottom: spacing[6],
  },
  ratingLabel: {
    marginTop: spacing[4],
  },
  commentLabel: {
    marginBottom: spacing[1],
  },
  commentHint: {
    marginBottom: spacing[3],
  },
  textarea: {
    minHeight: 100,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    padding: spacing[4],
    ...typography.bodyL,
    color: colors.neutral[800],
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[2],
    padding: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
});
