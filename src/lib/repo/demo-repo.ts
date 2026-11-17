import { FOODS } from "@/lib/data/foods";
import {
  SEED_GAMES,
  SEED_POSTS,
  SEED_REVIEWS,
  type SeedPost,
} from "@/lib/data/sample-feed";
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
import { minutesAgoISO } from "@/lib/utils";

import type { Repository, SaveTargetType } from "./types";

const STORAGE_KEY = "lapak-life:demo:v1";

interface DemoPersist {
  liked: string[];
  posts: Post[];
  extraComments: Record<string, Comment[]>;
  reviews: ZoneReview[];
  saves: Saves;
  games: Game[];
  deletedPosts: string[];
}

function emptyPersist(): DemoPersist {
  return {
    liked: [],
    posts: [],
    extraComments: {},
    reviews: [],
    saves: { zones: [], foods: [] },
    games: [],
    deletedPosts: [],
  };
}

function readPersist(): DemoPersist {
  if (typeof window === "undefined") return emptyPersist();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPersist();
    const parsed = JSON.parse(raw) as Partial<DemoPersist>;
    const base = emptyPersist();
    return {
      ...base,
      ...parsed,
      saves: { ...base.saves, ...(parsed.saves ?? {}) },
      extraComments: parsed.extraComments ?? {},
    };
  } catch {
    return emptyPersist();
  }
}

function seedComments(sp: SeedPost): Comment[] {
  return sp.comments.map((c, i) => ({
    id: `seed-${sp.id}-${i}`,
    postId: sp.id,
    userId: null,
    nickname: c.nickname,
    body: c.body,
    createdAt: minutesAgoISO(c.minutesAgo),
    mine: false,
  }));
}

function seedPostToPost(sp: SeedPost, liked: boolean, commentCount: number): Post {
  return {
    id: sp.id,
    userId: null,
    nickname: sp.nickname,
    badge: sp.badge,
    category: sp.category,
    body: sp.body,
    seatZone: null,
    seatDetail: sp.seat,
    media: sp.media,
    createdAt: minutesAgoISO(sp.minutesAgo),
    likeCount: sp.likes + (liked ? 1 : 0),
    commentCount,
    liked,
    mine: false,
  };
}

/**
 * 데모 저장소: Supabase 없이도 모든 화면과 쓰기 액션을 체험할 수 있게
 * 브라우저 localStorage 에 사용자 데이터만 얹어 둡니다.
 */
export class DemoRepository implements Repository {
  mode = "demo" as const;
  private persist: DemoPersist;

  constructor() {
    this.persist = readPersist();
  }

