import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeCategory } from "@/lib/data/categories";
import { FOODS } from "@/lib/data/foods";
import { ZONES } from "@/lib/data/zones";
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
  Saves,
  UserFood,
  UserParking,
  Zone,
  ZoneReview,
} from "@/lib/types";

import type { Repository, SaveTargetType } from "./types";

/* ------------------------------------------------------------------ */
/* PostgREST 응답은 중첩 조인(profiles)을 객체/배열 어느 쪽으로도 줄 수 있어
   방어적으로 읽습니다.                                                */
/* ------------------------------------------------------------------ */

type AnyRow = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function embeddedProfile(row: AnyRow): { nickname: string; avatarUrl: string | null } {
  const raw = row.profiles;
  const profile = (Array.isArray(raw) ? raw[0] : raw) as AnyRow | undefined | null;
  const nickname = str(profile?.nickname) || "라팍팬";
  const avatar = profile?.avatar_url;
  return { nickname, avatarUrl: typeof avatar === "string" ? avatar : null };
}

function photoUrlList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapPost(row: AnyRow, viewerId: string | null, likedIds: Set<string>): Post {
  const { nickname } = embeddedProfile(row);
  const id = str(row.id);
  const userId = row.user_id ? str(row.user_id) : null;
  const media = row.media === "day" || row.media === "night" ? row.media : null;
  return {
    id,
    userId,
    nickname,
    badge: viewerId && userId === viewerId ? "나" : "라팍팬",
    category: normalizeCategory(str(row.category) || "review"),
    body: str(row.body),
    seatZone: row.seat_zone ? str(row.seat_zone) : null,
    seatDetail: row.seat_detail ? str(row.seat_detail) : null,
    media,
    createdAt: str(row.created_at) || new Date().toISOString(),
    likeCount: num(row.like_count),
    commentCount: num(row.comment_count),
    liked: likedIds.has(id),
    mine: Boolean(viewerId && userId === viewerId),
  };
}

function mapComment(row: AnyRow, viewerId: string | null): Comment {
  const { nickname } = embeddedProfile(row);
  const userId = row.user_id ? str(row.user_id) : null;
  return {
    id: str(row.id),
    postId: str(row.post_id),
    userId,
    nickname,
    body: str(row.body),
    createdAt: str(row.created_at) || new Date().toISOString(),
    mine: Boolean(viewerId && userId === viewerId),
  };
}

function mapReview(row: AnyRow, viewerId: string | null): ZoneReview {
  const { nickname } = embeddedProfile(row);
  const userId = row.user_id ? str(row.user_id) : null;
  return {
    id: str(row.id),
    zoneCode: str(row.zone_code),
    userId,
    nickname,
    badge: viewerId && userId === viewerId ? "나" : "라팍팬",
    seatDetail: str(row.seat_detail),
    stars: num(row.rating, 5),
    body: str(row.body),
    photoUrls: photoUrlList(row.photo_urls),
    createdAt: str(row.created_at) || new Date().toISOString(),
    mine: Boolean(viewerId && userId === viewerId),
  };
}

function mapGame(row: AnyRow): Game {
  return {
    id: str(row.id),
    userId: row.user_id ? str(row.user_id) : null,
    playedOn: str(row.played_on),
    opponent: str(row.opponent),
    homeAway: row.home_away === "away" ? "away" : "home",
    zoneCode: row.zone_code ? str(row.zone_code) : null,
    scoreFor: num(row.score_for),
    scoreAgainst: num(row.score_against),
    note: str(row.note),
    photoUrls: photoUrlList(row.photo_urls),
    createdAt: str(row.created_at) || new Date().toISOString(),
  };
}

const POST_COLUMNS =
  // posts ↔ profiles 는 직접 FK(posts_user_id_fkey)와 post_likes 경유 다대다 경로가 함께 있어
  // PostgREST 가 임베드를 고르지 못한다(PGRST201). 제약 이름으로 직접 경로를 지정한다.
  "id, user_id, category, body, seat_zone, seat_detail, media, created_at, like_count, comment_count, profiles!posts_user_id_fkey(nickname, avatar_url)";
const COMMENT_COLUMNS = "id, post_id, user_id, body, created_at, profiles(nickname, avatar_url)";
const REVIEW_COLUMNS =
  "id, zone_code, user_id, seat_detail, rating, body, photo_urls, created_at, profiles(nickname, avatar_url)";

