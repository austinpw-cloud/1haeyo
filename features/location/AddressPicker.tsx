/**
 * 주소 선택 컴포넌트.
 *
 * 1. 검색창에 장소명/주소 입력 → 카카오 로컬 API 호출
 * 2. 결과 리스트에서 선택 → 좌표 + 표시명 세팅
 * 3. 선택 후 KakaoMapView로 위치 미리보기 + 탭해서 미세 조정
 *
 * 시니어 친화: 큰 터치 영역, 검색 버튼은 명시적, 결과 리스트는 큼직.
 */

import { Search } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Button,
  colors,
  radius,
  spacing,
  Text,
  typography,
} from '@/shared/ui';
import { KakaoMapView, MapPoint } from './KakaoMapView';
import { PlaceResult, searchLocations } from './api/geocoding';

export interface AddressSelection {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  value?: AddressSelection;
  onChange: (selection: AddressSelection) => void;
  label?: string;
  hint?: string;
}

export function AddressPicker({ value, onChange, label = '장소', hint }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const found = await searchLocations(query.trim());
      setResults(found);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (r: PlaceResult) => {
    onChange({
      name: r.name,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
    });
    setResults([]);
    setSearched(false);
    setQuery('');
  };

  const handleMapAdjust = (point: MapPoint) => {
    if (!value) return;
    onChange({ ...value, lat: point.lat, lng: point.lng });
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyM" color="body" style={styles.label}>
        {label}
      </Text>

      {/* 검색창 */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.neutral[500]} />
          <TextInput
            style={styles.searchInput}
            placeholder="가게 이름이나 주소 검색"
            placeholderTextColor={colors.neutral[400]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <Button
          variant="primary"
          size="md"
          onPress={handleSearch}
          disabled={!query.trim() || searching}
          loading={searching}
        >
          검색
        </Button>
      </View>

      {hint && !value && (
        <Text variant="caption" color="muted" style={styles.hint}>
          {hint}
        </Text>
      )}

      {/* 검색 결과 리스트 */}
      {searching && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.secondary[500]} />
        </View>
      )}

      {!searching && searched && results.length === 0 && (
        <View style={styles.emptyResult}>
          <Text variant="bodyM" color="muted">
            검색 결과가 없어요. 다른 검색어로 시도해보세요.
          </Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultList}>
          {results.map((r, i) => (
            <Pressable
              key={`${r.lat}-${r.lng}-${i}`}
              style={styles.resultItem}
              onPress={() => handleSelect(r)}
            >
              <Text variant="titleS" style={styles.resultName}>
                {r.name}
              </Text>
              <Text variant="bodyM" color="muted">
                {r.address}
              </Text>
              {r.category && (
                <Text variant="caption" color="subtle" style={styles.resultCategory}>
                  {r.category}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* 선택된 위치 + 지도 미리보기 */}
      {value && (
        <View style={styles.selectedBox}>
          <View style={styles.selectedHeader}>
            <Text variant="titleS">{value.name}</Text>
            <Text variant="bodyM" color="muted">
              {value.address}
            </Text>
          </View>
          <KakaoMapView
            center={{ lat: value.lat, lng: value.lng }}
            marker={{ lat: value.lat, lng: value.lng }}
            onMapPress={handleMapAdjust}
            height={200}
          />
          <Text variant="caption" color="muted" style={styles.mapHint}>
            지도 탭해서 핀 위치를 미세 조정할 수 있어요
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  label: {
    marginBottom: spacing[1],
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyL,
    color: colors.neutral[800],
    paddingVertical: spacing[3],
  },
  hint: {
    marginTop: spacing[1],
  },
  loading: {
    padding: spacing[5],
    alignItems: 'center',
  },
  emptyResult: {
    padding: spacing[5],
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
  },
  resultList: {
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.neutral[0],
  },
  resultItem: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: spacing[1],
  },
  resultName: {},
  resultCategory: {
    marginTop: spacing[1],
  },
  selectedBox: {
    marginTop: spacing[3],
    gap: spacing[3],
  },
  selectedHeader: {
    gap: spacing[1],
  },
  mapHint: {
    textAlign: 'center',
  },
});
