"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { Sheet } from "@/components/sheet";
import { categoryOf } from "@/lib/data/categories";
import { PARKING } from "@/lib/data/parking";
import { ZONE_GROUPS, zoneGroupOf } from "@/lib/data/zones";
import type { FoodFocusKind } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

/** 검색어가 비어 있을 때 한 번만 눌러도 바로 찾아지는 추천 검색어 */
const SUGGESTIONS = ["3루 테이블", "블루존", "치킨", "주차"];

/** 한 묶음에서 처음 보여 주는 결과 수 (나머지는 검색어를 좁히도록 안내) */
const PER_GROUP = 5;

function tokensOf(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

/** 검색어를 공백 단위로 나눠, 모든 조각이 들어 있는 항목만 남깁니다. */
function matches(haystack: string, tokens: string[]): boolean {
  const text = haystack.toLowerCase();
  return tokens.every((token) => text.includes(token));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 결과 안에서 검색어를 노랗게 표시 */
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (!tokens.length) return <>{text}</>;
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-[3px] bg-[#FFF0B8] px-[1px] text-inherit">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function Group({
  label,
  total,
  shown,
  children,
}: {
  label: string;
  total: number;
  shown: number;
  children: ReactNode;
}) {
  if (!total) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 px-0.5 pt-0.5">
        <span className="text-[11px] font-extrabold tracking-tight2 text-ink-2">{label}</span>
        <span className="text-[10px] font-extrabold text-ink-faint">{total}</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>
      {children}
      {total > shown ? (
        <p className="px-1 text-[10px] font-semibold text-[#AEB6C2]">
          외 {total - shown}건 · 검색어를 좁히면 더 정확해져요
        </p>
      ) : null}
    </div>
  );
}

