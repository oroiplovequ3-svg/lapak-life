"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/avatar";
import { DeleteButton } from "@/components/delete-button";
import { Icon, Stars } from "@/components/icons";
import { Pagination } from "@/components/pagination";
import {
  PhotoLightbox,
  PhotoTiles,
  type PhotoLightboxState,
} from "@/components/photo-gallery";
import { useApp } from "@/components/providers/app-provider";
import { ReportSheet } from "@/components/report-sheet";
import { ReviewSheet } from "@/components/review-sheet";
import { SeatMap } from "@/components/seat-map";
import {
  ZONE_BY_CODE,
  ZONE_GROUPS,
  zoneFamily,
  zoneFullName,
} from "@/lib/data/zones";
import { formatRelativeTime } from "@/lib/utils";
import type { ZoneReview } from "@/lib/types";

interface SeatScreenProps {
  /** 지금 고른 구역 코드 ('all' 이면 전체 구역 · 검색에서도 같은 값을 씁니다) */
  selectedZone: string;
  onSelectZone: (code: string) => void;
  /** 검색에서 구역을 골라 들어올 때마다 올라가는 값 — 그 구역 카드로 스크롤합니다. */
  focusNonce?: number;
  /** 후기 작성 시트를 열고, 지금 고른 구역을 미리 선택해 둡니다. */
  onWriteReview?: (zoneCode: string) => void;
}

/** '전체 구역'에서 후기를 쓸 때 미리 골라 둘 기본 구역 (홈 응원 3루 테이블) */
const DEFAULT_REVIEW_ZONE = "T3";

/** 후기 목록 한 페이지에 보여줄 개수 */
const REVIEWS_PER_PAGE = 5;

