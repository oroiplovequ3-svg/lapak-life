-- ============================================================
-- 인블루 · 013 라팍톡 글 사진 첨부 (posts.photo_urls + Storage 버킷)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 012 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) public.posts.photo_urls text[] — 글에 붙인 사진 공개 URL (최대 3장)
--   2) Storage 버킷 post-photos (공개 읽기 · 본인 폴더만 쓰기)
--      - 업로드 경로: post-photos/{user_id}/{timestamp}-{rand}.jpg
--      - 앱이 등록 전에 브라우저에서 긴 변 1000px · JPEG 로 줄여 올립니다(장당 140KB 내외).
--   3) Storage 정책
--      - SELECT: 로그인한 본인 파일만 목록 조회
--        (public = true 라서 이미 알고 있는 공개 URL 로는 누구나 표시됩니다 —
--         012 의 review-photos · user-food-photos 와 같은 방식)
--      - INSERT: 본인 폴더만
--      - DELETE: 본인 폴더 + 마스터(is_admin) — 글을 지울 때 사진도 함께 정리합니다
-- ============================================================

-- ------------------------------------------------------------
-- 1. 글 사진 URL 컬럼
-- ------------------------------------------------------------
alter table public.posts
  add column if not exists photo_urls text[] not null default '{}';

comment on column public.posts.photo_urls is
  '글(라팍톡)에 첨부한 사진 공개 URL (Storage post-photos 버킷, 최대 3장)';

-- ------------------------------------------------------------
-- 2. Storage 버킷 (공개 읽기 · 본인 폴더만 쓰기)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-photos',
  'post-photos',
  true,
  3145728, -- 3MB (브라우저에서 축소한 뒤 업로드하므로 실제로는 150KB 내외)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- 3. Storage 정책
-- ------------------------------------------------------------
drop policy if exists "post_photos_select_public" on storage.objects;
drop policy if exists "post_photos_select_own" on storage.objects;
create policy "post_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_photos_insert_own" on storage.objects;
create policy "post_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "post_photos_delete_own" on storage.objects;
create policy "post_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ------------------------------------------------------------
-- 4. 확인용
-- ------------------------------------------------------------
select 'column' as kind, 'posts.photo_urls' as name, data_type as value
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'posts'
   and column_name = 'photo_urls'
union all
select 'bucket', id, public::text
  from storage.buckets
 where id = 'post-photos'
union all
select 'policy', policyname, cmd
  from pg_policies
 where schemaname = 'storage'
   and tablename = 'objects'
   and policyname in (
     'post_photos_select_own', 'post_photos_insert_own', 'post_photos_delete_own'
   )
 order by 1, 2;
