import { ZONE_BY_CODE } from "@/lib/data/zones";

/**
 * 인블루 주소창(딥링크) 상태.
 *
 * - 홈(라팍톡): `/` · 공유 글은 `/?post=<글id>` (예전 링크 그대로 호환)
 * - 좌석 시야: `/?tab=seat&zone=<구역코드>`
 * - 맛집·주차: `/?tab=food&seg=parking`, `&food=<매장id>`, `&userFood=<id>`, `&parking=<id>`
 * - 내 직관: `/?tab=my`
 *
 * 탭 이름은 `feed`(라팍톡) 도 홈으로 받아 줍니다.
 */

export type AppTab = "home" | "seat" | "food" | "my";

export type FoodSegment = "food" | "parking";
/** 먹거리·맛집 안의 3탭 (전체 · 직관러 맛집 · 야구장 푸드) */
export type FoodTabKey = "all" | "user" | "stadium";
/** 야구장 푸드의 구장 안/밖 필터 */
export type FoodFilterKey = "all" | "in" | "out";

export interface FoodLink {
  seg: FoodSegment;
  ftab: FoodTabKey;
  filter: FoodFilterKey;
  /** 야구장 푸드 매장 id */
  food: string | null;
  /** 직관러 맛집 id */
  userFood: string | null;
  /** 직관러 주차 팁 id */
  parking: string | null;
  /** 주차 안내 카드 순번 */
  guide: string | null;
}

export const DEFAULT_FOOD_LINK: FoodLink = {
  seg: "food",
  ftab: "all",
  filter: "all",
  food: null,
  userFood: null,
  parking: null,
  guide: null,
};

export interface AppUrlState {
  tab: AppTab;
  /** 좌석 구역 코드 ('all' 이면 전체 구역) */
  zone: string;
  /** 공유된 글 id (?post=) */
  post: string | null;
  food: FoodLink;
}

const TAB_ALIASES: Record<string, AppTab> = {
  home: "home",
  feed: "home",
  seat: "seat",
  food: "food",
  my: "my",
};

/** 사람이 읽기 쉬운 이름으로 들어온 구역도 받아 줍니다. (예: ?zone=blue) */
const ZONE_ALIASES: Record<string, string> = {
  BLUE: "BZ",
  BLUEZONE: "BZ",
  VIP: "C",
};

const SEGMENTS: readonly FoodSegment[] = ["food", "parking"];
const FOOD_TABS: readonly FoodTabKey[] = ["all", "user", "stadium"];
const FOOD_FILTERS: readonly FoodFilterKey[] = ["all", "in", "out"];

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  const raw = (value ?? "").trim().toLowerCase();
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export function normalizeZone(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw || raw.toLowerCase() === "all") return "all";
  const upper = raw.toUpperCase();
  const code = ZONE_ALIASES[upper] ?? upper;
  return ZONE_BY_CODE[code] ? code : "all";
}

export function readAppUrl(search: string): AppUrlState {
  const params = new URLSearchParams(search);
  const post = params.get("post")?.trim() || null;
  const zoneParam = params.get("zone");
  const zone = normalizeZone(zoneParam);

  const segParam = params.get("seg");
  const ftabParam = params.get("ftab");
  const food = params.get("food")?.trim() || null;
  const userFood = params.get("userFood")?.trim() || null;
  const parking = params.get("parking")?.trim() || null;
  const guide = params.get("guide")?.trim() || null;

  const foodLink: FoodLink = {
    seg: pick(segParam, SEGMENTS, parking || guide ? "parking" : "food"),
    ftab: pick(ftabParam, FOOD_TABS, userFood ? "user" : food ? "stadium" : "all"),
    filter: pick(params.get("filter"), FOOD_FILTERS, "all"),
    food,
    userFood,
    parking,
    guide,
  };

  let tab = TAB_ALIASES[(params.get("tab") ?? "").trim().toLowerCase()];
  if (!tab) {
    // 탭 없이 값만 붙어 있어도 어느 화면인지 알아냅니다.
    if (zoneParam) tab = "seat";
    else if (segParam || ftabParam || food || userFood || parking || guide) tab = "food";
    else tab = "home";
  }
  if (post) tab = "home";

  return { tab, zone: tab === "seat" ? zone : "all", post, food: foodLink };
}

export function buildAppSearch({ tab, zone, post, food }: AppUrlState): string {
  const params = new URLSearchParams();
  if (tab === "home") {
    // 홈은 파라미터 없이 깔끔하게 — 공유 글만 ?post= 로 남깁니다.
    if (post) params.set("post", post);
  } else {
    params.set("tab", tab);
    if (tab === "seat" && zone !== "all") params.set("zone", zone);
    if (tab === "food") {
      if (food.seg !== "food") params.set("seg", food.seg);
      if (food.ftab !== "all") params.set("ftab", food.ftab);
      if (food.filter !== "all") params.set("filter", food.filter);
      if (food.food) params.set("food", food.food);
      if (food.userFood) params.set("userFood", food.userFood);
      if (food.parking) params.set("parking", food.parking);
      if (food.guide) params.set("guide", food.guide);
    }
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** 맛집·주차 화면 상태가 같은지 비교하는 열쇠 */
export function foodLinkKey(link: FoodLink): string {
  return [
    link.seg,
    link.ftab,
    link.filter,
    link.food ?? "",
    link.userFood ?? "",
    link.parking ?? "",
    link.guide ?? "",
  ].join("|");
}

/** 구역 하나를 공유할 때 쓰는 주소 */
export function zoneShareUrl(origin: string, zoneCode: string): string {
  return `${origin}/?tab=seat&zone=${encodeURIComponent(zoneCode)}`;
}
