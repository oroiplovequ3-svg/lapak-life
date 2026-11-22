"use client";

import { useEffect, useState } from "react";

import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";
import type { UserParking } from "@/lib/types";

interface UserParkingSheetProps {
  open: boolean;
  onClose: () => void;
  /** 수정할 주차 팁 — 넘기면 '수정' 모드로 열립니다 */
  editing?: UserParking | null;
}

/** 맛집·주차 → 직관러 주차 팁 등록 바텀시트 */
export function UserParkingSheet({ open, onClose, editing = null }: UserParkingSheetProps) {
  const { addUserParking, updateUserParking, isAdmin } = useApp();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [feeNote, setFeeNote] = useState("");
  const [walkTime, setWalkTime] = useState("");
  const [tip, setTip] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const valid = name.trim().length >= 1;

  // 열 때마다 새 주차 팁 / 수정할 팁으로 채웁니다.
  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setLocation(editing?.location ?? "");
    setIsFree(editing?.isFree ?? true);
    setFeeNote(editing?.feeNote ?? "");
    setWalkTime(editing?.walkTime ?? "");
    setTip(editing?.tip ?? "");
    setSubmitting(false);
  }, [open, editing]);

  const reset = () => {
    setName("");
    setLocation("");
    setFeeNote("");
    setWalkTime("");
    setTip("");
    setIsFree(true);
  };

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    const input = {
      name: name.trim(),
      location: location.trim(),
      isFree,
      feeNote: isFree ? "" : feeNote.trim(),
      walkTime: walkTime.trim(),
      tip: tip.trim(),
    };
    const ok = editing
      ? await updateUserParking(editing.id, input)
      : await addUserParking(input);
    setSubmitting(false);
    if (ok) {
      if (!editing) reset();
      onClose();
    }
  };

  return (
    <Sheet
      open={open}
      title={editing ? "직관러 주차 팁 수정" : "직관러 주차 팁 추가"}
      onClose={onClose}
    >
      <span className="text-xs font-extrabold text-ink-2">장소 이름</span>
      <input
        value={name}
        maxLength={40}
        onChange={(event) => setName(event.target.value)}
        placeholder="예: 외환들 공영주차장, 대구미술관 주차장"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">
        위치·출입구 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={location}
        maxLength={80}
        onChange={(event) => setLocation(event.target.value)}
        placeholder="예: 구장 동쪽, 3루 쪽 출입구로 나오면 가까워요"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">요금</span>
      <div className="flex gap-1.5">
        {(
          [
            [true, "무료"],
            [false, "유료"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setIsFree(value)}
            className={`flex-1 rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              isFree === value
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {!isFree ? (
        <input
          value={feeNote}
          maxLength={40}
          onChange={(event) => setFeeNote(event.target.value)}
          placeholder="예: 1시간 1,800원 · 1일 5,000원"
          className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
        />
      ) : null}

      <span className="text-xs font-extrabold text-ink-2">
        걷는 시간 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={walkTime}
        maxLength={40}
        onChange={(event) => setWalkTime(event.target.value)}
        placeholder="예: 도보 7분, 셔틀 약 10분"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">
        한 줄 팁 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <textarea
        value={tip}
        maxLength={120}
        rows={3}
        onChange={(event) => setTip(event.target.value)}
        placeholder="예: 전설로가 만차여도 여기는 자리가 있어요. 단속 구간은 피하세요."
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
          {submitting ? "저장 중…" : editing ? "수정 완료" : "주차 팁 등록"}
        </button>
      </div>

      {editing && !editing.mine && isAdmin ? (
        <p className="break-keep text-[10.5px] font-bold leading-relaxed text-[#B54708]">
          마스터 권한으로 다른 직관러의 주차 팁을 수정합니다.
        </p>
      ) : null}
    </Sheet>
  );
}
