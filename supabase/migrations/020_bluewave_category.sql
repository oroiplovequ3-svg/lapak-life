-- ============================================================
-- 인블루 · 020 블루웨이브 후기 카테고리 (2026-11-27)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 019 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) posts.category CHECK 에 'bluewave' 추가
--      (전체 · 직관후기 · 실시간현장 · 소통해요 · 굿즈 · 블루웨이브 후기 · 이벤트)
--   2) 블루웨이브 후기는 일반 회원 누구나 쓸 수 있으므로
--      018 의 RLS(이벤트=마스터 전용)는 그대로 두고 손대지 않습니다.
--      · posts_insert_own : category <> 'event' or is_admin()  → 'bluewave' 는 통과
--      · posts_update_own : 위와 같음
-- ============================================================

-- ------------------------------------------------------------
-- 1. 카테고리 CHECK 제약에 'bluewave' 추가
-- ------------------------------------------------------------
alter table public.posts drop constraint if exists posts_category_check;

alter table public.posts
  add constraint posts_category_check
  check (category in ('review', 'live', 'talk', 'goods', 'bluewave', 'event'));

comment on column public.posts.category is
  '라팍톡 카테고리 — review · live · talk · goods · bluewave · event(event 는 마스터만 작성)';

-- ------------------------------------------------------------
-- 2. 확인용 (실행 결과에 남는 조회)
-- ------------------------------------------------------------
select 'check' as kind,
       conname as name,
       pg_get_constraintdef(oid) as value
  from pg_constraint
 where conrelid = 'public.posts'::regclass
   and conname = 'posts_category_check'
order by 1, 2;
