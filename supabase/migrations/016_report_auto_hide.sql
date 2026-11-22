-- ============================================================
-- 인블루 · 016 신고 누적 자동 숨김 (report_count · is_hidden)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 015 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) 콘텐츠 6종(posts · comments · zone_reviews · user_foods ·
--      user_food_comments · user_parkings)에
--      report_count int not null default 0 · is_hidden bool not null default false
--   2) reports 에 신고가 들어오면(SECURITY DEFINER 트리거)
--      대상의 report_count 를 +1 하고, 10건 이상이면 is_hidden = true 로 자동 숨김
--   3) SELECT RLS 강화 — 숨김 콘텐츠는 마스터(is_admin())만 조회할 수 있고
--      일반 사용자·비로그인(anon)은 DB 단계에서 아예 받지 못합니다.
--   4) public.restore_reported_content() — 마스터가 숨김을 풀고 신고 수를 초기화
--      (같은 대상의 미처리 신고는 'dismissed' 로 정리)
--   5) 회원 탈퇴 함수에 user_food_comments 정리 추가
-- ============================================================

-- ------------------------------------------------------------
-- 1. 숨김·신고 수 컬럼
-- ------------------------------------------------------------
alter table public.posts
  add column if not exists report_count int not null default 0,
  add column if not exists is_hidden boolean not null default false;

alter table public.comments
  add column if not exists report_count int not null default 0,
  add column if not exists is_hidden boolean not null default false;

alter table public.zone_reviews
  add column if not exists report_count int not null default 0,
  add column if not exists is_hidden boolean not null default false;

alter table public.user_foods
  add column if not exists report_count int not null default 0,
  add column if not exists is_hidden boolean not null default false;

alter table public.user_food_comments
  add column if not exists report_count int not null default 0,
  add column if not exists is_hidden boolean not null default false;

alter table public.user_parkings
  add column if not exists report_count int not null default 0,
  add column if not exists is_hidden boolean not null default false;

comment on column public.posts.report_count is '누적 신고 수 (10건 이상이면 자동 숨김)';
comment on column public.comments.report_count is '누적 신고 수 (10건 이상이면 자동 숨김)';
comment on column public.zone_reviews.report_count is '누적 신고 수 (10건 이상이면 자동 숨김)';
comment on column public.user_foods.report_count is '누적 신고 수 (10건 이상이면 자동 숨김)';
comment on column public.user_food_comments.report_count is '누적 신고 수 (10건 이상이면 자동 숨김)';
comment on column public.user_parkings.report_count is '누적 신고 수 (10건 이상이면 자동 숨김)';

comment on column public.posts.is_hidden is '신고 누적으로 숨김 — 일반 사용자·비로그인 조회 불가, 마스터만 조회';
comment on column public.comments.is_hidden is '신고 누적으로 숨김 — 일반 사용자·비로그인 조회 불가, 마스터만 조회';
comment on column public.zone_reviews.is_hidden is '신고 누적으로 숨김 — 일반 사용자·비로그인 조회 불가, 마스터만 조회';
comment on column public.user_foods.is_hidden is '신고 누적으로 숨김 — 일반 사용자·비로그인 조회 불가, 마스터만 조회';
comment on column public.user_food_comments.is_hidden is '신고 누적으로 숨김 — 일반 사용자·비로그인 조회 불가, 마스터만 조회';
comment on column public.user_parkings.is_hidden is '신고 누적으로 숨김 — 일반 사용자·비로그인 조회 불가, 마스터만 조회';

create index if not exists posts_hidden_idx on public.posts (is_hidden);
create index if not exists comments_hidden_idx on public.comments (is_hidden);
create index if not exists zone_reviews_hidden_idx on public.zone_reviews (is_hidden);
create index if not exists user_foods_hidden_idx on public.user_foods (is_hidden);
create index if not exists user_food_comments_hidden_idx on public.user_food_comments (is_hidden);
create index if not exists user_parkings_hidden_idx on public.user_parkings (is_hidden);

-- ------------------------------------------------------------
-- 2. 신고 접수 → 대상 신고 수 +1, 10건이면 자동 숨김
--    (reports 는 마스터만 읽지만, 이 함수는 definer 권한으로 콘텐츠를 갱신합니다)
-- ------------------------------------------------------------
create or replace function public.apply_report_to_target()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_table text;
begin
  target_table := case new.target_type
    when 'post' then 'posts'
    when 'comment' then 'comments'
    when 'review' then 'zone_reviews'
    when 'user_food' then 'user_foods'
    when 'user_food_comment' then 'user_food_comments'
    when 'user_parking' then 'user_parkings'
    else null
  end;

  if target_table is null then
    return new;
  end if;

  execute format(
    'update public.%I
        set report_count = report_count + 1,
            is_hidden = (report_count + 1 >= 10)
      where id = $1',
    target_table
  ) using new.target_id;

  return new;
end;
$$;

comment on function public.apply_report_to_target() is
  '신고가 접수되면 대상 콘텐츠의 report_count 를 올리고 10건 이상이면 자동으로 숨깁니다';

drop trigger if exists reports_apply_to_target on public.reports;
create trigger reports_apply_to_target
  after insert on public.reports
  for each row execute function public.apply_report_to_target();

