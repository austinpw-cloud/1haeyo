/**
 * 현재 위치 훅.
 *
 * 권한 요청 + GPS 좌표 반환.
 * 권한 거부/불가 시 null로 폴백 (UI는 지도 기본 중심 유지).
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import type { MapPoint } from '../KakaoMapView';

type Status =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'error';

interface Result {
  point: MapPoint | null;
  status: Status;
  /** 현재 위치를 즉시 갱신하고 값 반환. state 업데이트를 기다릴 필요 없이 호출부에서 바로 사용 가능. */
  refresh: () => Promise<MapPoint | null>;
}

/** 앱 시작 시 또는 화면 진입 시 호출. 조용히 실패해도 앱 동작은 유지. */
export function useCurrentLocation(autoRequest = true): Result {
  const [point, setPoint] = useState<MapPoint | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const refresh = useCallback(async (): Promise<MapPoint | null> => {
    setStatus('requesting');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const next: MapPoint = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
      setPoint(next);
      setStatus('granted');
      return next;
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoRequest) refresh();
  }, [autoRequest, refresh]);

  return { point, status, refresh };
}

/**
 * 두 지점 간 거리 (미터).
 * Haversine 공식. 체크인 시 거리 검증에 사용.
 */
export function distanceMeters(a: MapPoint, b: MapPoint): number {
  const R = 6371000; // 지구 반지름 (m)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa));
  return R * c;
}
