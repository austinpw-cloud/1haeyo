# native/ — 네이티브 플랫폼 통합

한국 생태계 네이티브 모듈을 래핑해서 features에 제공.

## 모듈 목록

| 모듈 | 역할 |
|---|---|
| `kakao/` | 카카오 로그인, 공유 (`react-native-kakao` 래퍼) |
| `maps/` | 네이버 지도 / 카카오맵 (WebView → 네이티브 SDK 단계적) |
| `portone/` | PortOne 결제 SDK 래퍼 |

## 원칙

- 네이티브 SDK 변경을 feature 단으로 숨김
- SDK 업데이트 시 여기만 수정
- 플랫폼별 분기 (iOS/Android)는 여기서 처리
