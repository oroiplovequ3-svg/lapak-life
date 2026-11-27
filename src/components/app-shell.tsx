"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { ComposeSheet } from "@/components/compose-sheet";
import { GameSheet } from "@/components/game-sheet";
import { Icon, type IconName } from "@/components/icons";
import { LoginPromptSheet } from "@/components/login-prompt-sheet";
import { useApp } from "@/components/providers/app-provider";
import { ReviewSheet } from "@/components/review-sheet";
import { SearchSheet } from "@/components/search-sheet";
import { SettingsSheet } from "@/components/settings-sheet";
import { FoodScreen } from "@/components/screens/food-screen";
import { HomeScreen } from "@/components/screens/home-screen";
import { MyScreen } from "@/components/screens/my-screen";
import { SeatScreen } from "@/components/screens/seat-screen";
import type { FoodFocus, FoodFocusKind, Game, Report, ReportTargetPreview } from "@/lib/types";
import {
  DEFAULT_FOOD_LINK,
  buildAppSearch,
  foodLinkKey,
  readAppUrl,
  type AppTab,
  type FoodLink,
} from "@/lib/url-state";

type Tab = AppTab;

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "라팍톡", icon: "home" },
  { id: "seat", label: "좌석 시야", icon: "seat" },
  { id: "food", label: "맛집·주차", icon: "food" },
  { id: "my", label: "내 직관", icon: "my" },
];

const TITLES: Record<Tab, string> = {
  home: "인블루",
  seat: "좌석 시야",
  food: "맛집·주차",
  my: "내 직관",
};

const SUBS: Record<Tab, string> = {
  home: "삼성 라이온즈 팬 커뮤니티 · INBLUE",
  seat: "구역별 시야와 직관 후기",
  food: "라팍 먹거리와 주차·교통",
  my: "직관 기록과 저장한 것들",
};

/** '전체 구역'에서 후기를 쓸 때 미리 골라 둘 기본 구역 (홈 응원 3루 테이블) */
const DEFAULT_REVIEW_ZONE = "T3";

/** 딥링크(?tab=food&userFood=…)로 들어왔을 때 그 카드로 스크롤할 목표 */
function focusFromFoodLink(link: FoodLink): FoodFocus | null {
  const nonce = Date.now();
  if (link.seg === "parking") {
    if (link.parking) return { kind: "user-parking", id: link.parking, nonce };
    if (link.guide) return { kind: "parking-guide", id: link.guide, nonce };
    return null;
  }
  if (link.userFood) return { kind: "user-food", id: link.userFood, nonce };
  if (link.food) return { kind: "stadium", id: link.food, nonce };
  return null;
}

