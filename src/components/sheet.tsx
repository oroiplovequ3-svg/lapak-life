"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import { Icon } from "@/components/icons";

/**
 * 지금 열려 있는 시트 순서(마지막이 가장 위).
 * 시트가 겹치면(예: 신고 시트 위에 로그인 유도) ESC 는 맨 위 시트만 닫습니다.
 * 예전에는 시트마다 document keydown 을 따로 들어 한 번에 둘 다 닫혔습니다.
 */
const openSheetStack: string[] = [];

function pushSheet(id: string) {
  const at = openSheetStack.indexOf(id);
  if (at >= 0) openSheetStack.splice(at, 1);
  openSheetStack.push(id);
}

function removeSheet(id: string) {
  const at = openSheetStack.indexOf(id);
  if (at >= 0) openSheetStack.splice(at, 1);
}

function isTopSheet(id: string): boolean {
  return openSheetStack[openSheetStack.length - 1] === id;
}

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
  /**
   * 시트 하단에 늘 붙어 있는 영역(등록·저장 버튼 등).
   * 본문 스크롤과 분리돼 있어 작은 화면에서도 스크롤 없이 바로 보입니다.
   */
  footer?: ReactNode;
  children: ReactNode;
}

/** 프로토타입의 바텀시트 (글쓰기 · 시야 후기 · 로그인 유도) */
export function Sheet({
  open,
  title,
  onClose,
  dirty = false,
  dirtyMessage = "작성 중인 내용이 사라져요. 닫을까요?",
  footer,
  children,
}: SheetProps) {
  const [asking, setAsking] = useState(false);
  const sheetId = useId();

  useEffect(() => {
    if (!open) setAsking(false);
  }, [open]);

  // 열린 순서를 기억해, ESC 가 가장 위 시트만 닫도록 합니다.
  useEffect(() => {
    if (!open) return;
    pushSheet(sheetId);
    return () => removeSheet(sheetId);
  }, [open, sheetId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!isTopSheet(sheetId)) return;
      event.stopPropagation();
      // 닫기 확인 창이 떠 있으면 그 창만 닫습니다(입력은 그대로).
      if (asking) {
        setAsking(false);
        return;
      }
      if (dirty) setAsking(true);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, dirty, asking, sheetId]);

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
        <div className="mx-auto mt-[7px] h-1 w-[38px] rounded-full bg-[#E0E4EB]" />
        <div className="flex items-center gap-2.5 border-b border-line-soft px-[18px] pb-2.5 pt-1.5">
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
        <div
          className={`flex flex-col gap-3.5 overflow-y-auto px-[18px] pt-3.5 ${
            footer ? "pb-4" : "pb-[calc(20px+env(safe-area-inset-bottom))]"
          }`}
        >
          {children}
        </div>

        {footer ? (
          <div className="flex-none border-t border-line-soft bg-white px-[18px] pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        ) : null}

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
