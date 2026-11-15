"use client";

import { useEffect, type ReactNode } from "react";

import { Icon } from "@/components/icons";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** 프로토타입의 바텀시트 (글쓰기 · 시야 후기 · 로그인 유도) */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        aria-label="닫기"
        className="animate-fadeIn fixed inset-0 z-40 bg-ink/[.46]"
        onClick={onClose}
        type="button"
      />
      <div
        className="animate-sheetUp fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88%] w-full max-w-[430px] flex-col rounded-t-[26px] bg-white shadow-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mx-auto mt-[9px] h-1 w-[38px] rounded-full bg-[#E0E4EB]" />
        <div className="flex items-center gap-2.5 border-b border-line-soft px-[18px] py-2 pb-3">
          <h2 className="text-base font-extrabold tracking-tight3">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="ml-auto grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-[#F3F5F9] text-ink-muted"
          >
            <Icon name="close" size={14} strokeWidth={2.4} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 overflow-y-auto px-[18px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </div>
    </>
  );
}
