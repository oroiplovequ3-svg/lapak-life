export type CategoryId = "review" | "live" | "talk" | "goods" | "event";

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  bg: string;
}

/** 좌석 구역 (zones 테이블과 1:1) */
export interface Zone {
  code: string;
  name: string;
  short: string;
  /** 구역 대표 이름 아래 붙는 소분류 (예: 원정응원석 → 1루 내야 (지정석)) */
  sub?: string;
  emoji: string;
  side: string;
  grade: string;
  price: string;
  dist: string;
  block: string;
  roof: string;
  sun: string;
  rain: string;
  cheer: string;
  good: string;
  tip: string;
  sortOrder: number;
}

/** 먹거리 (foods 테이블과 1:1) */
export interface Food {
  id: string;
  name: string;
  emoji: string;
  thumbBg: string;
  price: string;
  loc: string;
  rating: number;
  wait: 0 | 1 | 2;
  waitTxt: string;
  menu: string;
  tip: string;
  inStadium: boolean;
  sortOrder: number;
}

export interface ParkingCard {
  ic: string;
  title: string;
  sub: string;
  kvs: [string, string][];
  warn?: string;
  tip?: string;
}

/** 직관러가 직접 올린 맛집 (user_foods 테이블과 1:1) */
export interface UserFood {
  id: string;
  /** DB가 매기는 작성순번 (화면에 No.N 으로 표시 · 지워지지 않고 새 글마다 증가) */
  postNo?: number;
  userId: string | null;
  nickname: string;
  avatarUrl: string | null;
  name: string;
  menu: string;
  tip: string;
  rating: number;
  inStadium: boolean;
  /** 맛집에 첨부한 사진 (최대 3장 · 데모는 축소된 data URL, 연동 시 Storage 공개 URL) */
  photoUrls: string[];
  /** 달린 댓글 수 (user_food_comments) */
  commentCount?: number;
  /** 누적 신고 수 (10회 이상이면 자동 숨김) */
  reportCount?: number;
  /** 신고 누적으로 숨겨진 글 — 마스터에게만 보입니다 */
  isHidden?: boolean;
  createdAt: string;
  mine: boolean;
}

/** 직관러 맛집에 달린 댓글 (user_food_comments 테이블과 1:1) */
export interface UserFoodComment {
  id: string;
  foodId: string;
  userId: string | null;
  nickname: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
  mine: boolean;
  /** 누적 신고 수 (10회 이상이면 자동 숨김) */
  reportCount?: number;
  /** 신고 누적으로 숨겨진 댓글 — 마스터에게만 보입니다 */
  isHidden?: boolean;
}

/** 직관러가 직접 올린 주차 팁 (user_parkings 테이블과 1:1) */
export interface UserParking {
  id: string;
  /** DB가 매기는 작성순번 (화면에 No.N 으로 표시) */
  postNo?: number;
  userId: string | null;
  nickname: string;
  avatarUrl: string | null;
  name: string;
  location: string;
  isFree: boolean;
  feeNote: string;
  walkTime: string;
  tip: string;
  createdAt: string;
  mine: boolean;
  /** 누적 신고 수 (10회 이상이면 자동 숨김) */
  reportCount?: number;
  /** 신고 누적으로 숨겨진 글 — 마스터에게만 보입니다 */
  isHidden?: boolean;
}

export interface Post {
  id: string;
  /** DB가 매기는 작성순번 (화면에 No.N 으로 표시 · 지워지지 않고 새 글마다 증가) */
  postNo?: number;
  userId: string | null;
  nickname: string;
  avatarUrl: string | null;
  badge: string;
  category: CategoryId;
  body: string;
  seatZone: string | null;
  seatDetail: string | null;
  media: "day" | "night" | null;
  /** 글에 첨부한 사진 (최대 3장 · 데모는 축소된 data URL, 연동 시 Storage 공개 URL) */
  photoUrls: string[];
  createdAt: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  mine: boolean;
  /** 누적 신고 수 (10회 이상이면 자동 숨김) */
  reportCount?: number;
  /** 신고 누적으로 숨겨진 글 — 마스터에게만 보입니다 */
  isHidden?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string | null;
  nickname: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
  mine: boolean;
  /** 누적 신고 수 (10회 이상이면 자동 숨김) */
  reportCount?: number;
  /** 신고 누적으로 숨겨진 댓글 — 마스터에게만 보입니다 */
  isHidden?: boolean;
}

export interface ZoneReview {
  id: string;
  /** DB가 매기는 작성순번 (화면에 No.N 으로 표시) */
  postNo?: number;
  zoneCode: string;
  userId: string | null;
  nickname: string;
  avatarUrl: string | null;
  badge: string;
  seatDetail: string;
  stars: number;
  body: string;
  /** 첨부 사진 (최대 3장 · 데모는 축소된 data URL, 연동 시 Storage 공개 URL) */
  photoUrls: string[];
  createdAt: string;
  mine: boolean;
  /** 누적 신고 수 (10회 이상이면 자동 숨김) */
  reportCount?: number;
  /** 신고 누적으로 숨겨진 후기 — 마스터에게만 보입니다 */
  isHidden?: boolean;
}

