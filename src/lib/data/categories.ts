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
  { id: "qna", label: "질문", color: "#039855", bg: "#ECFDF3" },
  { id: "market", label: "굿즈·티켓", color: "#7A5AF8", bg: "#F4F3FF" },
];

/** 글쓰기에서 고를 수 있는 카테고리 (전체 제외) */
export const WRITE_CATEGORIES: Category[] = FEED_FILTERS.filter(
  (f): f is Category => f.id !== "all",
);

export function categoryOf(id: string): Category {
  return WRITE_CATEGORIES.find((c) => c.id === id) ?? WRITE_CATEGORIES[0];
}
