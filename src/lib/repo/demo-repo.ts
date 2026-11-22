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
  Saves,
  UserFood,
  UserFoodComment,
  UserParking,
  Zone,
  ZoneReview,
} from "@/lib/types";
import { minutesAgoISO } from "@/lib/utils";
import { MAX_USER_FOOD_PHOTOS } from "@/lib/image";

import { DEMO_AUTHOR, NICKNAME_TAKEN_MESSAGE, type Repository, type SaveTargetType } from "./types";

const STORAGE_KEY = "lapak-life:demo:v1";

interface DemoPersist {
  /** 데모 모드의 내 프로필 (닉네임·프로필 사진) */
  profile: Author;
  liked: string[];
  posts: Post[];
  extraComments: Record<string, Comment[]>;
  reviews: ZoneReview[];
  saves: Saves;
  games: Game[];
  deletedPosts: string[];
  userFoods: UserFood[];
  /** 직관러 맛집 댓글 (foodId → 댓글) */
  userFoodComments: Record<string, UserFoodComment[]>;
  userParkings: UserParking[];
  /** 데모 모드에서 접수한 신고 (마스터가 없어 목록은 열리지 않습니다) */
  reports: Report[];
}

function emptyPersist(): DemoPersist {
  return {
    profile: { ...DEMO_AUTHOR },
    liked: [],
    posts: [],
    extraComments: {},
    reviews: [],
    saves: { zones: [], foods: [] },
    games: [],
    deletedPosts: [],
    userFoods: [],
    userFoodComments: {},
    userParkings: [],
    reports: [],
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
      profile: { ...base.profile, ...(parsed.profile ?? {}), id: null },
      extraComments: parsed.extraComments ?? {},
      userFoods: parsed.userFoods ?? [],
      userFoodComments: parsed.userFoodComments ?? {},
      userParkings: parsed.userParkings ?? [],
      reports: parsed.reports ?? [],
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
    avatarUrl: null,
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
    avatarUrl: null,
    badge: sp.badge,
    category: sp.category,
    body: sp.body,
    seatZone: null,
    seatDetail: sp.seat,
    media: sp.media,
    photoUrls: [],
    createdAt: minutesAgoISO(sp.minutesAgo),
    likeCount: sp.likes + (liked ? 1 : 0),
    commentCount,
    reportCount: 0,
    isHidden: false,
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

  /** 데모 모드에서 내가 보이는 이름·사진 */
  private get me(): Author {
    return this.persist.profile;
  }

  async loadProfile(): Promise<Author> {
    return { ...this.me, id: null };
  }

  /** 데모 모드에는 다른 사용자가 없으므로 마스터도 없습니다. */
  async isAdmin(): Promise<boolean> {
    return false;
  }

  /** 샘플 데이터에 이미 있는 이름 + 내가 지금 쓰는 이름을 기준으로 확인합니다. */
  async isNicknameAvailable(nickname: string): Promise<boolean> {
    const key = nickname.trim().toLowerCase();
    if (!key) return false;
    if (key === this.me.nickname.trim().toLowerCase()) return true;
    return !this.seedNicknames().some((name) => name.trim().toLowerCase() === key);
  }

  private seedNicknames(): string[] {
    const names = new Set<string>();
    for (const post of SEED_POSTS) {
      names.add(post.nickname);
      for (const comment of post.comments) names.add(comment.nickname);
    }
    for (const review of SEED_REVIEWS) names.add(review.nickname);
    for (const food of SEED_USER_FOODS) names.add(food.nickname);
    for (const parking of SEED_USER_PARKINGS) names.add(parking.nickname);
    return [...names];
  }

  /**
   * 데모 모드 프로필 저장. 사진은 브라우저에서 줄인 data URL 그대로
   * localStorage 에 넣고, 닉네임·사진은 내가 쓴 글·후기 표시에도 바로 반영합니다.
   */
  async updateProfile(input: ProfileUpdate): Promise<Author> {
    const nickname = input.nickname.trim();
    if (nickname.length < 2 || nickname.length > 16) {
      throw new Error("닉네임은 2~16자로 정해주세요");
    }
    if (nickname !== this.me.nickname && !(await this.isNicknameAvailable(nickname))) {
      throw new Error(NICKNAME_TAKEN_MESSAGE);
    }

    const avatarUrl =
      input.avatarDataUrl === undefined ? this.me.avatarUrl : input.avatarDataUrl;

    this.persist.profile = { id: null, nickname, avatarUrl };
    if (this.save() === "failed") {
      throw new Error(
        "브라우저 저장 공간이 부족해 프로필 사진을 저장하지 못했어요. 더 작은 사진으로 다시 시도해 주세요.",
      );
    }
    return { ...this.persist.profile };
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

  /** 데모 모드의 신고 누적 수 — 마스터가 없어 숨김은 일어나지 않습니다. */
  private reportCountOf(targetType: string, targetId: string): number {
    return this.persist.reports.filter(
      (report) => report.targetType === targetType && report.targetId === targetId,
    ).length;
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
        nickname: this.me.nickname,
        avatarUrl: this.me.avatarUrl,
        liked: liked.has(p.id),
        likeCount: p.likeCount + (liked.has(p.id) ? 1 : 0),
        commentCount: extra[p.id]?.length ?? 0,
        mine: true,
        reportCount: this.reportCountOf("post", p.id),
        isHidden: false,
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
      avatarUrl: author.avatarUrl ?? null,
      badge: "나",
      category: input.category,
      body: input.body,
      seatZone: input.seatZone,
      seatDetail: input.seatDetail,
      media: null,
      photoUrls: (input.photoUrls ?? []).slice(0, 3),
      createdAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      liked: false,
      mine: true,
      reportCount: 0,
      isHidden: false,
    };
    this.persist.posts.unshift(post);
    this.save();
    return post;
  }

  async updatePost(postId: string, input: NewPostInput): Promise<Post> {
    const target = this.persist.posts.find((p) => p.id === postId);
    if (!target) throw new Error("데모 모드에서는 내가 쓴 글만 수정할 수 있어요.");
    const updated: Post = {
      ...target,
      category: input.category,
      body: input.body,
      seatZone: input.seatZone,
      seatDetail: input.seatDetail,
      photoUrls: (input.photoUrls ?? []).slice(0, 3),
      mine: true,
    };
    this.persist.posts = this.persist.posts.map((p) => (p.id === postId ? updated : p));
    this.save();
    return updated;
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
    const decorate = (comment: Comment): Comment => ({
      ...comment,
      nickname: comment.mine ? this.me.nickname : comment.nickname,
      avatarUrl: comment.mine ? this.me.avatarUrl : comment.avatarUrl,
      reportCount: this.reportCountOf("comment", comment.id),
      isHidden: false,
    });
    return [...base.map(decorate), ...extra.map(decorate)];
  }

  async addComment(postId: string, body: string, author: Author): Promise<Comment> {
    const comment: Comment = {
      id: `demo-comment-${Date.now()}`,
      postId,
      userId: null,
      nickname: author.nickname,
      avatarUrl: author.avatarUrl ?? null,
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

  async updateComment(commentId: string, body: string): Promise<Comment> {
    for (const [postId, list] of Object.entries(this.persist.extraComments)) {
      const target = list.find((comment) => comment.id === commentId && comment.mine);
      if (target) {
        const updated: Comment = { ...target, body };
        this.persist.extraComments[postId] = list.map((comment) =>
          comment.id === commentId ? updated : comment,
        );
        this.save();
        return updated;
      }
    }
    throw new Error("데모 모드에서는 내가 쓴 댓글만 수정할 수 있어요.");
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
      avatarUrl: null,
      badge: r.badge,
      seatDetail: r.seat,
      stars: r.stars,
      body: r.body,
      photoUrls: [],
      createdAt: minutesAgoISO(r.minutesAgo),
      mine: false,
    }));
    return [
      ...this.persist.reviews.map((review) => ({
        ...review,
        nickname: this.me.nickname,
        avatarUrl: this.me.avatarUrl,
      })),
      ...seeded,
    ].map((review) => ({
      ...review,
      reportCount: this.reportCountOf("review", review.id),
      isHidden: false,
    }));
  }

  async createReview(input: NewReviewInput, author: Author): Promise<ZoneReview> {
    const review: ZoneReview = {
      id: `demo-review-${Date.now()}`,
      zoneCode: input.zoneCode,
      userId: null,
      nickname: author.nickname,
      avatarUrl: author.avatarUrl ?? null,
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

  async updateReview(reviewId: string, input: NewReviewInput): Promise<ZoneReview> {
    const target = this.persist.reviews.find((review) => review.id === reviewId);
    if (!target) throw new Error("데모 모드에서는 내가 쓴 후기만 수정할 수 있어요.");
    const updated: ZoneReview = {
      ...target,
      zoneCode: input.zoneCode,
      seatDetail:
        input.seatDetail || ZONES.find((z) => z.code === input.zoneCode)?.name || "",
      stars: input.stars,
      body: input.body,
      photoUrls: (input.photoUrls ?? []).filter(Boolean).slice(0, 3),
    };
    this.persist.reviews = this.persist.reviews.map((review) =>
      review.id === reviewId ? updated : review,
    );
    if (this.save() === "failed") {
      updated.photoUrls = target.photoUrls;
      this.save();
    }
    return updated;
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

  /** 직관 기록 수정 — 데모 모드에서는 내가 만든 기록만 고칩니다. */
  async updateGame(gameId: string, input: NewGameInput): Promise<Game> {
    const target = this.persist.games.find((game) => game.id === gameId);
    if (!target) throw new Error("데모 모드에서는 내가 만든 직관 기록만 수정할 수 있어요.");
    const updated: Game = {
      ...target,
      playedOn: input.playedOn,
      opponent: input.opponent,
      homeAway: input.homeAway,
      zoneCode: input.zoneCode,
      scoreFor: input.scoreFor,
      scoreAgainst: input.scoreAgainst,
      note: input.note,
      photoUrls: (input.photoUrls ?? []).filter(Boolean).slice(0, 3),
    };
    this.persist.games = this.persist.games.map((game) =>
      game.id === gameId ? updated : game,
    );
    if (this.save() === "failed") {
      updated.photoUrls = target.photoUrls;
      this.save();
    }
    return updated;
  }

  /* ── 직관러 맛집 ──────────────────────────────────────────── */
  async loadUserFoods(): Promise<UserFood[]> {
    const mine = this.persist.userFoods.map((food) => ({
      ...food,
      nickname: this.me.nickname,
      avatarUrl: this.me.avatarUrl,
      photoUrls: food.photoUrls ?? [],
    }));
    return [...mine, ...SEED_USER_FOODS].map((food) => ({
      ...food,
      photoUrls: food.photoUrls ?? [],
      commentCount: this.persist.userFoodComments[food.id]?.length ?? 0,
      reportCount: this.reportCountOf("user_food", food.id),
      isHidden: false,
    }));
  }

  /* ── 직관러 맛집 댓글 (데모 모드) ────────────────────────── */
  async loadUserFoodComments(foodId: string): Promise<UserFoodComment[]> {
    return (this.persist.userFoodComments[foodId] ?? []).map((comment) => ({
      ...comment,
      nickname: comment.mine ? this.me.nickname : comment.nickname,
      avatarUrl: comment.mine ? this.me.avatarUrl : comment.avatarUrl,
      reportCount: this.reportCountOf("user_food_comment", comment.id),
      isHidden: false,
    }));
  }

  async addUserFoodComment(
    foodId: string,
    body: string,
    author: Author,
  ): Promise<UserFoodComment> {
    const comment: UserFoodComment = {
      id: `demo-ufcomment-${Date.now()}`,
      foodId,
      userId: null,
      nickname: author.nickname,
      avatarUrl: author.avatarUrl ?? null,
      body,
      createdAt: new Date().toISOString(),
      mine: true,
      reportCount: 0,
      isHidden: false,
    };
    this.persist.userFoodComments[foodId] = [
      ...(this.persist.userFoodComments[foodId] ?? []),
      comment,
    ];
    const food = this.persist.userFoods.find((item) => item.id === foodId);
    if (food) food.commentCount = (food.commentCount ?? 0) + 1;
    this.save();
    return comment;
  }

  async updateUserFoodComment(commentId: string, body: string): Promise<UserFoodComment> {
    for (const [foodId, list] of Object.entries(this.persist.userFoodComments)) {
      const target = list.find((comment) => comment.id === commentId && comment.mine);
      if (target) {
        const updated: UserFoodComment = { ...target, body };
        this.persist.userFoodComments[foodId] = list.map((comment) =>
          comment.id === commentId ? updated : comment,
        );
        this.save();
        return updated;
      }
    }
    throw new Error("데모 모드에서는 내가 쓴 댓글만 수정할 수 있어요.");
  }

  async deleteUserFoodComment(commentId: string): Promise<void> {
    for (const [foodId, list] of Object.entries(this.persist.userFoodComments)) {
      const next = list.filter((comment) => comment.id !== commentId);
      if (next.length !== list.length) {
        this.persist.userFoodComments[foodId] = next;
        const food = this.persist.userFoods.find((item) => item.id === foodId);
        if (food) food.commentCount = Math.max(0, (food.commentCount ?? 0) - 1);
      }
    }
    this.save();
  }

  async createUserFood(input: NewUserFoodInput, author: Author): Promise<UserFood> {
    const food: UserFood = {
      id: `demo-ufood-${Date.now()}`,
      userId: null,
      nickname: author.nickname,
      avatarUrl: author.avatarUrl ?? null,
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

  async updateUserFood(foodId: string, input: NewUserFoodInput): Promise<UserFood> {
    const target = this.persist.userFoods.find((food) => food.id === foodId);
    if (!target) throw new Error("데모 모드에서는 내가 쓴 맛집만 수정할 수 있어요.");
    const updated: UserFood = {
      ...target,
      name: input.name,
      menu: input.menu,
      tip: input.tip,
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      inStadium: input.inStadium,
      photoUrls: (input.photoUrls ?? []).filter(Boolean).slice(0, MAX_USER_FOOD_PHOTOS),
    };
    this.persist.userFoods = this.persist.userFoods.map((food) =>
      food.id === foodId ? updated : food,
    );
    if (this.save() === "failed") {
      updated.photoUrls = target.photoUrls;
      this.save();
    }
    return updated;
  }

  async deleteUserFood(foodId: string): Promise<void> {
    this.persist.userFoods = this.persist.userFoods.filter((food) => food.id !== foodId);
    this.save();
  }

  /* ── 직관러 주차 팁 ──────────────────────────────────────── */
  async loadUserParkings(): Promise<UserParking[]> {
    const mine = this.persist.userParkings.map((parking) => ({
      ...parking,
      nickname: this.me.nickname,
      avatarUrl: this.me.avatarUrl,
    }));
    return [...mine, ...SEED_USER_PARKINGS].map((parking) => ({
      ...parking,
      reportCount: this.reportCountOf("user_parking", parking.id),
      isHidden: false,
    }));
  }

  async createUserParking(
    input: NewUserParkingInput,
    author: Author,
  ): Promise<UserParking> {
    const parking: UserParking = {
      id: `demo-uparking-${Date.now()}`,
      userId: null,
      nickname: author.nickname,
      avatarUrl: author.avatarUrl ?? null,
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

  async updateUserParking(
    parkingId: string,
    input: NewUserParkingInput,
  ): Promise<UserParking> {
    const target = this.persist.userParkings.find((parking) => parking.id === parkingId);
    if (!target) throw new Error("데모 모드에서는 내가 쓴 주차 팁만 수정할 수 있어요.");
    const updated: UserParking = {
      ...target,
      name: input.name,
      location: input.location,
      isFree: input.isFree,
      feeNote: input.isFree ? "" : input.feeNote,
      walkTime: input.walkTime,
      tip: input.tip,
    };
    this.persist.userParkings = this.persist.userParkings.map((parking) =>
      parking.id === parkingId ? updated : parking,
    );
    this.save();
    return updated;
  }

  async deleteUserParking(parkingId: string): Promise<void> {
    this.persist.userParkings = this.persist.userParkings.filter(
      (parking) => parking.id !== parkingId,
    );
    this.save();
  }

  /* ── 신고 (데모 모드) ──────────────────────────────── */
  async createReport(input: NewReportInput): Promise<void> {
    const duplicate = this.persist.reports.some(
      (report) =>
        report.targetType === input.targetType && report.targetId === input.targetId,
    );
    if (duplicate) throw new Error("이미 신고한 항목이에요.");
    this.persist.reports.unshift({
      id: `demo-report-${Date.now()}`,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      detail: input.detail ?? "",
      status: "open",
      createdAt: new Date().toISOString(),
    });
    this.save();
  }

  /** 데모 모드에는 마스터가 없어 신고 목록을 열 수 없습니다. */
  async loadReports(): Promise<Report[]> {
    return [];
  }

  async setReportStatus(): Promise<void> {
    throw new Error("데모 모드에서는 신고를 처리할 수 없어요.");
  }

  /** 데모 모드 신고는 대상 미리보기를 따로 보관하지 않습니다. */
  async loadReportTarget(): Promise<ReportTargetPreview> {
    return {
      found: false,
      body: "",
      nickname: "",
      userId: null,
      postId: null,
      foodId: null,
      zoneCode: null,
      hidden: false,
    };
  }

  /** 데모 모드에는 마스터가 없어 숨김 복구도 일어나지 않습니다. */
  async restoreReportedContent(): Promise<void> {
    throw new Error("데모 모드에서는 신고 복구를 할 수 없어요.");
  }

  /** 데모 모드에는 서버 계정이 없어 탈퇴할 계정도 없습니다. */
  async deleteOwnAccount(): Promise<void> {
    throw new Error("데모 모드에서는 탈퇴할 계정이 없어요. 구글 로그인 후 이용해 주세요.");
  }

  /* ── 회원 정지 — 데모 모드에는 마스터도 서버 계정도 없습니다. ── */
  async getMyBanStatus(): Promise<BanStatus> {
    return { banned: false, reason: null };
  }

  async listUsers(): Promise<AdminUserSummary[]> {
    return [];
  }

  async banUser(): Promise<void> {
    throw new Error("데모 모드에서는 회원을 정지할 수 없어요. 구글 로그인 후 이용해 주세요.");
  }

  async unbanUser(): Promise<void> {
    throw new Error("데모 모드에서는 회원 정지를 해제할 수 없어요. 구글 로그인 후 이용해 주세요.");
  }
}
