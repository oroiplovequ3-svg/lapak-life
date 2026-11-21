import type {
  Author,
  Comment,
  Food,
  Game,
  NewGameInput,
  NewPostInput,
  NewReviewInput,
  NewUserFoodInput,
  NewUserParkingInput,
  Post,
  ProfileUpdate,
  Saves,
  UserFood,
  UserParking,
  Zone,
  ZoneReview,
} from "@/lib/types";

export type SaveTargetType = "zone" | "food";

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
  loadZones(): Promise<Zone[]>;
  loadFoods(): Promise<Food[]>;
  loadPosts(viewerId: string | null): Promise<Post[]>;
  createPost(input: NewPostInput, author: Author): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  toggleLike(
    postId: string,
    viewerId: string,
    liked: boolean,
  ): Promise<{ liked: boolean; likeCount: number }>;
  loadComments(postId: string, viewerId: string | null): Promise<Comment[]>;
  addComment(postId: string, body: string, author: Author): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;
  loadReviews(viewerId: string | null): Promise<ZoneReview[]>;
  createReview(input: NewReviewInput, author: Author): Promise<ZoneReview>;
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
  deleteGame(gameId: string): Promise<void>;

  /* ── 직관러 참여 콘텐츠 (맛집 · 주차 팁) ──────────────────── */
  loadUserFoods(viewerId: string | null): Promise<UserFood[]>;
  createUserFood(input: NewUserFoodInput, author: Author): Promise<UserFood>;
  deleteUserFood(foodId: string): Promise<void>;
  loadUserParkings(viewerId: string | null): Promise<UserParking[]>;
  createUserParking(input: NewUserParkingInput, author: Author): Promise<UserParking>;
  deleteUserParking(parkingId: string): Promise<void>;
}

export const DEMO_AUTHOR: Author = {
  id: null,
  nickname: "데모직관러",
  avatarUrl: null,
};
