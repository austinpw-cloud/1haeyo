/**
 * 카카오맵 WebView 래퍼.
 *
 * expo managed에서 네이티브 SDK 대신 WebView + JavaScript API 사용.
 * HTML 문자열을 주입해 카카오맵을 렌더하고, postMessage로 클릭 좌표를 받음.
 *
 * 보안: Client 도메인은 카카오 콘솔 "제품 링크 관리 > 웹 도메인"에 등록된
 * http://localhost 등과 매칭돼야 로드됨.
 */

import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, radius, Text } from '@/shared/ui';

const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

export interface MapPoint {
  lat: number;
  lng: number;
}

interface Props {
  /** 지도 중심 좌표 */
  center: MapPoint;
  /** 마커 위치 (미지정 시 center) */
  marker?: MapPoint;
  /** 확대 레벨 (카카오 기준 1~14, 기본 3) */
  level?: number;
  /** 탭했을 때 좌표 회수 (주소 선택 UX) */
  onMapPress?: (point: MapPoint) => void;
  /** 지도 높이 */
  height?: number;
  style?: ViewStyle;
  /** 탭 인터랙션 비활성화 (미리보기 용도) */
  interactive?: boolean;
}

/** 분당 미금역 좌표 — 기본값 (GPS 없을 때 폴백) */
const DEFAULT_CENTER: MapPoint = { lat: 37.3503, lng: 127.1081 };

export function KakaoMapView({
  center,
  marker,
  level = 3,
  onMapPress,
  height = 240,
  style,
  interactive = true,
}: Props) {
  const webViewRef = useRef<WebView>(null);
  const [debugMsg, setDebugMsg] = useState<string | null>('지도 로딩 중…');
  const markerPoint = marker ?? center;

  const html = useMemo(
    () => buildMapHtml({ center, marker: markerPoint, level, interactive }),
    [center.lat, center.lng, markerPoint.lat, markerPoint.lng, level, interactive]
  );

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'map_press' && onMapPress) {
        onMapPress({ lat: data.lat, lng: data.lng });
      } else if (data.type === 'ready') {
        setDebugMsg(null);
      } else if (data.type === 'log') {
        console.log('[KakaoMap]', data.message);
      } else if (data.type === 'error') {
        setDebugMsg(`지도 오류: ${data.message ?? '원인 불명'}`);
      } else if (data.type === 'sdk_fail') {
        setDebugMsg(
          `카카오 SDK 로드 실패 (${data.message ?? '원인 불명'})\n\n확인: 플랫폼 키 > JavaScript 키 > JavaScript SDK 도메인에 http://localhost 등록`
        );
      }
    } catch {
      // 파싱 실패 무시
    }
  };

  if (!KAKAO_JS_KEY) {
    return (
      <View
        style={[
          styles.fallback,
          { height },
          style,
        ]}
      />
    );
  }

  return (
    <View style={[{ height, borderRadius: radius.md, overflow: 'hidden' }, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://1haeyo.com' }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={styles.webview}
      />
      {debugMsg && (
        <View style={styles.debugOverlay} pointerEvents="none">
          <Text variant="bodyM" style={styles.debugText}>
            {debugMsg}
          </Text>
        </View>
      )}
    </View>
  );
}

KakaoMapView.DEFAULT_CENTER = DEFAULT_CENTER;

function buildMapHtml({
  center,
  marker,
  level,
  interactive,
}: {
  center: MapPoint;
  marker: MapPoint;
  level: number;
  interactive: boolean;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
    body { background: #f3f4f6; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // 디버그 상태 추적
    var dbgState = { start: Date.now(), scriptAppended: false, scriptOnload: false, kakaoReady: false };
    function send(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    function summary() {
      var elapsed = Math.round((Date.now() - dbgState.start) / 1000);
      return 'origin=' + window.location.href
        + ' elapsed=' + elapsed + 's'
        + ' appended=' + dbgState.scriptAppended
        + ' onload=' + dbgState.scriptOnload
        + ' kakaoReady=' + dbgState.kakaoReady;
    }

    // 20초 타임아웃 (네트워크 느린 경우 대비)
    var loadTimer = setTimeout(function() {
      send({ type: 'error', message: '지도 초기화 타임아웃 (20초). ' + summary() });
    }, 20000);

    try {
      var sdkScript = document.createElement('script');
      // autoload=false — 공식 문서 권장 패턴
      sdkScript.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false';
      sdkScript.onerror = function() {
        clearTimeout(loadTimer);
        send({ type: 'sdk_fail', message: 'onerror. ' + summary() });
      };
      sdkScript.onload = function() {
        dbgState.scriptOnload = true;
        // 1차 시도: 공식 kakao.maps.load(callback) 패턴
        if (typeof kakao !== 'undefined' && kakao.maps && typeof kakao.maps.load === 'function') {
          try {
            kakao.maps.load(function() {
              if (kakao.maps.Map) {
                dbgState.kakaoReady = true;
                initMap();
              } else {
                // 콜백은 왔는데 Map 없음 → 폴링 폴백
                pollForMap();
              }
            });
            // .load 콜백이 안 올 수 있으니 폴링 폴백 동시 시작
            setTimeout(pollForMap, 500);
            return;
          } catch (e) {
            // .load 호출 실패 → 폴링
          }
        }
        pollForMap();
      };
      document.head.appendChild(sdkScript);
      dbgState.scriptAppended = true;
    } catch (e) {
      clearTimeout(loadTimer);
      send({ type: 'error', message: 'script append 실패: ' + e.message });
    }

    // Map constructor 준비될 때까지 100ms 간격 폴링 (최대 15초)
    var pollStarted = false;
    function pollForMap() {
      if (pollStarted) return;
      pollStarted = true;
      var attempts = 0;
      (function check() {
        if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.Map) {
          dbgState.kakaoReady = true;
          initMap();
          return;
        }
        if (++attempts >= 150) { // 15초
          clearTimeout(loadTimer);
          send({ type: 'sdk_fail', message: 'polling 15초 타임아웃. ' + summary() });
          return;
        }
        setTimeout(check, 100);
      })();
    }

    var initCalled = false;
    function initMap() {
      if (initCalled) return;
      initCalled = true;
      clearTimeout(loadTimer);
      (function() {
      try {
        var center = new kakao.maps.LatLng(${center.lat}, ${center.lng});
        var map = new kakao.maps.Map(document.getElementById('map'), {
          center: center,
          level: ${level},
          draggable: ${interactive},
          scrollwheel: ${interactive},
          disableDoubleClick: ${!interactive},
          disableDoubleClickZoom: ${!interactive}
        });
        var marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(${marker.lat}, ${marker.lng}),
          map: map
        });
        ${
          interactive
            ? `kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
                var latlng = mouseEvent.latLng;
                marker.setPosition(latlng);
                send({ type: 'map_press', lat: latlng.getLat(), lng: latlng.getLng() });
              });`
            : ''
        }
        send({ type: 'ready' });
      } catch (e) {
        send({ type: 'error', message: e.message });
      }
      })();
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  fallback: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
  },
  debugOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  debugText: {
    textAlign: 'center',
    color: colors.neutral[700],
  },
});
