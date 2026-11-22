-- ============================================================
-- 인블루 · 012 개인정보(Storage) 보호 · 신고 · 중복 방지 (2026-11-22)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 011 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) checkin-photos 버킷을 비공개로 전환
--      - 직관 기록(games)은 RLS 로 본인만 보는데 사진만 공개 버킷이라
--        익명이 목록 조회·다운로드할 수 있던 문제를 막습니다.
--      - 앱은 games.photo_urls 의 경로를 createSignedUrl 로 바꿔 표시합니다.
--   2) review-photos · user-food-photos · checkin-photos 의 SELECT 정책을
--      "본인 파일만"으로 좁혀 익명 목록 조회를 막습니다.
--      (review-photos · user-food-photos 는 public = true 를 유지해
--       이미 알고 있는 공개 URL 로는 계속 표시됩니다.)
--   3) 삭제 정책 정리: 본인 폴더 + 마스터는 남의 파일도 정리할 수 있게
--      (글·후기·맛집을 지울 때 파일도 함께 지웁니다)
--   4) post_likes · saves 에 본인 행 UPDATE 정책 추가
--      (upsert 가 ON CONFLICT DO UPDATE 를 실행할 때 RLS 에 막히던 문제)
--   5) public.reports — 신고 접수 표
--      본인 신고만 넣을 수 있고, 읽기·처리는 마스터만.
-- ============================================================

-- ------------------------------------------------------------
-- 1. checkin-photos 버킷을 비공개로
-- ------------------------------------------------------------
update storage.buckets
   set public = false
 where id = 'checkin-photos';

comment on column public.games.photo_urls is
  '직관 기록 첨부 사진 경로/URL (Storage checkin-photos 비공개 버킷, 최대 3장 · 표시할 때 서명 URL 로 변환)';

-- ------------------------------------------------------------
-- 2. Storage SELECT 정책: 본인 파일만 조회(목록) 허용
--    - public 버킷의 공개 URL(/object/public/...)은 RLS 를 거치지 않으므로
--      review-photos · user-food-photos 는 화면 표시가 그대로 동작합니다.
--    - checkin-photos 는 비공개라 본인만 서명 URL 을 만들 수 있습니다.
-- ------------------------------------------------------------
drop policy if exists "checkin_photos_select_public" on storage.objects;
drop policy if exists "checkin_photos_select_own" on storage.objects;
create policy "checkin_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "review_photos_select_public" on storage.objects;
drop policy if exists "review_photos_select_own" on storage.objects;
create policy "review_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user_food_photos_select_public" on storage.objects;
drop policy if exists "user_food_photos_select_own" on storage.objects;
create policy "user_food_photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'user-food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars 는 프로필 사진이라 공개 읽기를 그대로 둡니다(공개 URL 표시).
-- 목록 조회만 막아 익명이 전체 사용자 사진을 훑지 못하게 합니다.
drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_select_own" on storage.objects;
create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------
-- 3. 삭제 정책: 본인 폴더 + 마스터
--    (글·후기·맛집을 지울 때 Storage 파일도 함께 지웁니다)
-- ------------------------------------------------------------
drop policy if exists "checkin_photos_delete_own" on storage.objects;
create policy "checkin_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'checkin-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "review_photos_delete_own" on storage.objects;
create policy "review_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'review-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "user_food_photos_delete_own" on storage.objects;
create policy "user_food_photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'user-food-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ------------------------------------------------------------
-- 4. 좋아요 · 저장 upsert 가 기존 행에서 RLS 에 막히지 않도록
--    (INSERT ... ON CONFLICT DO UPDATE 는 UPDATE 정책까지 검사합니다)
-- ------------------------------------------------------------
drop policy if exists "post_likes_update_own" on public.post_likes;
create policy "post_likes_update_own" on public.post_likes
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own" on public.saves
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant update on public.post_likes to authenticated;
grant update on public.saves to authenticated;

-- ------------------------------------------------------------
-- 5. 신고 접수 표
-- ------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null
    check (target_type in ('post', 'comment', 'review', 'user_food', 'user_parking')),
  target_id uuid not null,
  reason text not null,
  detail text not null default '',
  reporter_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reporter_id, target_type, target_id)
);

comment on table public.reports is
  '직관러가 남긴 신고 — 본인 신고만 넣을 수 있고 읽기·처리는 마스터만 합니다';

create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin" on public.reports
  for select to authenticated
  using (public.is_admin());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reports_delete_admin" on public.reports;
create policy "reports_delete_admin" on public.reports
  for delete to authenticated
  using (public.is_admin());

grant select, update, delete on public.reports to authenticated;
grant insert on public.reports to authenticated;
-- 비로그인(anon)은 아무 권한도 주지 않습니다.
revoke all on public.reports from anon;

-- ------------------------------------------------------------
-- 6. 확인용
-- ------------------------------------------------------------
select 'bucket' as kind, id as name, public::text as value
  from storage.buckets
 where id in ('checkin-photos', 'review-photos', 'user-food-photos', 'avatars')
union all
select 'policy', policyname, cmd
  from pg_policies
 where schemaname = 'storage'
   and tablename = 'objects'
   and policyname in (
     'checkin_photos_select_own', 'review_photos_select_own',
     'user_food_photos_select_own', 'avatars_select_own',
     'checkin_photos_delete_own', 'review_photos_delete_own',
     'user_food_photos_delete_own'
   )
union all
select 'rls', policyname, cmd
  from pg_policies
 where schemaname = 'public'
   and tablename = 'reports'
 order by 1, 2;
