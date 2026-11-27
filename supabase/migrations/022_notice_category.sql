-- ============================================================
-- 인블루 · 022 공지 카테고리 (2026-11-27)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 021 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) posts.category CHECK 에 'notice' 추가
--      (전체 · 공지 · 직관후기 · 실시간현장 · 소통해요 · 굿즈 · 블루웨이브 후기 · 이벤트)
--   2) 공지 글은 마스터(is_admin())만 쓸 수 있게 RLS 강화 (018 의 이벤트와 같은 규칙)
--      · posts_insert_own : 새 글 category in ('event','notice') 는 마스터만
--      · posts_update_own : 기존 글을 'event'/'notice' 로 바꾸는 것도 마스터만
--      · 두 정책 모두 NOT public.is_banned() 를 함께 확인 (017 과 같은 규칙)
--   3) 공지에 달리는 댓글·좋아요는 그대로 —
--      정지되지 않은 로그인 회원 누구나 공지에도 댓글·좋아요를 남길 수 있습니다.
--   4) 화면의 '상단 고정'은 읽기 정렬일 뿐이라 DB 는 건드리지 않습니다.
--      (앱이 category='notice' 글을 피드 맨 위에 고정해 보여 줍니다)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 카테고리 CHECK 제약에 'notice' 추가
-- ------------------------------------------------------------
alter table public.posts drop constraint if exists posts_category_check;

alter table public.posts
  add constraint posts_category_check
  check (category in ('notice', 'review', 'live', 'talk', 'goods', 'bluewave', 'event'));

comment on column public.posts.category is
  '라팍톡 카테고리 — notice · review · live · talk · goods · bluewave · event(notice·event 는 마스터만 작성)';

-- ------------------------------------------------------------
-- 2. 공지·이벤트 글 작성·수정은 마스터만 (RLS)
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
    and (category not in ('event', 'notice') or public.is_admin())
  );

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and not public.is_banned()
    and (category not in ('event', 'notice') or public.is_admin())
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
