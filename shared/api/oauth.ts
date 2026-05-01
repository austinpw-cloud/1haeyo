/**
 * 소셜 로그인 OAuth 래퍼.
 *
 * Supabase OAuth + `expo-web-browser` 조합.
 * - 신규 로그인: `signInWithOAuth` → 별도 계정 생성
 * - 익명 계정 업그레이드: `linkIdentity` → 기존 데이터(일감/지원) 보존하며 소셜 계정 연결
 *
 * MVP 상태:
 *   - Google: 동작 (기본 로그인 방식)
 *   - Kakao: 코드는 있으나 account_email 권한 이슈로 실사용 불가.
 *     비즈 앱 전환 또는 Kakao 개인정보 동의항목 검수 통과 후 재활성화.
 */

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

const REDIRECT_URL = Linking.createURL('auth-callback');

export interface AuthResult {
  ok: boolean;
  error?: string;
}

// 호환성 유지용 별칭
export type KakaoAuthResult = AuthResult;

async function runOAuthFlow(authorizeUrl: string): Promise<AuthResult> {
  const res = await WebBrowser.openAuthSessionAsync(authorizeUrl, REDIRECT_URL);
  console.log('[oauth] result type:', res.type);
  if (res.type === 'success' && res.url) {
    console.log('[oauth] redirect url:', res.url);
    const params = extractHashOrQueryParams(res.url);
    console.log('[oauth] parsed params:', Object.keys(params));
    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) {
        return { ok: false, error: `exchange 실패: ${error.message}` };
      }
      return { ok: true };
    }
    if (params.error) {
      return { ok: false, error: `OAuth 에러: ${params.error_description ?? params.error}` };
    }
    // 마지막 수단: URL을 통째로 에러 메시지에 포함 (디버그용)
    const snippet = res.url.length > 250 ? res.url.substring(0, 250) + '...' : res.url;
    return {
      ok: false,
      error: `세션 토큰 없음.\n키: [${Object.keys(params).join(', ')}]\nURL: ${snippet}`,
    };
  }
  if (res.type === 'cancel' || res.type === 'dismiss') {
    return { ok: false, error: '로그인이 취소되었어요.' };
  }
  return { ok: false, error: `로그인 실패 (type=${res.type}).` };
}

function extractHashOrQueryParams(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const parsed = Linking.parse(url);
    if (parsed.queryParams) {
      for (const [k, v] of Object.entries(parsed.queryParams)) {
        if (typeof v === 'string') out[k] = v;
      }
    }
    const hashIdx = url.indexOf('#');
    if (hashIdx >= 0) {
      const hash = url.substring(hashIdx + 1);
      const pairs = hash.split('&');
      for (const p of pairs) {
        const [k, v] = p.split('=');
        if (k && v) out[decodeURIComponent(k)] = decodeURIComponent(v);
      }
    }
  } catch {
    // parse 실패는 무시
  }
  return out;
}

// ─────────────────────────────────────────
// Google
// ─────────────────────────────────────────

export async function signInWithGoogle(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? '구글 인증 URL을 받지 못했어요.' };
  }
  return runOAuthFlow(data.url);
}

export async function linkGoogleToAnonymous(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? '구글 연결 URL을 받지 못했어요.' };
  }
  return runOAuthFlow(data.url);
}

// ─────────────────────────────────────────
// Kakao (비활성 — 비즈 앱 전환 후 재활성화)
// ─────────────────────────────────────────

const KAKAO_SCOPES = 'profile_nickname profile_image';

export async function signInWithKakao(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
      scopes: KAKAO_SCOPES,
    },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? '카카오 인증 URL을 받지 못했어요.' };
  }
  return runOAuthFlow(data.url);
}

export async function linkKakaoToAnonymous(): Promise<AuthResult> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'kakao',
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
      scopes: KAKAO_SCOPES,
    },
  });
  if (error || !data?.url) {
    return { ok: false, error: error?.message ?? '카카오 연결 URL을 받지 못했어요.' };
  }
  return runOAuthFlow(data.url);
}
