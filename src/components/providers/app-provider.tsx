"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { FOODS } from "@/lib/data/foods";
import { ZONES } from "@/lib/data/zones";
import { DemoRepository } from "@/lib/repo/demo-repo";
import { SupabaseRepository } from "@/lib/repo/supabase-repo";
import { DEMO_AUTHOR, type Repository, type SaveTargetType } from "@/lib/repo/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  AppUser,
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

import { useToast } from "./toast-provider";

interface AuthPrompt {
  open: boolean;
  reason: string;
}

interface AppContextValue {
  configured: boolean;
  ready: boolean;
  loadError: string | null;
  repoMode: "demo" | "live";
  user: AppUser | null;
  /** 지금 이 브라우저에서 보이는 내 이름·사진 (데모 모드에서는 저장된 데모 프로필) */
  profile: Author;
  signingIn: boolean;
  authPrompt: AuthPrompt;
  closeAuthPrompt: () => void;

  zones: Zone[];
  foods: Food[];
  posts: Post[];
  reviews: ZoneReview[];
  games: Game[];
  saves: Saves;
  commentsByPost: Record<string, Comment[]>;
  commentsLoaded: Record<string, boolean>;
  userFoods: UserFood[];
  userParkings: UserParking[];

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: ProfileUpdate) => Promise<boolean>;

  createPost: (input: NewPostInput) => Promise<boolean>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addComment: (postId: string, body: string) => Promise<boolean>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;

  createReview: (input: NewReviewInput) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<void>;
  toggleSaveZone: (code: string) => Promise<void>;
  toggleSaveFood: (id: string) => Promise<void>;
  addGame: (input: NewGameInput) => Promise<boolean>;
  deleteGame: (gameId: string) => Promise<void>;
  addUserFood: (input: NewUserFoodInput) => Promise<boolean>;
  deleteUserFood: (foodId: string) => Promise<void>;
  addUserParking: (input: NewUserParkingInput) => Promise<boolean>;
  deleteUserParking: (parkingId: string) => Promise<void>;
  reload: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppProvider>");
  return value;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "알 수 없는 오류가 발생했어요";
}

