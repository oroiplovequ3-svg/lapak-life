import type {
  Author,
  Comment,
  Food,
  Game,
  NewGameInput,
  NewPostInput,
  NewReviewInput,
  Post,
  Saves,
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
  loadReviews(viewerId: string | null): Promise<ZoneReview[]>;
  createReview(input: NewReviewInput, author: Author): Promise<ZoneReview>;
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
}

export const DEMO_AUTHOR: Author = {
  id: null,
  nickname: "데모직관러",
  avatarUrl: null,
};
