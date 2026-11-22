-- ============================================================
-- 인블루 · 017 회원 영구 정지 (banned_users)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 ~ 016 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) public.banned_users — 정지된 회원 명단 (아이디·이메일·닉네임·사유)
--      RLS 로 마스터(is_admin())만 읽고 쓸 수 있고, anon 은 테이블 권한도 없습니다.
--   2) public.is_banned() — 지금 로그인한 계정(uid 또는 이메일)이 정지 상태인지
--   3) 글·댓글·후기·맛집·맛집 댓글·주차 팁·직관 기록·신고·좋아요의
--      INSERT / UPDATE / DELETE 에 RESTRICTIVE 정책으로 NOT public.is_banned() 추가
--      → 정지된 계정은 앱을 우회해도 DB 단에서 모든 쓰기가 막힙니다.
--   4) 마스터 전용 RPC
--      · admin_ban_user(대상 uid, 사유)   — 정지 + 공개 콘텐츠 숨김 + 재로그인 차단
--      · admin_unban_user(대상 uid)       — 정지 해제 (숨김은 그대로, 필요하면 복구 버튼으로)
--      · admin_list_users()               — 회원 목록(닉네임·가입일·정지 여부·사유)
--      · get_my_ban_status()              — 내가 정지 상태인지(본인만)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 정지 명단
-- ------------------------------------------------------------
create table if not exists public.banned_users (
  user_id uuid primary key,
  email text,
  nickname text,
  reason text,
  banned_by uuid,
  created_at timestamptz not null default now()
);

comment on table public.banned_users is
  '영구 정지된 회원 명단 — 마스터만 읽고 쓸 수 있고, is_banned() 가 쓰기 차단에 사용합니다';
comment on column public.banned_users.user_id is '정지된 회원의 auth.users.id';
comment on column public.banned_users.email is '정지 당시 이메일 — 같은 이메일 재가입·재로그인도 is_banned() 로 막습니다';
comment on column public.banned_users.reason is '정지 사유 (마스터가 남긴 메모)';

alter table public.banned_users enable row level security;

-- anon·일반 역할은 테이블 권한 자체를 회수하고, 마스터 정책으로만 통과시킵니다.
revoke all on table public.banned_users from anon, authenticated;
grant select, insert, delete on table public.banned_users to authenticated;

drop policy if exists "banned_users_admin_select" on public.banned_users;
create policy "banned_users_admin_select" on public.banned_users
  for select to authenticated
  using (public.is_admin());

drop policy if exists "banned_users_admin_insert" on public.banned_users;
create policy "banned_users_admin_insert" on public.banned_users
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "banned_users_admin_delete" on public.banned_users;
create policy "banned_users_admin_delete" on public.banned_users
  for delete to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- 2. 정지 여부 확인 함수 (uid 또는 이메일 기준)
-- ------------------------------------------------------------
create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.banned_users b
     where b.user_id = auth.uid()
        or (
          coalesce(auth.jwt() ->> 'email', '') <> ''
          and lower(coalesce(b.email, '')) = lower(auth.jwt() ->> 'email')
        )
  );
$$;

comment on function public.is_banned() is
  '지금 로그인한 계정(auth.uid 또는 이메일)이 영구 정지 명단에 있으면 true';

revoke all on function public.is_banned() from public;
grant execute on function public.is_banned() to anon, authenticated;

