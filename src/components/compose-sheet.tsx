"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";
import { WRITE_CATEGORIES } from "@/lib/data/categories";
import { zoneFullName, ZONE_ORDER } from "@/lib/data/zones";
import type { CategoryId, Post } from "@/lib/types";

/** 좌석을 함께 남기는 카테고리 — 직관후기 · 실시간현장만 */
const SEAT_CATEGORY_IDS: CategoryId[] = ["review", "live"];

interface ComposeSheetProps {
  open: boolean;
  onClose: () => void;
  /** 수정할 글 — 넘기면 '수정' 모드로 열립니다 */
  editing?: Post | null;
  /** 등록·수정 성공 시 (예: 피드 새로고침·스크롤) */
  onPosted?: () => void;
}

export function ComposeSheet({ open, onClose, editing = null, onPosted }: ComposeSheetProps) {
  const { createPost, updatePost, user, configured, isAdmin } = useApp();
  const [category, setCategory] = useState<CategoryId>("review");
  const [seatZone, setSeatZone] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 열 때마다 새 글 / 수정할 글로 채웁니다.
  useEffect(() => {
    if (!open) return;
    setCategory(editing?.category ?? "review");
    setSeatZone(editing?.seatZone ?? "");
    setBody(editing?.body ?? "");
    setSubmitting(false);
  }, [open, editing]);

  /** 소통해요·굿즈에서는 좌석 항목을 숨기고 저장도 하지 않는다 */
  const withSeat = SEAT_CATEGORY_IDS.includes(category);
  const seatCode = withSeat ? seatZone || null : null;

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    const input = {
      category,
      body: text,
      seatZone: seatCode,
      seatDetail: seatCode ? zoneFullName(seatCode) : null,
    };
    const ok = editing
      ? await updatePost(editing.id, input)
      : await createPost(input);
    setSubmitting(false);
    if (ok) {
      setBody("");
      setSeatZone("");
      onClose();
      onPosted?.();
    }
  };

  return (
    <Sheet
      open={open}
      title={editing ? "글 수정" : "새 글 쓰기"}
      onClose={onClose}
      dirty={body.trim().length > 0 || seatZone !== (editing?.seatZone ?? "")}
      dirtyMessage={editing ? "수정 중인 내용이 사라져요. 닫을까요?" : "작성 중인 글이 사라져요. 닫을까요?"}
    >
      <span className="text-xs font-extrabold text-ink-2">카테고리</span>
      <div className="flex flex-wrap gap-1.5">
        {WRITE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              category === c.id
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {withSeat && (
        <>
          <span className="text-xs font-extrabold text-ink-2">
            좌석 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
          </span>
          <div className="relative">
            <select
              value={seatZone}
              onChange={(event) => setSeatZone(event.target.value)}
              className="w-full appearance-none rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] pr-9 text-[13px] font-bold text-ink-2 outline-none"
            >
              <option value="">좌석을 선택하지 않음</option>
              {ZONE_ORDER.map((code) => (
                <option key={code} value={code}>
                  {zoneFullName(code)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
              <Icon name="chevron" size={15} />
            </span>
          </div>
        </>
      )}

      <span className="text-xs font-extrabold text-ink-2">내용</span>
      <textarea
        value={body}
        maxLength={300}
        onChange={(event) => setBody(event.target.value)}
        placeholder="라팍에서 있었던 일을 남겨보세요. 좌석 후기, 응원 팁, 먹거리 정보 모두 좋아요."
        rows={5}
        className="w-full resize-none rounded-[14px] border border-line bg-[#FAFBFC] px-[13px] py-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />
      <div className="-mt-2 text-right text-[10.5px] font-bold text-[#B4BCC9]">
        {body.length} / 300
      </div>

      {configured && !user && !editing && (
        <p className="rounded-[11px] bg-brand-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
          등록하려면 구글 로그인이 필요해요. 로그인한 뒤에 남겨주세요.
        </p>
      )}

      {editing && !editing.mine && isAdmin ? (
        <p className="rounded-[11px] bg-[#FFF7E8] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#B54708]">
          마스터 권한으로 다른 직관러의 글을 수정합니다.
        </p>
      ) : null}

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
          {submitting ? "저장 중…" : editing ? "수정 완료" : "등록하기"}
        </button>
      </div>
    </Sheet>
  );
}
