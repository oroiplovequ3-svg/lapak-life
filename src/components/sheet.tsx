"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Icon } from "@/components/icons";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /**
   * 작성 중인 내용이 있으면 배경 탭·닫기 버튼으로 바로 닫지 않고
   * "작성 중인 내용이 사라져요" 확인을 한 번 거칩니다.
   */
  dirty?: boolean;
  dirtyMessage?: string;
  children: ReactNode;
}

/** 프로토타입의 바텀시트 (글쓰기 · 시야 후기 · 로그인 유도) */
export function Sheet({
  open,
  title,
  onClose,
  dirty = false,
  dirtyMessage = "작성 중인 내용이 사라져요. 닫을까요?",
  children,
}: SheetProps) {
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!open) setAsking(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dirty) setAsking(true);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, dirty]);

  if (!open) return null;

  /** 닫기 요청 — 작성 중인 내용이 있으면 확인을 먼저 띄웁니다. */
  const requestClose = () => {
    if (dirty) setAsking(true);
    else onClose();
  };

  return (
    <>
      <button
        aria-label="닫기"
        className="animate-fadeIn fixed inset-0 z-40 bg-ink/[.46]"
        onClick={requestClose}
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
            onClick={requestClose}
            aria-label="닫기"
            className="ml-auto grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-[#F3F5F9] text-ink-muted"
          >
            <Icon name="close" size={14} strokeWidth={2.4} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 overflow-y-auto px-[18px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>

        {asking ? (
          <div className="absolute inset-0 z-10 flex items-end rounded-t-[26px] bg-ink/40 px-[18px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
            <div className="w-full rounded-[16px] bg-white p-4 shadow-sheet">
              <p className="text-[13px] font-extrabold text-ink">{dirtyMessage}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
                닫으면 지금까지 입력한 내용은 되돌릴 수 없어요.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAsking(false)}
                  className="flex-1 rounded-[12px] bg-brand py-2.5 text-[12.5px] font-extrabold text-white"
                >
                  계속 작성
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAsking(false);
                    onClose();
                  }}
                  className="flex-1 rounded-[12px] bg-[#F3F5F9] py-2.5 text-[12.5px] font-extrabold text-ink-2"
                >
                  그만두기
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