export function AppShell() {
  const { isAdmin, posts } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [composeOpen, setComposeOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewZone, setReviewZone] = useState<string>(DEFAULT_REVIEW_ZONE);
  const [gameOpen, setGameOpen] = useState(false);
  /** 수정 중인 직관 기록 (있으면 기록 시트를 수정 모드로 엽니다) */
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 좌석 시야 탭에서 지금 고른 구역 (검색에서도 같은 상태를 씁니다)
  const [seatZone, setSeatZone] = useState<string>("all");
  const [seatFocusNonce, setSeatFocusNonce] = useState(0);
  const [foodFocus, setFoodFocus] = useState<FoodFocus | null>(null);
  // 맛집·주차 화면의 지금 상태 (주소창 ?tab=food&… 와 같은 값)
  const [foodLink, setFoodLink] = useState<FoodLink>(DEFAULT_FOOD_LINK);
  /** 탭을 옮길 때만 히스토리에 쌓고, 같은 화면 안의 선택은 주소만 바꿉니다. */
  const pushHistory = useRef(false);

  const scrollScreenTop = () => {
    document.getElementById("screen")?.scrollTo({ top: 0 });
  };

  /* 주소창 → 화면. 딥링크로 바로 들어오거나 브라우저 뒤로가기(popstate)를 눌렀을 때. */
  useEffect(() => {
    const apply = () => {
      const next = readAppUrl(window.location.search);
      setTab(next.tab);
      setSeatZone(next.zone);
      setHighlightId(next.post);
      setFoodLink((current) =>
        foodLinkKey(current) === foodLinkKey(next.food) ? current : next.food,
      );
      if (next.tab === "food") {
        const focus = focusFromFoodLink(next.food);
        if (focus) setFoodFocus(focus);
      }
      pushHistory.current = false;
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  /* 화면 → 주소창. 탭 이동은 뒤로가기로 돌아올 수 있게 push, 구역·매장 선택은 replace. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = `${window.location.pathname}${buildAppSearch({
      tab,
      zone: seatZone,
      post: highlightId,
      food: foodLink,
    })}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (target === current) {
      pushHistory.current = false;
      return;
    }
    if (pushHistory.current) {
      window.history.pushState(null, "", target);
    } else {
      window.history.replaceState(null, "", target);
    }
    pushHistory.current = false;
  }, [tab, seatZone, foodLink, highlightId]);

  /** 하단 탭 이동 — 이전 탭에서 내려둔 스크롤 위치를 이어받지 않도록 맨 위로 올립니다. */
  const goTab = (next: Tab) => {
    pushHistory.current = next !== tab;
    setTab(next);
    scrollScreenTop();
  };

  useEffect(() => {
    if (!highlightId || tab !== "home") return;
    const timer = window.setTimeout(() => {
      document
        .querySelector(`[data-post-id="${highlightId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [highlightId, tab, posts.length]);

  const openMyPost = (postId: string) => {
    pushHistory.current = tab !== "home" || highlightId !== postId;
    setHighlightId(postId);
    setTab("home");
    window.setTimeout(() => {
      document
        .querySelector(`[data-post-id="${postId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 220);
  };

  /* 검색 결과에서 바로 이동 */
  const openZoneFromSearch = (zoneCode: string) => {
    pushHistory.current = tab !== "seat";
    setSeatZone(zoneCode);
    setSeatFocusNonce((value) => value + 1);
    setTab("seat");
    scrollScreenTop();
  };

  const openFoodFromSearch = (kind: FoodFocusKind, id: string) => {
    const nonce = Date.now();
    pushHistory.current = tab !== "food";
    setFoodFocus({ kind, id, nonce });
    setFoodLink((current) => ({
      ...current,
      seg: kind === "user-parking" || kind === "parking-guide" ? "parking" : "food",
      ftab: kind === "user-food" ? "user" : kind === "stadium" ? "stadium" : current.ftab,
      filter: kind === "stadium" ? "all" : current.filter,
      food: kind === "stadium" ? id : null,
      userFood: kind === "user-food" ? id : null,
      parking: kind === "user-parking" ? id : null,
      guide: kind === "parking-guide" ? id : null,
    }));
    setTab("food");
    scrollScreenTop();
    // 잠시 뒤 목표를 비워, 탭을 다시 열 때 엉뚱한 곳으로 또 스크롤하지 않게 합니다.
    window.setTimeout(() => {
      setFoodFocus((current) => (current?.nonce === nonce ? null : current));
    }, 1000);
  };

  /** 설정 → 신고 관리에서 '대상 보기' — 글·후기·맛집·주차 팁으로 바로 이동합니다. */
  const openReportTarget = (
    report: Report,
    preview: ReportTargetPreview | null,
  ) => {
    setSettingsOpen(false);
    switch (report.targetType) {
      case "post":
        openMyPost(report.targetId);
        break;
      case "comment":
        if (preview?.postId) openMyPost(preview.postId);
        break;
      case "review":
        if (preview?.zoneCode) {
          pushHistory.current = tab !== "seat";
          setSeatZone(preview.zoneCode);
          setSeatFocusNonce((value) => value + 1);
        }
        setTab("seat");
        scrollScreenTop();
        break;
      case "user_food":
        openFoodFromSearch("user-food", report.targetId);
        break;
      case "user_food_comment":
        if (preview?.foodId) openFoodFromSearch("user-food", preview.foodId);
        break;
      case "user_parking":
        openFoodFromSearch("user-parking", report.targetId);
        break;
    }
  };

  return (
    <div className="device relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-canvas">
      {/* 상단 앱바 */}
      <header className="z-20 flex flex-none items-center gap-2.5 border-b border-transparent bg-white/[.94] px-4 pb-[11px] pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/images/lapak-mascot-badge.png"
            alt=""
            aria-hidden
            width={72}
            height={72}
            priority
            className="h-[36px] w-[36px] flex-none rounded-full border-[1.5px] border-brand-100 bg-brand-50 object-cover shadow-[0_2px_8px_rgba(7,76,161,.24)]"
          />
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold leading-[1.15] tracking-tight3">
                {TITLES[tab]}
              </span>
              {isAdmin ? (
                <span className="rounded-[6px] bg-[#0F172A] px-[5px] py-[2px] text-[8.5px] font-extrabold leading-none tracking-[.12em] text-[#FFD77A]">
                  MASTER
                </span>
              ) : null}
            </div>
            <span className="mt-0.5 text-[10.5px] font-semibold tracking-tight text-ink-faint">
              {SUBS[tab]}
            </span>
          </div>
        </div>
        <div className="ml-auto flex gap-0.5">
          {tab === "home" ? (
            <button
              type="button"
              aria-label="검색"
              onClick={() => setSearchOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl text-[#475467] transition active:bg-[#F3F5F9]"
            >
              <Icon name="search" />
            </button>
          ) : null}
          {tab === "seat" ? (
            <button
              type="button"
              aria-label="직관 시야 후기 작성"
              onClick={() => {
                // 지금 보고 있는 구역을 그대로 후기 구역으로 이어받습니다.
                setReviewZone(seatZone === "all" ? DEFAULT_REVIEW_ZONE : seatZone);
                setReviewOpen(true);
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-[#475467]"
            >
              <Icon name="plus" />
            </button>
          ) : null}
          {tab === "my" ? (
            <button
              type="button"
              aria-label="설정"
              onClick={() => setSettingsOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl text-[#475467] transition active:bg-[#F3F5F9]"
            >
              <Icon name="gear" size={20} strokeWidth={1.7} />
            </button>
          ) : null}
        </div>
      </header>

      {/* 스크린 */}
      <main id="screen" className="flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tab === "home" ? (
          <HomeScreen
            onCompose={() => setComposeOpen(true)}
            highlightedPostId={highlightId}
            onGoSeat={() => goTab("seat")}
            onGoFood={() => goTab("food")}
          />
        ) : null}
        {tab === "seat" ? (
          <SeatScreen
            selectedZone={seatZone}
            onSelectZone={setSeatZone}
            focusNonce={seatFocusNonce}
            onWriteReview={(zoneCode) => {
              setReviewZone(zoneCode);
              setReviewOpen(true);
            }}
          />
        ) : null}
        {tab === "food" ? (
          <FoodScreen
            focus={foodFocus}
            link={foodLink}
            onLinkChange={(next) =>
              setFoodLink((current) =>
                foodLinkKey(current) === foodLinkKey(next) ? current : next,
              )
            }
          />
        ) : null}
        {tab === "my" ? (
          <MyScreen
            onOpenPost={openMyPost}
            onCompose={() => setComposeOpen(true)}
            onAddGame={() => setGameOpen(true)}
            onEditGame={(game) => setEditingGame(game)}
          />
        ) : null}
      </main>

      {/* 하단 탭바 */}
      <nav className="z-20 flex flex-none items-stretch border-t border-line bg-white/[.97] px-1.5 pb-[calc(5px+env(safe-area-inset-bottom))] pt-[5px] backdrop-blur">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTab(item.id)}
            aria-current={tab === item.id ? "page" : "false"}
            className={`flex flex-1 flex-col items-center gap-0.5 border-none bg-transparent py-1 pb-[3px] text-[10.5px] font-extrabold tracking-tight2 ${
              tab === item.id ? "text-brand" : "text-[#98A2B3]"
            }`}
          >
            <span
              className={`grid h-[26px] w-[38px] place-items-center rounded-[9px] transition-colors ${
                tab === item.id ? "bg-brand-50" : ""
              }`}
            >
              <Icon name={item.icon} size={21} strokeWidth={tab === item.id ? 2.2 : 1.85} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <ComposeSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPosted={() => {
          setHighlightId(null);
          setTab("home");
        }}
      />
      <ReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        initialZone={reviewZone}
        onPosted={(zone) => setReviewZone(zone)}
      />
      <GameSheet
        open={gameOpen || Boolean(editingGame)}
        onClose={() => {
          setGameOpen(false);
          setEditingGame(null);
        }}
        editing={editingGame}
      />
      <SearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenPost={openMyPost}
        onOpenZone={openZoneFromSearch}
        onOpenFood={openFoodFromSearch}
      />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenReportTarget={openReportTarget}
      />
      <LoginPromptSheet />
    </div>
  );
}
