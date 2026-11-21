/**
 * 2026 시즌 삼성 라이온즈 경기 일정 · 결과 (정규시즌 144경기 + 포스트시즌 10경기)
 *
 * 데이터 출처와 검증 (2026-11-21 조회)
 * - 야크크 야르 2026 월별 일정(yakuku-yaru.today/schedule/2026-04 … 2026-11): 원정 vs 홈 순서·구장·스코어
 * - 달위키 삼성 라이온즈 캘린더(dal.wiki/t/2PNFegleZaO7): 경기별 스코어 교차 확인 — 겹치는 경기 전부 일치
 * - 야구나라 삼성 경기별 원장(yagoonara.com/teams/1): 정규시즌 83승 3무 58패와 대조 — 일치
 * - 삼성 라이온즈 구단 페이지: 정규시즌 2위 · 플레이오프 KIA 3승 2패 · 한국시리즈 kt 4승 1패 우승 — 일치
 *
 * 숫자는 위 소스에서 그대로 옮겼고, 소스에 없는 값은 넣지 않았습니다.
 * - 정규시즌: 2026-03-28 개막(라팍) ~ 2026-10-12, 144경기 83승 3무 58패
 * - 플레이오프(2위 삼성 vs KIA): 2026-10-26 ~ 11-01, 3승 2패
 * - 한국시리즈(삼성 vs kt): 2026-11-03 ~ 11-08, 4승 1패 우승
 * - 우천·폭염·그라운드 취소 15경기는 스코어 없이 canceled로 남깁니다.
 * - 더블헤더 편성 경기는 없어서(한 날짜 1경기) 편성되면 같은 date 항목이 2개 들어가도록 두었습니다.
 */

export type SamsungOpponent = "kt" | "KIA" | "롯데" | "두산" | "LG" | "SSG" | "NC" | "한화" | "키움";
export type GameStage = "regular" | "playoff" | "koreanSeries";

export interface Samsung2026Game {
  /** YYYY-MM-DD */
  date: string;
  opponent: SamsungOpponent;
  homeAway: "home" | "away";
  /** 라팍 · 포항 · 잠실 · 광주 · 수원 · 고척 · 창원 · 인천 · 사직 · 대전 */
  venue: string;
  /** 시작 시각 (KST) */
  startTime: string;
  stage: GameStage;
  /** 포스트시즌 차전 (정규시즌은 null) */
  gameNo: number | null;
  /** 삼성 득점 (취소 경기는 null) */
  scoreFor: number | null;
  /** 상대 득점 (취소 경기는 null) */
  scoreAgainst: number | null;
  /** 취소 사유 ("우천 취소" · "폭염 취소" · "그라운드 취소"), 정상 경기는 null */
  canceled: string | null;
}

