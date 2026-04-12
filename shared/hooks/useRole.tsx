/**
 * 현재 사용자 역할 상태 관리.
 *
 * MVP에서는 메모리 상태만 사용 (앱 재시작 시 초기화).
 * Sprint 1에서 AsyncStorage + Supabase로 영속화 예정.
 */

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { UserRole } from '@/shared/types';

interface RoleContextValue {
  /** 현재 선택된 역할. null이면 아직 선택 전 */
  role: UserRole | null;
  /** 역할 설정 (로그인 시, 역할 전환 시) */
  setRole: (role: UserRole) => void;
  /** 역할 해제 (로그아웃 시) */
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(null);

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next);
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole은 RoleProvider 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
