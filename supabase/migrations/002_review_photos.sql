-- ============================================================
-- 시야 후기 사진 첨부 (zone_reviews.photo_urls + Storage 버킷)
-- - 앱은 등록 전에 브라우저에서 사진을 줄여(긴 변 1000px · JPEG) 올립니다.
-- - 업로드 경로: review-photos/{user_id}/{timestamp}-{rand}.jpg
-- - zone_reviews.photo_urls 에 공개 URL 배열로 저장합니다. (최대 3장)
-- ============================================================

-- 1. 후기 사진 URL 컬럼 (001_init.sql 의 photo_paths 는 예전 초안으로 남겨 둡니다)
alter table public.zone_reviews
  add column if not exists photo_urls text[] not null default '{}';

comment on column public.zone_reviews.photo_urls is '후기 첨부 사진 공개 URL (Storage review-photos 버킷, 최대 3장)';

-- 2. Storage 버킷 (공개 읽기 · 본인 폴더만 쓰기)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-photos',
  'review-photos',
  true,
  3145728, -- 3MB (브라우저에서 축소한 뒤 업로드하므로 실제로는 150KB 내외)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Storage 정책: 누구나 읽기, 로그인한 본인 폴더만 쓰기/삭제
drop policy if exists "review_photos_select_public" on storage.objects;
create policy "review_photos_select_public" on storage.objects
  for select using (bucket_id = 'review-photos');

drop policy if exists "review_photos_insert_own" on storage.objects;
create policy "review_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "review_photos_delete_own" on storage.objects;
create policy "review_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
