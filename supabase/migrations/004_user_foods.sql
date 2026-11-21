-- ============================================================
-- 라팍생활 · 004 직관러 맛집 (user_foods)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 실행 후)
-- ============================================================

create table if not exists public.user_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  menu text not null default '' check (char_length(menu) <= 80),
  tip text not null default '' check (char_length(tip) <= 120),
  rating int not null default 5 check (rating between 1 and 5),
  is_inside boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.user_foods is '직관러가 직접 올린 맛집 (맛집·주차 탭의 직관러 맛집 섹션)';

create index if not exists user_foods_created_idx on public.user_foods (created_at desc);
create index if not exists user_foods_user_idx on public.user_foods (user_id);
create index if not exists user_foods_inside_idx on public.user_foods (is_inside);

-- ============================================================
-- RLS: 공개 읽기 · 로그인한 본인만 추가/수정/삭제
-- ============================================================
alter table public.user_foods enable row level security;

drop policy if exists "user_foods_select_public" on public.user_foods;
create policy "user_foods_select_public" on public.user_foods
  for select using (true);

drop policy if exists "user_foods_insert_own" on public.user_foods;
create policy "user_foods_insert_own" on public.user_foods
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_foods_update_own" on public.user_foods;
create policy "user_foods_update_own" on public.user_foods
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_foods_delete_own" on public.user_foods;
create policy "user_foods_delete_own" on public.user_foods
  for delete using (auth.uid() = user_id);