-- ------------------------------------------------------------
-- 3. 정지 계정의 쓰기 차단 (INSERT · UPDATE · DELETE)
--    기존의 본인 글 정책은 그대로 두고, RESTRICTIVE 정책을 하나 더 겁니다.
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'posts', 'comments', 'zone_reviews', 'user_foods', 'user_food_comments',
    'user_parkings', 'games', 'reports', 'post_likes'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_block_banned_insert', t);
    execute format(
      'create policy %I on public.%I as restrictive for insert to public with check (not public.is_banned())',
      t || '_block_banned_insert', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_block_banned_update', t);
    execute format(
      'create policy %I on public.%I as restrictive for update to public using (not public.is_banned()) with check (not public.is_banned())',
      t || '_block_banned_update', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_block_banned_delete', t);
    execute format(
      'create policy %I on public.%I as restrictive for delete to public using (not public.is_banned())',
      t || '_block_banned_delete', t
    );
  end loop;
end
$$;

-- ------------------------------------------------------------
-- 4-1. 마스터 — 회원 영구 정지
--      · 본인·다른 마스터는 정지 불가
--      · auth.users 에서 이메일을 읽어 명단에 남기고 banned_until 로 재로그인 차단
--      · 그 회원이 쓴 공개 콘텐츠는 숨김 처리 (신고 누적 숨김과 같은 컬럼)
-- ------------------------------------------------------------
create or replace function public.admin_ban_user(
  p_target_user_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_email text;
  v_nickname text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.is_admin() then
    raise exception '마스터만 회원을 정지할 수 있어요' using errcode = '42501';
  end if;

  if p_target_user_id is null then
    raise exception '정지할 회원을 찾지 못했어요' using errcode = '22023';
  end if;

  if p_target_user_id = me then
    raise exception '본인 계정은 정지할 수 없어요' using errcode = '22023';
  end if;

  select u.email into v_email
    from auth.users u
   where u.id = p_target_user_id;

  if not found then
    raise exception '존재하지 않는 회원이에요' using errcode = '22023';
  end if;

  -- 다른 마스터 계정은 정지할 수 없습니다 (마스터끼리 서로 잠그지 못하게).
  if exists (
    select 1
      from public.app_admins a
     where lower(a.email) = lower(coalesce(v_email, ''))
  ) then
    raise exception '다른 마스터 계정은 정지할 수 없어요' using errcode = '22023';
  end if;

  select p.nickname into v_nickname
    from public.profiles p
   where p.id = p_target_user_id;

  insert into public.banned_users (user_id, email, nickname, reason, banned_by)
  values (p_target_user_id, v_email, v_nickname, v_reason, me)
  on conflict (user_id) do update
     set email = excluded.email,
         nickname = excluded.nickname,
         reason = excluded.reason,
         banned_by = excluded.banned_by,
         created_at = now();

  -- 그 회원이 쓴 공개 콘텐츠 숨김 (마스터는 복구 버튼으로 되돌릴 수 있습니다)
  update public.posts set is_hidden = true where user_id = p_target_user_id;
  update public.comments set is_hidden = true where user_id = p_target_user_id;
  update public.zone_reviews set is_hidden = true where user_id = p_target_user_id;
  update public.user_foods set is_hidden = true where user_id = p_target_user_id;
  update public.user_food_comments set is_hidden = true where user_id = p_target_user_id;
  update public.user_parkings set is_hidden = true where user_id = p_target_user_id;

  -- 재로그인·새 세션 차단 (Supabase Auth 가 banned_until 을 보고 로그인을 거절합니다)
  update auth.users
     set banned_until = '9999-12-31'::timestamptz
   where id = p_target_user_id;
end;
$$;

comment on function public.admin_ban_user(uuid, text) is
  '마스터가 회원을 영구 정지합니다 — 정지 명단 등록 · 공개 콘텐츠 숨김 · 재로그인 차단';

revoke all on function public.admin_ban_user(uuid, text) from public;
revoke all on function public.admin_ban_user(uuid, text) from anon;
grant execute on function public.admin_ban_user(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 4-2. 마스터 — 정지 해제
--      숨김 처리된 콘텐츠는 자동으로 되돌리지 않습니다.
--      (필요하면 신고 관리의 '숨김 복구' 로 하나씩 되돌립니다)
-- ------------------------------------------------------------
create or replace function public.admin_unban_user(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '마스터만 정지를 해제할 수 있어요' using errcode = '42501';
  end if;

  if p_target_user_id is null then
    raise exception '정지를 해제할 회원을 찾지 못했어요' using errcode = '22023';
  end if;

  delete from public.banned_users where user_id = p_target_user_id;

  update auth.users
     set banned_until = null
   where id = p_target_user_id;
end;
$$;

comment on function public.admin_unban_user(uuid) is
  '마스터가 회원의 영구 정지를 해제합니다 — 정지 명단 제거 · 재로그인 허용';

revoke all on function public.admin_unban_user(uuid) from public;
revoke all on function public.admin_unban_user(uuid) from anon;
grant execute on function public.admin_unban_user(uuid) to authenticated;

-- ------------------------------------------------------------
-- 4-3. 마스터 — 회원 목록
--      이메일은 마스터 화면에서만 보입니다 (닉네임이 같아도 구분할 수 있게).
-- ------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  nickname text,
  email text,
  created_at timestamptz,
  is_banned boolean,
  ban_reason text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '마스터만 회원 목록을 볼 수 있어요' using errcode = '42501';
  end if;

  return query
    select
      u.id as user_id,
      coalesce(p.nickname, split_part(coalesce(u.email, ''), '@', 1), '라팍팬') as nickname,
      u.email::text as email,
      u.created_at,
      (b.user_id is not null) as is_banned,
      b.reason as ban_reason
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.banned_users b on b.user_id = u.id
   order by u.created_at desc
   limit 500;
end;
$$;

comment on function public.admin_list_users() is
  '마스터 전용 회원 목록 (닉네임 · 가입일 · 정지 여부 · 정지 사유)';

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_list_users() from anon;
grant execute on function public.admin_list_users() to authenticated;

-- ------------------------------------------------------------
-- 4-4. 내 정지 상태 (본인 것만)
-- ------------------------------------------------------------
create or replace function public.get_my_ban_status()
returns table (banned boolean, reason text)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select b.reason, b.created_at
      from public.banned_users b
     where b.user_id = auth.uid()
        or (
          coalesce(auth.jwt() ->> 'email', '') <> ''
          and lower(coalesce(b.email, '')) = lower(auth.jwt() ->> 'email')
        )
     order by b.created_at desc
     limit 1
  )
  select
    exists (select 1 from mine) as banned,
    (select reason from mine) as reason;
$$;

comment on function public.get_my_ban_status() is
  '로그인한 본인이 영구 정지 상태인지와 사유만 돌려줍니다 (다른 회원 정보는 볼 수 없음)';

revoke all on function public.get_my_ban_status() from public;
revoke all on function public.get_my_ban_status() from anon;
grant execute on function public.get_my_ban_status() to authenticated;

-- ------------------------------------------------------------
-- 5. 확인용 (실행 결과에 남는 조회)
-- ------------------------------------------------------------
select 'table' as kind, 'banned_users' as name,
       (select count(*)::text from public.banned_users) as value
union all
select 'rls', c.relname, c.relrowsecurity::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname = 'banned_users'
union all
select 'policy', tablename || ':' || policyname, permissive || ' ' || cmd
  from pg_policies
 where schemaname = 'public'
   and (tablename = 'banned_users' or policyname like '%_block_banned_%')
 order by 1, 2, 3;
