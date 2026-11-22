-- ============================================================
-- 인블루 · 015 직관러 맛집 댓글 (user_food_comments)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 · 004 · 007 · 012 · 014 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) public.user_food_comments — 직관러 맛집 카드에 달리는 댓글
--   2) user_foods.comment_count — 카드에 '💬 댓글 N' 으로 바로 보여 줄 댓글 수
--      (comments → posts.comment_count 와 같은 방식: 댓글 insert/delete 트리거)
--   3) reports.target_type 에 'user_food_comment' 추가 (맛집 댓글 신고)
--   4) GRANT · RLS — 읽기는 공개, 쓰기는 본인, 수정·삭제는 본인 또는 마스터
-- ============================================================

-- ------------------------------------------------------------
-- 1. 댓글 표
-- ------------------------------------------------------------
create table if not exists public.user_food_comments (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.user_foods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

comment on table public.user_food_comments is
  '직관러 맛집에 달린 댓글 (맛집·주차 탭의 직관러 맛집 카드)';

create index if not exists user_food_comments_food_idx
  on public.user_food_comments (food_id, created_at);
create index if not exists user_food_comments_user_idx
  on public.user_food_comments (user_id);

-- ------------------------------------------------------------
-- 2. 카드에 보여 줄 댓글 수 (user_foods.comment_count)
-- ------------------------------------------------------------
alter table public.user_foods
  add column if not exists comment_count int not null default 0;

comment on column public.user_foods.comment_count is
  '달린 댓글 수 (user_food_comments insert/delete 트리거가 자동 갱신)';

create or replace function public.set_user_food_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_food uuid;
begin
  target_food := coalesce(new.food_id, old.food_id);

  update public.user_foods
     set comment_count = (
           select count(*) from public.user_food_comments where food_id = target_food
         )
   where id = target_food;

  return coalesce(new, old);
end;
$$;

comment on function public.set_user_food_comment_count() is
  '맛집 댓글이 늘거나 줄면 user_foods.comment_count 를 다시 셉니다';

drop trigger if exists user_food_comments_count on public.user_food_comments;
create trigger user_food_comments_count
  after insert or delete on public.user_food_comments
  for each row execute function public.set_user_food_comment_count();

-- 이미 댓글이 있는 경우(재실행) 한 번 맞춰 둡니다.
update public.user_foods f
   set comment_count = (
         select count(*) from public.user_food_comments c where c.food_id = f.id
       );

-- ------------------------------------------------------------
-- 3. API 역할 권한 (007 과 같은 규칙)
-- ------------------------------------------------------------
grant select on public.user_food_comments to anon, authenticated;
grant insert, update, delete on public.user_food_comments to authenticated;

-- ------------------------------------------------------------
-- 4. RLS — 공개 읽기 · 본인 쓰기 · 마스터 수정/삭제
-- ------------------------------------------------------------
alter table public.user_food_comments enable row level security;

drop policy if exists "user_food_comments_select_public" on public.user_food_comments;
create policy "user_food_comments_select_public" on public.user_food_comments
  for select using (true);

drop policy if exists "user_food_comments_insert_own" on public.user_food_comments;
create policy "user_food_comments_insert_own" on public.user_food_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_food_comments_update_own" on public.user_food_comments;
create policy "user_food_comments_update_own" on public.user_food_comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_food_comments_delete_own" on public.user_food_comments;
create policy "user_food_comments_delete_own" on public.user_food_comments
  for delete using (auth.uid() = user_id);

drop policy if exists "user_food_comments_admin_update" on public.user_food_comments;
create policy "user_food_comments_admin_update" on public.user_food_comments
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "user_food_comments_admin_delete" on public.user_food_comments;
create policy "user_food_comments_admin_delete" on public.user_food_comments
  for delete to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 5. 신고 대상 종류에 'user_food_comment' 추가
--    (reports 는 012 에서 만들고, 014 에서 status 제약을 다시 잡았습니다)
-- ------------------------------------------------------------
alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
  check (target_type in (
    'post', 'comment', 'review', 'user_food', 'user_food_comment', 'user_parking'
  ));

-- ------------------------------------------------------------
-- 6. 확인용 (실행 결과에 남는 조회)
-- ------------------------------------------------------------
select 'table' as kind, 'user_food_comments' as name,
       (select count(*)::text from information_schema.tables
         where table_schema = 'public' and table_name = 'user_food_comments') as value
union all
select 'policy', policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and tablename = 'user_food_comments'
union all
select 'constraint', conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.reports'::regclass
   and conname = 'reports_target_type_check'
union all
select 'trigger', tgname, 'user_food_comments'
  from pg_trigger
 where tgrelid = 'public.user_food_comments'::regclass
   and not tgisinternal
 order by 1, 2;
