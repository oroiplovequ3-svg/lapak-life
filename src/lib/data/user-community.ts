import type { UserFood, UserParking } from "@/lib/types";

/**
 * 직관러 맛집 데모 씨드.
 * Supabase 를 연결하기 전에도 '직관러가 올린 글' 느낌을 볼 수 있게 몇 개만 넣어 둡니다.
 * (연동하면 user_foods 테이블의 실제 데이터를 씁니다)
 */
export const SEED_USER_FOODS: UserFood[] = [
  {
    id: "uf-seed-1",
    userId: null,
    nickname: "3루직관러",
    name: "라팍 3루 통닭",
    menu: "간장치킨 + 감자튀김",
    tip: "8회쯤 지나면 세일해서 반값에 먹을 수 있어요.",
    rating: 5,
    inStadium: true,
    createdAt: "2026-10-04T10:20:00.000Z",
    mine: false,
  },
  {
    id: "uf-seed-2",
    userId: null,
    nickname: "수성구팬",
    name: "대공원역 앞 국밥집",
    menu: "돼지국밥 (9,000원)",
    tip: "경기 전 17시 이전에 가면 줄 없이 먹고 들어갈 수 있어요.",
    rating: 4,
    inStadium: false,
    createdAt: "2026-09-21T08:05:00.000Z",
    mine: false,
  },
];

/**
 * 직관러 주차 팁 데모 씨드. (연동하면 user_parkings 테이블)
 */
export const SEED_USER_PARKINGS: UserParking[] = [
  {
    id: "up-seed-1",
    userId: null,
    nickname: "차없는직관러",
    name: "대구미술관 주차장",
    location: "미술관 정문 쪽 · 구장 셔틀 정류장 앞",
    isFree: true,
    feeNote: "",
    walkTime: "셔틀 약 10분",
    tip: "경기 시작 2시간 전부터 셔틀이 돌아요. 만차 전에 13시쯤 도착하는 게 안전합니다.",
    createdAt: "2026-10-02T07:40:00.000Z",
    mine: false,
  },
  {
    id: "up-seed-2",
    userId: null,
    nickname: "라팍주차고수",
    name: "외환들 공영주차장",
    location: "구장 동쪽 · 외환들 방향",
    isFree: true,
    feeNote: "",
    walkTime: "도보 7분",
    tip: "전설로가 만차여도 여기는 거의 자리가 있어요. 돌아올 때 3루 쪽으로 걸으면 가까워요.",
    createdAt: "2026-09-28T11:10:00.000Z",
    mine: false,
  },
];
