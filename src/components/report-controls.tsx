"use client";

import { Icon } from "@/components/icons";

/**
 * 신고 관련 공통 UI.
 * - ReportButton: 모든 게시물에 붙는 신고 버튼 (1건 이상이면 "신고 N")
 * - HiddenBadge: 신고 10건 이상으로 자동 숨김된 콘텐츠임을 마스터에게 알리는 배지
 * - RestoreButton: 마스터가 숨김을 풀 때 누르는 버튼
 *
 * 숨김 콘텐츠는 DB(SELECT RLS)에서 마스터에게만 내려오므로,
 * 이 화면들은 마스터 눈에만 보입니다.
 */
export function ReportButton({
  count,
  onReport,
  /** 내 글·마스터가 관리 중인 글이면 신고 버튼 대신 누적 수만 보여 줍니다 */
  manage = false,
  size = "md",
  className = "",
}: {
  count: number;
  onReport?: () => void;
  manage?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const label = count > 0 ? `신고 ${count}` : "신고";
  const scale =
    size === "sm"
      ? "px-1.5 py-1 text-[10px]"
      : "px-2 py-[5px] text-[10.5px]";

  if (manage) {
    if (count <= 0) return null;
    return (
      <span
        className={`inline-flex flex-none items-center gap-[3px] rounded-md bg-[#FEF3F2] font-extrabold text-[#B42318] ${scale} ${className}`}
      >
        <Icon name="shield" size={11} strokeWidth={2.1} />
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onReport}
      aria-label="신고하기"
      className={`inline-flex flex-none items-center gap-[3px] rounded-md font-extrabold transition ${
        count > 0
          ? "bg-[#FEF3F2] text-[#B42318] hover:bg-[#FEE4E2]"
          : "text-[#B9C0CB] hover:text-[#B42318]"
      } ${scale} ${className}`}
    >
      <Icon name="shield" size={11} strokeWidth={2.1} />
      {label}
    </button>
  );
}

export function HiddenBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`wrap-any rounded-[10px] border border-[#FDA29B] bg-[#FFF1F3] px-2.5 py-2 text-[10.5px] font-extrabold leading-relaxed text-[#B42318] ${className}`}
    >
      🚨 신고 10회 이상 · 자동 숨김{" "}
      <span className="font-bold text-[#B42318]/70">(마스터 전용)</span>
    </div>
  );
}

export function RestoreButton({
  onClick,
  busy = false,
  className = "",
}: {
  onClick: () => void;
  busy?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex flex-none items-center gap-[3px] rounded-md bg-[#ECFDF3] px-2 py-[5px] text-[10.5px] font-extrabold text-[#027A48] transition hover:bg-[#D1FADF] disabled:opacity-60 ${className}`}
    >
      <Icon name="shield" size={11} strokeWidth={2.1} />
      {busy ? "복구 중…" : "숨김 복구"}
    </button>
  );
}
