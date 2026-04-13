/**
 * 인증 상태 Provider.
 *
 * 앱 시작 시 자동으로 익명 로그인 (Sprint 5 단계).
 * Sprint 6에서 카카오 로그인으로 업그레이드 예정.
 *
 * Supabase의 manual linking 기능으로 익명 계정을 카카오 계정에 연결 가능.
 * 그래서 지금 쌓인 데이터가 나중에도 그대로 보존됨.
 */

import { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '@/shared/api';

interface AuthContextValue {
  /** 현재 세션 */
  session: Session | null;
  /** 현재 사용자 */
  user: User | null;
  /** 인증 초기화 중 */
  isLoading: boolean;
  /** 에러 메시지 (있을 경우) */
  error: string | null;
  /** 익명 여부 (카카오 연동 후 false) */
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1) 기존 세션 확인
    (async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        if (mounted) {
          setError(sessionError.message);
          setIsLoading(false);
        }
        return;
      }

      if (sessionData.session) {
        // 이미 로그인 상태
        if (mounted) {
          setSession(sessionData.session);
          setIsLoading(false);
        }
        return;
      }

      // 2) 세션 없으면 익명 로그인
      const { data: anonData, error: anonError } =
        await supabase.auth.signInAnonymously();

      if (anonError) {
        if (mounted) {
          setError(anonError.message);
          setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        setSession(anonData.session);
        setIsLoading(false);
      }
    })();

    // 3) 이후 세션 변경 감지 (로그아웃, 토큰 갱신 등)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 익명 여부 판별: user.is_anonymous 또는 email 없음
  const isAnonymous = useMemo(() => {
    const u = session?.user;
    if (!u) return false;
    return Boolean((u as User & { is_anonymous?: boolean }).is_anonymous) || !u.email;
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      error,
      isAnonymous,
    }),
    [session, isLoading, error, isAnonymous]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
