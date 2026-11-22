"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";

export interface PhotoLightboxState {
  urls: string[];
  index: number;
}

/**
 * 사진 한 장 — 불러오지 못하면 깨진 아이콘 대신 안내 상자를 보여 줍니다.
 * (서명 URL 만료·삭제된 파일·느린 회선에서 사진이 조용히 사라지지 않게)
 */
function PhotoImage({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#F2F4F7] px-2 text-center">
        <Icon name="info" size={17} strokeWidth={1.9} className="text-[#98A2B3]" />
        <span className="wrap-any text-[10.5px] font-bold leading-relaxed text-[#98A2B3]">
          사진을 불러오지 못했어요
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

/**
 * 카드 안에 붙은 첨부 사진 — 1장은 가로로 크게, 2~3장은 정사각 그리드.
 * 누르면 PhotoLightbox 로 크게 봅니다. (시야 후기 · 직관 기록 공용)
 */
export function PhotoTiles({
  urls,
  onOpen,
  singleHeight = 170,
  label = "첨부 사진",
}: {
  urls: string[];
  onOpen: (index: number) => void;
  singleHeight?: number;
  label?: string;
}) {
  if (!urls.length) return null;

  if (urls.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen(0)}
        aria-label={`${label} 크게 보기`}
        style={{ height: singleHeight }}
        className="mt-2.5 block w-full overflow-hidden rounded-[12px] border border-line bg-[#F5F7FA] active:opacity-90"
      >
        <PhotoImage url={urls[0]} alt={label} />
      </button>
    );
  }

  return (
    <div className={`mt-2.5 grid gap-1.5 ${urls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {urls.map((url, index) => (
        <button
          key={`${index}-${url.slice(-12)}`}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={`${label} ${index + 1} 크게 보기`}
          className="aspect-square overflow-hidden rounded-[11px] border border-line bg-[#F5F7FA] active:opacity-90"
        >
          <PhotoImage url={url} alt={`${label} ${index + 1}`} />
        </button>
      ))}
    </div>
  );
}

/** 사진 전체화면 보기 (좌우로 넘김) */
export function PhotoLightbox({
  state,
  onClose,
  onPick,
  label = "첨부 사진",
}: {
  state: PhotoLightboxState;
  onClose: () => void;
  onPick: (index: number) => void;
  label?: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 크게 보기`}
      className="animate-fadeIn fixed inset-0 z-[60] mx-auto flex w-full max-w-[430px] flex-col bg-black/95"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[calc(12px+env(safe-area-inset-top))] text-white">
        <span className="text-[11.5px] font-extrabold tracking-tight2 text-white/70">
          {state.index + 1} / {state.urls.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="사진 닫기"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[.12] text-white"
        >
          <Icon name="close" size={16} strokeWidth={2.4} />
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="사진 닫기"
        className="flex flex-1 items-center justify-center px-3 pb-3"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.urls[state.index]}
          alt={label}
          className="max-h-full w-full rounded-[14px] object-contain"
        />
      </button>

      {state.urls.length > 1 ? (
        <div className="flex items-center justify-center gap-2 pb-[calc(18px+env(safe-area-inset-bottom))]">
          {state.urls.map((url, index) => (
            <button
              key={`${index}-${url.slice(-12)}`}
              type="button"
              onClick={() => onPick(index)}
              aria-label={`${index + 1}번째 사진 보기`}
              className={`h-1.5 rounded-full transition-all ${
                index === state.index ? "w-5 bg-white" : "w-1.5 bg-white/[.38]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
