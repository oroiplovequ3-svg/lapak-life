-- ============================================================
-- 라팍생활 · 라팍톡 카테고리 개편 (2026-11-21)
--   질문(qna) · 굿즈·티켓(market)  →  소통해요(talk) · 굿즈(goods)
--   Supabase SQL Editor 에서 그대로 실행하세요. 여러 번 실행해도 안전합니다.
-- ============================================================

-- 1) 기존 카테고리 CHECK 제약 삭제
alter table public.posts drop constraint if exists posts_category_check;

-- 2) 남아 있는 예전 카테고리 값을 새 값으로 이행
update public.posts set category = 'talk'  where category = 'qna';
update public.posts set category = 'goods' where category = 'market';

-- 3) 새 카테고리 목록으로 CHECK 제약 재생성
alter table public.posts
  add constraint posts_category_check
  check (category in ('review', 'live', 'talk', 'goods'));
