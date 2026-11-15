"use client";

import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";
import { ZONE_BY_CODE, ZONE_ORDER } from "@/lib/data/zones";
import { todayISO } from "@/lib/utils";
import { useState } from "react";

interface GameSheetProps {
  open: boolean;
  onClose: () => void;
}

/** 내 직관 · 직관 기록 추가 바텀시트 */
export function GameSheet({ open, onClose }: GameSheetProps) {
  const { addGame } = useApp();
  const [playedOn, setPlayedOn] = useState(todayISO());
  const [opponent, setOpponent] = useState("");
  const [homeAway, setHomeAway] = useState<"home" | "away">("home");
  const [zoneCode, setZoneCode] = useState("T3");
  const [scoreFor, setScoreFor] = useState("");
  const [scoreAgainst, setScoreAgainst] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const valid = opponent.trim() && scoreFor !== "" && scoreAgainst !== "";

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    const ok = await addGame({
      playedOn,
      opponent: opponent.trim(),
      homeAway,
      zoneCode,
      scoreFor: Number(scoreFor),
      scoreAgainst: Number(scoreAgainst),
      note: note.trim(),
    });
    setSubmitting(false);
    if (ok) {
      setOpponent("");
      setScoreFor("");
      setScoreAgainst("");
      setNote("");
      onClose();
    }
  };

  return (
    <Sheet open={open} title="직관 기록 추가" onClose={onClose}>
      <span className="text-xs font-extrabold text-ink-2">경기 날짜</span>
      <input
        type="date"
        value={playedOn}
        max={todayISO()}
        onChange={(event) => setPlayedOn(event.target.value)}
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none"
      />

      <span className="text-xs font-extrabold text-ink-2">상대팀</span>
      <input
        value={opponent}
        onChange={(event) => setOpponent(event.target.value)}
        placeholder="예: kt, KIA, 롯데"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">홈 / 원정</span>
      <div className="flex gap-1.5">
        {([
          ["home", "라팍 (홈)"],
          ["away", "원정"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setHomeAway(value)}
            className={`flex-1 rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              homeAway === value
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">좌석 구역</span>
      <div className="flex flex-wrap gap-1.5">
        {ZONE_ORDER.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setZoneCode(code)}
            className={`rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              zoneCode === code
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {ZONE_BY_CODE[code]?.short ?? code}
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">스코어 (삼성 : 상대)</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={scoreFor}
          onChange={(event) => setScoreFor(event.target.value)}
          placeholder="삼성"
          className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-center text-[15px] font-extrabold text-ink outline-none"
        />
        <span className="text-ink-faint">:</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={scoreAgainst}
          onChange={(event) => setScoreAgainst(event.target.value)}
          placeholder="상대"
          className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-center text-[15px] font-extrabold text-ink outline-none"
        />
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        메모 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={note}
        maxLength={60}
        onChange={(event) => setNote(event.target.value)}
        placeholder="예: 가족 직관, 홈런볼 획득"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

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
          {submitting ? "저장 중…" : "기록 저장"}
        </button>
      </div>
    </Sheet>
  );
}
