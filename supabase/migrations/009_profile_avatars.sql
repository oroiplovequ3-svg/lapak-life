-- ============================================================
-- 라팍생활 · 009 프로필 설정 (닉네임 · 프로필 사진)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 · 007 실행 후)
--
-- 확인 결과 이미 있던 것 (001_init.sql):
--   - profiles.nickname / profiles.avatar_url 컬럼
--   - profiles_select_public / profiles_insert_self / profiles_update_self (본인 행만 수정)
-- 이 마이그레이션이 더하는 것:
--   - 프로필 사진 Storage 버킷 'avatars' (공개 읽기 · 본인 폴더만 쓰기/수정/삭제)
--   - 앱은 올리기 전에 브라우저에서 정사각형 320px · JPEG(≈90KB 이하)로 줄여 올립니다.
--     업로드 경로: avatars/{user_id}/avatar-{timestamp}.jpg
--   - avatar_url 에 공개 URL 을 저장하고, 사진을 바꾸면 이전 파일을 지웁니다.
-- ============================================================

-- 1. profiles 컬럼 보정 (이미 있으면 그대로 둡니다)
alter table public.profiles
  add column if not exists nickname text not null default '라팍팬';
alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.nickname is '앱에서 보이는 닉네임 (프로필 설정에서 2~16자로 변경)';
comment on column public.profiles.avatar_url is '프로필 사진 공개 URL (Storage avatars 버킷)';

-- 2. 본인 프로필만 수정할 수 있는 정책 (001 과 같은 내용 · 재실행 안전)
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- 3. Storage 버킷 (공개 읽기 · 본인 폴더만 쓰기)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB (브라우저에서 90KB 안팎으로 줄여 올리므로 실제로는 훨씬 작습니다)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 4. Storage 정책: 누구나 읽기, 로그인한 본인 폴더만 쓰기/수정/삭제
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
