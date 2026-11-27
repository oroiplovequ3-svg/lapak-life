-- ============================================================
-- 인블루 · 023 이벤트 카테고리 삭제 (2026-11-27)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 022 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 바꾸는 것
--   1) posts.category CHECK 에서 'event' 제거
--      (전체 · 공지 · 직관후기 · 실시간현장 · 소통해요 · 굿즈 · 블루웨이브 후기)
--   2) 공지(notice)만 마스터 전용으로 남기고, RLS 조건에서 'event' 를 정리
--      · posts_insert_own : 새 글 category = 'notice' 는 마스터만
--      · posts_update_own : 기존 글을 'notice' 로 바꾸는 것도 마스터만
--      · 두 정책 모두 NOT public.is_banned() 를 함께 확인 (017 과 같은 규칙)
--   3) event 글이 남아 있으면 중단합니다.
--      CHECK 제약을 바꾸면 기존 event 행이 위반이 되므로, 지우거나 옮긴 뒤 실행하세요.
--      (2026-11-27: 마스터가 남긴 이벤트 글 1건을 확인 후 삭제하고 실행했습니다)
--   4) 018 이벤트 카테고리 · 020 블루웨이브 · 022 공지 마이그레이션 파일은 기록으로 그대로 둡니다.
-- ============================================================

-- ------------------------------------------------------------
-- 0. 남아 있는 event 글이 있으면 중단 (데이터 보호)
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.posts where category = 'event') then
    raise exception
      'category = ''event'' 글이 남아 있어 중단합니다. 글이 지워지지 않도록 먼저 확인해 주세요.';
  end if;
end $$;

-- ------------------------------------------------------------
-- 1. 카테고리 CHECK 제약에서 'event' 제거
-- ------------------------------------------------------------
alter table public.posts drop constraint if exists posts_category_check;

alter table public.posts
  add constraint posts_category_check
  check (category in ('notice', 'review', 'live', 'talk', 'goods', 'bluewave'));

comment on column public.posts.category is
  '라팍톡 카테고리 — notice · review · live · talk · goods · bluewave(notice 는 마스터만 작성)';

-- ------------------------------------------------------------
-- 2. 공지 글 작성·수정은 마스터만 (RLS)
--    기존 본인 글 정책을 같은 이름으로 다시 만들며 조건을 더합니다.
--    (마스터는 011 의 posts_admin_update 정책으로도 통과합니다)
--    · 017 의 RESTRICTIVE 정책(insert/update/delete + NOT is_banned)은 그대로 둡니다.
-- ------------------------------------------------------------
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and (category <> 'notice' or public.is_admin())
  );

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and (category <> 'notice' or public.is_admin())
  );

-- ------------------------------------------------------------
-- 3. 확인용 (실행 결과에 남는 조회)
-- ------------------------------------------------------------
select 'check' as kind,
       conname as name,
       pg_get_constraintdef(oid) as value
  from pg_constraint
 where conrelid = 'public.posts'::regclass
   and conname = 'posts_category_check'
union all
select 'insert_policy', policyname, coalesce(with_check, '')
  from pg_policies
 where schemaname = 'public' and tablename = 'posts' and cmd = 'INSERT'
union all
select 'update_policy', policyname, coalesce(with_check, '')
  from pg_policies
 where schemaname = 'public' and tablename = 'posts' and cmd = 'UPDATE'
 order by 1, 2;
