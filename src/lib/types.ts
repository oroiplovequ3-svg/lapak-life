export type CategoryId = "review" | "live" | "qna" | "market";

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

export interface Post {
  id: string;
  userId: string | null;
  nickname: string;
  badge: string;
  category: CategoryId;
  body: string;
  seatZone: string | null;
  seatDetail: string | null;
  media: "day" | "night" | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  mine: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string | null;
  nickname: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface ZoneReview {
  id: string;
  zoneCode: string;
  userId: string | null;
  nickname: string;
  badge: string;
  seatDetail: string;
  stars: number;
  body: string;
  createdAt: string;
  mine: boolean;
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

export interface NewPostInput {
  category: CategoryId;
  body: string;
  seatZone: string | null;
  seatDetail: string | null;
}

export interface NewReviewInput {
  zoneCode: string;
  seatDetail: string;
  stars: number;
  body: string;
}

export interface NewGameInput {
  playedOn: string;
  opponent: string;
  homeAway: "home" | "away";
  zoneCode: string | null;
  scoreFor: number;
  scoreAgainst: number;
  note: string;
}
