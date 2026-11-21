import type { Category, CategoryId } from "@/lib/types";

export type FilterId = CategoryId | "all";

export interface FeedFilter {
  id: FilterId;
  label: string;
  color: string;
  bg: string;
}

/** 피드 카테고리 칩 (프로토타입 CATS 그대로) */
export const FEED_FILTERS: FeedFilter[] = [
  { id: "all", label: "전체", color: "#074CA1", bg: "#EEF4FD" },
  { id: "review", label: "직관후기", color: "#0A58CA", bg: "#EAF1FD" },
  { id: "live", label: "실시간현장", color: "#D92D20", bg: "#FEF3F2" },
  { id: "talk", label: "소통해요", color: "#039855", bg: "#ECFDF3" },
  { id: "goods", label: "굿즈", color: "#7A5AF8", bg: "#F4F3FF" },
];

/** 글쓰기에서 고를 수 있는 카테고리 (전체 제외) */
export const WRITE_CATEGORIES: Category[] = FEED_FILTERS.filter(
  (f): f is Category => f.id !== "all",
);

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
