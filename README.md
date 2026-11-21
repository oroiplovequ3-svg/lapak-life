# 인블루 (INBLUE) 🦁

**인블루(INBLUE) — 라팍(대구 삼성라이온즈파크)에 가는 사람이, 가기 전에·있는 동안·다녀온 뒤에 쓰는 앱.**
좌석 시야 후기 · 먹거리/주차 큐레이션 · 직관 기록 승률을 한 곳에.

| 탭 | 내용 |
| --- | --- |
| **라팍톡** | 실시간 피드 · 카테고리 필터 · 좋아요 · 댓글 · 글쓰기 |
| **좌석 시야** | 팔각형 구장 도식 · 8개 구역 상세(햇빛/우천/응원/추천/팁) · 시야 후기 · 북마크 |
| **맛집·주차** | 먹거리 14곳(구장 안/밖 필터) · 전설로 주차장 사전예약 안내 · 대공원역 · 대안 주차 · 직관러가 직접 올리는 맛집·주차 팁 |
| **내 직관** | 구글 로그인 · 직관 성적/승률 · 기록 추가 · 저장한 좌석·맛집 · 내가 쓴 글 |

## 기술 스택

- **Next.js 15 (App Router)** + TypeScript + Tailwind CSS
- **Supabase** (DB · Auth 구글 OAuth · RLS)
- 배포: **Vercel** (월 0원 기준, 무료 플랜)

> 저장소·배포 주소(`oroiplovequ3-svg/lapak-life`, `https://lapak-life.vercel.app`)와 `localStorage` 키는 기존 연결을 그대로 쓰기 위해 이름을 유지합니다. 화면에 보이는 서비스 이름만 인블루(INBLUE)입니다.

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # Supabase 키를 채워 넣기 (비우면 데모 모드로 동작)
npm run dev
```

- Supabase 세팅과 구글 OAuth 등록은 **[SETUP.md](./SETUP.md)** 를 순서대로 따라 하세요.
- DB 스키마: `supabase/migrations/001_init.sql` / 시드: `supabase/seed.sql`

## 데모 모드

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 비어 있으면
앱이 자동으로 **데모 모드**로 동작합니다 — 샘플 데이터로 모든 화면을 체험할 수 있고,
쓰기 액션(글·댓글·후기·저장·직관 기록)은 브라우저 로컬 저장소에만 기록됩니다.

## 디렉터리

```
src/
  app/                 라우트 (/, /auth/callback)
  components/          UI (탭 화면, 바텀시트, 구장 도식 SVG, 아이콘)
  lib/data/            구역·먹거리·주차·샘플 데이터 (seed.sql과 동기화)
  lib/repo/            데이터 접근 계층 (SupabaseRepository | DemoRepository)
  lib/supabase/        클라이언트/서버 Supabase 연결
supabase/
  migrations/001_init.sql   테이블·트리거·RLS
  migrations/004_user_foods.sql      직관러 맛집 (공개 읽기 · 본인만 쓰기)
  migrations/005_user_parkings.sql   직관러 주차 팁 (공개 읽기 · 본인만 쓰기)
  seed.sql                  구역 8 · 먹거리 14 시드
```

## 데이터 기준

좌석 가격·거리·가림·주차 요금은 **2026 시즌 구단·티켓링크 공개 자료**를 참고한 값입니다.
시즌마다 바뀌므로 서비스 표기 시 기준일을 함께 노출하고, 방문 전 구단 공지를 확인하세요.
