-- ============================================================
-- 인블루 · 021 마스터 화면 회원 수·로그인 통계 (2026-11-27)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 · 011 · 017 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) public.admin_user_stats() — 마스터 전용 회원 현황 한 줄 요약
--      · total_users     전체 회원 수 (auth.users 기준)
--      · banned_users    현재 영구 정지된 회원 수 (banned_users)
--      · active_users    정지를 뺀 회원 수 (total_users - banned_users)
--      · today_signins   KST 오늘 00:00 이후 로그인한 회원 수 (last_sign_in_at)
--      · week_signins    최근 7일(168시간) 안에 로그인한 회원 수
--      · new_today       KST 오늘 00:00 이후 가입한 회원 수
--      · last_signin_at  마지막 로그인 시각 (없으면 null)
--   2) security definer + public.is_admin() 검증 · anon 권한 회수
--      → 일반 회원·비로그인은 함수를 호출해도 42501 로 막힙니다.
--
-- 기존 admin_list_users() 는 반환 시그니처를 건드리지 않습니다.
-- (프론트 listUsers() 호환 유지 · 통계는 이 가벼운 RPC 하나로 따로 읽습니다)
-- ============================================================

create or replace function public.admin_user_stats()
returns table (
  total_users bigint,
  active_users bigint,
  banned_users bigint,
  today_signins bigint,
  week_signins bigint,
  new_today bigint,
  last_signin_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  -- Supabase 서버는 UTC 로 도는데, 서비스 기준일은 한국 시간(KST)입니다.
  kst_today_start timestamptz :=
    date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
begin
  if not public.is_admin() then
    raise exception '마스터만 회원 현황을 볼 수 있어요' using errcode = '42501';
  end if;

  return query
    with base as (
      select u.id, u.last_sign_in_at, u.created_at, (b.user_id is not null) as is_banned
        from auth.users u
        left join public.banned_users b on b.user_id = u.id
    )
    select
      count(*) as total_users,
      count(*) filter (where not base.is_banned) as active_users,
      count(*) filter (where base.is_banned) as banned_users,
      count(*) filter (
        where base.last_sign_in_at is not null and base.last_sign_in_at >= kst_today_start
      ) as today_signins,
      count(*) filter (
        where base.last_sign_in_at is not null
          and base.last_sign_in_at >= now() - interval '7 days'
      ) as week_signins,
      count(*) filter (where base.created_at >= kst_today_start) as new_today,
      max(base.last_sign_in_at) as last_signin_at
    from base;
end;
$$;

comment on function public.admin_user_stats() is
  '마스터 전용 회원 현황 — 전체·정지·활성 회원 수, KST 오늘/최근 7일 로그인 수, 오늘 가입 수';

revoke all on function public.admin_user_stats() from public;
revoke all on function public.admin_user_stats() from anon;
grant execute on function public.admin_user_stats() to authenticated;

-- ------------------------------------------------------------
-- 확인용 (실행 결과에 남는 조회)
-- ------------------------------------------------------------
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer,
       r.rolname as owner_role
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_roles r on r.oid = p.proowner
 where n.nspname = 'public'
   and p.proname = 'admin_user_stats';