export interface Game {
  id: string;
  userId: string | null;
  playedOn: string;
  opponent: string;
  homeAway: "home" | "away";
  zoneCode: string | null;
  scoreFor: number;
  scoreAgainst: number;
  note: string;
  /** 직관 기록에 첨부한 사진 (최대 3장 · 데모는 축소된 data URL, 연동 시 Storage 공개 URL) */
  photoUrls: string[];
  createdAt: string;
}

export interface Author {
  id: string | null;
  nickname: string;
  avatarUrl: string | null;
}

export interface AppUser extends Author {
  id: string;
  email: string | null;
}

export interface Saves {
  zones: string[];
  foods: string[];
}

export interface ProfileUpdate {
  nickname: string;
  /**
   * undefined: 지금 사진 유지 · null: 기본 아바타로 되돌리기
   * string: 브라우저에서 줄인 프로필 사진 data URL
   */
  avatarDataUrl?: string | null;
}

export interface NewPostInput {
  category: CategoryId;
  body: string;
  seatZone: string | null;
  seatDetail: string | null;
  /**
   * 첨부 사진 — 새로 고른 사진은 축소된 data URL,
   * 수정할 때 남겨 둔 사진은 Storage 공개 URL 로 넘깁니다. (최대 3장)
   */
  photoUrls?: string[];
}

export interface NewReviewInput {
  zoneCode: string;
  seatDetail: string;
  stars: number;
  body: string;
  photoUrls?: string[];
}

export interface NewGameInput {
  playedOn: string;
  opponent: string;
  homeAway: "home" | "away";
  zoneCode: string | null;
  scoreFor: number;
  scoreAgainst: number;
  note: string;
  photoUrls?: string[];
}

export interface NewUserFoodInput {
  name: string;
  menu: string;
  tip: string;
  rating: number;
  inStadium: boolean;
  photoUrls?: string[];
}

/** 통합 검색에서 '맛집·주차' 탭의 특정 항목으로 바로 이동할 때 쓰는 목표 */
export type FoodFocusKind = "stadium" | "user-food" | "user-parking" | "parking-guide";

export interface FoodFocus {
  kind: FoodFocusKind;
  id: string;
  /** 같은 항목을 다시 눌러도 이동이 다시 일어나도록 올려 주는 값 */
  nonce: number;
}

export interface NewUserParkingInput {
  name: string;
  location: string;
  isFree: boolean;
  feeNote: string;
  walkTime: string;
  tip: string;
}

/** 신고할 수 있는 콘텐츠 종류 (reports.target_type) */
export type ReportTargetType =
  | "post"
  | "comment"
  | "review"
  | "user_food"
  | "user_food_comment"
  | "user_parking";

/** 직관러가 접수한 신고 (reports 테이블과 1:1) */
export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  /** 신고 사유 (짧은 문구) */
  reason: string;
  /** 사용자가 덧붙인 설명 (선택) */
  detail: string;
  /** open=접수됨 · resolved=삭제 등으로 처리 완료 · dismissed=문제 없음으로 기각 */
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

/** 신고 대상의 본문 미리보기 — 마스터가 신고 목록에서 내용을 바로 확인할 때 씁니다. */
export interface ReportTargetPreview {
  /** 대상이 아직 남아 있는지 (지워졌으면 false) */
  found: boolean;
  /** 본문·이름 등 한두 줄 미리보기 */
  body: string;
  /** 쓴 사람 닉네임 */
  nickname: string;
  /** 쓴 사람 계정 id — 마스터가 이 회원을 바로 영구 정지할 때 씁니다 */
  userId?: string | null;
  /** 댓글이면 부모 글 id (글로 바로 이동할 때) */
  postId: string | null;
  /** 직관러 맛집 댓글이면 부모 맛집 id (맛집·주차 탭으로 이동할 때) */
  foodId?: string | null;
  /** 시야 후기면 구역 코드 (좌석 시야 탭으로 이동할 때) */
  zoneCode: string | null;
  /** 신고 누적으로 숨김 처리된 대상인지 (마스터만 복구·삭제 결정) */
  hidden?: boolean;
}

/** 마스터 회원 관리 — 회원 한 명의 요약 (admin_list_users) */
export interface AdminUserSummary {
  userId: string;
  nickname: string;
  email: string | null;
  createdAt: string;
  isBanned: boolean;
  banReason: string | null;
}

/** 내가 영구 정지된 계정인지 (get_my_ban_status) */
export interface BanStatus {
  banned: boolean;
  reason: string | null;
}

export interface NewReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  detail?: string;
}
