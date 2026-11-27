import type { Category, CategoryId } from "@/lib/types";

export type FilterId = CategoryId | "all";

export interface FeedFilter {
  id: FilterId;
  label: string;
  color: string;
  bg: string;
}

/**
 * 피드 카테고리 칩
 * (전체 · 공지 · 직관후기 · 실시간현장 · 소통해요 · 굿즈 · 블루웨이브 후기 · 이벤트)
 * 공지는 마스터만 쓰는 카테고리라 칩은 어디서나 보이지만, 글은 항상 피드 맨 위에 고정됩니다.
 */
export const FEED_FILTERS: FeedFilter[] = [
  { id: "all", label: "전체", color: "#074CA1", bg: "#EEF4FD" },
  // 공지 — 인블루 남색(#074CA1)에 가장 가까운 톤으로, 다른 카테고리보다 '고정'된 느낌을 줍니다
  { id: "notice", label: "공지", color: "#063E84", bg: "#EAF0FA" },
  { id: "review", label: "직관후기", color: "#0A58CA", bg: "#EAF1FD" },
  { id: "live", label: "실시간현장", color: "#D92D20", bg: "#FEF3F2" },
  { id: "talk", label: "소통해요", color: "#039855", bg: "#ECFDF3" },
  { id: "goods", label: "굿즈", color: "#7A5AF8", bg: "#F4F3FF" },
  // 블루웨이브 응원 현장 후기 — 전체(#074CA1)·직관후기(#0A58CA)와 겹치지 않는 하늘색
  { id: "bluewave", label: "블루웨이브 후기", color: "#0284C7", bg: "#E0F2FE" },
  { id: "event", label: "이벤트", color: "#C11574", bg: "#FDF2FA" },
];

/** 글쓰기에서 고를 수 있는 카테고리 (전체 제외) */
export const WRITE_CATEGORIES: Category[] = FEED_FILTERS.filter(
  (f): f is Category => f.id !== "all",
);

/**
 * 마스터만 고를 수 있는 카테고리.
 * DB(018·022)의 RLS 도 같은 규칙으로 공지·이벤트 글을 막습니다.
 */
export const ADMIN_ONLY_CATEGORY_IDS: CategoryId[] = ["notice", "event"];

/** 글쓰기 시트에 실제로 보여 줄 카테고리 — 마스터에게만 공지·이벤트가 함께 보입니다 */
export function writeCategoriesFor(isAdmin: boolean): Category[] {
  return WRITE_CATEGORIES.filter(
    (category) => isAdmin || !ADMIN_ONLY_CATEGORY_IDS.includes(category.id),
  );
}

/** 예전 카테고리 값 → 지금 값 (질문·굿즈·티켓 개편 전 데이터 대비) */
const LEGACY_CATEGORY_IDS: Record<string, CategoryId> = {
  qna: "talk",
  market: "goods",
};

export function isCategoryId(id: string): id is CategoryId {
  return WRITE_CATEGORIES.some((c) => c.id === id);
}

/** DB·데모 데이터의 카테고리 값을 현재 카테고리로 맞춘다 */
export function normalizeCategory(id: string): CategoryId {
  if (isCategoryId(id)) return id;
  return LEGACY_CATEGORY_IDS[id] ?? "review";
}

export function categoryOf(id: string): Category {
  const normalized = normalizeCategory(id);
  return WRITE_CATEGORIES.find((c) => c.id === normalized) ?? WRITE_CATEGORIES[0];
}
