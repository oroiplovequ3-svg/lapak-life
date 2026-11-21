"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Icon, Stars } from "@/components/icons";
import {
  PhotoLightbox,
  PhotoTiles,
  type PhotoLightboxState,
} from "@/components/photo-gallery";
import { useApp } from "@/components/providers/app-provider";
import { SeatMap } from "@/components/seat-map";
import {
  ZONE_BY_CODE,
  ZONE_GROUPS,
  zoneFamily,
  zoneFullName,
} from "@/lib/data/zones";
import { formatRelativeTime, initialOf } from "@/lib/utils";

export function SeatScreen() {
  const { zones, reviews, saves, toggleSaveZone } = useApp();
  const [selected, setSelected] = useState<string>("all");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<PhotoLightboxState | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedRowRef = useRef<HTMLButtonElement | null>(null);
  const zone =
    selected === "all" ? null : zones.find((z) => z.code === selected) ?? ZONE_BY_CODE[selected];
  const filteredReviews = useMemo(
    () => (selected === "all" ? reviews : reviews.filter((r) => r.zoneCode === selected)),
    [reviews, selected],
  );
  const zoneName = selected === "all" ? "전체 구역" : zone?.short ?? selected;
  const family = zoneFamily(zone?.code);

  // 목록을 열면 지금 고른 구역이 스크롤 가운데에 보이게 맞춰요.
  useEffect(() => {
    if (!pickerOpen) return;
    const list = listRef.current;
    const row = selectedRowRef.current;
    if (!list || !row) return;
    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    list.scrollTop += rowRect.top - listRect.top - list.clientHeight / 2 + rowRect.height / 2;
  }, [pickerOpen]);

  function choose(code: string) {
    setSelected(code);
    setPickerOpen(false);
  }

  function pickFromMap(code: string) {
    setSelected(code);
    setPickerOpen(false);
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

      <section className="overflow-hidden rounded-md2 border border-line bg-white shadow-card">
        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-expanded={pickerOpen}
          aria-controls="seat-zone-picker"
          className={`flex w-full items-center gap-2 px-3 py-[11px] text-left transition ${
            pickerOpen ? "bg-[#F7FAFF]" : "bg-white"
          }`}
        >
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[9px] bg-brand-50 text-brand">
            <Icon name="seat" size={15} strokeWidth={2} />
          </span>
          <span className="flex-none text-[12.5px] font-extrabold tracking-tight2 text-ink-muted">
            좌석 선택
          </span>
          <span className="ml-auto flex min-w-0 items-center gap-[5px] rounded-[10px] bg-brand-50 py-[5px] pl-2.5 pr-2">
            <span className="truncate text-[11.5px] font-extrabold tracking-tight2 text-brand-600">
              {selected === "all" ? "전체 구역" : `${zone?.emoji ?? ""} ${zoneName}`.trim()}
            </span>
            <Icon
              name="chevron"
              size={11}
              strokeWidth={2.8}
              className={`flex-none text-brand-600 transition-transform duration-200 ${
                pickerOpen ? "-rotate-90" : "rotate-90"
              }`}
            />
          </span>
        </button>

        {pickerOpen ? (
          <div className="animate-fadeIn border-t border-line-soft bg-[#FBFCFE] px-2 pb-2 pt-1.5">
            <div
              id="seat-zone-picker"
              ref={listRef}
              className="max-h-[280px] overflow-y-auto overscroll-contain"
            >
              <button
                type="button"
                ref={selected === "all" ? selectedRowRef : undefined}
                onClick={() => choose("all")}
                className={`flex w-full items-center gap-2 rounded-[11px] border px-2 py-[9px] text-left transition active:scale-[.99] ${
                  selected === "all"
                    ? "border-brand-600 bg-white shadow-[0_1px_2px_rgba(16,24,40,.06)]"
                    : "border-transparent hover:bg-white"
                }`}
              >
                <span className="w-[18px] flex-none text-center text-[13px] leading-none">⚾</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-extrabold leading-tight tracking-tight2 text-ink">
                    전체 구역
                  </span>
                  <span className="mt-[2px] block truncate text-[10px] font-semibold text-ink-faint">
                    모든 구역의 시야 후기 보기
                  </span>
                </span>
                {selected === "all" ? (
                  <span className="flex-none text-[11px] font-black text-brand">✓</span>
                ) : null}
              </button>

              {ZONE_GROUPS.map((g) => (
                <div key={g.id}>
                  <div className="flex items-baseline gap-1.5 px-2 pb-1 pt-3">
                    <span className="text-[10.5px] font-extrabold tracking-tight2 text-ink-2">
                      {g.label}
                    </span>
                    <span className="truncate text-[9.5px] font-semibold text-[#B9C0CB]">
                      {g.hint}
                    </span>
                  </div>
                  {g.codes.map((code) => {
                    const z = ZONE_BY_CODE[code];
                    if (!z) return null;
                    const on = selected === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        ref={on ? selectedRowRef : undefined}
                        onClick={() => choose(code)}
                        className={`flex w-full items-center gap-2 rounded-[11px] border px-2 py-[7px] text-left transition active:scale-[.99] ${
                          on
                            ? "border-brand-600 bg-white shadow-[0_1px_2px_rgba(16,24,40,.06)]"
                            : "border-transparent hover:bg-white"
                        }`}
                      >
                        <span className="w-[18px] flex-none text-center text-[13px] leading-none">
                          {z.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[12.5px] font-extrabold leading-tight tracking-tight2 ${
                              on ? "text-brand-600" : "text-ink"
                            }`}
                          >
                            {z.short}
                          </span>
                          <span className="mt-[2px] block truncate text-[10px] font-semibold text-ink-faint">
                            {z.side}
                          </span>
                        </span>
                        {on ? (
                          <span className="flex-none text-[11px] font-black text-brand">✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="px-2 pt-1.5 text-center text-[9.5px] font-bold text-[#B9C0CB]">
              위아래로 넘겨 구역을 고르면 바로 아래 시야·후기가 바뀌어요
            </p>
          </div>
        ) : null}
      </section>

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
                      onClick={() => choose(code)}
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
              ["👇", "구역을 눌러보세요", "위 '좌석 선택'을 눌러 구역을 고르면 시야 특징과 유저 후기가 나옵니다."],
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
              <PhotoTiles
                urls={review.photoUrls ?? []}
                onOpen={(index) => setLightbox({ urls: review.photoUrls, index })}
                label="후기 사진"
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
          label="후기 사진"
        />
      ) : null}
    </div>
  );
}
