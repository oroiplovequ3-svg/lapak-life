-- ============================================================
-- 인블루 · 011 마스터(관리자) 계정 (2026-11-22)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 · 007 · 009 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) public.app_admins — 마스터로 지정한 계정의 이메일만 담는 표
--      (RLS 켜짐 + anon/authenticated 권한 회수 → 앱·비로그인 모두 읽을 수 없음)
--   2) public.is_admin() — 지금 로그인한 계정이 마스터인지 확인하는 함수
--   3) 글 · 댓글 · 시야 후기 · 직관러 맛집 · 직관러 주차 팁에 대해
--      마스터는 남의 글도 UPDATE / DELETE 할 수 있게 하는 RLS 정책
--
-- 마스터 계정 이메일은 이 파일에 적지 않습니다.
-- 이 파일을 실행한 뒤 SQL Editor 에서 아래 한 줄을 따로 실행하세요.
--   insert into public.app_admins (email) values ('<마스터 이메일>') on conflict do nothing;
-- ============================================================

-- 1) 마스터 명단 ----------------------------------------------------
create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

comment on table public.app_admins is
  '마스터(관리자) 계정 이메일 명단 — 앱에서는 읽을 수 없고 is_admin() 만 참조합니다';

alter table public.app_admins enable row level security;

-- RLS 만으로도 일반 역할은 아무 행도 못 읽지만, 권한 자체를 회수해 한 번 더 막습니다.
revoke all on table public.app_admins from anon, authenticated;

-- 2) 마스터 여부 확인 함수 ------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.app_admins
     where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

comment on function public.is_admin() is
  '지금 로그인한 계정(auth.jwt 의 email)이 마스터 명단에 있으면 true';

grant execute on function public.is_admin() to anon, authenticated;

-- 3) 마스터 수정·삭제 정책 ------------------------------------------
-- 기존의 본인 글 정책(posts_update_own 등)은 그대로 두고,
-- 마스터용 정책을 하나 더 붙입니다. (정책은 OR 로 합쳐집니다)

drop policy if exists "posts_admin_update" on public.posts;
create policy "posts_admin_update" on public.posts
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "posts_admin_delete" on public.posts;
create policy "posts_admin_delete" on public.posts
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "comments_admin_update" on public.comments;
create policy "comments_admin_update" on public.comments
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "comments_admin_delete" on public.comments;
create policy "comments_admin_delete" on public.comments
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "zone_reviews_admin_update" on public.zone_reviews;
create policy "zone_reviews_admin_update" on public.zone_reviews
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "zone_reviews_admin_delete" on public.zone_reviews;
create policy "zone_reviews_admin_delete" on public.zone_reviews
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "user_foods_admin_update" on public.user_foods;
create policy "user_foods_admin_update" on public.user_foods
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "user_foods_admin_delete" on public.user_foods;
create policy "user_foods_admin_delete" on public.user_foods
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "user_parkings_admin_update" on public.user_parkings;
create policy "user_parkings_admin_update" on public.user_parkings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "user_parkings_admin_delete" on public.user_parkings;
create policy "user_parkings_admin_delete" on public.user_parkings
  for delete to authenticated
  using (public.is_admin());

-- 4) 역할 권한 확인 (007 과 같은 내용 · 재실행 안전) ----------------
grant update, delete on public.posts to authenticated;
grant update, delete on public.comments to authenticated;
grant update, delete on public.zone_reviews to authenticated;
grant update, delete on public.user_foods to authenticated;
grant update, delete on public.user_parkings to authenticated;

-- 5) 확인용 (실행 결과에 남는 조회) ----------------------------------
select tablename, policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and policyname like '%\_admin\_%'
 order by tablename, policyname;
