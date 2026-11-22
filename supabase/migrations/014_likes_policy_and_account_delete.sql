-- ============================================================
-- 인블루 · 014 좋아요 비공개 · 신고 기각 · 회원 탈퇴 (2026-11-22)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 013 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) post_likes SELECT 정책을 "내 행만"으로 좁힘
--      - 앱은 로그인한 사람의 좋아요 여부만 확인하므로 공개 SELECT 가 필요 없습니다.
--      - 기존 공개 정책 때문에 anon 키로 "누가 어떤 글에 좋아요했는지"를 훑을 수 있었습니다.
--      - posts.like_count 는 SECURITY DEFINER 트리거(set_post_counts)가 유지하므로
--        이 정책을 좁혀도 집계는 그대로 갱신됩니다.
--   2) reports.status 에 'dismissed'(기각) 추가 — 신고 처리 루프의 "문제 없음" 상태
--   3) public.delete_own_account() — 회원 탈퇴(계정 삭제)
--      본인 사진(Storage) → 본인 콘텐츠 → 프로필 → auth.users 순서로 지웁니다.
--      앱의 설정 > 회원 탈퇴 버튼이 이 함수를 호출합니다.
-- ============================================================

-- ------------------------------------------------------------
-- 1. post_likes 는 내 좋아요만 읽을 수 있게
-- ------------------------------------------------------------
drop policy if exists "post_likes_select_public" on public.post_likes;
drop policy if exists "post_likes_select_own" on public.post_likes;
create policy "post_likes_select_own" on public.post_likes
  for select to authenticated
  using (auth.uid() = user_id);

-- 비로그인에게는 좋아요 표 자체를 열지 않습니다(앱도 조회하지 않음).
revoke select on public.post_likes from anon;
grant select on public.post_likes to authenticated;

comment on table public.post_likes is
  '글 좋아요 — 본인 행만 읽고 쓸 수 있습니다. 글의 좋아요 수는 posts.like_count 트리거가 유지합니다.';

-- ------------------------------------------------------------
-- 2. 신고 상태에 기각(dismissed) 추가
-- ------------------------------------------------------------
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('open', 'resolved', 'dismissed'));

comment on column public.reports.status is
  'open=접수됨 · resolved=삭제 등으로 처리 완료 · dismissed=문제 없음으로 기각';

-- ------------------------------------------------------------
-- 3. 회원 탈퇴 — 본인 계정과 콘텐츠·사진을 한 번에 삭제
--    SECURITY DEFINER 로 실행되어 RLS·Storage 정책을 우회하지만,
--    지울 대상은 언제나 auth.uid() 본인으로 고정합니다.
-- ------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception '로그인이 필요합니다' using errcode = '42501';
  end if;

  -- 3-1. 내가 올린 사진 파일 (폴더가 내 uid 인 파일 + 소유자가 나인 파일)
  delete from storage.objects
   where bucket_id in (
           'avatars',
           'checkin-photos',
           'review-photos',
           'user-food-photos',
           'post-photos'
         )
     and (
       (storage.foldername(name))[1] = me::text
       or owner = me
     );

  -- 3-2. 내가 남긴 콘텐츠 (글을 지우면 그 글의 댓글·좋아요도 함께 지워집니다)
  delete from public.posts where user_id = me;
  delete from public.comments where user_id = me;
  delete from public.zone_reviews where user_id = me;
  delete from public.user_foods where user_id = me;
  delete from public.user_parkings where user_id = me;
  delete from public.games where user_id = me;
  delete from public.saves where user_id = me;
  delete from public.post_likes where user_id = me;
  delete from public.reports where reporter_id = me;

  -- 3-3. 프로필 → 계정 (남은 자식 행은 FK cascade 로 정리됩니다)
  delete from public.profiles where id = me;
  delete from auth.users where id = me;
end;
$$;

comment on function public.delete_own_account() is
  '회원 탈퇴 — 본인 사진·콘텐츠·프로필·계정을 지웁니다. 본인(auth.uid())만 실행할 수 있습니다.';

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

-- ------------------------------------------------------------
-- 4. 확인용 (실행 결과에 남는 조회)
-- ------------------------------------------------------------
select 'policy' as kind, policyname as name, cmd as value
  from pg_policies
 where schemaname = 'public'
   and tablename = 'post_likes'
union all
select 'fn', p.proname, pg_get_function_identity_arguments(p.oid)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname = 'delete_own_account'
union all
select 'fn_security', p.proname, (case when p.prosecdef then 'definer' else 'invoker' end)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('delete_own_account', 'set_post_counts')
union all
select 'report_status_check', conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.reports'::regclass
   and conname = 'reports_status_check'
union all
select 'acl', 'delete_own_account', coalesce(array_to_string(proacl::text[], ' | '), '')
  from pg_proc
 where proname = 'delete_own_account'
   and pronamespace = 'public'::regnamespace
 order by 1, 2;
