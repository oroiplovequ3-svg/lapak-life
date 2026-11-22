"use client";

import Link from "next/link";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";

/**
 * 쓰기 액션 시 뜨는 구글 로그인 유도 바텀시트.
 *
 * 예전에는 "구글로 계속하기"를 한 번 누르면 같은 사유로는 다시 뜨지 않아,
 * 구글 화면에서 취소·실패로 돌아온 뒤 같은 동작을 다시 눌러도 아무 반응이
 * 없었습니다. 이제 시트는 authPrompt 상태만 따르고, 닫으면 앱 쪽에서
 * authPrompt 를 내리므로 다시 시도할 수 있습니다.
 */
export function LoginPromptSheet() {
  const { authPrompt, closeAuthPrompt, signInWithGoogle, signingIn, configured } = useApp();

  if (!configured) return null;
  if (!authPrompt.open) return null;

  return (
    <Sheet open title="로그인이 필요해요" onClose={closeAuthPrompt}>
      <p className="text-[13.5px] leading-relaxed text-ink-2">
        {authPrompt.reason}
        <br />
        구글 계정으로 10초 만에 시작하고, 내 기록을 안전하게 보관하세요.
      </p>
      <button
        type="button"
        onClick={() => {
          // 로그인 화면으로 이동하기 전에 시트를 닫아 둡니다.
          // 돌아왔을 때 로그인이 안 되어 있으면 같은 동작에서 다시 열립니다.
          closeAuthPrompt();
          void signInWithGoogle();
        }}
        disabled={signingIn}
        className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-white px-4 py-3 text-[13.5px] font-extrabold text-[#1F1F1F] ring-1 ring-[#DADCE0] shadow-[0_1px_2px_rgba(60,64,67,.16)] disabled:opacity-60"
      >
        <Icon name="google" size={18} />
        {signingIn ? "구글로 이동 중…" : "구글로 계속하기"}
      </button>
      <button
        type="button"
        onClick={closeAuthPrompt}
        className="w-full rounded-[13px] bg-white py-3 text-[13px] font-bold text-ink-2 ring-1 ring-line"
      >
        나중에 할게요
      </button>
      <p className="text-center text-[10.5px] leading-relaxed text-ink-faint">
        구글 계정 정보(이메일·프로필)는 회원 식별에만 쓰입니다.{" "}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-brand-600 underline underline-offset-2"
        >
          개인정보처리방침
        </Link>
      </p>
    </Sheet>
  );
}