function ResultRow({
  emoji,
  title,
  sub,
  badge,
  tokens,
  onClick,
}: {
  emoji: string;
  title: string;
  sub: string;
  badge?: string;
  tokens: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-[12px] border border-line-soft bg-white px-2.5 py-2.5 text-left transition active:scale-[.99]"
    >
      <span className="grid h-[32px] w-[32px] flex-none place-items-center rounded-[10px] bg-[#F3F6FB] text-[15px]">
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-[13px] font-extrabold tracking-tight2 text-ink">
            <Highlight text={title} tokens={tokens} />
          </span>
          {badge ? (
            <span className="flex-none rounded-md bg-brand-50 px-1.5 py-[1px] text-[9.5px] font-extrabold text-brand-600">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-[2px] block truncate text-[11px] font-semibold text-ink-faint">
          <Highlight text={sub} tokens={tokens} />
        </span>
      </span>
      <Icon name="chevron" size={12} strokeWidth={2.6} className="flex-none text-[#C4CBD6]" />
    </button>
  );
}

interface SearchSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenPost: (postId: string) => void;
  onOpenZone: (zoneCode: string) => void;
  onOpenFood: (kind: FoodFocusKind, id: string) => void;
}

/**
 * 통합 검색 — 라팍톡 글, 좌석 구역, 먹거리·맛집, 주차·교통을 한 번에 찾습니다.
 * 지금 화면에 로드된 데이터에서 실시간으로 걸러 냅니다.
 */
export function SearchSheet({ open, onClose, onOpenPost, onOpenZone, onOpenFood }: SearchSheetProps) {
  const { posts, zones, foods, userFoods, userParkings } = useApp();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 열 때마다 새 검색을 시작하고, 키보드가 올라오도록 입력창에 포커스를 줍니다.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 240);
    return () => window.clearTimeout(timer);
  }, [open]);

  const tokens = useMemo(() => tokensOf(query), [query]);

  const found = useMemo(() => {
    if (!tokens.length) return null;

    const groupText = (code: string) => {
      const group = ZONE_GROUPS.find((item) => item.id === zoneGroupOf(code));
      return group ? `${group.label} ${group.hint}` : "";
    };

    const zoneHits = zones.filter((zone) =>
      matches(
        [
          zone.name,
          zone.short,
          zone.sub ?? "",
          zone.side,
          zone.grade,
          zone.price,
          zone.dist,
          zone.block,
          zone.roof,
          zone.sun,
          zone.rain,
          zone.cheer,
          zone.good,
          zone.tip,
          groupText(zone.code),
        ].join(" "),
        tokens,
      ),
    );

    const postHits = posts.filter((post) => {
      const zone = post.seatZone ? zones.find((item) => item.code === post.seatZone) : null;
      return matches(
        [
          post.body,
          post.nickname,
          post.seatDetail ?? "",
          zone?.name ?? "",
          zone?.short ?? "",
          categoryOf(post.category).label,
        ].join(" "),
        tokens,
      );
    });

    const foodHits = foods.filter((food) =>
      matches([food.name, food.menu, food.loc, food.price, food.tip].join(" "), tokens),
    );

    const userFoodHits = userFoods.filter((food) =>
      matches([food.name, food.menu, food.tip, food.nickname].join(" "), tokens),
    );

    const parkingHits = PARKING.map((card, index) => ({ card, index })).filter(({ card }) =>
      matches(
        [card.title, card.sub, card.tip ?? "", card.warn ?? "", ...card.kvs.flat()].join(" "),
        tokens,
      ),
    );

    const userParkingHits = userParkings.filter((parking) =>
      matches(
        [parking.name, parking.location, parking.feeNote, parking.walkTime, parking.tip, parking.nickname].join(
          " ",
        ),
        tokens,
      ),
    );

    return { zoneHits, postHits, foodHits, userFoodHits, parkingHits, userParkingHits };
  }, [tokens, zones, posts, foods, userFoods, userParkings]);

  const total =
    (found?.zoneHits.length ?? 0) +
    (found?.postHits.length ?? 0) +
    (found?.foodHits.length ?? 0) +
    (found?.userFoodHits.length ?? 0) +
    (found?.parkingHits.length ?? 0) +
    (found?.userParkingHits.length ?? 0);

  const go = (run: () => void) => {
    onClose();
    run();
  };

  return (
    <Sheet open={open} title="검색" onClose={onClose}>
      {/* 검색창 */}
      <div className="flex items-center gap-2 rounded-[13px] border border-line bg-[#F7F9FC] px-3 py-[10px] transition focus-within:border-[#C7D7F0] focus-within:bg-white">
        <Icon name="search" size={17} className="flex-none text-ink-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="구역 · 매장 · 글 검색"
          aria-label="검색어"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] font-bold text-ink outline-none placeholder:font-semibold placeholder:text-[#AEB6C2]"
        />
        {query ? (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[#E4E7EC] text-[10px] text-white"
          >
            <Icon name="close" size={10} strokeWidth={3} />
          </button>
        ) : null}
      </div>

      {!tokens.length ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => setQuery(word)}
                className="rounded-full border border-line bg-white px-3 py-[7px] text-[11.5px] font-extrabold text-[#475467] transition active:scale-[.97]"
              >
                {word}
              </button>
            ))}
          </div>
          <div className="rounded-[13px] border border-line-soft bg-[#F8FAFD] px-3.5 py-3">
            <p className="text-[11.5px] font-extrabold text-ink-2">이런 걸 한 번에 찾아요</p>
            <div className="mt-1.5 flex flex-col gap-[5px] text-[11px] font-semibold text-ink-faint">
              <span>🪑 좌석 구역 — 구역명·층·시야 특징</span>
              <span>🍗 먹거리·맛집 — 매장명·메뉴·위치</span>
              <span>🚗 주차·교통 — 주차장·요금·도보 시간</span>
              <span>💬 라팍톡 — 글 내용·작성자·좌석</span>
            </div>
          </div>
        </>
      ) : total === 0 ? (
        <div className="rounded-[13px] border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[26px] text-center">
          <div className="mb-[7px] text-[24px]">🔍</div>
          <p className="text-[13px] font-extrabold text-ink-2">
            ‘{query.trim()}’에 맞는 결과가 없어요
          </p>
          <p className="mt-1 break-keep text-[11.5px] leading-relaxed text-ink-faint">
            구역은 ‘3루’, 매장은 ‘치킨’, 주차는 ‘주차장’처럼 짧게 넣어 보세요.
          </p>
        </div>
      ) : (
        <>
          <p className="px-0.5 text-[10.5px] font-bold text-ink-faint">결과 {total}건</p>

          <Group
            label="🪑 좌석 구역"
            total={found!.zoneHits.length}
            shown={Math.min(PER_GROUP, found!.zoneHits.length)}
          >
            {found!.zoneHits.slice(0, PER_GROUP).map((zone) => (
              <ResultRow
                key={zone.code}
                emoji={zone.emoji}
                title={zone.name}
                sub={`${zone.side} · ${zone.price}`}
                badge={zone.grade}
                tokens={tokens}
                onClick={() => go(() => onOpenZone(zone.code))}
              />
            ))}
          </Group>

          <Group
            label="🍗 먹거리·맛집"
            total={found!.foodHits.length + found!.userFoodHits.length}
            shown={Math.min(PER_GROUP, found!.foodHits.length + found!.userFoodHits.length)}
          >
            {found!.foodHits.slice(0, PER_GROUP).map((food) => (
              <ResultRow
                key={`stadium-${food.id}`}
                emoji={food.emoji}
                title={food.name}
                sub={`${food.loc} · ${food.price}`}
                badge={food.inStadium ? "구장 안" : "구장 밖"}
                tokens={tokens}
                onClick={() => go(() => onOpenFood("stadium", food.id))}
              />
            ))}
            {found!.userFoodHits
              .slice(0, Math.max(PER_GROUP - found!.foodHits.length, 0))
              .map((food) => (
                <ResultRow
                  key={`user-${food.id}`}
                  emoji="🦁"
                  title={food.name}
                  sub={[food.menu, food.nickname].filter(Boolean).join(" · ")}
                  badge="직관러"
                  tokens={tokens}
                  onClick={() => go(() => onOpenFood("user-food", food.id))}
                />
              ))}
          </Group>

          <Group
            label="🚗 주차·교통"
            total={found!.parkingHits.length + found!.userParkingHits.length}
            shown={Math.min(
              PER_GROUP,
              found!.parkingHits.length + found!.userParkingHits.length,
            )}
          >
            {found!.parkingHits.slice(0, PER_GROUP).map(({ card, index }) => (
              <ResultRow
                key={`guide-${index}`}
                emoji={card.ic}
                title={card.title}
                sub={card.sub}
                tokens={tokens}
                onClick={() => go(() => onOpenFood("parking-guide", String(index)))}
              />
            ))}
            {found!.userParkingHits
              .slice(0, Math.max(PER_GROUP - found!.parkingHits.length, 0))
              .map((parking) => (
                <ResultRow
                  key={`parking-${parking.id}`}
                  emoji="🅿️"
                  title={parking.name}
                  sub={[parking.location, parking.isFree ? "무료" : parking.feeNote]
                    .filter(Boolean)
                    .join(" · ")}
                  badge="직관러"
                  tokens={tokens}
                  onClick={() => go(() => onOpenFood("user-parking", parking.id))}
                />
              ))}
          </Group>

          <Group
            label="💬 라팍톡 글"
            total={found!.postHits.length}
            shown={Math.min(PER_GROUP, found!.postHits.length)}
          >
            {found!.postHits.slice(0, PER_GROUP).map((post) => (
              <ResultRow
                key={post.id}
                emoji="💬"
                title={post.body.split("\n")[0]}
                sub={[
                  post.nickname,
                  categoryOf(post.category).label,
                  formatRelativeTime(post.createdAt),
                ].join(" · ")}
                tokens={tokens}
                onClick={() => go(() => onOpenPost(post.id))}
              />
            ))}
          </Group>
        </>
      )}
    </Sheet>
  );
}