-- 신고 행이 지워지면 수치가 어긋나지 않도록 되돌립니다(숨김은 유지).
create or replace function public.rollback_report_to_target()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_table text;
begin
  target_table := case old.target_type
    when 'post' then 'posts'
    when 'comment' then 'comments'
    when 'review' then 'zone_reviews'
    when 'user_food' then 'user_foods'
    when 'user_food_comment' then 'user_food_comments'
    when 'user_parking' then 'user_parkings'
    else null
  end;

  if target_table is null then
    return old;
  end if;

  execute format(
    'update public.%I set report_count = greatest(0, report_count - 1) where id = $1',
    target_table
  ) using old.target_id;

  return old;
end;
$$;

drop trigger if exists reports_rollback_target on public.reports;
create trigger reports_rollback_target
  after delete on public.reports
  for each row execute function public.rollback_report_to_target();

-- ------------------------------------------------------------
-- 3. SELECT RLS 강화 — 숨김 콘텐츠는 마스터만
--    (기존 '공개 읽기' 정책을 같은 이름으로 다시 만들어 조건을 더합니다)
-- ------------------------------------------------------------
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public" on public.posts
  for select using (not is_hidden or public.is_admin());

drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public" on public.comments
  for select using (not is_hidden or public.is_admin());

drop policy if exists "zone_reviews_select_public" on public.zone_reviews;
create policy "zone_reviews_select_public" on public.zone_reviews
  for select using (not is_hidden or public.is_admin());

drop policy if exists "user_foods_select_public" on public.user_foods;
create policy "user_foods_select_public" on public.user_foods
  for select using (not is_hidden or public.is_admin());

drop policy if exists "user_food_comments_select_public" on public.user_food_comments;
create policy "user_food_comments_select_public" on public.user_food_comments
  for select using (not is_hidden or public.is_admin());

drop policy if exists "user_parkings_select_public" on public.user_parkings;
create policy "user_parkings_select_public" on public.user_parkings
  for select using (not is_hidden or public.is_admin());

-- ------------------------------------------------------------
-- 4. 마스터 복구 — 숨김 해제 · 신고 수 초기화 · 미처리 신고 기각
-- ------------------------------------------------------------
create or replace function public.restore_reported_content(
  p_target_type text,
  p_target_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_table text;
begin
  if not public.is_admin() then
    raise exception '마스터만 복구할 수 있어요' using errcode = '42501';
  end if;

  target_table := case p_target_type
    when 'post' then 'posts'
    when 'comment' then 'comments'
    when 'review' then 'zone_reviews'
    when 'user_food' then 'user_foods'
    when 'user_food_comment' then 'user_food_comments'
    when 'user_parking' then 'user_parkings'
    else null
  end;

  if target_table is null then
    raise exception '알 수 없는 신고 대상이에요' using errcode = '22023';
  end if;

  execute format(
    'update public.%I set is_hidden = false, report_count = 0 where id = $1',
    target_table
  ) using p_target_id;

  update public.reports
     set status = 'dismissed',
         resolved_at = now()
   where target_type = p_target_type
     and target_id = p_target_id
     and status = 'open';
end;
$$;

comment on function public.restore_reported_content(text, uuid) is
  '마스터가 신고 누적으로 숨겨진 콘텐츠를 복구합니다 (숨김 해제 · 신고 수 0 · 미처리 신고 기각)';

revoke all on function public.restore_reported_content(text, uuid) from public;
revoke all on function public.restore_reported_content(text, uuid) from anon;
grant execute on function public.restore_reported_content(text, uuid) to authenticated;

-- ------------------------------------------------------------
-- 5. 회원 탈퇴에 맛집 댓글 정리 추가
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

  -- 5-1. 내가 올린 사진 파일 (폴더가 내 uid 인 파일 + 소유자가 나인 파일)
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

  -- 5-2. 내가 남긴 콘텐츠 (글을 지우면 그 글의 댓글·좋아요도 함께 지워집니다)
  delete from public.posts where user_id = me;
  delete from public.comments where user_id = me;
  delete from public.zone_reviews where user_id = me;
  delete from public.user_food_comments where user_id = me;
  delete from public.user_foods where user_id = me;
  delete from public.user_parkings where user_id = me;
  delete from public.games where user_id = me;
  delete from public.saves where user_id = me;
  delete from public.post_likes where user_id = me;
  delete from public.reports where reporter_id = me;

  -- 5-3. 프로필 → 계정 (남은 자식 행은 FK cascade 로 정리됩니다)
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
-- 6. 확인용 (실행 결과에 남는 조회)
-- ------------------------------------------------------------
select 'column' as kind, table_name || '.' || column_name as name, data_type as value
  from information_schema.columns
 where table_schema = 'public'
   and column_name in ('report_count', 'is_hidden')
   and table_name in (
     'posts', 'comments', 'zone_reviews', 'user_foods', 'user_food_comments', 'user_parkings'
   )
union all
select 'select_policy', tablename, policyname || ' :: ' || coalesce(qual, '')
  from pg_policies
 where schemaname = 'public'
   and cmd = 'SELECT'
   and tablename in (
     'posts', 'comments', 'zone_reviews', 'user_foods', 'user_food_comments', 'user_parkings'
   )
union all
select 'trigger', tgname, tgrelid::regclass::text
  from pg_trigger
 where not tgisinternal
   and tgname in ('reports_apply_to_target', 'reports_rollback_target')
union all
select 'function', p.proname, pg_get_function_identity_arguments(p.oid)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('apply_report_to_target', 'rollback_report_to_target', 'restore_reported_content')
 order by 1, 2, 3;
