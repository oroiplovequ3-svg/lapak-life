"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icons";

interface DeleteButtonProps {
  /** 무엇을 지우는지 — 확인 문구와 접근성 라벨에 함께 쓰입니다. (예: "글", "댓글") */
  what: string;
  onDelete: () => void | Promise<void>;
  size?: number;
  className?: string;
}

/**
 * 내가 쓴 글·댓글·후기 삭제 버튼.
 * 휴지통을 한 번 누르면 바로 지우지 않고 "삭제할까요?" 확인을 먼저 띄웁니다.
 * (확인은 4초 뒤 자동으로 닫히고, 다른 곳을 눌러도 취소와 같습니다.)
 */
export function DeleteButton({ what, onDelete, size = 13, className = "" }: DeleteButtonProps) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!asking) return;
    const timer = window.setTimeout(() => setAsking(false), 4000);
    return () => window.clearTimeout(timer);
  }, [asking]);

  useEffect(() => {
    if (!asking) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setAsking(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [asking]);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
      setAsking(false);
    }
  };

  return (
    <span ref={wrapperRef} className={`relative inline-flex flex-none ${className}`}>
      <button
        type="button"
        aria-label={`${what} 삭제`}
        aria-expanded={asking}
        onClick={() => setAsking((prev) => !prev)}
        className={`rounded-lg p-1.5 transition ${
          asking ? "bg-[#FEF3F2] text-[#B42318]" : "text-[#C4CBD6]"
        }`}
      >
        <Icon name="trash" size={size} />
      </button>

      {asking ? (
        <span className="absolute right-0 top-full z-40 mt-1 flex w-max max-w-[240px] items-center gap-1.5 rounded-[11px] border border-line bg-white px-2 py-1.5 shadow-[0_10px_26px_-10px_rgba(16,24,40,.45)]">
          <span className="whitespace-nowrap text-[10.5px] font-extrabold text-ink-2">
            {what} 삭제할까요?
          </span>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy}
            className="flex-none rounded-[7px] bg-[#B42318] px-[7px] py-[3px] text-[10.5px] font-extrabold text-white disabled:bg-[#E4E7EC] disabled:text-ink-faint"
          >
            {busy ? "삭제 중" : "삭제"}
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="flex-none rounded-[7px] bg-[#F3F5F9] px-[7px] py-[3px] text-[10.5px] font-extrabold text-ink-muted"
          >
            취소
          </button>
        </span>
      ) : null}
    </span>
  );
}
