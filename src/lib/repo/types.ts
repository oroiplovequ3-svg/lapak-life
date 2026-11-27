import type {
  AdminUserStats,
  AdminUserSummary,
  Author,
  BanStatus,
  Comment,
  Food,
  Game,
  NewGameInput,
  NewPostInput,
  NewReportInput,
  NewReviewInput,
  NewUserFoodInput,
  NewUserParkingInput,
  Post,
  ProfileUpdate,
  Report,
  ReportTargetPreview,
  ReportTargetType,
  Saves,
  UserFood,
  UserFoodComment,
  UserParking,
  Zone,
  ZoneReview,
} from "@/lib/types";

export type SaveTargetType = "zone" | "food";

/** 닉네임이 이미 누군가 쓰고 있을 때 보여 주는 문구 (프로필 시트·저장소가 함께 씀) */
export const NICKNAME_TAKEN_MESSAGE = "이미 사용 중인 닉네임이에요.";

/**
 * 데이터 접근 계층.
 * - Supabase 연결 시: SupabaseRepository
 * - 미연결 시: DemoRepository (샘플 데이터 + 브라우저 로컬 저장)
 * 화면 코드는 이 인터페이스만 바라봅니다.
 */
export interface Repository {
  mode: "demo" | "live";
  /** 지금 보고 있는 사람의 표시 정보(닉네임·프로필 사진) */
  loadProfile(viewerId: string | null): Promise<Author>;
  updateProfile(input: ProfileUpdate, viewerId: string | null): Promise<Author>;
  /**
   * 닉네임을 지금 쓸 수 있는지 (앞뒤 공백·대소문자 무시).
   * excludeUserId 는 내 프로필 — 지금 쓰는 이름은 그대로 통과시킵니다.
   */
  isNicknameAvailable(nickname: string, excludeUserId?: string | null): Promise<boolean>;
  /** 마스터(관리자) 계정인지 — 남의 글·댓글·후기·맛집·주차 팁도 수정·삭제할 수 있습니다. */
  isAdmin(): Promise<boolean>;
  loadZones(): Promise<Zone[]>;
  loadFoods(): Promise<Food[]>;
  loadPosts(viewerId: string | null): Promise<Post[]>;
  createPost(input: NewPostInput, author: Author): Promise<Post>;
  /** 수정은 본인 글 또는 마스터만 (권한이 없으면 예외) */
  updatePost(postId: string, input: NewPostInput, viewerId: string | null): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  toggleLike(
    postId: string,
    viewerId: string,
    liked: boolean,
  ): Promise<{ liked: boolean; likeCount: number }>;
  loadComments(postId: string, viewerId: string | null): Promise<Comment[]>;
  addComment(postId: string, body: string, author: Author): Promise<Comment>;
  updateComment(commentId: string, body: string, viewerId: string | null): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  loadReviews(viewerId: string | null): Promise<ZoneReview[]>;
  createReview(input: NewReviewInput, author: Author): Promise<ZoneReview>;
  updateReview(
    reviewId: string,
    input: NewReviewInput,
    viewerId: string | null,
  ): Promise<ZoneReview>;
  deleteReview(reviewId: string): Promise<void>;
  loadSaves(viewerId: string | null): Promise<Saves>;
  setSave(
    targetType: SaveTargetType,
    targetId: string,
    on: boolean,
    viewerId: string,
  ): Promise<void>;
  loadGames(viewerId: string | null): Promise<Game[]>;
  createGame(input: NewGameInput, viewerId: string): Promise<Game>;
  /** 수정은 본인 기록 또는 마스터만 (권한이 없으면 예외) */
  updateGame(gameId: string, input: NewGameInput, viewerId: string | null): Promise<Game>;
  deleteGame(gameId: string): Promise<void>;

  /* ── 직관러 참여 콘텐츠 (맛집 · 주차 팁) ──────────────────── */
  loadUserFoods(viewerId: string | null): Promise<UserFood[]>;
  createUserFood(input: NewUserFoodInput, author: Author): Promise<UserFood>;
  updateUserFood(
    foodId: string,
    input: NewUserFoodInput,
    viewerId: string | null,
  ): Promise<UserFood>;
  deleteUserFood(foodId: string): Promise<void>;
  /** 직관러 맛집에 달린 댓글 */
  loadUserFoodComments(foodId: string, viewerId: string | null): Promise<UserFoodComment[]>;
  addUserFoodComment(foodId: string, body: string, author: Author): Promise<UserFoodComment>;
  updateUserFoodComment(
    commentId: string,
    body: string,
    viewerId: string | null,
  ): Promise<UserFoodComment>;
  deleteUserFoodComment(commentId: string): Promise<void>;
  loadUserParkings(viewerId: string | null): Promise<UserParking[]>;
  createUserParking(input: NewUserParkingInput, author: Author): Promise<UserParking>;
  updateUserParking(
    parkingId: string,
    input: NewUserParkingInput,
    viewerId: string | null,
  ): Promise<UserParking>;
  deleteUserParking(parkingId: string): Promise<void>;

  /* ── 신고 ────────────────────────────────────────────────── */
  /** 신고 접수 — 같은 항목을 두 번 신고하면 예외 */
  createReport(input: NewReportInput, reporterId: string): Promise<void>;
  /** 마스터만 — 접수된 신고 목록 */
  loadReports(): Promise<Report[]>;
  /** 마스터만 — 신고 상태 바꾸기 (처리 완료 · 기각) */
  setReportStatus(reportId: string, status: Report["status"]): Promise<void>;
  /** 마스터만 — 신고된 대상의 본문 미리보기 (지워졌으면 found=false) */
  loadReportTarget(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<ReportTargetPreview>;
  /** 마스터만 — 신고 누적으로 숨겨진 대상을 다시 보이게 하고 신고 수를 초기화 */
  restoreReportedContent(targetType: ReportTargetType, targetId: string): Promise<void>;

  /* ── 계정 ────────────────────────────────────────────────── */
  /** 회원 탈퇴 — 내 콘텐츠·사진과 계정을 서버에서 지웁니다 (delete_own_account RPC) */
  deleteOwnAccount(): Promise<void>;

  /* ── 회원 정지 (마스터) ──────────────────────────────────── */
  /** 로그인한 내가 영구 정지된 계정인지 (get_my_ban_status) */
  getMyBanStatus(): Promise<BanStatus>;
  /** 마스터만 — 회원 목록 (관리 패널) */
  listUsers(): Promise<AdminUserSummary[]>;
  /** 마스터만 — 회원 수·로그인 통계 (admin_user_stats) */
  adminUserStats(): Promise<AdminUserStats>;
  /** 마스터만 — 회원 영구 정지 (admin_ban_user) */
  banUser(userId: string, reason: string | null): Promise<void>;
  /** 마스터만 — 영구 정지 해제 (admin_unban_user) */
  unbanUser(userId: string): Promise<void>;
}

export const DEMO_AUTHOR: Author = {
  id: null,
  nickname: "데모직관러",
  avatarUrl: null,
};
