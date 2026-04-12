# shared/ — 공용 레이어

feature 간 공유되는 UI, 유틸, 훅, API 클라이언트, 타입.

## 모듈 목록

| 모듈 | 역할 |
|---|---|
| `ui/` | 디자인 토큰, 공용 컴포넌트 (Button, Card, Input 등) |
| `api/` | Supabase 클라이언트, Realtime 설정 |
| `hooks/` | 범용 훅 (useDebounce, useKeyboard 등) |
| `utils/` | 순수 함수 유틸 (포매팅, 검증) |
| `types/` | 앱 전반의 공용 타입 |

## 원칙

- feature를 **import하면 안 됨** (단방향 의존)
- 순수해야 함. 비즈니스 로직 X
- 모든 feature가 쓰는 것만 여기 둠
