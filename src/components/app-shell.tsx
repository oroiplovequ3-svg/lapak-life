"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
import type { FoodFocus, FoodFocusKind, Game } from "@/lib/types";

type Tab = "home" | "seat" | "food" | "my";

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

export function AppShell() {
  const { isAdmin, posts } = useApp();
  const [tab, setTab] = useState<Tab>("home");
  const [composeOpen, setComposeOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewZone, setReviewZone] = useState<string>("T3");
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

  const scrollScreenTop = () => {
    document.getElementById("screen")?.scrollTo({ top: 0 });
  };

  /** 하단 탭 이동 — 이전 탭에서 내려둔 스크롤 위치를 이어받지 않도록 맨 위로 올립니다. */
  const goTab = (next: Tab) => {
    setTab(next);
    scrollScreenTop();
  };

  /* 공유 링크(?post=글id)로 들어오면 그 글로 바로 이동합니다. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("post");
    if (!id) return;
    setHighlightId(id);
    setTab("home");
  }, []);

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
    setSeatZone(zoneCode);
    setSeatFocusNonce((value) => value + 1);
    setTab("seat");
    scrollScreenTop();
  };

  const openFoodFromSearch = (kind: FoodFocusKind, id: string) => {
    const nonce = Date.now();
    setFoodFocus({ kind, id, nonce });
    setTab("food");
    scrollScreenTop();
    // 잠시 뒤 목표를 비워, 탭을 다시 열 때 엉뚱한 곳으로 또 스크롤하지 않게 합니다.
    window.setTimeout(() => {
      setFoodFocus((current) => (current?.nonce === nonce ? null : current));
    }, 1000);
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
                setReviewZone("T3");
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
        {tab === "food" ? <FoodScreen focus={foodFocus} /> : null}
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
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <LoginPromptSheet />
    </div>
  );
}
