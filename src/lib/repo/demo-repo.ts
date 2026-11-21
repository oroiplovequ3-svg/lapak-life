import { FOODS } from "@/lib/data/foods";
import {
  SEED_GAMES,
  SEED_POSTS,
  SEED_REVIEWS,
  type SeedPost,
} from "@/lib/data/sample-feed";
import { SEED_USER_FOODS, SEED_USER_PARKINGS } from "@/lib/data/user-community";
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
import { minutesAgoISO } from "@/lib/utils";
import { MAX_USER_FOOD_PHOTOS } from "@/lib/image";

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
  userFoods: UserFood[];
  userParkings: UserParking[];
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
    userFoods: [],
    userParkings: [],
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
      userFoods: parsed.userFoods ?? [],
      userParkings: parsed.userParkings ?? [],
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
   * localStorage 저장. 첨부 사진(data URL) 때문에 용량이 넘치면
   * 가장 오래된 후기·직관 기록의 사진부터 비우고 다시 시도합니다.
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

    // 오래된 후기·직관 기록의 사진부터 하나씩 비우며 다시 저장합니다.
    const targets: { createdAt: string; clear: () => void }[] = [];
    for (const review of this.persist.reviews) {
      if (!review.photoUrls?.length) continue;
      targets.push({ createdAt: review.createdAt, clear: () => (review.photoUrls = []) });
    }
    for (const game of this.persist.games) {
      if (!game.photoUrls?.length) continue;
      targets.push({ createdAt: game.createdAt, clear: () => (game.photoUrls = []) });
    }
    for (const food of this.persist.userFoods) {
      if (!food.photoUrls?.length) continue;
      targets.push({ createdAt: food.createdAt, clear: () => (food.photoUrls = []) });
    }
    targets.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

    for (const target of targets) {
      target.clear();
      try {
        write();
        return "pruned";
      } catch {
        // 다음(더 최근) 항목의 사진도 비워봅니다.
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
    // 글과 함께 달린 내 댓글도 같이 정리합니다. (샘플 글은 그대로)
    delete this.persist.extraComments[postId];
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

  async deleteComment(commentId: string): Promise<void> {
    for (const [postId, list] of Object.entries(this.persist.extraComments)) {
      const next = list.filter((comment) => comment.id !== commentId);
      if (next.length !== list.length) this.persist.extraComments[postId] = next;
    }
    this.save();
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

  async deleteReview(reviewId: string): Promise<void> {
    this.persist.reviews = this.persist.reviews.filter((review) => review.id !== reviewId);
    this.save();
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
      photoUrls: [],
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
      photoUrls: (input.photoUrls ?? []).filter(Boolean).slice(0, 3),
      createdAt: new Date().toISOString(),
    };
    this.persist.games.unshift(game);

    if (this.save() === "failed") {
      // 사진을 다 비워도 저장 공간이 없으면 사진 없는 기록으로 남깁니다.
      game.photoUrls = [];
      this.save();
    }
    return game;
  }

  async deleteGame(gameId: string): Promise<void> {
    this.persist.games = this.persist.games.filter((g) => g.id !== gameId);
    this.save();
  }

  /* ── 직관러 맛집 ──────────────────────────────────────────── */
  async loadUserFoods(): Promise<UserFood[]> {
    return [...this.persist.userFoods, ...SEED_USER_FOODS].map((food) => ({
      ...food,
      photoUrls: food.photoUrls ?? [],
    }));
  }

  async createUserFood(input: NewUserFoodInput, author: Author): Promise<UserFood> {
    const food: UserFood = {
      id: `demo-ufood-${Date.now()}`,
      userId: null,
      nickname: author.nickname,
      name: input.name,
      menu: input.menu,
      tip: input.tip,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      inStadium: input.inStadium,
      photoUrls: (input.photoUrls ?? []).filter(Boolean).slice(0, MAX_USER_FOOD_PHOTOS),
      createdAt: new Date().toISOString(),
      mine: true,
    };
    this.persist.userFoods.unshift(food);

    if (this.save() === "failed") {
      // 사진을 다 비워도 저장 공간이 없으면 사진 없는 맛집으로 남깁니다.
      food.photoUrls = [];
      this.save();
    }
    return food;
  }

  async deleteUserFood(foodId: string): Promise<void> {
    this.persist.userFoods = this.persist.userFoods.filter((food) => food.id !== foodId);
    this.save();
  }

  /* ── 직관러 주차 팁 ──────────────────────────────────────── */
  async loadUserParkings(): Promise<UserParking[]> {
    return [...this.persist.userParkings, ...SEED_USER_PARKINGS];
  }

  async createUserParking(
    input: NewUserParkingInput,
    author: Author,
  ): Promise<UserParking> {
    const parking: UserParking = {
      id: `demo-uparking-${Date.now()}`,
      userId: null,
      nickname: author.nickname,
      name: input.name,
      location: input.location,
      isFree: input.isFree,
      feeNote: input.isFree ? "" : input.feeNote,
      walkTime: input.walkTime,
      tip: input.tip,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    this.persist.userParkings.unshift(parking);
    this.save();
    return parking;
  }

  async deleteUserParking(parkingId: string): Promise<void> {
    this.persist.userParkings = this.persist.userParkings.filter(
      (parking) => parking.id !== parkingId,
    );
    this.save();
  }
}