  /**
   * localStorage 저장. 후기 사진(data URL) 때문에 용량이 넘치면
   * 가장 오래된 내 후기 사진부터 비우고 다시 시도합니다.
   */
  private save(): "ok" | "pruned" | "failed" {
    if (typeof window === "undefined") return "ok";

    const write = () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persist));
    };

    try {
      write();
      return "ok";
    } catch {
      // 용량 초과 → 아래에서 사진부터 정리합니다.
    }

    for (let i = this.persist.reviews.length - 1; i >= 0; i -= 1) {
      const review = this.persist.reviews[i];
      if (!review.photoUrls?.length) continue;
      review.photoUrls = [];
      try {
        write();
        return "pruned";
      } catch {
        // 다음(더 최근) 후기 사진도 비워봅니다.
      }
    }

    // 사진을 모두 비워도 저장할 수 없으면 화면 동작은 계속되게 둡니다.
    return "failed";
  }

  private seedCommentCount(postId: string): number {
    const seed = SEED_POSTS.find((p) => p.id === postId);
    return seed ? seed.comments.length : 0;
  }

  async loadZones(): Promise<Zone[]> {
    return ZONES;
  }

  async loadFoods(): Promise<Food[]> {
    return FOODS;
  }

  async loadPosts(): Promise<Post[]> {
    const liked = new Set(this.persist.liked);
    const deleted = new Set(this.persist.deletedPosts);
    const extra = this.persist.extraComments;

    const seeded = SEED_POSTS.filter((p) => !deleted.has(p.id)).map((sp) =>
      seedPostToPost(
        sp,
        liked.has(sp.id),
        this.seedCommentCount(sp.id) + (extra[sp.id]?.length ?? 0),
      ),
    );

    const mine = this.persist.posts
      .filter((p) => !deleted.has(p.id))
      .map((p) => ({
        ...p,
        liked: liked.has(p.id),
        likeCount: p.likeCount + (liked.has(p.id) ? 1 : 0),
        commentCount: extra[p.id]?.length ?? 0,
        mine: true,
      }));

    return [...mine, ...seeded].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async createPost(input: NewPostInput, author: Author): Promise<Post> {
    const post: Post = {
      id: `demo-post-${Date.now()}`,
      userId: null,
      nickname: author.nickname,
      badge: "나",
      category: input.category,
      body: input.body,
      seatZone: input.seatZone,
      seatDetail: input.seatDetail,
      media: null,
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      liked: false,
      mine: true,
    };
    this.persist.posts.unshift(post);
    this.save();
    return post;
  }

  async deletePost(postId: string): Promise<void> {
    this.persist.posts = this.persist.posts.filter((p) => p.id !== postId);
    if (!this.persist.deletedPosts.includes(postId)) {
      this.persist.deletedPosts.push(postId);
    }
    this.save();
  }

  async toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
    const has = this.persist.liked.includes(postId);
    this.persist.liked = has
      ? this.persist.liked.filter((id) => id !== postId)
      : [...this.persist.liked, postId];
    this.save();

    const liked = !has;
    const posts = await this.loadPosts();
    const target = posts.find((p) => p.id === postId);
    return { liked, likeCount: target?.likeCount ?? (liked ? 1 : 0) };
  }

  async loadComments(postId: string): Promise<Comment[]> {
    const seeded = SEED_POSTS.find((p) => p.id === postId);
    const base = seeded ? seedComments(seeded) : [];
    const extra = this.persist.extraComments[postId] ?? [];
    return [...base, ...extra];
  }

  async addComment(postId: string, body: string, author: Author): Promise<Comment> {
    const comment: Comment = {
      id: `demo-comment-${Date.now()}`,
      postId,
      userId: null,
      nickname: author.nickname,
      body,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    this.persist.extraComments[postId] = [
      ...(this.persist.extraComments[postId] ?? []),
      comment,
    ];
    this.save();
    return comment;
  }

  async loadReviews(): Promise<ZoneReview[]> {
    const seeded: ZoneReview[] = SEED_REVIEWS.map((r) => ({
      id: r.id,
      zoneCode: r.zone,
      userId: null,
      nickname: r.nickname,
      badge: r.badge,
      seatDetail: r.seat,
      stars: r.stars,
      body: r.body,
      photoUrls: [],
      createdAt: minutesAgoISO(r.minutesAgo),
      mine: false,
    }));
    return [...this.persist.reviews, ...seeded];
  }

  async createReview(input: NewReviewInput, author: Author): Promise<ZoneReview> {
    const review: ZoneReview = {
      id: `demo-review-${Date.now()}`,
      zoneCode: input.zoneCode,
      userId: null,
      nickname: author.nickname,
      badge: "나",
      seatDetail: input.seatDetail || ZONES.find((z) => z.code === input.zoneCode)?.name || "",
      stars: input.stars,
      body: input.body,
      photoUrls: (input.photoUrls ?? []).filter(Boolean).slice(0, 3),
      createdAt: new Date().toISOString(),
      mine: true,
    };
    this.persist.reviews.unshift(review);

    if (this.save() === "failed") {
      // 사진을 다 비워도 저장 공간이 없으면 사진 없는 후기로 남깁니다.
      review.photoUrls = [];
      this.save();
    }
    return review;
  }

  async loadSaves(): Promise<Saves> {
    return {
      zones: [...this.persist.saves.zones],
      foods: [...this.persist.saves.foods],
    };
  }

  async setSave(
    targetType: SaveTargetType,
    targetId: string,
    on: boolean,
  ): Promise<void> {
    const list = targetType === "zone" ? this.persist.saves.zones : this.persist.saves.foods;
    const next = on ? [...new Set([...list, targetId])] : list.filter((id) => id !== targetId);
    if (targetType === "zone") this.persist.saves.zones = next;
    else this.persist.saves.foods = next;
    this.save();
  }

  async loadGames(): Promise<Game[]> {
    const seeded: Game[] = SEED_GAMES.map((g, i) => ({
      id: `seed-game-${i}`,
      userId: null,
      playedOn: g.playedOn,
      opponent: g.opponent,
      homeAway: g.homeAway,
      zoneCode: g.zoneCode,
      scoreFor: g.scoreFor,
      scoreAgainst: g.scoreAgainst,
      note: g.note,
      createdAt: new Date(g.playedOn).toISOString(),
    }));
    return [...this.persist.games, ...seeded].sort((a, b) =>
      a.playedOn < b.playedOn ? 1 : -1,
    );
  }

  async createGame(input: NewGameInput): Promise<Game> {
    const game: Game = {
      id: `demo-game-${Date.now()}`,
      userId: null,
      playedOn: input.playedOn,
      opponent: input.opponent,
      homeAway: input.homeAway,
      zoneCode: input.zoneCode,
      scoreFor: input.scoreFor,
      scoreAgainst: input.scoreAgainst,
      note: input.note,
      createdAt: new Date().toISOString(),
    };
    this.persist.games.unshift(game);
    this.save();
    return game;
  }

  async deleteGame(gameId: string): Promise<void> {
    this.persist.games = this.persist.games.filter((g) => g.id !== gameId);
    this.save();
  }
}
