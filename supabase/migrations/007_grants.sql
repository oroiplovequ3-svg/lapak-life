-- ============================================================
-- 라팍생활 · 007 API 역할 권한(GRANT) 보정
-- Supabase SQL Editor 에서 전체를 실행하세요. (001~005 실행 후)
--
-- 왜 필요한가:
--  001~005 는 RLS 정책은 만들지만 anon / authenticated 역할에 대한
--  테이블 권한(GRANT)은 넣지 않습니다. Supabase 대시보드 SQL Editor 로
--  실행하면 기본 권한이 자동으로 붙지만, 그 밖의 경로(psql · 마이그레이션 도구)로
--  실행하면 권한이 비어 있어 앱이 "permission denied for table posts" 로 실패합니다.
--  RLS 정책은 그대로 행 단위 접근을 제한하므로, 아래 권한은 앱이 의도한 동작입니다.
-- ============================================================

grant usage on schema public to anon, authenticated;

-- 읽기: 누구나(비로그인 포함) 공개 데이터 조회. 행 범위는 RLS 정책이 제한합니다.
grant select on all tables in schema public to anon, authenticated;

-- 쓰기: 로그인한 사용자만. 실제 허용 범위는 RLS 정책이 제한합니다.
grant insert, update, delete on all tables in schema public to authenticated;

-- 앞으로 추가되는 테이블에도 같은 기본 권한 적용
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;

-- 시퀀스/함수 (필요 시)
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
