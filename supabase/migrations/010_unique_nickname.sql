-- ============================================================
-- 인블루 · 010 닉네임 중복 방지 (2026-11-22)
-- Supabase SQL Editor 에서 전체를 실행하세요. (001 · 009 실행 후)
-- 여러 번 실행해도 안전합니다.
--
-- 더하는 것
--   1) profiles.nickname 의 앞뒤 공백을 지우고, 비어 있으면 기본 이름으로 채웁니다.
--   2) 이미 같은 이름을 쓰는 행이 있으면 뒤에 번호를 붙여 겹치지 않게 정리합니다.
--   3) 공백·대소문자를 무시하는 유니크 인덱스
--      ( ' 김민수 ' = '김민수' , 'KIM' = 'kim' )
--   4) 닉네임을 쓸 수 있는지 묻는 함수 public.is_nickname_available(candidate, exclude_id)
--   5) 회원가입 트리거가 겹치는 이름 대신 번호를 붙여 저장하도록 보강
--      (구글 이름이 이미 있는 이름이어도 가입이 실패하지 않게)
-- ============================================================

-- 1) 앞뒤 공백 정리 -------------------------------------------------
update public.profiles
   set nickname = btrim(nickname)
 where nickname is distinct from btrim(nickname);

-- 2) 빈 이름은 기본 이름으로 ----------------------------------------
update public.profiles
   set nickname = '라팍팬'
 where btrim(nickname) = '';

-- 3) 겹치는 이름 정리 ----------------------------------------------
-- 같은 이름(공백·대소문자 무시)이 여러 행에 있으면, 먼저 만든 행은 그대로 두고
-- 나머지 행에 2, 3 … 번호를 붙여 유니크 인덱스를 만들 수 있게 합니다.
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in
    select id, btrim(nickname) as nickname
      from (
        select id,
               btrim(nickname) as nickname,
               row_number() over (
                 partition by lower(btrim(nickname))
                 order by created_at, id
               ) as rn
          from public.profiles
      ) ranked
     where rn > 1
  loop
    base := left(r.nickname, 16);
    n := 2;
    loop
      candidate := left(base, greatest(1, 16 - length(n::text))) || n::text;
      exit when not exists (
        select 1
          from public.profiles
         where lower(btrim(nickname)) = lower(candidate)
      );
      n := n + 1;
      if n > 999 then
        -- 이름이 아주 많아 번호가 넘치면 임의 접미사로 확정합니다.
        candidate := left(base, 10) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
        exit;
      end if;
    end loop;
    update public.profiles set nickname = candidate where id = r.id;
  end loop;
end $$;

-- 4) 유니크 인덱스 --------------------------------------------------
-- 앱은 저장 전에 같은 규칙으로 미리 확인하고, 동시에 저장된 경우에는
-- 이 인덱스가 23505(unique_violation) 로 막아 줍니다.
create unique index if not exists profiles_nickname_unique_idx
  on public.profiles (lower(btrim(nickname)))
  where nickname is not null and btrim(nickname) <> '';

comment on index public.profiles_nickname_unique_idx is
  '닉네임 중복 방지 (앞뒤 공백·대소문자 무시)';

-- 5) 닉네임 사용 가능 여부 함수 -------------------------------------
-- 인덱스와 똑같은 규칙으로 비교합니다. exclude_id 는 내 프로필(지금 쓰는 이름)입니다.
create or replace function public.is_nickname_available(
  candidate text,
  exclude_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select case
    when btrim(coalesce(candidate, '')) = '' then false
    else not exists (
      select 1
        from public.profiles
       where lower(btrim(nickname)) = lower(btrim(candidate))
         and (exclude_id is null or id <> exclude_id)
    )
  end;
$$;

comment on function public.is_nickname_available(text, uuid) is
  '닉네임을 지금 쓸 수 있는지 (공백·대소문자 무시, exclude_id 는 내 행 제외)';

grant execute on function public.is_nickname_available(text, uuid) to anon, authenticated;

-- 6) 회원가입 트리거 보강 -------------------------------------------
-- 구글 계정 이름이 이미 누가 쓰는 이름이면 그대로 넣다가 가입이 실패하므로,
-- 겹치면 '이름2', '이름3' … 처럼 번호를 붙여 저장합니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  base := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'preferred_username'), ''),
    '라팍팬'
  );
  base := left(base, 16);
  candidate := base;

  while exists (
    select 1 from public.profiles where lower(btrim(nickname)) = lower(candidate)
  ) loop
    n := n + 1;
    candidate := left(base, greatest(1, 16 - length(n::text))) || n::text;
    if n > 99 then
      candidate := left(base, 10) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
      nullif(new.raw_user_meta_data ->> 'picture', '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 7) 확인용 (실행 결과에 남는 조회) ----------------------------------
select indexname, indexdef
  from pg_indexes
 where schemaname = 'public'
   and tablename = 'profiles';
