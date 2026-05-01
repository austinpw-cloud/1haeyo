-- ============================================================================
-- 006_enable_realtime.sql
-- Supabase Realtime — 테이블별 변경 이벤트를 WebSocket으로 브로드캐스트.
--
-- RLS가 여전히 적용되므로, 클라이언트는 본인이 볼 수 있는 row의 변경만 받음.
-- ============================================================================

-- 구독 대상 테이블 → supabase_realtime publication에 추가
alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.reviews;

-- REPLICA IDENTITY FULL로 UPDATE 이벤트의 OLD row 전체를 받도록 설정
-- (기본 DEFAULT는 PK만 보내서 필터/로컬 매칭에 불편)
alter table public.applications replica identity full;
alter table public.jobs replica identity full;
alter table public.matches replica identity full;
alter table public.reviews replica identity full;