export const SAMSUNG_2026_SCHEDULE: Samsung2026Game[] = [
  { date: "2026-03-28", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 6, canceled: null },
  { date: "2026-03-29", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 6, canceled: null },
  { date: "2026-03-31", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 5, canceled: null },
  { date: "2026-04-01", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 13, scoreAgainst: 3, canceled: null },
  { date: "2026-04-02", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 2, canceled: null },
  { date: "2026-04-03", opponent: "kt", homeAway: "away", venue: "수원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 1, canceled: null },
  { date: "2026-04-04", opponent: "kt", homeAway: "away", venue: "수원", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 6, canceled: null },
  { date: "2026-04-05", opponent: "kt", homeAway: "away", venue: "수원", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 2, canceled: null },
  { date: "2026-04-07", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 3, canceled: null },
  { date: "2026-04-08", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 15, canceled: null },
  { date: "2026-04-09", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-04-10", opponent: "NC", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 5, canceled: null },
  { date: "2026-04-11", opponent: "NC", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 4, canceled: null },
  { date: "2026-04-12", opponent: "NC", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 3, canceled: null },
  { date: "2026-04-14", opponent: "한화", homeAway: "away", venue: "대전", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 5, canceled: null },
  { date: "2026-04-15", opponent: "한화", homeAway: "away", venue: "대전", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 13, scoreAgainst: 5, canceled: null },
  { date: "2026-04-16", opponent: "한화", homeAway: "away", venue: "대전", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 1, canceled: null },
  { date: "2026-04-17", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-04-18", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 2, canceled: null },
  { date: "2026-04-19", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 5, canceled: null },
  { date: "2026-04-21", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 5, canceled: null },
  { date: "2026-04-22", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 3, canceled: null },
  { date: "2026-04-23", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 8, canceled: null },
  { date: "2026-04-24", opponent: "키움", homeAway: "away", venue: "고척", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 6, canceled: null },
  { date: "2026-04-25", opponent: "키움", homeAway: "away", venue: "고척", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 4, canceled: null },
  { date: "2026-04-26", opponent: "키움", homeAway: "away", venue: "고척", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 2, canceled: null },
  { date: "2026-04-28", opponent: "두산", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 4, canceled: null },
  { date: "2026-04-29", opponent: "두산", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 4, canceled: null },
  { date: "2026-04-30", opponent: "두산", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 8, canceled: null },
  { date: "2026-05-01", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 3, canceled: null },
  { date: "2026-05-02", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 13, canceled: null },
  { date: "2026-05-03", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 6, canceled: null },
  { date: "2026-05-05", opponent: "키움", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 11, scoreAgainst: 1, canceled: null },
  { date: "2026-05-06", opponent: "키움", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 1, canceled: null },
  { date: "2026-05-07", opponent: "키움", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 0, canceled: null },
  { date: "2026-05-08", opponent: "NC", homeAway: "away", venue: "창원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 3, canceled: null },
  { date: "2026-05-09", opponent: "NC", homeAway: "away", venue: "창원", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 4, canceled: null },
  { date: "2026-05-10", opponent: "NC", homeAway: "away", venue: "창원", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 11, scoreAgainst: 1, canceled: null },
  { date: "2026-05-12", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 1, canceled: null },
  { date: "2026-05-13", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 5, canceled: null },
  { date: "2026-05-14", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 5, canceled: null },
  { date: "2026-05-15", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 5, canceled: null },
  { date: "2026-05-16", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 2, canceled: null },
  { date: "2026-05-17", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 16, canceled: null },
  { date: "2026-05-19", opponent: "kt", homeAway: "home", venue: "포항", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 2, canceled: null },
  { date: "2026-05-20", opponent: "kt", homeAway: "home", venue: "포항", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-05-21", opponent: "kt", homeAway: "home", venue: "포항", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 5, canceled: null },
  { date: "2026-05-22", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 5, canceled: null },
  { date: "2026-05-23", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 7, canceled: null },
  { date: "2026-05-24", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 0, canceled: null },
  { date: "2026-05-26", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-05-27", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 1, canceled: null },
  { date: "2026-05-28", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 1, canceled: null },
  { date: "2026-05-29", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 9, canceled: null },
  { date: "2026-05-30", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 8, canceled: null },
  { date: "2026-05-31", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 4, canceled: null },
  { date: "2026-06-02", opponent: "NC", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 7, canceled: null },
  { date: "2026-06-03", opponent: "NC", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 6, canceled: null },
  { date: "2026-06-04", opponent: "NC", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 6, canceled: null },
  { date: "2026-06-05", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 5, canceled: null },
  { date: "2026-06-06", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 2, canceled: null },
  { date: "2026-06-07", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 7, canceled: null },
  { date: "2026-06-09", opponent: "kt", homeAway: "away", venue: "수원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 5, canceled: null },
  { date: "2026-06-10", opponent: "kt", homeAway: "away", venue: "수원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 4, canceled: null },
  { date: "2026-06-11", opponent: "kt", homeAway: "away", venue: "수원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 1, canceled: null },
  { date: "2026-06-12", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 5, canceled: null },
  { date: "2026-06-13", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 6, canceled: null },
  { date: "2026-06-14", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 8, canceled: null },
  { date: "2026-06-16", opponent: "키움", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 1, canceled: null },
  { date: "2026-06-17", opponent: "키움", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 1, scoreAgainst: 0, canceled: null },
  { date: "2026-06-18", opponent: "키움", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 3, canceled: null },
  { date: "2026-06-19", opponent: "한화", homeAway: "away", venue: "대전", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 3, canceled: null },
  { date: "2026-06-20", opponent: "한화", homeAway: "away", venue: "대전", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 10, canceled: null },
  { date: "2026-06-21", opponent: "한화", homeAway: "away", venue: "대전", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 1, canceled: null },
  { date: "2026-06-23", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 4, canceled: null },
  { date: "2026-06-24", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 2, canceled: null },
  { date: "2026-06-25", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 13, scoreAgainst: 6, canceled: null },
  { date: "2026-06-26", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 1, canceled: null },
  { date: "2026-06-27", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 3, canceled: null },
  { date: "2026-06-28", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 4, canceled: null },
  { date: "2026-06-30", opponent: "NC", homeAway: "away", venue: "창원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 13, scoreAgainst: 7, canceled: null },
  { date: "2026-07-01", opponent: "NC", homeAway: "away", venue: "창원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 10, canceled: null },
  { date: "2026-07-02", opponent: "NC", homeAway: "away", venue: "창원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 1, canceled: null },
  { date: "2026-07-03", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 4, canceled: null },
  { date: "2026-07-04", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 13, scoreAgainst: 7, canceled: null },
  { date: "2026-07-05", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 13, scoreAgainst: 3, canceled: null },
  { date: "2026-07-07", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 2, canceled: null },
  { date: "2026-07-08", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 8, canceled: null },
  { date: "2026-07-09", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 5, canceled: null },
  { date: "2026-07-16", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 1, canceled: null },
  { date: "2026-07-17", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-07-18", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 0, canceled: null },
  { date: "2026-07-19", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 11, canceled: null },
  { date: "2026-07-21", opponent: "키움", homeAway: "away", venue: "고척", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 6, canceled: null },
  { date: "2026-07-22", opponent: "키움", homeAway: "away", venue: "고척", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 1, scoreAgainst: 3, canceled: null },
  { date: "2026-07-23", opponent: "키움", homeAway: "away", venue: "고척", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 1, canceled: null },
  { date: "2026-07-24", opponent: "두산", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 15, scoreAgainst: 4, canceled: null },
  { date: "2026-07-25", opponent: "두산", homeAway: "away", venue: "잠실", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 1, canceled: null },
  { date: "2026-07-26", opponent: "두산", homeAway: "away", venue: "잠실", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 7, canceled: null },
  { date: "2026-07-28", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 12, scoreAgainst: 5, canceled: null },
  { date: "2026-07-29", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 9, canceled: null },
  { date: "2026-07-30", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 12, canceled: null },
  { date: "2026-07-31", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 7, canceled: null },
  { date: "2026-08-01", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "폭염 취소" },
  { date: "2026-08-02", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 10, canceled: null },
  { date: "2026-08-04", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 1, scoreAgainst: 4, canceled: null },
  { date: "2026-08-05", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "폭염 취소" },
  { date: "2026-08-06", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "폭염 취소" },
  { date: "2026-08-07", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "폭염 취소" },
  { date: "2026-08-08", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "폭염 취소" },
  { date: "2026-08-09", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "폭염 취소" },
  { date: "2026-08-11", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 1, scoreAgainst: 3, canceled: null },
  { date: "2026-08-12", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 7, canceled: null },
  { date: "2026-08-13", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 9, scoreAgainst: 8, canceled: null },
  { date: "2026-08-14", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 5, canceled: null },
  { date: "2026-08-15", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 11, scoreAgainst: 6, canceled: null },
  { date: "2026-08-16", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "그라운드 취소" },
  { date: "2026-08-18", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 5, canceled: null },
  { date: "2026-08-19", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 18, scoreAgainst: 4, canceled: null },
  { date: "2026-08-20", opponent: "SSG", homeAway: "home", venue: "라팍", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 6, canceled: null },
  { date: "2026-08-21", opponent: "NC", homeAway: "away", venue: "창원", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 3, canceled: null },
  { date: "2026-08-22", opponent: "NC", homeAway: "away", venue: "창원", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 6, canceled: null },
  { date: "2026-08-23", opponent: "NC", homeAway: "away", venue: "창원", startTime: "19:00", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 1, canceled: null },
  { date: "2026-08-25", opponent: "키움", homeAway: "away", venue: "고척", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 3, canceled: null },
  { date: "2026-08-26", opponent: "키움", homeAway: "away", venue: "고척", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 12, scoreAgainst: 2, canceled: null },
  { date: "2026-08-27", opponent: "키움", homeAway: "away", venue: "고척", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 15, scoreAgainst: 2, canceled: null },
  { date: "2026-08-28", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "그라운드 취소" },
  { date: "2026-08-29", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 2, canceled: null },
  { date: "2026-08-30", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "18:00", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-09-01", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 0, canceled: null },
  { date: "2026-09-02", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 5, canceled: null },
  { date: "2026-09-03", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 3, canceled: null },
  { date: "2026-09-04", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 4, canceled: null },
  { date: "2026-09-05", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 4, scoreAgainst: 3, canceled: null },
  { date: "2026-09-06", opponent: "LG", homeAway: "away", venue: "잠실", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 4, canceled: null },
  { date: "2026-09-08", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 4, canceled: null },
  { date: "2026-09-09", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 2, canceled: null },
  { date: "2026-09-11", opponent: "키움", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 4, canceled: null },
  { date: "2026-09-12", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 4, canceled: null },
  { date: "2026-09-13", opponent: "LG", homeAway: "home", venue: "라팍", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 13, canceled: null },
  { date: "2026-09-15", opponent: "롯데", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 7, scoreAgainst: 3, canceled: null },
  { date: "2026-09-16", opponent: "두산", homeAway: "away", venue: "잠실", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 1, scoreAgainst: 3, canceled: null },
  { date: "2026-09-18", opponent: "한화", homeAway: "away", venue: "대전", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 4, canceled: null },
  { date: "2026-09-19", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 5, canceled: null },
  { date: "2026-09-20", opponent: "롯데", homeAway: "away", venue: "사직", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 13, canceled: null },
  { date: "2026-09-22", opponent: "NC", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 8, scoreAgainst: 5, canceled: null },
  { date: "2026-09-24", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 4, canceled: null },
  { date: "2026-09-25", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "17:00", stage: "regular", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-09-29", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 10, scoreAgainst: 5, canceled: null },
  { date: "2026-09-30", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 2, canceled: null },
  { date: "2026-10-01", opponent: "한화", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 2, canceled: null },
  { date: "2026-10-03", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 6, scoreAgainst: 4, canceled: null },
  { date: "2026-10-04", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 0, scoreAgainst: 12, canceled: null },
  { date: "2026-10-05", opponent: "두산", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 7, canceled: null },
  { date: "2026-10-06", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 5, scoreAgainst: 4, canceled: null },
  { date: "2026-10-07", opponent: "kt", homeAway: "away", venue: "수원", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 9, canceled: null },
  { date: "2026-10-09", opponent: "SSG", homeAway: "away", venue: "인천", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 1, scoreAgainst: 3, canceled: null },
  { date: "2026-10-11", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "regular", gameNo: null, scoreFor: 3, scoreAgainst: 12, canceled: null },
  { date: "2026-10-12", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "regular", gameNo: null, scoreFor: 2, scoreAgainst: 4, canceled: null },
  { date: "2026-10-25", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "playoff", gameNo: null, scoreFor: null, scoreAgainst: null, canceled: "우천 취소" },
  { date: "2026-10-26", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "playoff", gameNo: 1, scoreFor: 1, scoreAgainst: 5, canceled: null },
  { date: "2026-10-27", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "playoff", gameNo: 2, scoreFor: 8, scoreAgainst: 3, canceled: null },
  { date: "2026-10-29", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "18:30", stage: "playoff", gameNo: 3, scoreFor: 6, scoreAgainst: 4, canceled: null },
  { date: "2026-10-30", opponent: "KIA", homeAway: "away", venue: "광주", startTime: "18:30", stage: "playoff", gameNo: 4, scoreFor: 2, scoreAgainst: 4, canceled: null },
  { date: "2026-11-01", opponent: "KIA", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "playoff", gameNo: 5, scoreFor: 6, scoreAgainst: 1, canceled: null },
  { date: "2026-11-03", opponent: "kt", homeAway: "away", venue: "수원", startTime: "18:30", stage: "koreanSeries", gameNo: 1, scoreFor: 7, scoreAgainst: 8, canceled: null },
  { date: "2026-11-04", opponent: "kt", homeAway: "away", venue: "수원", startTime: "18:30", stage: "koreanSeries", gameNo: 2, scoreFor: 3, scoreAgainst: 2, canceled: null },
  { date: "2026-11-06", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "18:30", stage: "koreanSeries", gameNo: 3, scoreFor: 5, scoreAgainst: 1, canceled: null },
  { date: "2026-11-07", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "koreanSeries", gameNo: 4, scoreFor: 10, scoreAgainst: 5, canceled: null },
  { date: "2026-11-08", opponent: "kt", homeAway: "home", venue: "라팍", startTime: "14:00", stage: "koreanSeries", gameNo: 5, scoreFor: 12, scoreAgainst: 1, canceled: null },];

const BY_DATE = SAMSUNG_2026_SCHEDULE.reduce<Record<string, Samsung2026Game[]>>((acc, game) => {
  (acc[game.date] ??= []).push(game);
  return acc;
}, {});

/** 해당 날짜의 삼성 경기 (더블허더면 2건). 경기가 없으면 빈 배열. */
export function gamesOnDate(date: string): Samsung2026Game[] {
  return BY_DATE[date] ?? [];
}

export function isPostseason(game: Samsung2026Game): boolean {
  return game.stage !== "regular";
}

/** "정규시즌" · "플레이오프 3차전" · "한국시리즈 5차전" */
export function stageLabel(game: Samsung2026Game): string {
  if (game.stage === "regular") return "정규시즌";
  const name = game.stage === "playoff" ? "플레이오프" : "한국시리즈";
  return game.gameNo ? `${name} ${game.gameNo}차전` : name;
}

/** 경기 결과 — 취소·미기록이면 null */
export function gameResult(game: Samsung2026Game): "win" | "loss" | "draw" | null {
  if (game.scoreFor === null || game.scoreAgainst === null) return null;
  if (game.scoreFor > game.scoreAgainst) return "win";
  if (game.scoreFor < game.scoreAgainst) return "loss";
  return "draw";
}

/** "라팍" / "수원" → 홈·원정 표기 "라팍(홈)" · "원정" */
export function venueLabel(game: Samsung2026Game): string {
  return game.homeAway === "home" ? `${game.venue}(홈)` : `${game.venue}(원정)`;
}

/** 스코어가 확정된 마지막 경기 (비시즌에 "최근 경기" 바로 채우기용) */
export function lastPlayedGame(): Samsung2026Game | null {
  for (let i = SAMSUNG_2026_SCHEDULE.length - 1; i >= 0; i -= 1) {
    const game = SAMSUNG_2026_SCHEDULE[i];
    if (game.scoreFor !== null && game.scoreAgainst !== null) return game;
  }
  return null;
}

/** 시즌 요약 (정규시즌 2위 · 한국시리즈 우승) — 화면 안내용 */
export const SAMSUNG_2026_SUMMARY = {
  regular: { rank: 2, wins: 83, draws: 3, losses: 58 },
  playoff: { opponent: "KIA" as SamsungOpponent, wins: 3, losses: 2 },
  koreanSeries: { opponent: "kt" as SamsungOpponent, wins: 4, losses: 1 },
};
