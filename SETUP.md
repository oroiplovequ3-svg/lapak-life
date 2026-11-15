# 라팍생활 배포·연동 가이드

처음부터 끝까지 **약 30분**이면 됩니다. 순서대로 따라 하세요.

> 완성되면 이렇게 됩니다: Vercel 주소로 접속 → 라팍생활 앱 → 카카오 로그인 → 글·후기·직관 기록 저장

---

## 0. 준비물

- 무료 계정 3개: [Supabase](https://supabase.com) · [Vercel](https://vercel.com) · [Kakao Developers](https://developers.kakao.com)
- 이 저장소가 내 GitHub 계정에 있어야 합니다 (이미 완료: `lapak-life` 비공개 저장소)

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
4. 왼쪽 **Table Editor** 에서 `zones`(8행) · `foods`(14행) 가 채워졌는지 확인합니다.

## 3. 카카오 로그인 앱 등록 (10분, 승인까지 하루 걸릴 수 있어요)

1. <https://developers.kakao.com> → **내 애플리케이션** → **애플리케이션 추가하기**
   - 앱 이름: `라팍생활` (아무 이름이나 가능)
2. 왼쪽 **앱 설정 → 플랫폼** → **Web 플랫폼 등록**
   - 로컬 테스트용: `http://localhost:3000`
   - 배포 후: `https://<내프로젝트>.vercel.app` (4단계에서 알게 됩니다. 나중에 추가해도 됩니다)
3. **앱 설정 → 요약** 에서 **네이티브 앱 키(REST API 키 아님, "네이티브 앱 키")** 를 복사해 둡니다.
4. **제품 설정 → 카카오 로그인 → 일반** 에서:
   - **활성화 설정**: ON
   - **OpenID Connect 활성화**: OFF (Supabase는 기본 토큰 방식 사용)
   - **Redirect URI** 등록:
     - `https://<SUPABASE프로젝트ID>.supabase.co/auth/v1/callback`
     - (Supabase 프로젝트 ID는 5단계의 URL에서 확인)
5. **카카오 로그인 → 동의항목** 에서 `닉네임`, `프로필 사진` 을 **필수 동의**로 설정 (이메일은 선택 또는 미설정 권장)
6. 좌측 **보안 → 클라이언트 시크릿** → 코드 발급 후 **활성화 ON**, 시크릿 코드 복사.

## 4. Supabase에 카카오 Provider 등록 (2분)

1. Supabase 대시보드 → **Authentication → Sign In / Up → Auth Providers → Kakao**
2. **Enable Sign in with Kakao**: ON
3. 붙여넣기:
   - **Client ID**: 카카오 **네이티브 앱 키**
   - **Client Secret**: 3-6에서 발급한 **클라이언트 시크릿**
4. **Save**

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

카카오 로그인 버튼을 눌러 로그인이 되면 연동 성공입니다.

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

- [ ] 카카오 개발자 콘솔 **Web 플랫폼**에 Vercel 주소 추가
- [ ] 카카오 **Redirect URI**에 `https://<프로젝트ID>.supabase.co/auth/v1/callback` 이 등록돼 있는지 (이미 3-4에서 했으면 패스)
- [ ] Vercel의 `NEXT_PUBLIC_SITE_URL`을 최종 주소로 맞추고 **Redeploy**
- [ ] 폰으로 접속 → 카카오 로그인 → 글쓰기 → 라팍톡에 글 올라오는지 확인

---

## 환경변수를 비워 두면?

앱이 **데모 모드**로 자동 동작합니다 — 샘플 데이터로 모든 화면을 체험할 수 있고,
글·후기·직관 기록은 브라우저 로컬에만 저장됩니다. 배포에 지장이 없으니,
Supabase 연결 전에 UI를 먼저 확인하는 용도로 쓰세요.

## 자주 나는 문제

| 증상 | 원인·해결 |
| --- | --- |
| 카카오 로그인 버튼을 눌러도 "redirect_uri 미승인" 오류 | 3-4의 Redirect URI 오타. Supabase 콜백 URL과 한 글자까지 같아야 합니다. |
| 로그인은 되는데 글쓰기가 안 돼요 | Supabase SQL Editor에서 `001_init.sql` 실행 여부 확인 (RLS 정책이 없으면 insert가 막힙니다). |
| 로그인 후에도 게스트로 보여요 | 카카오 동의항목에 '닉네임'이 켜져 있는지 확인하세요. |
| 주차 예약 버튼을 만들고 싶어요 | 만들지 마세요. 티켓링크 약관상 **대행·대리 예약은 금지**입니다 (mvp-plan 8절). 안내 링크만 제공하세요. |