export function SeatScreen({
  selectedZone,
  onSelectZone,
  focusNonce = 0,
  onWriteReview,
}: SeatScreenProps) {
  const { zones, reviews, saves, toggleSaveZone, deleteReview, isAdmin } = useApp();
  const selected = selectedZone;
  const [pickerOpen, setPickerOpen] = useState(false);
  /** 수정 중인 후기 (있으면 수정 시트를 엽니다) */
  const [editingReview, setEditingReview] = useState<ZoneReview | null>(null);
  /** 신고 중인 후기 */
  const [reportReview, setReportReview] = useState<ZoneReview | null>(null);
  const [lightbox, setLightbox] = useState<PhotoLightboxState | null>(null);
  /** 후기 목록 페이지 (5개씩) */
  const [reviewPage, setReviewPage] = useState(1);
  const pickerRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedRowRef = useRef<HTMLButtonElement | null>(null);
  const detailRef = useRef<HTMLElement | null>(null);
  const reviewsRef = useRef<HTMLDivElement | null>(null);
  /** 좌석 선택기(도면·목록)에서 구역을 고르면 그 구역 카드로 이동시킵니다. */
  const jumpAfterPick = useRef(false);
  const zone =
    selected === "all" ? null : zones.find((z) => z.code === selected) ?? ZONE_BY_CODE[selected];
  const filteredReviews = useMemo(
    () => (selected === "all" ? reviews : reviews.filter((r) => r.zoneCode === selected)),
    [reviews, selected],
  );
  const reviewPageCount = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  // 후기 삭제·추가로 목록이 줄면 페이지가 범위를 넘지 않게 맞춰요.
  const currentReviewPage = Math.min(reviewPage, reviewPageCount);
  const pagedReviews = filteredReviews.slice(
    (currentReviewPage - 1) * REVIEWS_PER_PAGE,
    currentReviewPage * REVIEWS_PER_PAGE,
  );
  const zoneName = selected === "all" ? "전체 구역" : zone?.short ?? selected;
  const family = zoneFamily(zone?.code);
  const reviewZone = selected === "all" ? DEFAULT_REVIEW_ZONE : selected;
  const writeReview = () => onWriteReview?.(reviewZone);

  // 목록을 열면 화면이 선택기 전체를 보여주게 올리고,
  // 지금 고른 구역이 스크롤 가운데에 오도록 맞춰요.
  useEffect(() => {
    if (!pickerOpen) return;
    const picker = pickerRef.current;
    const list = listRef.current;
    const row = selectedRowRef.current;
    const screen = document.getElementById("screen");
    if (picker && screen) {
      const pickerRect = picker.getBoundingClientRect();
      const screenRect = screen.getBoundingClientRect();
      screen.scrollTop += pickerRect.top - screenRect.top - 8;
    }
    if (!list || !row) return;
    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    list.scrollTop += rowRect.top - listRect.top - list.clientHeight / 2 + rowRect.height / 2;
  }, [pickerOpen]);

  // 검색에서 구역을 골라 들어오면 그 구역의 시야·후기 카드가 바로 보이게 맞춰요.
  useEffect(() => {
    if (!focusNonce) return;
    const timer = window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [focusNonce]);

  // 구역이 바뀌면 그 구역 후기 목록은 1페이지부터 보여줘요.
  useEffect(() => {
    setReviewPage(1);
  }, [selected]);

  // 선택기에서 구역을 고르면 선택기가 접히고, 고른 구역의 시야·후기가 바로 보이게 올려요.
  useEffect(() => {
    if (!jumpAfterPick.current) return;
    jumpAfterPick.current = false;
    const timer = window.setTimeout(() => {
      if (selected === "all") {
        reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [selected]);

  function goReviewPage(next: number) {
    const target = Math.min(Math.max(1, next), reviewPageCount);
    if (target === currentReviewPage) return;
    setReviewPage(target);
    reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function choose(code: string) {
    onSelectZone(code);
    setPickerOpen(false);
    jumpAfterPick.current = true;
  }

  function pickFromMap(code: string) {
    onSelectZone(code);
    setPickerOpen(false);
    jumpAfterPick.current = true;
  }

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-[30px] pt-3.5">
      <div
        ref={reviewsRef}
        className="flex scroll-mt-3 items-center justify-between gap-2.5 px-0.5"
      >
        <h2 className="flex min-w-0 items-center gap-1.5 text-[15.5px] font-extrabold tracking-tight2">
          직관 시야 후기
          <span className="text-xs font-bold text-ink-faint">{filteredReviews.length}</span>
        </h2>
        {onWriteReview ? (
          <button
            type="button"
            onClick={writeReview}
            aria-label="직관 시야 후기 작성"
            className="flex flex-none items-center gap-1 rounded-full bg-brand px-2.5 py-[6px] text-[11.5px] font-extrabold tracking-tight2 text-white shadow-brand transition active:scale-[.97]"
          >
            <Icon name="plus" size={12} strokeWidth={2.6} />
            후기 작성
          </button>
        ) : null}
      </div>

      {selected === "all" ? null : (
        <div className="-mt-1.5 flex items-center gap-1.5 px-0.5">
          <span className="flex min-w-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-[3px] text-[10.5px] font-extrabold text-brand-600">
            <span className="truncate">
              {zone?.emoji} {zoneName} 후기만 보는 중
            </span>
          </span>
          <button
            type="button"
            onClick={() => choose("all")}
            className="flex-none rounded-full px-1.5 py-[3px] text-[10.5px] font-bold text-ink-faint underline decoration-[#C4CBD6] underline-offset-2 transition active:scale-[.97]"
          >
            전체 구역 보기
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filteredReviews.length ? (
          pagedReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-md2 border border-line bg-white p-[13px] shadow-card"
            >
              <div className="flex items-center gap-2">
                <Avatar
                  nickname={review.nickname}
                  avatarUrl={review.avatarUrl}
                  size={32}
                  className={
                    review.mine
                      ? "bg-gradient-to-br from-brand-500 to-brand text-xs text-white"
                      : "bg-brand-50 text-xs text-brand"
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="wrap-any text-[13.5px] font-extrabold tracking-tight">
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
                  <div className="mt-0.5 wrap-any text-[11px] text-ink-faint">
                    {zoneFullName(review.zoneCode)} · {formatRelativeTime(review.createdAt)}
                  </div>
                </div>
                <Stars value={review.stars} />
                {review.mine || isAdmin ? (
                  <span className="ml-[-2px] flex flex-none items-center">
                    <button
                      type="button"
                      aria-label="후기 수정"
                      onClick={() => setEditingReview(review)}
                      className="rounded-lg p-1.5 text-[#C4CBD6] transition hover:text-brand"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <DeleteButton what="후기" size={14} onDelete={() => deleteReview(review.id)} />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReportReview(review)}
                    className="ml-[-2px] flex-none rounded-lg px-1.5 py-1 text-[10px] font-bold text-[#B9C0CB] transition hover:text-[#B42318]"
                  >
                    신고
                  </button>
                )}
              </div>
              <p className="mt-[9px] wrap-any text-[13.5px] leading-relaxed text-[#1D2939]">
                {review.body}
              </p>
              <PhotoTiles
                urls={review.photoUrls ?? []}
                onOpen={(index) => setLightbox({ urls: review.photoUrls, index })}
                label="후기 사진"
              />
              {review.seatDetail ? (
                <span className="mt-[9px] inline-block max-w-full wrap-any rounded-md bg-[#F3F8FF] px-[7px] py-0.5 text-[11px] font-bold text-brand-600">
                  {review.seatDetail}
                </span>
              ) : null}
            </article>
          ))
        ) : (
          <div className="rounded-md2 border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[22px] text-center">
            <div className="mb-[7px] text-[26px]">👀</div>
            <p className="text-[13px] font-extrabold text-ink-2">
              {selected === "all" ? "아직 등록된 후기가 없어요" : "이 구역 후기가 아직 없어요"}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
              {selected === "all"
                ? "첫 직관 시야 후기를 남겨보세요."
                : `${zoneName} 첫 직관 시야 후기를 남겨보세요.`}
            </p>
            {onWriteReview ? (
              <button
                type="button"
                onClick={writeReview}
                className="mt-3 inline-flex items-center gap-1 rounded-[11px] bg-brand px-3.5 py-[9px] text-[12px] font-extrabold text-white shadow-brand transition active:scale-[.98]"
              >
                <Icon name="plus" size={12} strokeWidth={2.6} />
                후기 작성
              </button>
            ) : null}
          </div>
        )}
      </div>

      <Pagination
        page={currentReviewPage}
        pageCount={reviewPageCount}
        onChange={goReviewPage}
        label="직관 시야 후기 페이지"
      />

      <section
        ref={pickerRef}
        className="overflow-hidden rounded-md2 border border-line bg-white shadow-card"
      >
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
          <div className="animate-fadeIn border-t border-line-soft bg-[#FBFCFE] px-2 pb-2 pt-2">
            <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
              <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-extrabold text-ink-2">
                <Icon name="seat" size={14} strokeWidth={2} />
                라이온즈파크 좌석배치도
              </span>
              <span className="flex-none whitespace-nowrap rounded-lg bg-white px-2 py-[3px] text-[11px] font-extrabold text-brand-600 shadow-[inset_0_0_0_1px_#DDE7F6]">
                {zoneName}
              </span>
            </div>
            <SeatMap selected={selected} onSelect={pickFromMap} />
            <p className="mt-1.5 text-center text-[10px] font-bold leading-relaxed text-ink-faint">
              도면의 구역을 누르면 바로 선택돼요 · 좁은 띠는 근처를 눌러도 가까운 구역이 선택돼요
            </p>
            <div
              id="seat-zone-picker"
              ref={listRef}
              className="mt-1.5 max-h-[200px] overflow-y-auto overscroll-contain border-t border-line-soft pt-1"
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
              위아래로 넘겨 구역을 고르면 그 구역 시야·후기로 바로 바뀌어요
            </p>
          </div>
        ) : (
          <p className="border-t border-line-soft bg-[#FBFCFE] px-3 py-2 text-center text-[10px] font-bold text-ink-faint">
            누르면 라이온즈파크 좌석배치도가 펼쳐져요
          </p>
        )}
      </section>

      {zone ? (
        <>
          <section
            ref={detailRef}
            className="relative overflow-hidden rounded-lg2 bg-gradient-to-br from-brand via-brand-600 to-brand-500 px-4 py-4 text-white shadow-brand"
          >
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
                  <div className="mt-0.5 wrap-any text-[13px] leading-relaxed text-ink-2">{ft}</div>
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
              ["👇", "구역을 눌러보세요", "위 '좌석 선택'을 눌러 구역을 고르면 시야 특징과 직관 시야 후기가 나옵니다."],
            ].map(([fi, fl, ft], index, all) => (
              <div
                key={fl}
                className={`flex gap-2.5 py-2.5 ${index < all.length - 1 ? "border-b border-line-soft" : ""}`}
              >
                <span className="w-[22px] flex-none text-sm leading-[1.4]">{fi}</span>
                <div>
                  <div className="text-[10.5px] font-extrabold text-ink-faint">{fl}</div>
                  <div className="mt-0.5 wrap-any text-[13px] leading-relaxed text-ink-2">{ft}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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

      <ReviewSheet
        open={Boolean(editingReview)}
        onClose={() => setEditingReview(null)}
        editing={editingReview}
        onPosted={(zoneCode) => onSelectZone(zoneCode)}
      />

      <ReportSheet
        open={Boolean(reportReview)}
        onClose={() => setReportReview(null)}
        targetType="review"
        targetId={reportReview?.id ?? ""}
        targetHint={
          reportReview
            ? `${reportReview.nickname}님의 ${zoneFullName(reportReview.zoneCode)} 후기`
            : undefined
        }
      />
    </div>
  );
}
