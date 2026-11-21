export type CategoryId = "review" | "live" | "talk" | "goods";

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
  userId: string | null;
  nickname: string;
  name: string;
  menu: string;
  tip: string;
  rating: number;
  inStadium: boolean;
  /** 맛집에 첨부한 사진 (최대 3장 · 데모는 축소된 data URL, 연동 시 Storage 공개 URL) */
  photoUrls: string[];
  createdAt: string;
  mine: boolean;
}

/** 직관러가 직접 올린 주차 팁 (user_parkings 테이블과 1:1) */
export interface UserParking {
  id: string;
  userId: string | null;
  nickname: string;
  name: string;
  location: string;
  isFree: boolean;
  feeNote: string;
  walkTime: string;
  tip: string;
  createdAt: string;
  mine: boolean;
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
  /** 첨부 사진 (최대 3장 · 데모는 축소된 data URL, 연동 시 Storage 공개 URL) */
  photoUrls: string[];
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

export interface NewUserParkingInput {
  name: string;
  location: string;
  isFree: boolean;
  feeNote: string;
  walkTime: string;
  tip: string;
}
