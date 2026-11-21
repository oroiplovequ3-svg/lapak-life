-- ============================================================
-- 라팍생활 · 005 직관러 주차 팁 (user_parkings)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 실행 후)
-- ============================================================

create table if not exists public.user_parkings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  location text not null default '' check (char_length(location) <= 80),
  is_free boolean not null default true,
  fee_note text not null default '' check (char_length(fee_note) <= 40),
  walk_time text not null default '' check (char_length(walk_time) <= 40),
  tip text not null default '' check (char_length(tip) <= 120),
  created_at timestamptz not null default now()
);

comment on table public.user_parkings is '직관러가 직접 올린 주차장·주차 팁 (맛집·주차 탭의 직관러 주차 팁 섹션)';

create index if not exists user_parkings_created_idx on public.user_parkings (created_at desc);
create index if not exists user_parkings_user_idx on public.user_parkings (user_id);

-- ============================================================
-- RLS: 공개 읽기 · 로그인한 본인만 추가/수정/삭제
-- ============================================================
alter table public.user_parkings enable row level security;

drop policy if exists "user_parkings_select_public" on public.user_parkings;
create policy "user_parkings_select_public" on public.user_parkings
  for select using (true);

drop policy if exists "user_parkings_insert_own" on public.user_parkings;
create policy "user_parkings_insert_own" on public.user_parkings
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_parkings_update_own" on public.user_parkings;
create policy "user_parkings_update_own" on public.user_parkings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_parkings_delete_own" on public.user_parkings;
create policy "user_parkings_delete_own" on public.user_parkings
  for delete using (auth.uid() = user_id);
