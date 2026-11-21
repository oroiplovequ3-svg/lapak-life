"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";

/** 쓰기 액션 시 뜨는 구글 로그인 유도 바텀시트 */
export function LoginPromptSheet() {
  const { authPrompt, closeAuthPrompt, signInWithGoogle, signingIn, configured } = useApp();
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (!configured) return null;
  if (!authPrompt.open) return null;
  if (dismissed === authPrompt.reason) return null;

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
          setDismissed(authPrompt.reason);
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
