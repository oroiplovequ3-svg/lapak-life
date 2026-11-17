import type { SupabaseClient } from "@supabase/supabase-js";

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
  Post,
  Saves,
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
    category: (str(row.category) || "review") as Post["category"],
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
    photoUrls: Array.isArray(row.photo_urls)
      ? (row.photo_urls as unknown[]).filter((value): value is string => typeof value === "string")
      : [],
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
    createdAt: str(row.created_at) || new Date().toISOString(),
  };
}

const POST_COLUMNS =
  "id, user_id, category, body, seat_zone, seat_detail, media, created_at, like_count, comment_count, profiles(nickname, avatar_url)";
const COMMENT_COLUMNS = "id, post_id, user_id, body, created_at, profiles(nickname, avatar_url)";
const REVIEW_COLUMNS =
  "id, zone_code, user_id, seat_detail, rating, body, photo_urls, created_at, profiles(nickname, avatar_url)";

/** 시야 후기 사진 버킷 (supabase/migrations/002_review_photos.sql) */
const REVIEW_PHOTO_BUCKET = "review-photos";

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "알 수 없는 오류"}`);
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
    const { error } = await this.supabase.from("posts").delete().eq("id", postId);
    if (error) fail("글을 삭제하지 못했습니다", error);
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
   * 사진 업로드가 실패해도 후기 본문 등록은 막지 않습니다.
   */
  private async uploadReviewPhotos(dataUrls: string[], userId: string | null): Promise<string[]> {
    if (!userId || !dataUrls.length) return [];
    const bucket = this.supabase.storage.from(REVIEW_PHOTO_BUCKET);
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
    const photoUrls = await this.uploadReviewPhotos(input.photoUrls ?? [], author.id);

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
      .select("id, user_id, played_on, opponent, home_away, zone_code, score_for, score_against, note, created_at")
      .eq("user_id", viewerId)
      .order("played_on", { ascending: false });

    if (error) fail("직관 기록을 불러오지 못했습니다", error);
    return ((data ?? []) as AnyRow[]).map(mapGame);
  }

  async createGame(input: NewGameInput, viewerId: string): Promise<Game> {
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
      })
      .select("id, user_id, played_on, opponent, home_away, zone_code, score_for, score_against, note, created_at")
      .single();

    if (error || !data) fail("직관 기록을 저장하지 못했습니다", error);
    return mapGame(data as AnyRow);
  }

  async deleteGame(gameId: string): Promise<void> {
    const { error } = await this.supabase.from("games").delete().eq("id", gameId);
    if (error) fail("직관 기록을 삭제하지 못했습니다", error);
  }
}