/** 시야 후기 사진 버킷 (supabase/migrations/002_review_photos.sql) */
const REVIEW_PHOTO_BUCKET = "review-photos";

/** 직관러 맛집 사진 버킷 (supabase/migrations/006_user_food_photos.sql) */
const USER_FOOD_PHOTO_BUCKET = "user-food-photos";

/** 직관 기록 사진 버킷 (supabase/migrations/003_checkin_photos.sql) */
const CHECKIN_PHOTO_BUCKET = "checkin-photos";

const GAME_COLUMNS =
  "id, user_id, played_on, opponent, home_away, zone_code, score_for, score_against, note, photo_urls, created_at";

/** 직관러 맛집 (supabase/migrations/004_user_foods.sql · 사진은 006) */
const USER_FOOD_COLUMNS =
  "id, user_id, name, menu, tip, rating, is_inside, photo_urls, created_at, profiles(nickname, avatar_url)";

/** 006 마이그레이션 전 스키마(사진 컬럼 없음) 대체 목록 */
const USER_FOOD_COLUMNS_LEGACY =
  "id, user_id, name, menu, tip, rating, is_inside, created_at, profiles(nickname, avatar_url)";

/** 직관러 주차 팁 (supabase/migrations/005_user_parkings.sql) */
const USER_PARKING_COLUMNS =
  "id, user_id, name, location, is_free, fee_note, walk_time, tip, created_at, profiles(nickname, avatar_url)";

function mapUserFood(row: AnyRow, viewerId: string | null): UserFood {
  const { nickname } = embeddedProfile(row);
  const userId = row.user_id ? str(row.user_id) : null;
  return {
    id: str(row.id),
    userId,
    nickname,
    name: str(row.name),
    menu: str(row.menu),
    tip: str(row.tip),
    rating: num(row.rating, 5),
    inStadium: typeof row.is_inside === "boolean" ? row.is_inside : true,
    photoUrls: photoUrlList(row.photo_urls),
    createdAt: str(row.created_at) || new Date().toISOString(),
    mine: Boolean(viewerId && userId === viewerId),
  };
}

