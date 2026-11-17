"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import {
  PhotoLightbox,
  PhotoTiles,
  type PhotoLightboxState,
} from "@/components/photo-gallery";
import { useApp } from "@/components/providers/app-provider";
import { categoryOf } from "@/lib/data/categories";
import { FOOD_BY_ID } from "@/lib/data/foods";
import { ZONE_BY_CODE } from "@/lib/data/zones";
import { formatDotDate, formatRelativeTime, initialOf } from "@/lib/utils";

interface MyScreenProps {
  onOpenPost?: (postId: string) => void;
  onCompose?: () => void;
  onAddGame?: () => void;
}

export function MyScreen({ onOpenPost, onCompose, onAddGame }: MyScreenProps) {
  const {
    user,
    configured,
    signInWithKakao,
    signOut,
    signingIn,
    games,
    saves,
    posts,
    deleteGame,
    ready,
    toggleSaveZone,
    toggleSaveFood,
  } = useApp();

  const [lightbox, setLightbox] = useState<PhotoLightboxState | null>(null);

  const myPosts = useMemo(() => posts.filter((post) => post.mine), [posts]);

  const summary = useMemo(() => {
    const win = games.filter((game) => game.scoreFor > game.scoreAgainst).length;
    const lose = games.filter((game) => game.scoreFor < game.scoreAgainst).length;
    const draw = games.length - win - lose;
    const total = games.length;
    const rate = total ? Math.round((win / total) * 1000) / 10 : 0;
    const avgFor = total
      ? Math.round((games.reduce((sum, game) => sum + game.scoreFor, 0) / total) * 10) / 10
      : 0;
    const avgAgainst = total
      ? Math.round((games.reduce((sum, game) => sum + game.scoreAgainst, 0) / total) * 10) / 10
      : 0;
    const zoneCounts: Record<string, number> = {};
    for (const game of games) {
      if (game.zoneCode) zoneCounts[game.zoneCode] = (zoneCounts[game.zoneCode] ?? 0) + 1;
    }
    const topZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0];
    return { win, lose, draw, total, rate, avgFor, avgAgainst, topZone: topZone?.[0] ?? null };
  }, [games]);

  const savedZones = saves.zones.map((code) => ZONE_BY_CODE[code]).filter(Boolean);
  const savedFoods = saves.foods.map((id) => FOOD_BY_ID[id]).filter(Boolean);

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-[30px] pt-3.5">
      <section className="rounded-md2 border border-line bg-white p-3.5 shadow-card">
        {configured && user ? (
          <div className="flex items-center gap-3">
            <div className="grid h-[54px] w-[54px] flex-none place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand text-xl font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(7,76,161,.7)]">
              {initialOf(user.nickname)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-extrabold tracking-tight3">{user.nickname}</div>
              <div className="mt-[3px] text-[11.5px] font-semibold text-ink-faint">
                {user.email ?? "카카오 로그인"} · 삼성 라이온즈 팬
              </div>
              <div className="mt-[7px] flex gap-1.5">
                <span className="rounded-md bg-brand-50 px-[7px] py-[2.5px] text-[10px] font-extrabold text-brand-600">
                  직관러
                </span>
                <span className="rounded-md bg-brand-50 px-[7px] py-[2.5px] text-[10px] font-extrabold text-brand-600">
                  직관 {games.length}회
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex-none rounded-[11px] bg-[#F3F5F9] px-3 py-2 text-[11.5px] font-bold text-ink-muted"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2.5">
            <div className="flex items-center gap-3">
              <div className="grid h-[54px] w-[54px] flex-none place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand text-xl font-extrabold text-white shadow-[0_6px_16px_-6px_rgba(7,76,161,.7)]">
                🦁
              </div>
              <div>
                <div className="text-[17px] font-extrabold tracking-tight3">게스트</div>
                <div className="mt-[3px] text-[11.5px] font-semibold text-ink-faint">
                  {configured
                    ? "로그인하면 기록·저장이 계정에 저장돼요"
                    : "데모 모드 · 이 브라우저에만 저장돼요"}
                </div>
              </div>
            </div>
            {configured ? (
              <button
                type="button"
                onClick={() => void signInWithKakao()}
                disabled={signingIn}
                className="flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#FEE500] px-4 py-3 text-[13.5px] font-extrabold text-[#191919] disabled:opacity-60"
              >
                <Icon name="kakao" size={18} filled strokeWidth={0} />
                {signingIn ? "카카오로 이동 중…" : "카카오로 시작하기"}
              </button>
            ) : (
              <p className="rounded-[11px] bg-brand-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
                지금은 데모 모드예요. Supabase를 연결하면(SETUP.md 1~2단계) 카카오 로그인이
                활성화됩니다.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-lg2 bg-gradient-to-br from-[#0B4E9B] via-brand-600 to-[#2A7BE4] px-[17px] py-[17px] text-white shadow-[0_12px_26px_-12px_rgba(7,76,161,.7)]">
        <div className="pointer-events-none absolute -right-[46px] -top-[52px] h-[160px] w-[160px] rounded-full bg-white/[.07]" />
        <div className="relative flex items-center justify-between">
          <span className="text-[11.5px] font-extrabold text-white/80">내 직관 성적</span>
          {!configured ? (
            <span className="rounded-md bg-white/[.16] px-1.5 py-0.5 text-[9.5px] font-extrabold text-white/90">
              샘플 데이터
            </span>
          ) : null}
        </div>
        <div className="relative mt-2.5 flex items-end gap-2">
          <span className="text-[30px] font-extrabold leading-none tracking-tight3">
            {summary.total}
            <small className="ml-0.5 text-sm font-extrabold opacity-70">경기</small>
          </span>
          <span className="pb-[3px] text-[11.5px] font-bold text-white/70">
            {summary.win}승 {summary.lose}패
            {summary.draw ? ` ${summary.draw}무` : ""} · 승률{" "}
            {(summary.rate / 100).toFixed(3).replace("0.", ".")}
          </span>
        </div>
        <div className="relative mt-3.5 h-[7px] overflow-hidden rounded-full bg-white/20">
          <i
            className="block h-full rounded-full bg-gradient-to-r from-white to-[#BFDCFF]"
            style={{ width: `${summary.rate}%` }}
          />
        </div>
        <div className="relative mt-2.5 flex justify-between gap-2 text-[11px] font-bold text-white/80">
          <span>평균 득점 {summary.avgFor || "-"}</span>
          <span>평균 실점 {summary.avgAgainst || "-"}</span>
          <span>
            최다 구역{" "}
            {summary.topZone ? (ZONE_BY_CODE[summary.topZone]?.short ?? summary.topZone) : "-"}
          </span>
        </div>
      </section>

      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[15.5px] font-extrabold tracking-tight2">최근 직관 기록</h2>
        <button
          type="button"
          onClick={onAddGame}
          className="rounded-lg px-1 py-1 text-xs font-extrabold text-brand-600"
        >
          + 기록 추가
        </button>
      </div>
      <section className="rounded-md2 border border-line bg-white px-3.5 py-1.5 shadow-card">
        {games.length ? (
          games.map((game) => {
            const result = game.scoreFor > game.scoreAgainst ? "W" : game.scoreFor < game.scoreAgainst ? "L" : "D";
            return (
              <div
                key={game.id}
                className="border-b border-line-soft py-[11px] last:border-none"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`grid h-6 w-6 flex-none place-items-center rounded-lg text-[11px] font-extrabold ${
                      result === "W"
                        ? "bg-[#ECFDF3] text-[#039855]"
                        : result === "L"
                          ? "bg-[#FEF3F2] text-[#B42318]"
                          : "bg-[#FFFAEB] text-[#B54708]"
                    }`}
                  >
                    {result === "W" ? "승" : result === "L" ? "패" : "무"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-extrabold tracking-tight">
                      {formatDotDate(game.playedOn)} vs {game.opponent}
                      {game.homeAway === "away" ? " (원정)" : ""}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-ink-faint">
                      {game.zoneCode ? (ZONE_BY_CODE[game.zoneCode]?.short ?? game.zoneCode) : "-"}
                      {game.note ? ` · ${game.note}` : ""}
                    </div>
                  </div>
                  <span className="text-[13px] font-extrabold tracking-tight text-ink-2">
                    {game.scoreFor} : {game.scoreAgainst}
                  </span>
                  <button
                    type="button"
                    aria-label="기록 삭제"
                    onClick={() => void deleteGame(game.id)}
                    className="flex-none rounded-lg p-1.5 text-[#C4CBD6]"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
                <PhotoTiles
                  urls={game.photoUrls ?? []}
                  onOpen={(index) => setLightbox({ urls: game.photoUrls, index })}
                  singleHeight={150}
                  label="직관 기록 사진"
                />
              </div>
            );
          })
        ) : (
          <div className="px-1 py-4 text-center text-[11.5px] text-ink-faint">
            {ready ? "직관 기록을 추가해 보세요." : "불러오는 중…"}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[15.5px] font-extrabold tracking-tight2">저장한 좌석·맛집</h2>
        <span className="text-xs font-bold text-ink-faint">{savedZones.length + savedFoods.length}</span>
      </div>
      <section className="rounded-md2 border border-line bg-white px-3.5 py-1.5 shadow-card">
        {savedZones.length ? (
          <>
            <div className="py-2 text-[11.5px] font-extrabold text-ink-faint">좌석 구역</div>
            {savedZones.map((zone) => (
              <div
                key={zone.code}
                className="flex items-center gap-2 border-b border-line-soft py-2.5 last:border-none"
              >
                <div className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] bg-[#F5F7FA] text-sm">
                  {zone.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-extrabold tracking-tight">{zone.name}</div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-ink-faint">{zone.price}</div>
                </div>
                <button
                  type="button"
                  aria-label="저장 해제"
                  onClick={() => void toggleSaveZone(zone.code)}
                  className="rounded-lg p-1 text-[#C4CBD6]"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        ) : null}
        {savedFoods.length ? (
          <>
            <div className="py-2 pt-3 text-[11.5px] font-extrabold text-ink-faint">맛집</div>
            {savedFoods.map((food) => (
              <div
                key={food.id}
                className="flex items-center gap-2 border-b border-line-soft py-2.5 last:border-none"
              >
                <div className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] bg-[#F5F7FA] text-sm">
                  {food.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-extrabold tracking-tight">{food.name}</div>
                  <div className="mt-0.5 text-[10.5px] font-semibold text-ink-faint">{food.loc}</div>
                </div>
                <button
                  type="button"
                  aria-label="저장 해제"
                  onClick={() => void toggleSaveFood(food.id)}
                  className="rounded-lg p-1 text-[#C4CBD6]"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        ) : null}
        {savedZones.length + savedFoods.length === 0 ? (
          <div className="px-1 py-4 text-center">
            <div className="text-[22px]">🔖</div>
            <p className="mt-1 text-[13px] font-extrabold text-ink-2">저장한 항목이 없어요</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
              좌석 시야에서 구역을, 맛집에서 가게를 저장해 보세요.
            </p>
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[15.5px] font-extrabold tracking-tight2">내가 쓴 글</h2>
        <span className="text-xs font-bold text-ink-faint">{myPosts.length}</span>
      </div>
      {myPosts.length ? (
        <div className="flex flex-col gap-2">
          {myPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => onOpenPost?.(post.id)}
              className="cursor-pointer rounded-[13px] border border-line bg-white px-3 py-[11px]"
            >
              <div className="text-[12.5px] font-extrabold text-brand-600">
                {categoryOf(post.category).label}
              </div>
              <p className="mt-[5px] line-clamp-2 break-keep text-[13px] leading-relaxed text-[#1D2939]">
                {post.body}
              </p>
              <div className="mt-[7px] text-[10.5px] font-semibold text-ink-faint">
                {formatRelativeTime(post.createdAt)} · 좋아요 {post.likeCount} · 댓글 {post.commentCount}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-md2 border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[22px] text-center">
          <div className="mb-[7px] text-[26px]">✍️</div>
          <p className="text-[13px] font-extrabold text-ink-2">아직 쓴 글이 없어요</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
            라팍톡에서 첫 직관 후기를 남겨보세요.
            <br />
            여기에 그대로 모입니다.
          </p>
          <button
            type="button"
            onClick={onCompose}
            className="mt-3 rounded-[13px] bg-brand px-[18px] py-2.5 text-[13px] font-extrabold text-white shadow-brand"
          >
            첫 글 쓰기
          </button>
        </div>
      )}

      <p className="break-keep px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
        직관 성적은 이 앱에 저장한 기록만 계산됩니다.
      </p>

      {lightbox ? (
        <PhotoLightbox
          state={lightbox}
          onClose={() => setLightbox(null)}
          onPick={(index) => setLightbox({ ...lightbox, index })}
          label="직관 기록 사진"
        />
      ) : null}
    </div>
  );
}
