-- ============================================================================
-- 007_friendly_default_name.sql
-- 익명 사용자의 프로필 기본 이름을 "이름없음" → "사장님/일손/사용자 + short_id"로 개선.
-- Sprint 6 카카오 로그인 이후에는 카카오 닉네임으로 대체됨.
-- ============================================================================

-- 트리거 교체 — display_name이 metadata에 없으면 UUID 앞 4자리로 "사용자 a1b2c3" 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      '사용자 ' || substr(new.id::text, 1, 6)
    )
  );
  return new;
end;
$$;

-- 기존 "이름없음" 프로필도 정리
update public.profiles
set display_name = '사용자 ' || substr(id::text, 1, 6)
where display_name = '이름없음';

-- 기존 applications의 snapshot도 정리 (이후 지원 건에는 새 이름이 찍힘)
update public.applications
set snapshot_display_name = (
  select display_name from public.profiles where profiles.id = applications.worker_id
)
where snapshot_display_name = '이름없음';