function nicknameFromSession(session: Session): string {
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const candidates = [meta.nickname, meta.name, meta.preferred_username, meta.full_name];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "라팍팬";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  const [repo, setRepo] = useState<Repository | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Author>({ ...DEMO_AUTHOR });
  const [signingIn, setSigningIn] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<AuthPrompt>({ open: false, reason: "" });

  const [zones, setZones] = useState<Zone[]>(ZONES);
  const [foods, setFoods] = useState<Food[]>(FOODS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<ZoneReview[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [saves, setSaves] = useState<Saves>({ zones: [], foods: [] });
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentsLoaded, setCommentsLoaded] = useState<Record<string, boolean>>({});
  const [userFoods, setUserFoods] = useState<UserFood[]>([]);
  const [userParkings, setUserParkings] = useState<UserParking[]>([]);

  const userRef = useRef<AppUser | null>(null);
  userRef.current = user;

  /* ── 1. 저장소 + 세션 ───────────────────────────────────────── */
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    setRepo(supabase ? new SupabaseRepository(supabase) : new DemoRepository());

    if (!supabase) return;
    let active = true;

    const apply = async (session: Session | null) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        return;
      }
      const authUser = session.user;
      let nickname = nicknameFromSession(session);
      let avatarUrl =
        (authUser.user_metadata?.avatar_url as string | undefined) ??
        (authUser.user_metadata?.picture as string | undefined) ??
        null;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nickname, avatar_url")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profile?.nickname) nickname = profile.nickname;
        if (profile?.avatar_url) avatarUrl = profile.avatar_url;

        if (!profile) {
          // 트리거가 아직 없거나 실패한 경우를 대비한 자가 복구
          await supabase
            .from("profiles")
            .upsert({ id: authUser.id, nickname, avatar_url: avatarUrl }, { onConflict: "id" });
        }
      } catch {
        // 프로필 조회 실패는 로그인 자체를 막지 않습니다.
      }

      if (active) {
        setUser({
          id: authUser.id,
          nickname,
          avatarUrl,
          email: authUser.email ?? null,
        });
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => {});

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void apply(session);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  /* ── 2. 데이터 로드 (로그인 상태가 바뀌면 다시) ─────────────── */
  const loadAll = useCallback(
    async (repository: Repository, viewerId: string | null) => {
      const [
        profileRow,
        zoneRows,
        foodRows,
        postRows,
        reviewRows,
        saveRows,
        gameRows,
        userFoodRows,
        userParkingRows,
      ] = await Promise.all([
        repository.loadProfile(viewerId),
        repository.loadZones(),
        repository.loadFoods(),
        repository.loadPosts(viewerId),
        repository.loadReviews(viewerId),
        repository.loadSaves(viewerId),
        repository.loadGames(viewerId),
        repository.loadUserFoods(viewerId),
        repository.loadUserParkings(viewerId),
      ]);
      return {
        profileRow,
        zoneRows,
        foodRows,
        postRows,
        reviewRows,
        saveRows,
        gameRows,
        userFoodRows,
        userParkingRows,
      };
    },
    [],
  );

  useEffect(() => {
    if (!repo) return;
    let active = true;
    setReady(false);

    (async () => {
      try {
        const result = await loadAll(repo, user?.id ?? null);
        if (!active) return;
        setProfile(result.profileRow);
        setZones(result.zoneRows);
        setFoods(result.foodRows);
        setPosts(result.postRows);
        setReviews(result.reviewRows);
        setSaves(result.saveRows);
        setGames(result.gameRows);
        setUserFoods(result.userFoodRows);
        setUserParkings(result.userParkingRows);
        setCommentsByPost({});
        setCommentsLoaded({});
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setLoadError(errorMessage(error));
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [repo, user?.id, loadAll]);

  /* ── 3. OAuth 콜백 오류 안내 ────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const authError = url.searchParams.get("auth_error");
    if (!authError) return;
    toast(`로그인에 실패했어요: ${authError}`);
    url.searchParams.delete("auth_error");
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
  }, [toast]);

  /* ── 4. 쓰기 권한 ───────────────────────────────────────────── */
  const ensureCanWrite = useCallback(
    (action: string): boolean => {
      if (!isSupabaseConfigured) return true; // 데모 모드: 로컬 체험 허용
      if (userRef.current) return true;
      setAuthPrompt({ open: true, reason: `${action}려면 구글 로그인이 필요해요` });
      return false;
    },
    [],
  );

  const author: Author = user ?? profile;

  const reload = useCallback(async () => {
    if (!repo) return;
    try {
      const result = await loadAll(repo, userRef.current?.id ?? null);
      setProfile(result.profileRow);
      setZones(result.zoneRows);
      setFoods(result.foodRows);
      setPosts(result.postRows);
      setReviews(result.reviewRows);
      setSaves(result.saveRows);
      setGames(result.gameRows);
      setUserFoods(result.userFoodRows);
      setUserParkings(result.userParkingRows);
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, [repo, loadAll]);

  /* ── 5. 인증 ────────────────────────────────────────────────── */
  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast("Supabase가 아직 연결되지 않았어요. 지금은 데모 모드로 동작합니다.");
      return;
    }
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback?next=/`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast(`구글 로그인을 시작하지 못했어요: ${errorMessage(error)}`);
      setSigningIn(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast(`로그아웃하지 못했어요: ${error.message}`);
      return;
    }
    setUser(null);
    toast("로그아웃했어요");
  }, [toast]);

  /* ── 5-1. 프로필 설정 (닉네임 · 프로필 사진) ────────────────── */
  const updateProfile = useCallback(
    async (input: ProfileUpdate) => {
      if (!repo) return false;
      const nickname = input.nickname.trim();
      if (nickname.length < 2 || nickname.length > 16) {
        toast("닉네임은 2~16자로 정해주세요");
        return false;
      }
      if (repo.mode === "live" && !userRef.current) {
        setAuthPrompt({ open: true, reason: "프로필을 바꾸려면 구글 로그인이 필요해요" });
        return false;
      }

      try {
        const next = await repo.updateProfile(
          { ...input, nickname },
          userRef.current?.id ?? null,
        );
        setProfile(next);
        if (userRef.current) {
          setUser({ ...userRef.current, nickname: next.nickname, avatarUrl: next.avatarUrl });
        }
        // 내가 쓴 글·댓글·후기·맛집·주차 팁과 랍톡 피드까지 새 이름·사진으로 다시 그립니다.
        await reload();
        toast("프로필을 저장했어요");
        return true;
      } catch (error) {
        toast(errorMessage(error));
        return false;
      }
    },
    [repo, reload, toast],
  );

  /* ── 6. 피드 ────────────────────────────────────────────────── */
  const createPost = useCallback(
    async (input: NewPostInput) => {
      if (!repo) return false;
      if (!ensureCanWrite("글을 쓰")) return false;
      try {
        const post = await repo.createPost(input, author);
        setPosts((prev) => [post, ...prev]);
        toast("게시글을 등록했어요");
        return true;
      } catch (error) {
        toast(errorMessage(error));
        return false;
      }
    },
    [repo, ensureCanWrite, author, toast],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!repo) return;
      try {
        await repo.deletePost(postId);
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        toast("글을 삭제했어요");
      } catch (error) {
        toast(errorMessage(error));
      }
    },
    [repo, toast],
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!repo) return;
      const target = posts.find((post) => post.id === postId);
      if (!target) return;
      if (!ensureCanWrite("좋아요를 누르")) return;

      const nextLiked = !target.liked;
      const optimisticDelta = nextLiked ? 1 : -1;

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked: nextLiked,
                likeCount: Math.max(0, post.likeCount + optimisticDelta),
              }
            : post,
        ),
      );

      try {
        const result = await repo.toggleLike(postId, userRef.current?.id ?? "demo", nextLiked);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, liked: result.liked, likeCount: result.likeCount }
              : post,
          ),
        );
      } catch (error) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, liked: target.liked, likeCount: target.likeCount }
              : post,
          ),
        );
        toast(errorMessage(error));
      }
    },
    [repo, posts, ensureCanWrite, toast],
  );

  const loadComments = useCallback(
    async (postId: string) => {
      if (!repo || commentsLoaded[postId]) return;
      try {
        const list = await repo.loadComments(postId, userRef.current?.id ?? null);
        setCommentsByPost((prev) => ({ ...prev, [postId]: list }));
        setCommentsLoaded((prev) => ({ ...prev, [postId]: true }));
      } catch (error) {
        toast(errorMessage(error));
      }
    },
    [repo, commentsLoaded, toast],
  );

  const addComment = useCallback(
    async (postId: string, body: string) => {
      if (!repo) return false;
      const text = body.trim();
      if (!text) return false;
      if (!ensureCanWrite("댓글을 남기")) return false;

      try {
        const comment = await repo.addComment(postId, text, author);
        const nextList = [...(commentsByPost[postId] ?? []), comment];
        setCommentsByPost((prev) => ({ ...prev, [postId]: nextList }));
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, commentCount: nextList.length } : post,
          ),
        );
        setCommentsLoaded((prev) => ({ ...prev, [postId]: true }));
        return true;
      } catch (error) {
        toast(errorMessage(error));
        return false;
      }
    },
    [repo, ensureCanWrite, author, commentsByPost, toast],
  );

  /* ── 7. 시야 후기 ───────────────────────────────────────────── */
  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      if (!repo) return;
      try {
        await repo.deleteComment(commentId);
        setCommentsByPost((prev) => {
          const nextList = (prev[postId] ?? []).filter((comment) => comment.id !== commentId);
          return { ...prev, [postId]: nextList };
        });
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
              : post,
          ),
        );
        toast("댓글을 삭제했어요");
      } catch (error) {
        toast(errorMessage(error));
      }
    },
    [repo, toast],
  );

  const createReview = useCallback(
    async (input: NewReviewInput) => {
      if (!repo) return false;
      if (!ensureCanWrite("시야 후기를 올리")) return false;
      try {
        const review = await repo.createReview(input, author);
        setReviews((prev) => [review, ...prev]);
        toast("시야 후기를 등록했어요");
        return true;
      } catch (error) {
        toast(errorMessage(error));
        return false;
      }
    },
    [repo, ensureCanWrite, author, toast],
  );

  /* ── 8. 저장(북마크) ────────────────────────────────────────── */
  const deleteReview = useCallback(
    async (reviewId: string) => {
      if (!repo) return;
      try {
        await repo.deleteReview(reviewId);
        setReviews((prev) => prev.filter((review) => review.id !== reviewId));
        toast("시야 후기를 삭제했어요");
      } catch (error) {
        toast(errorMessage(error));
      }
    },
    [repo, toast],
  );

  const toggleSave = useCallback(
    async (targetType: SaveTargetType, targetId: string, label: string) => {
      if (!repo) return;
      if (!ensureCanWrite("저장하")) return;

      const list = targetType === "zone" ? saves.zones : saves.foods;
      const on = !list.includes(targetId);
      const apply = (prev: Saves): Saves => ({
        zones:
          targetType === "zone"
            ? on
              ? [...prev.zones, targetId]
              : prev.zones.filter((id) => id !== targetId)
            : prev.zones,
        foods:
          targetType === "food"
            ? on
              ? [...prev.foods, targetId]
              : prev.foods.filter((id) => id !== targetId)
            : prev.foods,
      });

      const snapshot = saves;
      setSaves(apply);

      try {
        await repo.setSave(targetType, targetId, on, userRef.current?.id ?? "demo");
        toast(on ? `${label} 저장했어요 · 내 직관에서 확인` : "저장을 해제했어요");
      } catch (error) {
        setSaves(snapshot);
        toast(errorMessage(error));
      }
    },
    [repo, saves, ensureCanWrite, toast],
  );

  const toggleSaveZone = useCallback(
    async (code: string) => {
      const zone = ZONES.find((z) => z.code === code) ?? zones.find((z) => z.code === code);
      await toggleSave("zone", code, zone?.short ?? "구역");
    },
    [toggleSave, zones],
  );

  const toggleSaveFood = useCallback(
    async (id: string) => {
      const food = foods.find((f) => f.id === id);
      await toggleSave("food", id, food?.name ?? "맛집");
    },
    [toggleSave, foods],
  );

  /* ── 9. 직관 기록 ───────────────────────────────────────────── */
  const addGame = useCallback(
    async (input: NewGameInput) => {
      if (!repo) return false;
      if (!ensureCanWrite("직관 기록을 추가하")) return false;
      try {
        const game = await repo.createGame(input, userRef.current?.id ?? "demo");
        setGames((prev) =>
          [game, ...prev].sort((a, b) => (a.playedOn < b.playedOn ? 1 : -1)),
        );
        toast("직관 기록을 저장했어요");
        return true;
      } catch (error) {
        toast(errorMessage(error));
        return false;
      }
    },
    [repo, ensureCanWrite, toast],
  );

  const deleteGame = useCallback(
    async (gameId: string) => {
      if (!repo) return;
      try {
        await repo.deleteGame(gameId);
        setGames((prev) => prev.filter((game) => game.id !== gameId));
        toast("직관 기록을 삭제했어요");
      } catch (error) {
        toast(errorMessage(error));
      }
    },
    [repo, toast],
  );

  /* ── 10. 직관러 맛집 · 주차 팁 ─────────────────────────────── */
  const addUserFood = useCallback(
    async (input: NewUserFoodInput) => {
      if (!repo) return false;
      if (!ensureCanWrite("맛집을 추가하")) return false;
      try {
        const food = await repo.createUserFood(input, author);
        setUserFoods((prev) => [food, ...prev]);
        toast("직관러 맛집에 등록했어요");
        return true;
      } catch (error) {
        toast(errorMessage(error));
        return false;
      }
    },
    [repo, ensureCanWrite, author, toast],
  );

  const deleteUserFood = useCallback(
    async (foodId: string) => {
      if (!repo) return;
      try {
        await repo.deleteUserFood(foodId);
        setUserFoods((prev) => prev.filter((food) => food.id !== foodId));
        toast("맛집을 삭제했어요");
      } catch (error) {
        toast(errorMessage(error));
      }
    },
    [repo, toast],
  );

  const addUserParking = useCallback(
    async (input: NewUserParkingInput) => {
      if (!repo) return false;
      if (!ensureCanWrite("주차 팁을 추가하")) return false;
      try {
        const parking = await repo.createUserParking(input, author);
        setUserParkings((prev) => [parking, ...prev]);
        toast("직관러 주차 팁에 등록했어요");
        return true;
      } catch (error) {
        toast(errorMessage(error));
        return false;
      }
    },
    [repo, ensureCanWrite, author, toast],
  );

  const deleteUserParking = useCallback(
    async (parkingId: string) => {
      if (!repo) return;
      try {
        await repo.deleteUserParking(parkingId);
        setUserParkings((prev) => prev.filter((parking) => parking.id !== parkingId));
        toast("주차 팁을 삭제했어요");
      } catch (error) {
        toast(errorMessage(error));
      }
    },
    [repo, toast],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      ready,
      loadError,
      repoMode: repo?.mode ?? "demo",
      user,
      profile,
      signingIn,
      authPrompt,
      closeAuthPrompt: () => setAuthPrompt({ open: false, reason: "" }),
      zones,
      foods,
      posts,
      reviews,
      games,
      saves,
      commentsByPost,
      commentsLoaded,
      userFoods,
      userParkings,
      signInWithGoogle,
      signOut,
      updateProfile,
      createPost,
      deletePost,
      toggleLike,
      loadComments,
      addComment,
      deleteComment,
      createReview,
      deleteReview,
      toggleSaveZone,
      toggleSaveFood,
      addGame,
      deleteGame,
      addUserFood,
      deleteUserFood,
      addUserParking,
      deleteUserParking,
      reload,
    }),
    [
      ready,
      loadError,
      repo,
      user,
      profile,
      signingIn,
      authPrompt,
      zones,
      foods,
      posts,
      reviews,
      games,
      saves,
      commentsByPost,
      commentsLoaded,
      userFoods,
      userParkings,
      signInWithGoogle,
      signOut,
      updateProfile,
      createPost,
      deletePost,
      toggleLike,
      loadComments,
      addComment,
      deleteComment,
      createReview,
      deleteReview,
      toggleSaveZone,
      toggleSaveFood,
      addGame,
      deleteGame,
      addUserFood,
      deleteUserFood,
      addUserParking,
      deleteUserParking,
      reload,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
