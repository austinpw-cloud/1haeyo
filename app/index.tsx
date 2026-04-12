/**
 * 앱 진입 시 첫 화면.
 *
 * 현재 상태별 분기:
 *  - 로그인 안 됨 → /(auth)/login
 *  - 로그인 됐지만 역할 미선택 → /(auth)/role-select
 *  - 일손 역할 → /(worker)
 *  - 사장님 역할 → /(employer)
 *
 * Sprint 1에서 Supabase 세션 체크 + AsyncStorage 역할 복원 연결 예정.
 */

import { Redirect } from 'expo-router';
import { useRole } from '@/shared/hooks';

export default function Index() {
  const { role } = useRole();

  // TODO: Supabase 세션 체크 (Sprint 1에서 구현)
  const isLoggedIn = false;

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!role) {
    return <Redirect href="/(auth)/role-select" />;
  }

  if (role === 'worker') {
    return <Redirect href="/(worker)" />;
  }

  return <Redirect href="/(employer)" />;
}
