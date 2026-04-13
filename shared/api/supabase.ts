/**
 * Supabase 클라이언트 인스턴스.
 *
 * 앱 전역에서 이 싱글턴을 import해서 사용.
 * React Native 환경용 설정: AsyncStorage로 세션 영속화.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    '.env 에 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 설정해주세요.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN 환경에서는 URL 기반 세션 감지 불필요
  },
});

/** 연결 상태 확인용 헬스체크 */
export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    // auth.getSession은 인증 필요 없이 연결만 테스트
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '알 수 없는 오류' };
  }
}
