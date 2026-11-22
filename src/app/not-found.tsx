import Link from "next/link";

export const metadata = {
  title: "페이지를 찾을 수 없어요 — 인블루",
};

/** 없는 주소로 들어왔을 때 보여 주는 한국어 404 페이지 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <div className="text-[40px]">⚾</div>
      <h1 className="text-[19px] font-extrabold tracking-tight3 text-ink">
        페이지를 찾을 수 없어요
      </h1>
      <p className="break-keep text-[13px] leading-relaxed text-ink-muted">
        주소가 바뀌었거나 삭제된 페이지예요.
        <br />
        아래 버튼으로 인블루 홈에서 다시 찾아보세요.
      </p>
      <Link
        href="/"
        className="mt-1 rounded-[13px] bg-brand px-5 py-3 text-[13px] font-extrabold text-white shadow-brand"
      >
        인블루 홈으로
      </Link>
      <p className="text-[10.5px] font-semibold text-[#AEB6C2]">
        인블루 (INBLUE) · 삼성 라이온즈 팬 커뮤니티
      </p>
    </main>
  );
}
