/**
 * 인증 화면 그룹.
 * 로그인, 회원가입, 온보딩 등이 여기 들어감.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
