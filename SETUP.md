# 인블루 (INBLUE) 배포·연동 가이드

처음부터 끝까지 **약 30분**이면 됩니다. 순서대로 따라 하세요.

> 완성되면 이렇게 됩니다: Vercel 주소로 접속 → 인블루 앱 → 구글 로그인 → 글·후기·직관 기록 저장

---

## 0. 준비물

- 무료 계정 3개: [Supabase](https://supabase.com) · [Vercel](https://vercel.com) · [Google Cloud Console](https://console.cloud.google.com)
- 이 저장소가 내 GitHub 계정에 있어야 합니다 (`lapak-life` 빈 저장소 생성 후 푸시 필요)

---

## 1. Supabase 프로젝트 만들기 (5분)

1. <https://supabase.com> → **Sign in** (GitHub 계정으로 가능) → **New project**
2. 이름: `lapak-life` / 비밀번호는 아무데나 기록해 두고 / 리전: **Singapore (ap-southeast-1)** / Free 플랜 선택
3. 프로젝트가 초록불이 될 때까지 1~2분 기다립니다.

## 2. DB 스키마 & 시드 데이터 넣기 (5분)

1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 저장소의 `supabase/migrations/001_init.sql` 파일 내용 전체를 붙여넣고 **Run**
   - "Success. No rows returned" 가 나오면 성공
3. 같은 방법으로 `supabase/seed.sql` 내용 전체를 붙여넣고 **Run**
4. 같은 방법으로 아래 마이그레이션을 **번호 순서대로** 실행합니다 (사진 첨부·권한·카테고리·프로필 사진)
   - `supabase/migrations/002_review_photos.sql`
   - `supabase/migrations/003_checkin_photos.sql`
   - `supabase/migrations/004_user_foods.sql`
   - `supabase/migrations/005_user_parkings.sql`
   - `supabase/migrations/006_user_food_photos.sql`
   - `supabase/migrations/007_grants.sql`
   - `supabase/migrations/008_post_categories.sql`
   - `supabase/migrations/009_profile_avatars.sql` (프로필 사진 Storage 버킷 `avatars`)
5. 왼쪽 **Table Editor** 에서 `zones`(8행) · `foods`(14행) 가 채워졌는지 확인합니다.

## 3. 구글 OAuth 클라이언트 만들기 (10분, 무료)

1. <https://console.cloud.google.com> → 상단 프로젝트 선택 → **새 프로젝트** → 이름 `lapak-life` → 만들기
2. 왼쪽 **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부(External)** → 만들기
   - 앱 이름 `인블루`, 사용자 지원 이메일·개발자 연락처를 내 구글 주소로 입력 → 저장
   - **테스트 사용자**에 로그인해 볼 구글 계정을 추가 (게시 전에는 여기 넣은 계정만 로그인됩니다)
3. 왼쪽 **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 자바스크립트 원본**
     - `http://localhost:3000`
     - `https://<내프로젝트>.vercel.app` (7단계에서 확정되면 추가)
   - **승인된 리디렉션 URI** — Supabase 콜백 주소 하나만 넣습니다
     - `https://<SUPABASE프로젝트ID>.supabase.co/auth/v1/callback`
     - (프로젝트 ID는 Supabase → Project Settings → API 의 Project URL에서 확인)
4. 만들기를 누르면 나오는 **클라이언트 ID** 와 **클라이언트 보안 비밀** 을 복사해 둡니다.

> 나중에 아무 구글 계정이나 로그인할 수 있게 하려면 OAuth 동의 화면에서 **앱 게시**를 누릅니다.
> 이메일·닉네임·프로필 사진은 기본 범위(openid/email/profile)라 별도 검수 없이 동작합니다.

## 4. Supabase에 구글 Provider 등록 (2분)

1. Supabase 대시보드 → **Authentication → Sign In / Up → Auth Providers → Google**
2. **Enable Sign in with Google**: ON
3. 붙여넣기:
   - **Client ID (for OAuth)**: 3-4의 **클라이언트 ID**
   - **Client Secret (for OAuth)**: 3-4의 **클라이언트 보안 비밀**
4. **Save**
5. 같은 화면의 **Authentication → URL Configuration**
   - **Site URL**: `https://<내프로젝트>.vercel.app`
   - **Redirect URLs** 에 아래를 추가 (앱이 로그인 후 돌아오는 주소)
     - `http://localhost:3000/auth/callback`
     - `https://<내프로젝트>.vercel.app/auth/callback`

## 5. 환경변수 값 복사 (1분)

Supabase 대시보드 → **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Project API Keys → anon / public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6. 로컬에서 확인 (선택, 3분)

```bash
cd lapak-life
cp .env.example .env.local   # 값을 채워 넣기
npm install
npm run dev                  # http://localhost:3000
```

구글 로그인 버튼을 눌러 로그인이 되면 연동 성공입니다.

## 7. Vercel 배포 (3분)

1. <https://vercel.com> → **Add New… → Project** → 이 `lapak-life` 저장소 **Import**
2. Framework Preset: **Next.js** (자동 인식) → 배포 전 **Environment Variables** 에 등록:
   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | 5단계에서 복사한 값 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 5단계에서 복사한 값 |
   | `NEXT_PUBLIC_SITE_URL` | `https://<내프로젝트>.vercel.app` (배포 후 확정된 주소로 다시 넣어도 됩니다) |
3. **Deploy** → 배포가 끝나면 주소가 나옵니다 (예: `https://lapak-life.vercel.app`).

## 8. 마무리 체크 (2분)

- [ ] Google Cloud **승인된 리디렉션 URI** 에 `https://<프로젝트ID>.supabase.co/auth/v1/callback` 이 있는지 (이미 3-3에서 했으면 패스)
- [ ] Supabase **Redirect URLs** 에 `https://<내프로젝트>.vercel.app/auth/callback` 이 있는지
- [ ] `009_profile_avatars.sql` 까지 실행됐는지 (안 했으면 프로필 사진을 올릴 때 오류가 납니다)
- [ ] `004_user_foods.sql` · `005_user_parkings.sql` 까지 실행됐는지 (안 했으면 직관러 섹션은 비어 보입니다)
- [ ] Vercel의 `NEXT_PUBLIC_SITE_URL`을 최종 주소로 맞추고 **Redeploy**
- [ ] 폰으로 접속 → 구글 로그인 → 글쓰기 → 라팍톡에 글 올라오는지 확인

---

## 환경변수를 비워 두면?

앱이 **데모 모드**로 자동 동작합니다 — 샘플 데이터로 모든 화면을 체험할 수 있고,
글·후기·직관 기록은 브라우저 로컬에만 저장됩니다. 배포에 지장이 없으니,
Supabase 연결 전에 UI를 먼저 확인하는 용도로 쓰세요.

## 자주 나는 문제

| 증상 | 원인·해결 |
| --- | --- |
| 구글 로그인 버튼을 눌러도 "redirect_uri_mismatch" 오류 | Google Cloud의 **승인된 리디렉션 URI** 가 Supabase 콜백 주소와 한 글자까지 같아야 합니다. |
| 로그인 후 "invalid flow state"·"code verifier" 오류 | Supabase **Redirect URLs** 에 `https://<내프로젝트>.vercel.app/auth/callback` 을 추가하고, `NEXT_PUBLIC_SITE_URL` 이 실제 주소인지 확인하세요. |
| 구글 계정을 골랐는데 "액세스 차단됨" | OAuth 동의 화면이 **테스트** 상태입니다. 테스트 사용자에 그 계정을 추가하거나 앱을 **게시**하세요. |
| 로그인은 되는데 글쓰기가 안 돼요 | Supabase SQL Editor에서 `001_init.sql` 실행 여부 확인 (RLS 정책이 없으면 insert가 막힙니다). |
| 로그인 후에도 게스트로 보여요 | 프로필 생성 트리거가 돌았는지 확인하세요 (`001_init.sql` 실행 여부). |
| 주차 예약 버튼을 만들고 싶어요 | 만들지 마세요. 티켓링크 약관상 **대행·대리 예약은 금지**입니다 (mvp-plan 8절). 안내 링크만 제공하세요. |
