"use client";

import { useMemo, useState } from "react";

import { Icon, Stars } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { SeatMap } from "@/components/seat-map";
import {
  ZONE_BY_CODE,
  ZONE_GROUPS,
  zoneFamily,
  zoneFullName,
  zoneGroupOf,
  zoneSubtitle,
  type ZoneGroupId,
} from "@/lib/data/zones";
import { formatRelativeTime, initialOf } from "@/lib/utils";

const ALL_CODES = ZONE_GROUPS.flatMap((group) => group.codes);

interface LightboxState {
  urls: string[];
  index: number;
}

/** 후기 카드 안의 첨부 사진 — 1장은 크게, 2~3장은 정사각 그리드 */
function ReviewPhotos({ urls, onOpen }: { urls: string[]; onOpen: (index: number) => void }) {
  if (!urls.length) return null;

  if (urls.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen(0)}
        aria-label="첨부 사진 크게 보기"
        className="mt-2.5 block w-full overflow-hidden rounded-[12px] border border-line bg-[#F5F7FA] active:opacity-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[0]}
          alt="후기 첨부 사진"
          loading="lazy"
          className="h-[170px] w-full object-cover"
        />
      </button>
    );
  }

  return (
    <div className={`mt-2.5 grid gap-1.5 ${urls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {urls.map((url, index) => (
        <button
          key={`${index}-${url.slice(-12)}`}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={`첨부 사진 ${index + 1} 크게 보기`}
          className="aspect-square overflow-hidden rounded-[11px] border border-line bg-[#F5F7FA] active:opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`후기 첨부 사진 ${index + 1}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}

function PhotoLightbox({ state, onClose, onPick }: { state: LightboxState; onClose: () => void; onPick: (index: number) => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="후기 사진 크게 보기"
      className="animate-fadeIn fixed inset-0 z-[60] mx-auto flex w-full max-w-[430px] flex-col bg-black/95"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[calc(12px+env(safe-area-inset-top))] text-white">
        <span className="text-[11.5px] font-extrabold tracking-tight2 text-white/70">
          {state.index + 1} / {state.urls.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="사진 닫기"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[.12] text-white"
        >
          <Icon name="close" size={16} strokeWidth={2.4} />
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="사진 닫기"
        className="flex flex-1 items-center justify-center px-3 pb-3"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.urls[state.index]}
          alt="후기 사진"
          className="max-h-full w-full rounded-[14px] object-contain"
        />
      </button>

      {state.urls.length > 1 ? (
        <div className="flex items-center justify-center gap-2 pb-[calc(18px+env(safe-area-inset-bottom))]">
          {state.urls.map((url, index) => (
            <button
              key={`${index}-${url.slice(-12)}`}
              type="button"
              onClick={() => onPick(index)}
              aria-label={`${index + 1}번째 사진 보기`}
              className={`h-1.5 rounded-full transition-all ${
                index === state.index ? "w-5 bg-white" : "w-1.5 bg-white/[.38]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SeatScreen() {
  const { zones, reviews, saves, toggleSaveZone } = useApp();
  const [selected, setSelected] = useState<string>("all");
  const [group, setGroup] = useState<ZoneGroupId>("all");
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const zone =
    selected === "all" ? null : zones.find((z) => z.code === selected) ?? ZONE_BY_CODE[selected];
  const filteredReviews = useMemo(
    () => (selected === "all" ? reviews : reviews.filter((r) => r.zoneCode === selected)),
    [reviews, selected],
  );
  const zoneName = selected === "all" ? "전체 구역" : zone?.short ?? selected;
  const visibleCodes = group === "all" ? ALL_CODES : ZONE_GROUPS.find((g) => g.id === group)?.codes ?? ALL_CODES;
  const family = zoneFamily(zone?.code);

  function pick(code: string) {
    setSelected(code);
  }

  function pickFromMap(code: string) {
    setSelected(code);
    setGroup(zoneGroupOf(code));
  }

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-[30px] pt-3.5">
      <section className="rounded-md2 border border-line bg-gradient-to-b from-white to-[#F8FAFD] px-2.5 pb-3 pt-2.5 shadow-card">
        <div className="flex items-center justify-between gap-2 px-1 pb-2">
          <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[12.5px] font-extrabold text-ink-2">
            <Icon name="seat" size={15} strokeWidth={2} />
            라이온즈파크 좌석배치도
          </span>
          <span className="flex-none whitespace-nowrap rounded-lg bg-brand-50 px-2 py-[3px] text-[11px] font-extrabold text-brand-600">
            {zoneName}
          </span>
        </div>
        <SeatMap selected={selected} onSelect={pickFromMap} />
        <p className="mt-2 border-t border-line-soft pt-2 text-center text-[10px] font-bold text-ink-faint">
          {selected === "all"
            ? "도면의 구역을 누르면 시야 특징과 후기가 나와요"
            : `${zoneName} 선택됨 · 도면에서 다른 구역도 눌러보세요`}
        </p>
      </section>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        <button
          type="button"
          onClick={() => setGroup("all")}
          className={`flex-none rounded-full border px-3 py-[7px] text-[11.5px] font-extrabold transition ${
            group === "all"
              ? "border-brand-600 bg-brand text-white"
              : "border-line bg-white text-ink-2"
          }`}
        >
          전체
        </button>
        {ZONE_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className={`flex-none rounded-full border px-3 py-[7px] text-[11.5px] font-extrabold transition ${
              group === g.id
                ? "border-brand-600 bg-brand text-white"
                : "border-line bg-white text-ink-2"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-[7px]">
        <button
          type="button"
          onClick={() => setSelected("all")}
          className={`rounded-[13px] border bg-white px-2 py-[9px] text-left transition active:scale-[.975] ${
            selected === "all"
              ? "border-brand-600 bg-[#F3F8FF] shadow-[0_0_0_2px_rgba(10,88,202,.13)]"
              : "border-line"
          }`}
        >
          <span className="block text-xs font-extrabold leading-tight tracking-tight2 text-ink">
            전체 구역
          </span>
          <span className="mt-[3px] block text-[10px] font-semibold text-ink-faint">
            모든 후기 보기
          </span>
        </button>
        {visibleCodes.map((code) => {
          const z = ZONE_BY_CODE[code];
          if (!z) return null;
          return (
            <button
              key={code}
              type="button"
              onClick={() => pick(code)}
              className={`rounded-[13px] border bg-white px-2 py-[9px] text-left transition active:scale-[.975] ${
                selected === code
                  ? "border-brand-600 bg-[#F3F8FF] shadow-[0_0_0_2px_rgba(10,88,202,.13)]"
                  : "border-line"
              }`}
            >
              <span className="block text-xs font-extrabold leading-tight tracking-tight2 text-ink">
                {z.short}
              </span>
              <span className="mt-[3px] block text-[10px] font-semibold leading-snug text-ink-faint">
                {z.emoji} {zoneSubtitle(z)}
              </span>
            </button>
          );
        })}
      </div>

      {zone ? (
        <>
          <section className="relative overflow-hidden rounded-lg2 bg-gradient-to-br from-brand via-brand-600 to-brand-500 px-4 py-4 text-white shadow-brand">
            <div className="pointer-events-none absolute -bottom-[60px] -right-10 h-[150px] w-[150px] rounded-full bg-white/[.07]" />
            <div className="relative text-lg font-extrabold tracking-tight3">
              {zone.emoji} {zone.name}
            </div>
            {zone.sub ? (
              <div className="relative mt-1 flex items-center gap-1.5">
                <span className="rounded-md bg-white/[.16] px-2 py-[3px] text-[10px] font-extrabold text-white/85">
                  소분류
                </span>
                <span className="text-[11px] font-bold text-white/80">{zone.sub}</span>
              </div>
            ) : null}
            <div className="relative mt-[5px] text-[11.5px] font-semibold text-white/80">
              {zone.side} · {zone.price}
            </div>
            {family ? (
              <div className="relative mt-2.5 flex flex-wrap gap-1.5">
                {family.codes.map((code) => {
                  const sibling = ZONE_BY_CODE[code];
                  if (!sibling) return null;
                  const on = code === zone.code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => pick(code)}
                      className={`rounded-full px-2.5 py-[5px] text-[10.5px] font-extrabold transition ${
                        on
                          ? "bg-white text-brand-600"
                          : "bg-white/[.16] text-white/85"
                      }`}
                    >
                      {sibling.short}
                    </button>
                  );
                })}
                <span className="self-center text-[10px] font-bold text-white/60">
                  {family.label} 안에서 골라보세요
                </span>
              </div>
            ) : null}
            <div className="relative mt-3.5 grid grid-cols-3 gap-[7px]">
              {[
                ["내야까지", zone.dist],
                ["앞사람 가림", zone.block.replace("가림 ", "")],
                ["지붕", zone.roof.replace("지붕 ", "")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[11px] bg-white/[.13] px-[9px] py-2">
                  <div className="text-[9.5px] font-bold text-white/70">{k}</div>
                  <div className="mt-[3px] text-xs font-extrabold tracking-tight">{v}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-md2 border border-line bg-white px-3.5 py-1 shadow-card">
            {[
              ["☀️", "햇빛", zone.sun],
              ["🌧️", "우천", zone.rain],
              ["📣", "응원 분위기", zone.cheer],
              ["👍", "추천 대상", zone.good],
              ["💡", "꿀팁", zone.tip],
            ].map(([fi, fl, ft], index, all) => (
              <div
                key={fl}
                className={`flex gap-2.5 py-2.5 ${index < all.length - 1 ? "border-b border-line-soft" : ""}`}
              >
                <span className="w-[22px] flex-none text-sm leading-[1.4]">{fi}</span>
                <div>
                  <div className="text-[10.5px] font-extrabold text-ink-faint">{fl}</div>
                  <div className="mt-0.5 break-keep text-[13px] leading-relaxed text-ink-2">{ft}</div>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pb-3 pt-1">
              <button
                type="button"
                onClick={() => void toggleSaveZone(zone.code)}
                className={`flex-1 rounded-[13px] py-3 text-[13px] font-extrabold transition active:scale-[.98] ${
                  saves.zones.includes(zone.code)
                    ? "bg-brand-50 text-brand shadow-[inset_0_0_0_1px_#C7D7F0]"
                    : "bg-white text-ink-2 shadow-[inset_0_0_0_1px_#EAECF0]"
                }`}
              >
                {saves.zones.includes(zone.code) ? "★ 저장됨" : "☆ 이 구역 저장"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <section className="relative overflow-hidden rounded-lg2 bg-gradient-to-br from-brand via-brand-600 to-brand-500 px-4 py-4 text-white shadow-brand">
            <div className="pointer-events-none absolute -bottom-[60px] -right-10 h-[150px] w-[150px] rounded-full bg-white/[.07]" />
            <div className="relative text-lg font-extrabold tracking-tight3">⚾ 라팍 한눈에</div>
            <div className="relative mt-[5px] text-[11.5px] font-semibold text-white/80">
              2016년 개장 · 팔각형 · 약 24,000석
            </div>
            <div className="relative mt-3.5 grid grid-cols-3 gap-[7px]">
              {[
                ["홈 응원", "3루 (Gate 21)"],
                ["원정 응원", "1루 (Gate 1)"],
                ["지하철", "대공원역 5번"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-[11px] bg-white/[.13] px-[9px] py-2">
                  <div className="text-[9.5px] font-bold text-white/70">{k}</div>
                  <div className="mt-[3px] text-xs font-extrabold tracking-tight">{v}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-md2 border border-line bg-white px-3.5 shadow-card">
            {[
              ["🦁", "홈 더그아웃이 3루", "다른 구장과 반대예요. 삼성 팬은 3루, 원정 팬은 1루 쪽으로 앉으면 됩니다."],
              ["☀️", "해는 1루 쪽으로", "낮 경기엔 1루 쪽이 햇빛이 강하고 3루 쪽이 그늘이 빨리 옵니다."],
              ["🔭", "지붕은 상층만", "5층 SKY·4층 스윗박스는 지붕이 있고, 내야·외야 일반석은 비를 그대로 맞습니다."],
              ["👇", "구역을 눌러보세요", "위 탭으로 층을 고르고, 구역을 누르면 시야 특징과 유저 후기가 나옵니다."],
            ].map(([fi, fl, ft], index, all) => (
              <div
                key={fl}
                className={`flex gap-2.5 py-2.5 ${index < all.length - 1 ? "border-b border-line-soft" : ""}`}
              >
                <span className="w-[22px] flex-none text-sm leading-[1.4]">{fi}</span>
                <div>
                  <div className="text-[10.5px] font-extrabold text-ink-faint">{fl}</div>
                  <div className="mt-0.5 break-keep text-[13px] leading-relaxed text-ink-2">{ft}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-2.5 px-0.5">
        <h2 className="flex items-center gap-1.5 text-[15.5px] font-extrabold tracking-tight2">
          유저 시야 후기
          <span className="text-xs font-bold text-ink-faint">{filteredReviews.length}</span>
        </h2>
      </div>

      <div className="flex flex-col gap-2.5">
        {filteredReviews.length ? (
          filteredReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-md2 border border-line bg-white p-[13px] shadow-card"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-extrabold ${
                    review.mine
                      ? "bg-gradient-to-br from-brand-500 to-brand text-white"
                      : "bg-brand-50 text-brand"
                  }`}
                >
                  {initialOf(review.nickname)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[13.5px] font-extrabold tracking-tight">
                      {review.nickname}
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                        review.mine ? "bg-brand text-white" : "bg-brand-50 text-brand-600"
                      }`}
                    >
                      {review.badge}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-faint">
                    {zoneFullName(review.zoneCode)} · {formatRelativeTime(review.createdAt)}
                  </div>
                </div>
                <Stars value={review.stars} />
              </div>
              <p className="mt-[9px] break-keep text-[13.5px] leading-relaxed text-[#1D2939]">
                {review.body}
              </p>
              <ReviewPhotos
                urls={review.photoUrls ?? []}
                onOpen={(index) => setLightbox({ urls: review.photoUrls, index })}
              />
              <span className="mt-[9px] inline-block rounded-md bg-[#F3F8FF] px-[7px] py-0.5 text-[11px] font-bold text-brand-600">
                {review.seatDetail}
              </span>
            </article>
          ))
        ) : (
          <div className="rounded-md2 border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[22px] text-center">
            <div className="mb-[7px] text-[26px]">👀</div>
            <p className="text-[13px] font-extrabold text-ink-2">이 구역 후기가 아직 없어요</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
              첫 시야 후기를 남겨보세요.
            </p>
          </div>
        )}
      </div>

      <p className="break-keep px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
        가격·구역명은 2026 시즌 공개 자료 기준이며 시즌마다 달라질 수 있어요.
      </p>

      {lightbox ? (
        <PhotoLightbox
          state={lightbox}
          onClose={() => setLightbox(null)}
          onPick={(index) => setLightbox({ ...lightbox, index })}
        />
      ) : null}
    </div>
  );
}
