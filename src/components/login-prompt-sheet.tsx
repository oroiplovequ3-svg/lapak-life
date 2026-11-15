"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";

/** 쓰기 액션 시 뜨는 카카오 로그인 유도 바텀시트 */
export function LoginPromptSheet() {
  const { authPrompt, closeAuthPrompt, signInWithKakao, signingIn, configured } = useApp();
  const [dismissed, setDismissed] = useState<string | null>(null);

  if (!configured) return null;
  if (!authPrompt.open) return null;
  if (dismissed === authPrompt.reason) return null;

  return (
    <Sheet open title="로그인이 필요해요" onClose={closeAuthPrompt}>
      <p className="text-[13.5px] leading-relaxed text-ink-2">
        {authPrompt.reason}
        <br />
        카카오 계정으로 10초 만에 시작하고, 내 기록을 안전하게 보관하세요.
      </p>
      <button
        type="button"
        onClick={() => {
          setDismissed(authPrompt.reason);
          void signInWithKakao();
        }}
        disabled={signingIn}
        className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#FEE500] px-4 py-3 text-[13.5px] font-extrabold text-[#191919] disabled:opacity-60"
      >
        <Icon name="kakao" size={18} filled strokeWidth={0} />
        {signingIn ? "카카오로 이동 중…" : "카카오로 계속하기"}
      </button>
      <button
        type="button"
        onClick={closeAuthPrompt}
        className="w-full rounded-[13px] bg-white py-3 text-[13px] font-bold text-ink-2 ring-1 ring-line"
      >
        나중에 할게요
      </button>
    </Sheet>
  );
}