function mapUserParking(row: AnyRow, viewerId: string | null): UserParking {
  const { nickname } = embeddedProfile(row);
  const userId = row.user_id ? str(row.user_id) : null;
  return {
    id: str(row.id),
    userId,
    nickname,
    name: str(row.name),
    location: str(row.location),
    isFree: typeof row.is_free === "boolean" ? row.is_free : true,
    feeNote: str(row.fee_note),
    walkTime: str(row.walk_time),
    tip: str(row.tip),
    createdAt: str(row.created_at) || new Date().toISOString(),
    mine: Boolean(viewerId && userId === viewerId),
  };
}

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "알 수 없는 오류"}`);
}

/**
 * 내가 쓴 행만 지우는 공통 경로.
 * RLS 가 막으면 에러 없이 0건이 지워지므로, 실제로 지워졌는지 확인까지 합니다.
 */
async function deleteOwnRow(
  supabase: SupabaseClient,
  table: string,
  id: string,
  context: string,
): Promise<void> {
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) fail(context, error);
  if (!data?.length) {
    throw new Error(`${context}: 이미 지워졌거나 내가 쓴 항목이 아니에요.`);
  }
}

export class SupabaseRepository implements Repository {
  mode = "live" as const;

  constructor(private readonly supabase: SupabaseClient) {}

  async loadZones(): Promise<Zone[]> {
    const { data, error } = await this.supabase
      .from("zones")
      .select("code, name, short_name, emoji, side, grade, price_note, dist, block_rate, roof, sun, rain, cheer, recommend, tip, sort_order")
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      // 스키마/시드가 아직 없어도 화면이 비지 않도록 코드 상수를 폴백으로 씁니다.
      return ZONES;
    }

    const mapped = data.map((row) => {
      const fallback = ZONES.find((z) => z.code === row.code);
      return {
        code: str(row.code),
        name: str(row.name) || fallback?.name || str(row.code),
        short: str(row.short_name) || fallback?.short || str(row.code),
        emoji: str(row.emoji) || fallback?.emoji || "⚾",
        side: str(row.side) || fallback?.side || "",
        grade: str(row.grade) || fallback?.grade || "",
        price: str(row.price_note) || fallback?.price || "",
        dist: str(row.dist) || fallback?.dist || "",
        block: str(row.block_rate) || fallback?.block || "",
        roof: str(row.roof) || fallback?.roof || "",
        sun: str(row.sun) || fallback?.sun || "",
        rain: str(row.rain) || fallback?.rain || "",
        cheer: str(row.cheer) || fallback?.cheer || "",
        good: str(row.recommend) || fallback?.good || "",
        tip: str(row.tip) || fallback?.tip || "",
        sortOrder: num(row.sort_order, fallback?.sortOrder ?? 99),
      };
    });

    return mapped.length ? mapped : ZONES;
  }

  async loadFoods(): Promise<Food[]> {
    const { data, error } = await this.supabase
      .from("foods")
      .select("id, name, emoji, thumb_bg, price_note, place, rating, wait_level, wait_text, menu, tip, is_inside, sort_order")
      .order("sort_order", { ascending: true });

    if (error || !data?.length) return FOODS;

    return data.map((row) => {
      const fallback = FOODS.find((f) => f.id === row.id);
      const wait = num(row.wait_level, fallback?.wait ?? 1);
      return {
        id: str(row.id),
        name: str(row.name) || fallback?.name || str(row.id),
        emoji: str(row.emoji) || fallback?.emoji || "🍽️",
        thumbBg: str(row.thumb_bg) || fallback?.thumbBg || "linear-gradient(150deg,#FFF6E7,#FFE3C2)",
        price: str(row.price_note) || fallback?.price || "",
        loc: str(row.place) || fallback?.loc || "",
        rating: num(row.rating, fallback?.rating ?? 4),
        wait: (wait >= 0 && wait <= 2 ? wait : 1) as 0 | 1 | 2,
        waitTxt: str(row.wait_text) || fallback?.waitTxt || "보통",
        menu: str(row.menu) || fallback?.menu || "",
        tip: str(row.tip) || fallback?.tip || "",
        inStadium: typeof row.is_inside === "boolean" ? row.is_inside : Boolean(fallback?.inStadium),
        sortOrder: num(row.sort_order, fallback?.sortOrder ?? 99),
      };
    });
  }

  async loadPosts(viewerId: string | null): Promise<Post[]> {
    const { data, error } = await this.supabase
      .from("posts")
      .select(POST_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) fail("글 목록을 불러오지 못했습니다", error);

    let likedIds = new Set<string>();
    if (viewerId) {
      const { data: likes } = await this.supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", viewerId);
      likedIds = new Set((likes ?? []).map((l) => str((l as AnyRow).post_id)));
    }

    return ((data ?? []) as AnyRow[]).map((row) => mapPost(row, viewerId, likedIds));
  }

  async createPost(input: NewPostInput, author: Author): Promise<Post> {
    const { data, error } = await this.supabase
      .from("posts")
      .insert({
        user_id: author.id,
        category: input.category,
        body: input.body,
        seat_zone: input.seatZone,
        seat_detail: input.seatDetail,
      })
      .select(POST_COLUMNS)
      .single();

    if (error || !data) fail("글을 등록하지 못했습니다", error);

    const row = data as AnyRow;
    return { ...mapPost(row, author.id, new Set()), mine: true, badge: "나" };
  }

  async deletePost(postId: string): Promise<void> {
    await deleteOwnRow(this.supabase, "posts", postId, "글을 삭제하지 못했습니다");
  }

  async toggleLike(
    postId: string,
    viewerId: string,
    liked: boolean,
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (liked) {
      const { error } = await this.supabase
        .from("post_likes")
        .upsert({ post_id: postId, user_id: viewerId }, { onConflict: "post_id,user_id" });
      if (error) fail("좋아요를 저장하지 못했습니다", error);
    } else {
      const { error } = await this.supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", viewerId);
      if (error) fail("좋아요를 취소하지 못했습니다", error);
    }

    const { data } = await this.supabase
      .from("posts")
      .select("like_count")
      .eq("id", postId)
      .maybeSingle();

    return { liked, likeCount: num((data as AnyRow | null)?.like_count) };
  }

  async loadComments(postId: string, viewerId: string | null): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .from("comments")
      .select(COMMENT_COLUMNS)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) fail("댓글을 불러오지 못했습니다", error);
    return ((data ?? []) as AnyRow[]).map((row) => mapComment(row, viewerId));
  }

  async addComment(postId: string, body: string, author: Author): Promise<Comment> {
    const { data, error } = await this.supabase
      .from("comments")
      .insert({ post_id: postId, user_id: author.id, body })
      .select(COMMENT_COLUMNS)
      .single();

    if (error || !data) fail("댓글을 등록하지 못했습니다", error);
    return { ...mapComment(data as AnyRow, author.id), mine: true };
  }

  async deleteComment(commentId: string): Promise<void> {
    await deleteOwnRow(this.supabase, "comments", commentId, "댓글을 삭제하지 못했습니다");
  }

  async loadReviews(viewerId: string | null): Promise<ZoneReview[]> {
    const { data, error } = await this.supabase
      .from("zone_reviews")
      .select(REVIEW_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) fail("시야 후기를 불러오지 못했습니다", error);
    return ((data ?? []) as AnyRow[]).map((row) => mapReview(row, viewerId));
  }

  /**
   * 브라우저에서 축소한 data URL 사진을 Storage에 올리고 공개 URL을 돌려줍니다.
   * 사진 업로드가 실패해도 후기·직관 기록 본문 등록은 막지 않습니다.
   */
  private async uploadPhotos(
    bucketName: string,
    dataUrls: string[],
    userId: string | null,
  ): Promise<string[]> {
    if (!userId || !dataUrls.length) return [];
    const bucket = this.supabase.storage.from(bucketName);
    const uploaded: string[] = [];

    for (const dataUrl of dataUrls.slice(0, 3)) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const ext = blob.type === "image/png" ? "png" : "jpg";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await bucket.upload(path, blob, {
          contentType: blob.type || "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw new Error(error.message);
        uploaded.push(bucket.getPublicUrl(path).data.publicUrl);
      } catch {
        // 개별 사진 실패는 건너뜁니다.
      }
    }

    return uploaded;
  }

  async createReview(input: NewReviewInput, author: Author): Promise<ZoneReview> {
    const photoUrls = await this.uploadPhotos(
      REVIEW_PHOTO_BUCKET,
      input.photoUrls ?? [],
      author.id,
    );

    const { data, error } = await this.supabase
      .from("zone_reviews")
      .insert({
        zone_code: input.zoneCode,
        user_id: author.id,
        seat_detail: input.seatDetail,
        rating: input.stars,
        body: input.body,
        photo_urls: photoUrls,
      })
      .select(REVIEW_COLUMNS)
      .single();

    if (error || !data) fail("시야 후기를 등록하지 못했습니다", error);
    return { ...mapReview(data as AnyRow, author.id), mine: true };
  }

  async deleteReview(reviewId: string): Promise<void> {
    await deleteOwnRow(this.supabase, "zone_reviews", reviewId, "시야 후기를 삭제하지 못했습니다");
  }

  async loadSaves(viewerId: string | null): Promise<Saves> {
    if (!viewerId) return { zones: [], foods: [] };
    const { data, error } = await this.supabase
      .from("saves")
      .select("target_type, target_id")
      .eq("user_id", viewerId);

    if (error) fail("저장 목록을 불러오지 못했습니다", error);

    const saves: Saves = { zones: [], foods: [] };
    for (const row of (data ?? []) as AnyRow[]) {
      const type = str(row.target_type);
      const id = str(row.target_id);
      if (type === "zone") saves.zones.push(id);
      else if (type === "food") saves.foods.push(id);
    }
    return saves;
  }

  async setSave(
    targetType: SaveTargetType,
    targetId: string,
    on: boolean,
    viewerId: string,
  ): Promise<void> {
    if (on) {
      const { error } = await this.supabase
        .from("saves")
        .upsert(
          { user_id: viewerId, target_type: targetType, target_id: targetId },
          { onConflict: "user_id,target_type,target_id" },
        );
      if (error) fail("저장하지 못했습니다", error);
    } else {
      const { error } = await this.supabase
        .from("saves")
        .delete()
        .eq("user_id", viewerId)
        .eq("target_type", targetType)
        .eq("target_id", targetId);
      if (error) fail("저장을 해제하지 못했습니다", error);
    }
  }

  async loadGames(viewerId: string | null): Promise<Game[]> {
    if (!viewerId) return [];
    const { data, error } = await this.supabase
      .from("games")
      .select(GAME_COLUMNS)
      .eq("user_id", viewerId)
      .order("played_on", { ascending: false });

    if (error) fail("직관 기록을 불러오지 못했습니다", error);
    return ((data ?? []) as AnyRow[]).map(mapGame);
  }

  async createGame(input: NewGameInput, viewerId: string): Promise<Game> {
    const photoUrls = await this.uploadPhotos(
      CHECKIN_PHOTO_BUCKET,
      input.photoUrls ?? [],
      viewerId,
    );

    const { data, error } = await this.supabase
      .from("games")
      .insert({
        user_id: viewerId,
        played_on: input.playedOn,
        opponent: input.opponent,
        home_away: input.homeAway,
        zone_code: input.zoneCode,
        score_for: input.scoreFor,
        score_against: input.scoreAgainst,
        note: input.note,
        photo_urls: photoUrls,
      })
      .select(GAME_COLUMNS)
      .single();

    if (error || !data) fail("직관 기록을 저장하지 못했습니다", error);
    return mapGame(data as AnyRow);
  }

  async deleteGame(gameId: string): Promise<void> {
    await deleteOwnRow(this.supabase, "games", gameId, "직관 기록을 삭제하지 못했습니다");
  }

  /* ── 직관러 맛집 ──────────────────────────────────────────── */
  async loadUserFoods(viewerId: string | null): Promise<UserFood[]> {
    const primary = await this.supabase
      .from("user_foods")
      .select(USER_FOOD_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);

    let rows = (primary.data ?? []) as AnyRow[];
    if (primary.error) {
      // 006(사진 컬럼)을 아직 실행하지 않았으면 사진 없이 한 번 더 시도합니다.
      const retry = await this.supabase
        .from("user_foods")
        .select(USER_FOOD_COLUMNS_LEGACY)
        .order("created_at", { ascending: false })
        .limit(200);
      // 마이그레이션 004 를 아직 실행하지 않았어도 화면은 비지 않게 둡니다.
      if (retry.error) return [];
      rows = (retry.data ?? []) as AnyRow[];
    }
    return rows.map((row) => mapUserFood(row, viewerId));
  }

  async createUserFood(input: NewUserFoodInput, author: Author): Promise<UserFood> {
    const requested = (input.photoUrls ?? []).length;
    const photoUrls = await this.uploadPhotos(
      USER_FOOD_PHOTO_BUCKET,
      input.photoUrls ?? [],
      author.id,
    );

    // 사진 저장소(user-food-photos 버킷)가 아직 없으면 사진만 조용히 사라지므로 알려줍니다.
    if (requested > 0 && photoUrls.length === 0) {
      throw new Error("사진을 저장하지 못했어요. 사진 없이 등록하거나 잠시 후 다시 시도해 주세요.");
    }

    // 006 이전 스키마(photo_urls 없음)에서도 사진 없는 등록은 되도록,
    // 사진이 있을 때만 컬럼을 보냅니다.
    const payload: Record<string, unknown> = {
      user_id: author.id,
      name: input.name,
      menu: input.menu,
      tip: input.tip,
      rating: input.rating,
      is_inside: input.inStadium,
    };
    if (photoUrls.length) payload.photo_urls = photoUrls;

    const { data, error } = await this.supabase
      .from("user_foods")
      .insert(payload)
      .select(USER_FOOD_COLUMNS)
      .single();

    if (error || !data) fail("맛집을 등록하지 못했습니다", error);
    return { ...mapUserFood(data as AnyRow, author.id), mine: true };
  }

  async deleteUserFood(foodId: string): Promise<void> {
    await deleteOwnRow(this.supabase, "user_foods", foodId, "맛집을 삭제하지 못했습니다");
  }

  /* ── 직관러 주차 팁 ──────────────────────────────────────── */
  async loadUserParkings(viewerId: string | null): Promise<UserParking[]> {
    const { data, error } = await this.supabase
      .from("user_parkings")
      .select(USER_PARKING_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return [];
    return ((data ?? []) as AnyRow[]).map((row) => mapUserParking(row, viewerId));
  }

  async createUserParking(
    input: NewUserParkingInput,
    author: Author,
  ): Promise<UserParking> {
    const { data, error } = await this.supabase
      .from("user_parkings")
      .insert({
        user_id: author.id,
        name: input.name,
        location: input.location,
        is_free: input.isFree,
        fee_note: input.isFree ? "" : input.feeNote,
        walk_time: input.walkTime,
        tip: input.tip,
      })
      .select(USER_PARKING_COLUMNS)
      .single();

    if (error || !data) fail("주차 팁을 등록하지 못했습니다", error);
    return { ...mapUserParking(data as AnyRow, author.id), mine: true };
  }

  async deleteUserParking(parkingId: string): Promise<void> {
    await deleteOwnRow(this.supabase, "user_parkings", parkingId, "주차 팁을 삭제하지 못했습니다");
  }
}
