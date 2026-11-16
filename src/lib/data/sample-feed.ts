import type { CategoryId } from "@/lib/types";

export interface SeedComment {
  nickname: string;
  body: string;
  minutesAgo: number;
}

export interface SeedPost {
  id: string;
  nickname: string;
  badge: string;
  category: CategoryId;
  seat: string | null;
  media: "day" | "night" | null;
  body: string;
  likes: number;
  minutesAgo: number;
  comments: SeedComment[];
}

/** 데모 모드·첫 배포용 씨앗 글 (프로토타입 POSTS) */
export const SEED_POSTS: SeedPost[] = [
  {
    id: "p1",
    nickname: "민지",
    badge: "3루 단골",
    category: "review",
    seat: "3루 테이블 T3-2 · 3열",
    media: "day",
    body: "어제 3루 테이블에서 봤는데 테이블 넓어서 치킨이랑 맥주 두고 먹기 딱이었어요. 낮 경기였는데 4회부터 그늘 들어와서 생각보다 안 더웠습니다. 4연석으로 가족이랑 오기 좋아요.",
    likes: 24,
    minutesAgo: 120,
    comments: [
      { nickname: "야구보는직장인", body: "저도 다음 주에 4연석 예매했어요. 주차는 어떻게 하셨어요?", minutesAgo: 60 },
      { nickname: "민지", body: "전설로 주차장 7일 전 14시에 티켓링크에서 미리 잡았어요!", minutesAgo: 58 },
      { nickname: "대공원역5번", body: "역에서 도보 2분이라 차 없이 가는 게 편하더라고요", minutesAgo: 40 },
    ],
  },
  {
    id: "p2",
    nickname: "라팍3루",
    badge: "블루존 상주",
    category: "live",
    seat: "블루존 3-2 · 6열",
    media: "night",
    body: "8회말인데 통천 응원 미쳤습니다 ㅋㅋ 목이 다 쉬었어요. 오늘 응원단 텐션 진짜 최고",
    likes: 41,
    minutesAgo: 12,
    comments: [
      { nickname: "수성구팬", body: "집에서 중계로 보는데도 소리 들려요", minutesAgo: 8 },
      { nickname: "라팍3루", body: "9회도 갑니다 🔥", minutesAgo: 5 },
    ],
  },
  {
    id: "p3",
    nickname: "태인이사랑",
    badge: "직관 3회",
    category: "qna",
    seat: null,
    media: null,
    body: "토요일 처음 라팍 갑니다. 3루 내야지정석(15,000원)이랑 블루존(19,000원) 중에 뭐가 나을까요? 응원은 좋아하는데 계속 일어나는 건 좀 부담스러워요.",
    likes: 8,
    minutesAgo: 35,
    comments: [
      { nickname: "수성구팬", body: "그럼 3루 내야지정석 추천이요. 화면은 거의 똑같고 4천원 쌉니다", minutesAgo: 30 },
      { nickname: "민지", body: "블루존은 공격 때마다 일어나야 해서 처음 가시면 내야지정석이 편해요", minutesAgo: 22 },
    ],
  },
  {
    id: "p4",
    nickname: "야구는9회말",
    badge: "굿즈 헌터",
    category: "market",
    seat: null,
    media: null,
    body: "팀스토어에 V9 우승 유니폼 재입고 됐어요. 1F 팀스토어 오전 11시 오픈이고, 사이즈는 100·105만 남아 있다고 합니다.",
    likes: 19,
    minutesAgo: 60,
    comments: [{ nickname: "라팍3루", body: "오늘 갔는데 95는 진작에 없더라고요", minutesAgo: 45 }],
  },
  {
    id: "p5",
    nickname: "대공원역5번",
    badge: "직관 24회",
    category: "review",
    seat: "1루 내야 1-8",
    media: null,
    body: "주차는 이제 전설로 사전예약이 필수예요. 경기 7일 전 14시에 티켓링크에서 잡아야 하고 주차권 2,000원 + 수수료 1,000원. 못 잡으면 대구미술관 무료주차 + 셔틀이 답입니다.",
    likes: 33,
    minutesAgo: 180,
    comments: [
      { nickname: "고기굽는포수", body: "예약 마감이 전날 15시라 그것도 놓치기 쉽더라고요", minutesAgo: 120 },
      { nickname: "태인이사랑", body: "정보 감사합니다 저장해둘게요", minutesAgo: 60 },
    ],
  },
  {
    id: "p6",
    nickname: "크림새우러버",
    badge: "5층 주민",
    category: "review",
    seat: "SKY 상단 13구역",
    media: null,
    body: "5층 크림새우 스테이션 줄 10분이면 삽니다. 내야 3층보다 5층이 훨씬 덜 붐벼요. SKY 상단 첫 줄은 통로랑 붙어 있어서 이동도 편합니다.",
    likes: 12,
    minutesAgo: 300,
    comments: [],
  },
  {
    id: "p7",
    nickname: "잔디밭민수",
    badge: "돗자리파",
    category: "live",
    seat: "잔디그린존",
    media: null,
    body: "잔디석 돗자리 깔고 맥주 한 캔. 이 맛에 옵니다. 다만 6시 넘어도 해가 안 져서 모자 없으면 진짜 힘들어요.",
    likes: 9,
    minutesAgo: 1500,
    comments: [{ nickname: "홈런볼기다림", body: "선크림 필수 동의합니다", minutesAgo: 1440 }],
  },
];

