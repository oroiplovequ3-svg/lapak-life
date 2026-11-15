-- ============================================================
-- 라팍생활 · 초기 스키마
-- Supabase SQL Editor 에 전체를 실행하세요.
-- ============================================================

-- ------------------------------------------------------------
-- 0. (안전) 재실행 대비: 기존 객체 정리
--    (데이터가 있는 운영 환경에서는 실행하지 마세요)
-- ------------------------------------------------------------
-- drop table if exists public.comments cascade;
-- drop table if exists public.post_likes cascade;
-- drop table if exists public.zone_reviews cascade;
-- drop table if exists public.games cascade;
-- drop table if exists public.saves cascade;
-- drop table if exists public.posts cascade;
-- drop table if exists public.foods cascade;
-- drop table if exists public.zones cascade;
-- drop table if exists public.profiles cascade;
-- drop function if exists public.handle_new_user();
-- drop function if exists public.set_post_counts();

-- ------------------------------------------------------------
-- 1. profiles (auth.users 와 1:1)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default '라팍팬',
  avatar_url text,
  favorite_zone text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is '사용자 프로필 (auth.users와 1:1, 회원가입 시 트리거로 자동 생성)';

-- ------------------------------------------------------------
-- 2. zones (좌석 구역 마스터 · 읽기 전용 운영)
-- ------------------------------------------------------------
create table if not exists public.zones (
  code text primary key,
  name text not null,
  short_name text not null,
  emoji text not null default '⚾',
  side text not null,
  grade text not null default '',
  price_note text not null default '',
  dist text not null default '',
  block_rate text not null default '',
  roof text not null default '',
  sun text not null default '',
  rain text not null default '',
  cheer text not null default '',
  recommend text not null default '',
  tip text not null default '',
  sort_order int not null default 99
);

-- ------------------------------------------------------------
-- 3. foods (먹거리 큐레이션 · 읽기 전용 운영)
-- ------------------------------------------------------------
create table if not exists public.foods (
  id text primary key,
  name text not null,
  emoji text not null default '🍽️',
  thumb_bg text not null default '',
  price_note text not null default '',
  place text not null default '',
  rating numeric(2, 1) not null default 0,
  wait_level int not null default 1,
  wait_text text not null default '보통',
  menu text not null default '',
  tip text not null default '',
  is_inside boolean not null default true,
  sort_order int not null default 99
);

-- ------------------------------------------------------------
-- 4. posts (라팍톡 피드)
-- ------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('review', 'live', 'qna', 'market')),
  body text not null check (char_length(body) between 1 and 1000),
  seat_zone text,
  seat_detail text,
  media text,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);
create index if not exists posts_user_idx on public.posts (user_id);

-- ------------------------------------------------------------
-- 5. post_likes (좋아요 · 유저당 1회)
-- ------------------------------------------------------------
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on public.post_likes (user_id);

-- ------------------------------------------------------------
-- 6. comments (댓글)
-- ------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ------------------------------------------------------------
-- 7. zone_reviews (좌석 시야 후기)
-- ------------------------------------------------------------
create table if not exists public.zone_reviews (
  id uuid primary key default gen_random_uuid(),
  zone_code text not null references public.zones (code) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seat_detail text not null default '',
  rating int not null default 5 check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 1000),
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists zone_reviews_zone_idx on public.zone_reviews (zone_code, created_at desc);

-- ------------------------------------------------------------
-- 8. saves (북마크 · 좌석/맛집)
-- ------------------------------------------------------------
create table if not exists public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('zone', 'food')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

-- ------------------------------------------------------------
-- 9. games (직관 기록)
-- ------------------------------------------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  played_on date not null,
  opponent text not null,
  home_away text not null default 'home' check (home_away in ('home', 'away')),
  zone_code text references public.zones (code) on delete set null,
  score_for int not null default 0,
  score_against int not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists games_user_idx on public.games (user_id, played_on desc);

-- ============================================================
-- 트리거 함수
-- ============================================================

-- 회원가입 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
      '라팍팬'
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- like_count / comment_count 자동 갱신
create or replace function public.set_post_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post uuid;
begin
  target_post := coalesce(new.post_id, old.post_id);

  update public.posts
     set like_count = (select count(*) from public.post_likes where post_id = target_post),
         comment_count = (select count(*) from public.comments where post_id = target_post)
   where id = target_post;

  return coalesce(new, old);
end;
$$;

drop trigger if exists post_likes_count on public.post_likes;
create trigger post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.set_post_counts();

drop trigger if exists comments_count on public.comments;
create trigger comments_count
  after insert or delete on public.comments
  for each row execute function public.set_post_counts();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.zones enable row level security;
alter table public.foods enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.zone_reviews enable row level security;
alter table public.saves enable row level security;
alter table public.games enable row level security;

-- profiles: 모두 읽기, 본인만 수정
create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- zones / foods: 공개 읽기 전용 (쓰기는 SQL Editor에서 운영자가 직접)
create policy "zones_select_public" on public.zones
  for select using (true);
create policy "foods_select_public" on public.foods
  for select using (true);

-- posts: 공개 읽기, 로그인한 본인만 쓰기
create policy "posts_select_public" on public.posts
  for select using (true);
create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = user_id);

-- post_likes: 공개 읽기(집계용), 본인 행만 관리
create policy "post_likes_select_public" on public.post_likes
  for select using (true);
create policy "post_likes_insert_own" on public.post_likes
  for insert with check (auth.uid() = user_id);
create policy "post_likes_delete_own" on public.post_likes
  for delete using (auth.uid() = user_id);

-- comments: 공개 읽기, 본인만 쓰기
create policy "comments_select_public" on public.comments
  for select using (true);
create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on public.comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = user_id);

-- zone_reviews: 공개 읽기, 본인만 쓰기
create policy "zone_reviews_select_public" on public.zone_reviews
  for select using (true);
create policy "zone_reviews_insert_own" on public.zone_reviews
  for insert with check (auth.uid() = user_id);
create policy "zone_reviews_update_own" on public.zone_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "zone_reviews_delete_own" on public.zone_reviews
  for delete using (auth.uid() = user_id);

-- saves: 본인만 접근
create policy "saves_select_own" on public.saves
  for select using (auth.uid() = user_id);
create policy "saves_insert_own" on public.saves
  for insert with check (auth.uid() = user_id);
create policy "saves_delete_own" on public.saves
  for delete using (auth.uid() = user_id);

-- games: 본인만 접근
create policy "games_select_own" on public.games
  for select using (auth.uid() = user_id);
create policy "games_insert_own" on public.games
  for insert with check (auth.uid() = user_id);
create policy "games_update_own" on public.games
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "games_delete_own" on public.games
  for delete using (auth.uid() = user_id);
