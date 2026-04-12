/**
 * 사용자 역할 타입.
 *
 * UI 표기:
 *  - worker → "일손"
 *  - employer → "사장님"
 */
export type UserRole = 'worker' | 'employer';

export const RoleLabel: Record<UserRole, string> = {
  worker: '일손',
  employer: '사장님',
};

export const RoleAction: Record<UserRole, string> = {
  worker: '일하고 싶어요',
  employer: '사람을 찾아요',
};