export interface SeedReview {
  id: string;
  zone: string;
  nickname: string;
  badge: string;
  seat: string;
  stars: number;
  body: string;
  minutesAgo: number;
}

/** 시야 후기 씨앗 (구역별 1~2건, 26개 구역 모두) */
export const SEED_REVIEWS: SeedReview[] = [
  {
    id: "r1",
    zone: "T3",
    nickname: "민지",
    badge: "3루 단골",
    seat: "3루 테이블 T3-2 · 3열",
    stars: 5,
    body: "테이블 넓어서 치킨이랑 맥주 두고 먹기 딱이에요. 낮 경기인데 4회부터 그늘 들어와서 생각보다 안 더웠습니다.",
    minutesAgo: 120,
  },
  {
    id: "r2",
    zone: "T3",
    nickname: "야구보는직장인",
    badge: "직관 38회",
    seat: "3루 테이블 T3-4 · 1열",
    stars: 4,
    body: "시야는 최고인데 1열은 테이블 난간이 시야 아래를 살짝 가려요. 2열 이후가 마음 편합니다.",
    minutesAgo: 1440,
  },
  {
    id: "r3",
    zone: "BZ",
    nickname: "라팍3루",
    badge: "블루존 상주",
    seat: "블루존 3-2 · 6열",
    stars: 5,
    body: "통천 응원 한 번 제대로 해보세요. 공격 이닝마다 일어나니까 운동량 엄청납니다. 목 관리 필수!",
    minutesAgo: 12,
  },
  {
    id: "r4",
    zone: "N3",
    nickname: "수성구팬",
    badge: "응원 3년차",
    seat: "3루 내야 3-9 · 12열",
    stars: 4,
    body: "블루존보다 3루 내야지정석이 4,000원 저렴한데 화면은 거의 똑같이 보여요. 앉아서 응원하고 싶으면 이쪽입니다.",
    minutesAgo: 4320,
  },
  {
    id: "r5",
    zone: "N1",
    nickname: "대공원역5번",
    badge: "직관 24회",
    seat: "1루 내야 1-8 · 5열",
    stars: 3,
    body: "낮 경기엔 각오하세요. 봄에도 해가 얼굴에 계속 내리쬡니다. 대신 가격이 착해서 자주 갑니다.",
    minutesAgo: 7200,
  },
  {
    id: "r6",
    zone: "I1",
    nickname: "원정왔습니다",
    badge: "게스트",
    seat: "원정응원석 1-3 · 2열",
    stars: 4,
    body: "원정 팬인데 자리 널널하고 응원하기 좋았어요. 다만 경기 끝나고 1루 게이트로 나오면 대공원역까지 조금 걸어야 합니다.",
    minutesAgo: 10080,
  },
  {
    id: "r7",
    zone: "T1",
    nickname: "고기굽는포수",
    badge: "테이블석 애호가",
    seat: "1루 테이블 T1-1 · 3열",
    stars: 4,
    body: "테이블석 중에선 1루가 덜 붐벼서 좋아요. 대신 여름 낮 경기는 햇빛 그대로 맞습니다.",
    minutesAgo: 5760,
  },
  {
    id: "r8",
    zone: "CT",
    nickname: "심판판정궁금",
    badge: "야구분석러",
    seat: "중앙테이블 CT-1 · 2열",
    stars: 5,
    body: "투구 궤적이 정면으로 보여서 볼 판정이 그 자리에서 이해됩니다. 테이블도 넓어서 음식 두고 먹기 편해요.",
    minutesAgo: 2880,
  },
  {
    id: "r9",
    zone: "C",
    nickname: "부부직관러",
    badge: "시즌권",
    seat: "VIP V2 · 3열",
    stars: 5,
    body: "포수 표정까지 보입니다. 그물망 너머인데 답답하지 않고, 파울팁이 앞에서 걸러져서 안전해요. 한 시즌에 두 번 정도 특별한 날 씁니다.",
    minutesAgo: 8640,
  },
  {
    id: "r10",
    zone: "SB",
    nickname: "회식담당",
    badge: "단체 12명",
    seat: "스윗박스 S28",
    stars: 4,
    body: "비 오는 날 회식 겸 갔는데 유리 앞이라 시야는 살짝 가려도 편했습니다. 단체로는 최고.",
    minutesAgo: 20160,
  },
  {
    id: "r11",
    zone: "DG",
    nickname: "잔디밭민수",
    badge: "돗자리파",
    seat: "잔디그린존 중앙",
    stars: 4,
    body: "돗자리 펴고 맥주 한 캔, 이 맛에 옵니다. 다만 6시 넘어도 해가 안 져서 모자 없으면 힘들어요.",
    minutesAgo: 1440,
  },
  {
    id: "r12",
    zone: "OF",
    nickname: "홈런볼기다림",
    badge: "외야 10년",
    seat: "외야지정 LF-3 · 4열",
    stars: 4,
    body: "외야수가 공을 자주 던져줘서 아이들이 좋아해요. 경기 디테일보다 분위기 보는 자리입니다.",
    minutesAgo: 11520,
  },
  {
    id: "r13",
    zone: "U3",
    nickname: "가성비직관",
    badge: "SKY 애호가",
    seat: "3루 SKY 상단 13구역 · 1열",
    stars: 5,
    body: "8,000원에 이 조망이면 무조건 여기입니다. 통로 바로 앞이라 이동도 편해요.",
    minutesAgo: 60,
  },
  {
    id: "r14",
    zone: "SH",
    nickname: "비오는날직관",
    badge: "우천 단골",
    seat: "SKY 하단 U27 · 3열",
    stars: 4,
    body: "비 와도 지붕 있어서 끝까지 볼 수 있었어요. 대신 계단이 많아 어르신 모시고는 힘듭니다.",
    minutesAgo: 4320,
  },
  {
    id: "r15",
    zone: "E3",
    nickname: "3루익사이팅러",
    badge: "직관 21회",
    seat: "3루 익사이팅 3E-3 · 9열",
    stars: 5,
    body: "선수가 1열 앞에서 준비하는 게 다 보여요. 덕아웃에서 몸 푸는 모습까지 눈앞이라 그 자체로 값어치가 있습니다. 대신 포수·홈베이스는 안 보여서 판정은 스코어보드로 봐야 해요.",
    minutesAgo: 300,
  },
  {
    id: "r16",
    zone: "E3",
    nickname: "파울볼조심",
    badge: "익사이팅 단골",
    seat: "3루 익사이팅 3E-1 · 4열",
    stars: 4,
    body: "파울볼이 정말 자주 날아옵니다. 4열인데 머리 위로 두 번 지나갔어요. 아이 데리고 갈 땐 글러브 꼭 챙기세요. 응원은 뒤쪽 블루존 열기가 그대로 내려와 뜨겁습니다.",
    minutesAgo: 4320,
  },
  {
    id: "r17",
    zone: "E1",
    nickname: "1루직관러",
    badge: "원정 동행",
    seat: "1루 익사이팅 1E-2 · 6열",
    stars: 4,
    body: "그라운드랑 눈높이가 거의 같아서 펜스가 낮게 느껴져요. 원정 불펜에서 투수 준비하는 모습이 바로 앞이라 신기했습니다. 낮 경기는 해가 얼굴에 계속 내리쬐니 모자 필수예요.",
    minutesAgo: 5760,
  },
  {
    id: "r18",
    zone: "C",
    nickname: "정면뷰집착",
    badge: "VIP 2회",
    seat: "VIP V1 · 2열",
    stars: 5,
    body: "포수 미트 소리가 그대로 들리고 투구 궤적이 정면으로 보입니다. 그물망이 시야를 거의 가리지 않아요. 한 시즌에 한 번은 써보고 싶은 자리.",
    minutesAgo: 1440,
  },
  {
    id: "r19",
    zone: "CT",
    nickname: "포수뒤정면",
    badge: "직관 15회",
    seat: "중앙테이블 CT-1 · 1열",
    stars: 4,
    body: "그물망이 생각보다 시야를 안 가립니다. 1열은 테이블이 낮아 무릎이 편했어요. 다만 낮 경기엔 해가 정면으로 들어와 5회까지 눈이 부셨어요.",
    minutesAgo: 10080,
  },
  {
    id: "r20",
    zone: "N3",
    nickname: "응원은앉아서",
    badge: "3루 내야 5년",
    seat: "3루 내야 3-6 · 8열",
    stars: 4,
    body: "일어서는 응원이 부담스러울 때 딱입니다. 블루존 소리는 다 들리고 시야도 비슷한데 값이 더 낮아요.",
    minutesAgo: 7200,
  },
  {
    id: "r21",
    zone: "I1",
    nickname: "원정응원단",
    badge: "원정 12회",
    seat: "원정응원석 1-1 · 3열",
    stars: 5,
    body: "1루 내야 앞쪽 파란 칸이 원정 응원석이에요. 응원단이 가까워서 같이 소리 지르기 좋고, 뒤쪽 보라색 지정석은 조용해서 취향대로 고르면 됩니다.",
    minutesAgo: 14400,
  },
  {
    id: "r22",
    zone: "N1",
    nickname: "가성비1루",
    badge: "직관 30회",
    seat: "1루 내야 1-10 · 7열",
    stars: 3,
    body: "1만 원대로 내야를 볼 수 있는 건 큰 장점이에요. 대신 낮 경기 햇빛과 각도 때문에 우익수 쪽 타구는 잘 안 보입니다.",
    minutesAgo: 17280,
  },
  {
    id: "r23",
    zone: "PF",
    nickname: "파티담당",
    badge: "모임 8회",
    seat: "파티플로어 P2",
    stars: 4,
    body: "회사 송년회 겸 빌렸는데 비 오는 날에도 자리 이동 없이 볼 수 있었어요. 유리 앞이라 그라운드가 살짝 멀게 느껴지는 건 감안하세요.",
    minutesAgo: 23040,
  },
  {
    id: "r24",
    zone: "UC",
    nickname: "위에서보는맛",
    badge: "SKY 단골",
    seat: "중앙 SKY 상단 12구역 · 2열",
    stars: 4,
    body: "포수 뒤를 위에서 내려다보니 투구 코스가 한눈에 들어옵니다. 응원 소리가 멀어 조용히 보기 좋아요.",
    minutesAgo: 3600,
  },
  {
    id: "r25",
    zone: "U1",
    nickname: "비오는날1루",
    badge: "우천 단골",
    seat: "1루 SKY 상단 3구역",
    stars: 4,
    body: "1루 쪽 상층이라 낮 경기 햇빛도 피하고 비도 피했습니다. 아래 원정 응원석 소리가 올라와서 분위기는 그대로 느껴져요.",
    minutesAgo: 9360,
  },
  {
    id: "r26",
    zone: "SKB",
    nickname: "응원상층",
    badge: "SKY 블루존",
    seat: "SKY 블루존 22구역",
    stars: 4,
    body: "아래 블루존만큼 뜨겁진 않지만 응원가 따라 부르기 좋아요. 가격이 낮고 비를 피할 수 있는 게 제일 큽니다.",
    minutesAgo: 6480,
  },
  {
    id: "r27",
    zone: "SF",
    nickname: "아이와함께",
    badge: "패밀리 4인",
    seat: "SKY박스 2",
    stars: 5,
    body: "아이랑 넷이서 갔는데 상층 맨 앞이라 계단이 적어 편했어요. 지붕 아래라 비 걱정도 없고, 4인 단위라 자리도 붙어 있습니다.",
    minutesAgo: 2880,
  },
  {
    id: "r28",
    zone: "OF",
    nickname: "외야지정러",
    badge: "직관 45회",
    seat: "외야지정 RF-5 · 6열",
    stars: 4,
    body: "지정 좌석인데도 가격이 착해서 자주 옵니다. 파울라인 쪽 RF1이 그라운드와 제일 가까워요.",
    minutesAgo: 8640,
  },
  {
    id: "r29",
    zone: "OT",
    nickname: "테이블4인",
    badge: "외야테이블",
    seat: "외야 테이블 OT-2",
    stars: 4,
    body: "넷이서 테이블 하나 쓰니 음식 펼쳐놓고 먹기 좋았어요. 외야라 응원은 멀지만 홈런 타구는 제일 가깝습니다.",
    minutesAgo: 11520,
  },
  {
    id: "r30",
    zone: "OC",
    nickname: "커플직관",
    badge: "둘이서",
    seat: "외야 커플 C-3",
    stars: 4,
    body: "외야 펜스 바로 뒤 연두색 자리예요. 붙어 앉아 대화하기 좋고 생각보다 시야가 트여 있습니다.",
    minutesAgo: 12960,
  },
  {
    id: "r31",
    zone: "RT",
    nickname: "루프탑러",
    badge: "데크 단골",
    seat: "루프탑 테이블 LF-2 · 4인",
    stars: 4,
    body: "4인 테이블에 음식 펼쳐놓고 봤는데 편했어요. 그라운드와는 거리가 있지만 전경이 탁 트여서 홈런 궤적이 다 보입니다.",
    minutesAgo: 15840,
  },
  {
    id: "r32",
    zone: "OP",
    nickname: "패밀리4인",
    badge: "가족 4인",
    seat: "외야 패밀리 RF-8",
    stars: 4,
    body: "아이들과 넷이 앉기 딱 좋았어요. 다이아 블록이라 앞사람에 가리지 않고, 지나가는 타구가 가까워 아이들이 좋아합니다.",
    minutesAgo: 18720,
  },
  {
    id: "r33",
    zone: "CP",
    nickname: "캠핑직관",
    badge: "텐트족",
    seat: "캠핑존 C-2 · 6인",
    stars: 4,
    body: "텐트 치고 피크닉하듯 볼 수 있어요. 아이들이 지루해하지 않아서 좋았습니다. 경기는 멀리서 보는 느낌이라 디테일보다 분위기용이에요.",
    minutesAgo: 21600,
  },
];

export interface SeedGame {
  playedOn: string;
  opponent: string;
  homeAway: "home" | "away";
  zoneCode: string;
  scoreFor: number;
  scoreAgainst: number;
  note: string;
}

/** 데모용 직관 기록 5건 */
export const SEED_GAMES: SeedGame[] = [
  { playedOn: "2026-10-08", opponent: "kt", homeAway: "home", zoneCode: "T3", scoreFor: 12, scoreAgainst: 1, note: "한국시리즈 5차전 · 우승" },
  { playedOn: "2026-10-07", opponent: "kt", homeAway: "home", zoneCode: "BZ", scoreFor: 7, scoreAgainst: 3, note: "한국시리즈 4차전" },
  { playedOn: "2026-09-21", opponent: "KIA", homeAway: "home", zoneCode: "BZ", scoreFor: 2, scoreAgainst: 5, note: "주말 3연전" },
  { playedOn: "2026-08-30", opponent: "롯데", homeAway: "away", zoneCode: "SH", scoreFor: 9, scoreAgainst: 4, note: "가족 직관" },
  { playedOn: "2026-07-11", opponent: "두산", homeAway: "home", zoneCode: "T1", scoreFor: 6, scoreAgainst: 2, note: "친구와" },
];
