"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";
import type { ReportTargetType } from "@/lib/types";

const REASONS = [
  "스팸·광고",
  "욕설·비방",
  "개인정보 노출",
  "음란·불쾌한 내용",
  "허위 정보",
  "기타",
] as const;

const TARGET_LABEL: Record<ReportTargetType, string> = {
  post: "글",
  comment: "댓글",
  review: "시야 후기",
  user_food: "직관러 맛집",
  user_parking: "주차 팁",
};

interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  /** 신고 대상 설명 (누구의 어떤 글인지) */
  targetHint?: string;
}

/** 글·댓글·후기·맛집·주차 팁 신고 시트 */
export function ReportSheet({
  open,
  onClose,
  targetType,
  targetId,
  targetHint,
}: ReportSheetProps) {
  const { createReport } = useApp();
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason(REASONS[0]);
    setDetail("");
    setSubmitting(false);
  }, [open, targetId]);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await createReport({
      targetType,
      targetId,
      reason,
      detail: reason === "기타" ? detail.trim() : detail.trim(),
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <Sheet open={open} title="신고하기" onClose={onClose}>
      <p className="break-keep rounded-[12px] bg-[#F8FAFC] px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-muted">
        {TARGET_LABEL[targetType]}을(를) 신고합니다.
        {targetHint ? (
          <>
            <br />
            <span className="font-bold text-ink-2">{targetHint}</span>
          </>
        ) : null}
      </p>

      <span className="text-xs font-extrabold text-ink-2">신고 사유</span>
      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setReason(item)}
            className={`rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              reason === item
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        설명 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <textarea
        value={detail}
        maxLength={300}
        onChange={(event) => setDetail(event.target.value)}
        placeholder="어떤 점이 문제인지 적어주시면 확인에 도움이 돼요."
        rows={4}
        className="w-full resize-none rounded-[14px] border border-line bg-[#FAFBFC] px-[13px] py-3 text-[13px] leading-relaxed text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <p className="break-keep text-[10.5px] leading-relaxed text-ink-faint">
        신고는 운영자(마스터)만 확인합니다. 같은 항목은 한 번만 신고할 수 있어요.
      </p>

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
          onClick={() => void submit()}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[13px] bg-[#B42318] py-3 text-[13px] font-extrabold text-white shadow disabled:bg-[#E4E7EC] disabled:text-ink-faint disabled:shadow-none"
        >
          <Icon name="shield" size={14} strokeWidth={2.1} />
          {submitting ? "접수 중…" : "신고 접수"}
        </button>
      </div>
    </Sheet>
  );
}
