"use client";

import { Icon } from "@/components/icons";

/**
 * 목록 페이지 바 (`< 1 2 >`) — 직관 시야 후기·라팍톡이 같은 모양을 씁니다.
 * 한 페이지에 보여줄 개수는 화면이 정하고, 여기서는 페이지 번호만 다룹니다.
 */

/** 페이지 버튼 목록 — 페이지가 많으면 현재 위치 주변만 숫자로 보여줍니다. */
export function pageNumbers(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const nums = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

/** 페이지 이동 버튼 (<, >) */
function PageArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-[9px] transition active:scale-[.96] ${
        disabled ? "cursor-default text-[#D5DAE1]" : "text-ink-muted hover:bg-[#F3F5F9]"
      }`}
    >
      {children}
    </button>
  );
}

export function Pagination({
  page,
  pageCount,
  onChange,
  label,
  className = "",
}: {
  /** 지금 보고 있는 페이지 (1부터) */
  page: number;
  /** 전체 페이지 수 (1 이상) */
  pageCount: number;
  onChange: (next: number) => void;
  /** 화면 낭독기용 이름 (예: "직관 시야 후기 페이지") */
  label: string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label={label}
      className={`flex items-center justify-center gap-1.5 rounded-md2 border border-line bg-white px-2 py-1.5 shadow-card ${className}`}
    >
      <PageArrow label="이전 페이지" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <Icon name="chevron" size={12} strokeWidth={2.8} className="rotate-180" />
      </PageArrow>
      {pageNumbers(page, pageCount).map((n, index) =>
        n === "gap" ? (
          <span key={`gap-${index}`} className="px-0.5 text-[11px] font-bold text-[#B9C0CB]">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-current={n === page ? "page" : undefined}
            aria-label={`${n}페이지`}
            onClick={() => onChange(n)}
            className={`grid h-7 min-w-[28px] place-items-center rounded-[9px] px-1.5 text-[11.5px] font-extrabold transition active:scale-[.96] ${
              n === page
                ? "bg-brand text-white shadow-brand"
                : "text-ink-muted hover:bg-[#F3F5F9]"
            }`}
          >
            {n}
          </button>
        ),
      )}
      <PageArrow
        label="다음 페이지"
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
      >
        <Icon name="chevron" size={12} strokeWidth={2.8} />
      </PageArrow>
    </nav>
  );
}
