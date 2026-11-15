"use client";

import { useState } from "react";

import { Icon, Stars } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";
import { ZONE_ORDER, ZONE_BY_CODE } from "@/lib/data/zones";

interface ReviewSheetProps {
  open: boolean;
  onClose: () => void;
  initialZone?: string;
  /** 등록 후 이동할 구역 */
  onPosted?: (zoneCode: string) => void;
}

export function ReviewSheet({ open, onClose, initialZone = "T3", onPosted }: ReviewSheetProps) {
  const { createReview } = useApp();
  const [zone, setZone] = useState(initialZone);
  const [seatDetail, setSeatDetail] = useState("");
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    const ok = await createReview({ zoneCode: zone, seatDetail: seatDetail.trim(), stars, body: text });
    setSubmitting(false);
    if (ok) {
      setBody("");
      setSeatDetail("");
      setStars(5);
      onClose();
      onPosted?.(zone);
    }
  };

  return (
    <Sheet open={open} title="시야 후기 올리기" onClose={onClose}>
      <span className="text-xs font-extrabold text-ink-2">구역</span>
      <div className="flex flex-wrap gap-1.5">
        {ZONE_ORDER.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setZone(code)}
            className={`rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              zone === code
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {ZONE_BY_CODE[code]?.short ?? code}
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        좌석 상세 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={seatDetail}
        onChange={(event) => setSeatDetail(event.target.value)}
        placeholder="예: T3-2 · 3열 10번"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">별점</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n}점`}>
            <span className={n <= stars ? "text-[#F79009]" : "text-[#E4E7EC]"}>
              <Icon name="star" size={26} strokeWidth={1.4} filled />
            </span>
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">한 줄 후기</span>
      <textarea
        value={body}
        maxLength={300}
        onChange={(event) => setBody(event.target.value)}
        placeholder="시야·햇빛·응원 분위기 등 실제로 느낀 점을 남겨주세요."
        rows={5}
        className="w-full resize-none rounded-[14px] border border-line bg-[#FAFBFC] px-[13px] py-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />
      <div className="-mt-2 text-right text-[10.5px] font-bold text-[#B4BCC9]">
        {body.length} / 300
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
          disabled={!body.trim() || submitting}
          className="flex-1 rounded-[13px] bg-brand py-3 text-[13px] font-extrabold text-white shadow-brand disabled:bg-[#E4E7EC] disabled:text-ink-faint disabled:shadow-none"
        >
          {submitting ? "등록 중…" : "후기 등록"}
        </button>
      </div>
    </Sheet>
  );
}

export function StarsPreview({ value }: { value: number }) {
  return <Stars value={value} />;
}
