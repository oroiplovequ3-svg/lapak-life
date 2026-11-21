"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";

interface UserFoodSheetProps {
  open: boolean;
  onClose: () => void;
}

/** 맛집·주차 → 직관러 맛집 등록 바텀시트 */
export function UserFoodSheet({ open, onClose }: UserFoodSheetProps) {
  const { addUserFood } = useApp();
  const [name, setName] = useState("");
  const [inStadium, setInStadium] = useState(true);
  const [menu, setMenu] = useState("");
  const [tip, setTip] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const valid = name.trim().length >= 1;

  const reset = () => {
    setName("");
    setMenu("");
    setTip("");
    setRating(5);
    setInStadium(true);
  };

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    const ok = await addUserFood({
      name: name.trim(),
      menu: menu.trim(),
      tip: tip.trim(),
      rating,
      inStadium,
    });
    setSubmitting(false);
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <Sheet open={open} title="직관러 맛집 추가" onClose={onClose}>
      <span className="text-xs font-extrabold text-ink-2">가게 이름</span>
      <input
        value={name}
        maxLength={40}
        onChange={(event) => setName(event.target.value)}
        placeholder="예: 3루 통닭, 대공원역 국밥집"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">위치</span>
      <div className="flex gap-1.5">
        {(
          [
            [true, "구장 안"],
            [false, "구장 밖(입장 전)"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setInStadium(value)}
            className={`flex-1 rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              inStadium === value
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        추천 메뉴 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={menu}
        maxLength={80}
        onChange={(event) => setMenu(event.target.value)}
        placeholder="예: 간장치킨 + 감자튀김 (12,000원)"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">별점</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`별점 ${value}점`}
            onClick={() => setRating(value)}
            className={`grid h-9 w-9 place-items-center rounded-[11px] transition ${
              value <= rating ? "bg-[#FFF6E7] text-[#F79009]" : "bg-[#F5F7FA] text-[#D5DBE3]"
            }`}
          >
            <Icon name="star" size={18} strokeWidth={1.2} filled={value <= rating} />
          </button>
        ))}
        <span className="ml-1 text-[12px] font-extrabold text-ink-faint">{rating}.0</span>
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        한 줄 팁 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <textarea
        value={tip}
        maxLength={120}
        rows={3}
        onChange={(event) => setTip(event.target.value)}
        placeholder="예: 8회 이후엔 반값 세일, 줄 서는 시간대는 6시 전후예요."
        className="w-full resize-none rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] leading-relaxed text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />
      <div className="-mt-2 text-right text-[10.5px] font-bold text-[#B4BCC9]">
        {tip.length} / 120
      </div>

      <div className="flex gap-2 pt-0.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-[13px] bg-white py-3 text-[13px] font-extrabold text-ink-2 ring-1 ring-line"
        >
          취소
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!valid || submitting}
          className="flex-1 rounded-[13px] bg-brand py-3 text-[13px] font-extrabold text-white shadow-brand disabled:bg-[#E4E7EC] disabled:text-ink-faint disabled:shadow-none"
        >
          {submitting ? "등록 중…" : "맛집 등록"}
        </button>
      </div>
    </Sheet>
  );
}
