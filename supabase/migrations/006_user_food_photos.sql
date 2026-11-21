-- ============================================================
-- 라팍생활 · 006 직관러 맛집 사진 첨부 (user_foods.photo_urls + Storage 버킷)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 · 004 실행 후)
-- - 앱은 등록 전에 브라우저에서 사진을 줄여(긴 변 1000px · JPEG) 올립니다.
-- - 업로드 경로: user-food-photos/{user_id}/{timestamp}-{rand}.jpg
-- - user_foods.photo_urls 에 공개 URL 배열로 저장합니다. (최대 3장)
-- - 버킷은 공개 읽기(카드에서 바로 <img>로 표시), 쓰기·삭제는 본인 폴더만 허용합니다.
--   (시야 후기 review-photos · 직관 기록 checkin-photos 버킷과 같은 방식입니다.)
-- ============================================================

-- 1. 맛집 사진 URL 컬럼
alter table public.user_foods
  add column if not exists photo_urls text[] not null default '{}';

comment on column public.user_foods.photo_urls is '직관러 맛집 첨부 사진 공개 URL (Storage user-food-photos 버킷, 최대 3장)';

-- 2. Storage 버킷 (공개 읽기 · 본인 폴더만 쓰기)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-food-photos',
  'user-food-photos',
  true,
  3145728, -- 3MB (브라우저에서 축소한 뒤 업로드하므로 실제로는 150KB 내외)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Storage 정책: 누구나 읽기, 로그인한 본인 폴더만 쓰기/삭제
drop policy if exists "user_food_photos_select_public" on storage.objects;
create policy "user_food_photos_select_public" on storage.objects
  for select using (bucket_id = 'user-food-photos');

drop policy if exists "user_food_photos_insert_own" on storage.objects;
create policy "user_food_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'user-food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user_food_photos_delete_own" on storage.objects;
create policy "user_food_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'user-food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
