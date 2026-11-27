"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/avatar";
import { DeleteButton } from "@/components/delete-button";
import { Icon, Stars } from "@/components/icons";
import {
  PhotoLightbox,
  PhotoTiles,
  type PhotoLightboxState,
} from "@/components/photo-gallery";
import { PostNo } from "@/components/post-no";
import { useApp } from "@/components/providers/app-provider";
import { HiddenBadge, ReportButton, RestoreButton } from "@/components/report-controls";
import { ReportSheet } from "@/components/report-sheet";
import { UserFoodSheet } from "@/components/user-food-sheet";
import { UserParkingSheet } from "@/components/user-parking-sheet";
import { groupedFoods } from "@/lib/data/foods";
import { PARKING } from "@/lib/data/parking";
import type {
  Food,
  FoodFocus,
  ReportTargetType,
  UserFood,
  UserFoodComment,
  UserParking,
} from "@/lib/types";
import { foodLinkKey, type FoodLink, type FoodSegment } from "@/lib/url-state";

type FoodFilter = "all" | "in" | "out";
type FoodTab = "all" | "user" | "stadium";

interface FoodScreenProps {
  /** 검색 등에서 특정 카드로 바로 이동할 때 */
  focus?: FoodFocus | null;
  /** 주소창(?tab=food&…)에서 읽은 지금 상태 */
  link: FoodLink;
  /** 화면에서 바뀐 상태를 주소창에 남깁니다 */
  onLinkChange?: (link: FoodLink) => void;
}

function SectionHead({
  title,
  sub,
  count,
  onAdd,
  addLabel = "추가",
}: {
  title: string;
  sub: string;
  count: number;
  onAdd: () => void;
  addLabel?: string;
}) {
  return (
    <div className="mt-1 flex items-end justify-between gap-2 px-0.5">
      <div className="min-w-0">
        <h2 className="text-[15.5px] font-extrabold tracking-tight2">
          {title} <span className="text-[11.5px] font-extrabold text-ink-faint">{count}</span>
        </h2>
        <p className="mt-[2px] wrap-any text-[10.5px] font-semibold text-ink-faint">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex flex-none items-center gap-1 rounded-full bg-brand px-[11px] py-[7px] text-[11.5px] font-extrabold text-white shadow-[0_3px_10px_-2px_rgba(7,76,161,.5)]"
      >
        <Icon name="plus" size={12} strokeWidth={2.6} /> {addLabel}
      </button>
    </div>
  );
}

function UserFoodCommentRow({
  comment,
  canManage,
  onSave,
  onDelete,
}: {
  comment: UserFoodComment;
  /** 본인 댓글이거나 마스터 */
  canManage: boolean;
  onSave: (body: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const { isAdmin, restoreReportedContent } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const hidden = comment.isHidden === true;

  useEffect(() => {
    if (!editing) setDraft(comment.body);
  }, [comment.body, editing]);

  const save = async () => {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    const ok = await onSave(text);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {hidden && isAdmin ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <HiddenBadge className="flex-1" />
          <RestoreButton
            busy={restoring}
            onClick={() => {
              setRestoring(true);
              void restoreReportedContent("user_food_comment", comment.id).finally(() =>
                setRestoring(false),
              );
            }}
          />
        </div>
      ) : null}
      <div className="flex items-start gap-[7px]">
        <Avatar
          nickname={comment.nickname}
          avatarUrl={comment.avatarUrl}
          size={22}
          className="bg-brand-50 text-[9.5px] text-brand"
        />
        {editing ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <input
              value={draft}
              maxLength={300}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // 한글 IME 조합 중 Enter 는 글자를 확정하는 키입니다.
                if (event.nativeEvent.isComposing) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  void save();
                }
                if (event.key === "Escape") setEditing(false);
              }}
              className="w-full rounded-xl border border-[#C7D7F0] bg-white px-3 py-[7px] text-[12px] text-ink outline-none"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-[9px] bg-[#F3F5F9] px-2.5 py-1 text-[10.5px] font-extrabold text-ink-muted"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={!draft.trim() || saving}
                className="rounded-[9px] bg-brand px-2.5 py-1 text-[10.5px] font-extrabold text-white disabled:bg-[#E4E7EC] disabled:text-ink-faint"
              >
                {saving ? "저장 중" : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <p className="min-w-0 flex-1 wrap-any pt-px text-[12px] leading-relaxed text-ink-2">
              <span className="mr-[5px] text-[11.5px] font-extrabold text-ink">
                {comment.nickname}
              </span>
              {comment.body}
            </p>
            <span className="flex flex-none items-center gap-0.5">
              {canManage ? (
                <>
                  <button
                    type="button"
                    aria-label="댓글 수정"
                    onClick={() => setEditing(true)}
                    className="rounded-lg p-1.5 text-[#C4CBD6] transition hover:text-brand"
                  >
                    <Icon name="edit" size={11} />
                  </button>
                  <DeleteButton what="댓글" size={11} onDelete={onDelete} className="mt-[-4px]" />
                </>
              ) : null}
              <ReportButton
                count={comment.reportCount ?? 0}
                manage={canManage}
                size="sm"
                onReport={() => setReportOpen(true)}
              />
            </span>
          </div>
        )}
      </div>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="user_food_comment"
        targetId={comment.id}
        targetHint={`${comment.nickname}님의 맛집 댓글`}
      />
    </div>
  );
}

function UserFoodCard({
  food,
  canManage,
  onEdit,
  onDelete,
  onReport,
  onOpenPhoto,
}: {
  food: UserFood;
  /** 본인 맛집이거나 마스터 */
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  onOpenPhoto: (index: number) => void;
}) {
  const {
    isAdmin,
    userFoodCommentsByFood,
    userFoodCommentsLoaded,
    loadUserFoodComments,
    addUserFoodComment,
    updateUserFoodComment,
    deleteUserFoodComment,
    restoreReportedContent,
  } = useApp();
  const photoUrls = food.photoUrls ?? [];
  const comments = userFoodCommentsByFood[food.id] ?? [];
  const loaded = userFoodCommentsLoaded[food.id] === true;
  const commentCount = loaded ? comments.length : food.commentCount ?? 0;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const hidden = food.isHidden === true;

  const toggle = () => {
    setOpen((prev) => !prev);
    if (!open) void loadUserFoodComments(food.id);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await addUserFoodComment(food.id, text);
    setSending(false);
    if (ok) setDraft("");
  };

  return (
    <article
      data-user-food-id={food.id}
      className="relative rounded-md2 border border-line bg-white p-3 shadow-card"
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-brand-50 text-base">
          🦁
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-[7px] gap-y-0.5">
            <PostNo no={food.postNo} />
            <h3 className="min-w-0 wrap-any text-[13.5px] font-extrabold tracking-tight2">{food.name}</h3>
            <span className="rounded-md bg-[#F2F8FF] px-1.5 py-[1px] text-[10px] font-extrabold text-[#0B4A96]">
              {food.inStadium ? "구장 안" : "구장 밖"}
            </span>
          </div>
          <div className="mt-[3px] flex min-w-0 items-center gap-1 wrap-any text-[10.5px] font-semibold text-ink-faint">
            <Stars value={food.rating} size={10} />
            <Avatar
              nickname={food.nickname}
              avatarUrl={food.avatarUrl}
              size={16}
              className="ml-0.5 bg-brand-50 text-[8.5px] text-brand"
            />
            <span className="ml-0.5">{food.nickname}</span>
          </div>
          {food.menu ? (
            <p className="mt-1.5 wrap-any text-[11.5px] font-extrabold text-brand-600">
              {food.menu}
            </p>
          ) : null}
          {food.tip ? (
            <div className="mt-1.5 wrap-any rounded-[9px] bg-[#F8FAFC] px-[9px] py-[7px] text-[11.5px] leading-[1.5] text-[#475467]">
              💡 {food.tip}
            </div>
          ) : null}
        </div>
        <span className="flex flex-none items-center gap-0.5">
          {canManage ? (
            <>
              <button
                type="button"
                aria-label="맛집 수정"
                onClick={onEdit}
                className="rounded-lg p-1.5 text-[#C4CBD6] transition hover:text-brand"
              >
                <Icon name="edit" size={13} />
              </button>
              <DeleteButton what="맛집" size={13} onDelete={onDelete} />
            </>
          ) : null}
          <ReportButton
            count={food.reportCount ?? 0}
            manage={canManage}
            size="sm"
            onReport={onReport}
          />
        </span>
      </div>

      {hidden && isAdmin ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <HiddenBadge className="flex-1" />
          <RestoreButton
            busy={restoring}
            onClick={() => {
              setRestoring(true);
              void restoreReportedContent("user_food", food.id).finally(() => setRestoring(false));
            }}
          />
        </div>
      ) : null}

      <PhotoTiles
        urls={photoUrls}
        onOpen={onOpenPhoto}
        singleHeight={150}
        label="맛집 사진"
      />

      <div className="mt-2 flex items-center gap-2 border-t border-line-soft pt-[7px]">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="inline-flex items-center gap-[5px] border-none bg-transparent p-0 text-[11.5px] font-bold text-ink-muted"
        >
          <Icon name="comment" size={13} />
          <span>댓글 {commentCount}</span>
        </button>
      </div>

      {open ? (
        <div className="mt-2 flex flex-col gap-2 border-t border-line-soft pt-2">
          {loaded && comments.length === 0 ? (
            <p className="py-1 text-[11px] text-ink-faint">첫 댓글을 남겨보세요.</p>
          ) : null}
          {comments.map((comment) => (
            <UserFoodCommentRow
              key={comment.id}
              comment={comment}
              canManage={comment.mine || isAdmin}
              onSave={(body) => updateUserFoodComment(food.id, comment.id, body)}
              onDelete={() => void deleteUserFoodComment(food.id, comment.id)}
            />
          ))}
          <div className="flex items-center gap-[6px]">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // 한글 IME 조합 중 Enter 는 글자를 확정하는 키라 댓글을 등록하지 않습니다.
                if (event.nativeEvent.isComposing) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="댓글을 입력하세요"
              className="min-w-0 flex-1 rounded-xl border border-line bg-[#F9FAFB] px-3 py-[8px] text-[12px] text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim() || sending}
              className="flex-none rounded-[11px] bg-brand px-3 py-[8px] text-[11.5px] font-extrabold text-white disabled:bg-[#E4E7EC] disabled:text-ink-faint"
            >
              등록
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function UserParkingCard({
  parking,
  canManage,
  onEdit,
  onDelete,
  onReport,
  showHidden,
  restoring,
  onRestoreHidden,
}: {
  parking: UserParking;
  /** 본인 팁이거나 마스터 */
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  /** 숨김 배지·복구 버튼을 보여 줄지 (마스터만) */
  showHidden: boolean;
  restoring: boolean;
  onRestoreHidden: () => void;
}) {
  return (
    <article
      data-user-parking-id={parking.id}
      className="relative rounded-md2 border border-line bg-white p-3 shadow-card"
    >
      <div className="flex items-start gap-2.5">
        <div className="grid h-[34px] w-[34px] flex-none place-items-center rounded-[11px] bg-brand-50 text-base">
          🅿️
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-[7px] gap-y-0.5">
            <PostNo no={parking.postNo} />
            <h3 className="min-w-0 wrap-any text-[13.5px] font-extrabold tracking-tight2">{parking.name}</h3>
            <span
              className={`rounded-md px-1.5 py-[1px] text-[10px] font-extrabold ${
                parking.isFree ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#FFFAEB] text-[#B54708]"
              }`}
            >
              {parking.isFree ? "무료" : parking.feeNote || "유료"}
            </span>
          </div>
          <div className="mt-[3px] flex min-w-0 items-center gap-1 wrap-any text-[10.5px] font-semibold text-ink-faint">
            <Avatar
              nickname={parking.nickname}
              avatarUrl={parking.avatarUrl}
              size={16}
              className="flex-none bg-brand-50 text-[8.5px] text-brand"
            />
            <span>{[parking.location, parking.walkTime, parking.nickname].filter(Boolean).join(" · ")}</span>
          </div>
          {parking.tip ? (
            <div className="mt-1.5 wrap-any rounded-[9px] bg-[#F8FAFC] px-[9px] py-[7px] text-[11.5px] leading-[1.5] text-[#475467]">
              💡 {parking.tip}
            </div>
          ) : null}
        </div>
        <span className="flex flex-none items-center gap-0.5">
          {canManage ? (
            <>
              <button
                type="button"
                aria-label="주차 팁 수정"
                onClick={onEdit}
                className="rounded-lg p-1.5 text-[#C4CBD6] transition hover:text-brand"
              >
                <Icon name="edit" size={13} />
              </button>
              <DeleteButton what="주차 팁" size={13} onDelete={onDelete} />
            </>
          ) : null}
          <ReportButton
            count={parking.reportCount ?? 0}
            manage={canManage}
            size="sm"
            onReport={onReport}
          />
        </span>
      </div>
      {parking.isHidden && showHidden ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <HiddenBadge className="flex-1" />
          <RestoreButton busy={restoring} onClick={onRestoreHidden} />
        </div>
      ) : null}
    </article>
  );
}
function shortLoc(loc: string) {
  return loc.replace(/\s*\(.*?\)/g, "").split(" · ")[0].trim();
}

/** 좌석 화면의 '좌석 선택'과 같은 톤의 매장 스크롤 선택기 */
function FoodPicker({
  foods,
  selected,
  onSelect,
}: {
  foods: Food[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedRowRef = useRef<HTMLButtonElement | null>(null);
  const groups = useMemo(() => groupedFoods(foods), [foods]);
  const current = selected === "all" ? null : foods.find((food) => food.id === selected) ?? null;

  // 목록을 열면 선택기가 화면 안에 들어오게 올리고,
  // 지금 고른 매장이 스크롤 가운데에 오도록 맞춰요.
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  function choose(id: string) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <section
      ref={pickerRef}
      className="overflow-hidden rounded-md2 border border-line bg-white shadow-card"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="food-picker"
        className={`flex w-full items-center gap-2 px-3 py-[11px] text-left transition ${
          open ? "bg-[#F7FAFF]" : "bg-white"
        }`}
      >
        <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[9px] bg-brand-50 text-[13px]">
          🍔
        </span>
        <span className="flex-none text-[12.5px] font-extrabold tracking-tight2 text-ink-muted">
          푸드 선택
        </span>
        <span className="ml-auto flex min-w-0 items-center gap-[5px] rounded-[10px] bg-brand-50 py-[5px] pl-2.5 pr-2">
          <span className="truncate text-[11.5px] font-extrabold tracking-tight2 text-brand-600">
            {current ? `${current.emoji} ${current.name}` : `전체 매장 (${foods.length}곳)`}
          </span>
          <Icon
            name="chevron"
            size={11}
            strokeWidth={2.8}
            className={`flex-none text-brand-600 transition-transform duration-200 ${
              open ? "-rotate-90" : "rotate-90"
            }`}
          />
        </span>
      </button>

      {open ? (
        <div className="animate-fadeIn border-t border-line-soft bg-[#FBFCFE] px-2 pb-2 pt-1.5">
          <div
            id="food-picker"
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
              <span className="w-[18px] flex-none text-center text-[13px] leading-none">🍽️</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-extrabold leading-tight tracking-tight2 text-ink">
                  전체 매장 한눈에
                </span>
                <span className="mt-[2px] block truncate text-[10px] font-semibold text-ink-faint">
                  {foods.length}곳 요약 보기
                </span>
              </span>
              {selected === "all" ? (
                <span className="flex-none text-[11px] font-black text-brand">✓</span>
              ) : null}
            </button>

            {groups.map((group, index) => (
              <div key={group.id}>
                {index === 0 || groups[index - 1].inside !== group.inside ? (
                  <div className="flex items-center gap-1.5 px-2 pb-0.5 pt-3">
                    <span className="flex-none text-[10px] font-extrabold tracking-tight2 text-brand-600">
                      {group.inside ? "🏟️ 구장 안" : "🚪 구장 밖 · 입장 전"}
                    </span>
                    <span className="h-px flex-1 bg-line-soft" />
                  </div>
                ) : null}
                <div className="flex items-baseline gap-1.5 px-2 pb-1 pt-2">
                  <span className="text-[10.5px] font-extrabold tracking-tight2 text-ink-2">
                    {group.label}
                  </span>
                  <span className="truncate text-[9.5px] font-semibold text-[#B9C0CB]">
                    {group.hint}
                  </span>
                </div>
                {group.items.map((food) => {
                  const on = selected === food.id;
                  return (
                    <button
                      key={food.id}
                      type="button"
                      ref={on ? selectedRowRef : undefined}
                      onClick={() => choose(food.id)}
                      className={`flex w-full items-center gap-2 rounded-[11px] border px-2 py-[7px] text-left transition active:scale-[.99] ${
                        on
                          ? "border-brand-600 bg-white shadow-[0_1px_2px_rgba(16,24,40,.06)]"
                          : "border-transparent hover:bg-white"
                      }`}
                    >
                      <span className="w-[18px] flex-none text-center text-[13px] leading-none">
                        {food.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[12.5px] font-extrabold leading-tight tracking-tight2 ${
                            on ? "text-brand-600" : "text-ink"
                          }`}
                        >
                          {food.name}
                        </span>
                        <span className="mt-[2px] block truncate text-[10px] font-semibold text-ink-faint">
                          {[shortLoc(food.loc), food.price].filter(Boolean).join(" · ")}
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
            위아래로 넘겨 매장을 고르면 바로 아래에 메뉴·팁이 나와요
          </p>
        </div>
      ) : null}
    </section>
  );
}

/** 기본 상태(전체 매장)에서 매장 카드 대신 보여주는 한눈에 요약 카드 */
function FoodOverview({ foods }: { foods: Food[] }) {
  const inside = foods.filter((food) => food.inStadium).length;
  const outside = foods.length - inside;
  const fast = foods.filter((food) => food.wait === 0).length;
  const groups = groupedFoods(foods);
  const guides: [string, string, string][] = [
    ...(inside
      ? ([
          [
            "🏟️",
            "구장 안",
            "2F 푸드스트리트·외야석, 3F 내야석, 4F 스윗박스, 5F SKY에 매장이 나뉘어 있어요. 좌석이 있는 층에서 먹는 게 가장 빠릅니다.",
          ],
        ] as [string, string, string][])
      : []),
    ...(outside
      ? ([
          [
            "🚪",
            "구장 밖",
            "1F 외야 매표소와 2F Gate 1 밖에 매장이 있어요. 하우스 오브 라이온즈는 티켓 없이도 들어갈 수 있습니다.",
          ],
        ] as [string, string, string][])
      : []),
    ["👇", "매장 고르기", "위 '푸드 선택'을 눌러 매장을 고르면 메뉴·가격·평점·웨이팅 팁이 바로 나옵니다."],
  ];

  return (
    <>
      <section className="relative overflow-hidden rounded-lg2 bg-gradient-to-br from-brand via-brand-600 to-brand-500 px-4 py-4 text-white shadow-brand">
        <div className="pointer-events-none absolute -bottom-[60px] -right-10 h-[150px] w-[150px] rounded-full bg-white/[.07]" />
        <div className="relative text-lg font-extrabold tracking-tight3">🍽️ 라팍 먹거리 한눈에</div>
        <div className="relative mt-[5px] wrap-any text-[11.5px] font-semibold text-white/80">
          구장 안 {inside}곳 · 구장 밖 {outside}곳 · 2026 시즌 식음매장 안내 기준
        </div>
        <div className="relative mt-3.5 grid grid-cols-3 gap-[7px]">
          {[
            ["구장 안", `${inside}곳`],
            ["구장 밖", `${outside}곳`],
            ["대기 짧음", `${fast}곳`],
          ].map(([key, value]) => (
            <div key={key} className="rounded-[11px] bg-white/[.13] px-[9px] py-2">
              <div className="text-[9.5px] font-bold text-white/70">{key}</div>
              <div className="mt-[3px] text-xs font-extrabold tracking-tight">{value}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-2.5 flex flex-wrap gap-1.5">
          {groups.map((group) => (
            <span
              key={group.id}
              className="rounded-full bg-white/[.14] px-2.5 py-[5px] text-[10.5px] font-extrabold text-white/85"
            >
              {group.short} <span className="font-bold text-white/55">{group.items.length}</span>
            </span>
          ))}
        </div>
      </section>

      <div className="rounded-md2 border border-line bg-white px-3.5 shadow-card">
        {guides.map(([emoji, title, body], index, all) => (
          <div
            key={title}
            className={`flex gap-2.5 py-2.5 ${index < all.length - 1 ? "border-b border-line-soft" : ""}`}
          >
            <span className="w-[22px] flex-none text-sm leading-[1.4]">{emoji}</span>
            <div>
              <div className="text-[10.5px] font-extrabold text-ink-faint">{title}</div>
              <div className="mt-0.5 wrap-any text-[12.5px] leading-relaxed text-ink-2">
                {body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FoodCard({ food }: { food: Food }) {
  const { saves, toggleSaveFood } = useApp();
  const saved = saves.foods.includes(food.id);
  const waitColor = ["text-[#027A48] bg-[#ECFDF3]", "text-[#B54708] bg-[#FFFAEB]", "text-[#B42318] bg-[#FEF3F2]"][
    food.wait
  ];

  return (
    <article
      data-food-id={food.id}
      className="relative rounded-md2 border border-line bg-white p-3 shadow-card"
    >
      <button
        type="button"
        aria-label={saved ? "저장 해제" : "저장"}
        onClick={() => void toggleSaveFood(food.id)}
        className={`absolute right-[9px] top-[9px] grid h-[30px] w-[30px] place-items-center rounded-[10px] transition ${
          saved ? "bg-brand-50 text-brand" : "bg-[#F5F7FA] text-[#B4BCC9]"
        }`}
      >
        <Icon name="bookmark" size={15} strokeWidth={2} filled={saved} />
      </button>
      <div className="flex gap-2.5 pr-6">
        <div
          className="grid h-[58px] w-[58px] flex-none place-items-center rounded-[15px] text-[26px]"
          style={{ background: food.thumbBg }}
        >
          {food.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-[7px]">
            <h3 className="text-[14.5px] font-extrabold tracking-tight2">{food.name}</h3>
            {food.price ? (
              <span className="text-[11.5px] font-extrabold text-brand-600">{food.price}</span>
            ) : null}
          </div>
          <div className="mt-[3px] text-[11px] font-semibold text-ink-muted">📍 {food.loc}</div>
          <p className="mt-1.5 wrap-any text-xs leading-relaxed text-ink-2">{food.menu}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#FFFAEB] px-1.5 py-0.5 text-[11px] font-extrabold text-[#B54708]">
              ★ {food.rating.toFixed(1)}
            </span>
            <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-extrabold ${waitColor}`}>
              웨이팅 {food.waitTxt}
            </span>
            <span className="text-[11.5px] text-ink-faint">
              {food.inStadium ? "구장 안" : "구장 밖"}
            </span>
          </div>
          <div className="mt-2 wrap-any rounded-[9px] bg-[#F8FAFC] px-[9px] py-[7px] text-[11.5px] leading-[1.5] text-[#475467]">
            💡 {food.tip}
          </div>
        </div>
      </div>
    </article>
  );
}

export function FoodScreen({ focus, link, onLinkChange }: FoodScreenProps) {
  const {
    foods,
    userFoods,
    userParkings,
    deleteUserFood,
    deleteUserParking,
    isAdmin,
    restoreReportedContent,
    ensureCanWrite,
    loadError,
    reload,
  } = useApp();
  const [segment, setSegment] = useState<FoodSegment>(link.seg);
  const [tab, setTab] = useState<FoodTab>(link.ftab);
  const [filter, setFilter] = useState<FoodFilter>(link.filter);
  const [picked, setPicked] = useState<string>(link.food ?? "all");
  /** 화면 상태와 주소창 상태가 같은지 견주는 열쇠 */
  const linkKeyRef = useRef(foodLinkKey(link));
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [parkingSheetOpen, setParkingSheetOpen] = useState(false);
  /** 수정 중인 맛집·주차 팁 (있으면 수정 시트를 엽니다) */
  const [editingFood, setEditingFood] = useState<UserFood | null>(null);
  const [editingParking, setEditingParking] = useState<UserParking | null>(null);
  const [lightbox, setLightbox] = useState<PhotoLightboxState | null>(null);
  /** 복구 처리 중인 주차 팁 id */
  const [restoringParking, setRestoringParking] = useState<string | null>(null);
  /** 신고 중인 맛집·주차 팁 */
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
    hint: string;
  } | null>(null);

  /** 맛집·주차 팁 등록 — 게스트는 빈 시트 대신 로그인 안내부터 띄웁니다. */
  const openFoodSheet = () => {
    if (!ensureCanWrite("맛집을 추가하")) return;
    setFoodSheetOpen(true);
  };
  const openParkingSheet = () => {
    if (!ensureCanWrite("주차 팁을 추가하")) return;
    setParkingSheetOpen(true);
  };

  // 주소창(딥링크·뒤로가기) 값이 바뀌면 화면도 그 값으로 맞춥니다.
  useEffect(() => {
    const key = foodLinkKey(link);
    if (key === linkKeyRef.current) return;
    linkKeyRef.current = key;
    setSegment(link.seg);
    setTab(link.ftab);
    setFilter(link.filter);
    setPicked(link.food ?? "all");
  }, [link]);

  // 화면에서 고른 값도 주소창에 남겨, 그대로 복사해 공유할 수 있게 합니다.
  useEffect(() => {
    const next: FoodLink = {
      seg: segment,
      ftab: tab,
      filter,
      // 매장 선택은 '야구장 푸드' 탭에서만 주소에 남깁니다.
      food: tab === "stadium" && picked !== "all" ? picked : null,
      userFood: segment === "food" && link.seg === "food" ? link.userFood : null,
      parking: segment === "parking" && link.seg === "parking" ? link.parking : null,
      guide: segment === "parking" && link.seg === "parking" ? link.guide : null,
    };
    const key = foodLinkKey(next);
    if (key === linkKeyRef.current) return;
    linkKeyRef.current = key;
    onLinkChange?.(next);
  }, [segment, tab, filter, picked, link, onLinkChange]);

  // 검색에서 특정 매장·맛집·주차 항목을 골라 들어오면 그 카드가 바로 보이게 맞춰요.
  useEffect(() => {
    if (!focus) return;

    if (focus.kind === "stadium") {
      setSegment("food");
      setTab("stadium");
      setFilter("all");
      setPicked(focus.id);
    } else if (focus.kind === "user-food") {
      setSegment("food");
      setTab("user");
    } else {
      setSegment("parking");
    }

    const selector =
      focus.kind === "stadium"
        ? `[data-food-id="${focus.id}"]`
        : focus.kind === "user-food"
          ? `[data-user-food-id="${focus.id}"]`
          : focus.kind === "user-parking"
            ? `[data-user-parking-id="${focus.id}"]`
            : `[data-parking-guide="${focus.id}"]`;

    const scroll = () =>
      document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "center" });
    // 탭·세그먼트가 바뀌며 목록이 다시 그려진 뒤에 찾도록 한 박자 기다렸다가 두 번 맞춰요.
    const first = window.setTimeout(scroll, 220);
    const second = window.setTimeout(scroll, 560);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [focus]);

  const insideCount = foods.filter((food) => food.inStadium).length;

  // 소분류(전체·구장 안·구장 밖) 필터는 '야구장 푸드' 탭에서만 씁니다.
  // '전체' 탭은 구장 안/밖 구분 없이 야구장 푸드와 직관러 맛집을 모두 보여줍니다.
  const showFilters = tab === "stadium";
  const filtered = useMemo(
    () =>
      !showFilters || filter === "all"
        ? foods
        : foods.filter((food) => (filter === "in" ? food.inStadium : !food.inStadium)),
    [foods, showFilters, filter],
  );
  const pickedFood = picked === "all" ? null : filtered.find((food) => food.id === picked) ?? null;

  // 선택한 매장이 필터(구장 안·밖)와 어긋나면 '전체 매장'으로 돌려놓습니다.
  useEffect(() => {
    if (picked !== "all" && !filtered.some((food) => food.id === picked)) setPicked("all");
  }, [picked, filtered]);

  const tabs: [FoodTab, string, number][] = [
    ["all", "전체", foods.length + userFoods.length],
    ["user", "직관러 맛집", userFoods.length],
    ["stadium", "야구장 푸드", foods.length],
  ];

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-[30px] pt-3.5">
      {loadError ? (
        <div className="rounded-md2 border border-[#FECDCA] bg-[#FEF3F2] p-4 text-center">
          <p className="text-[13px] font-extrabold text-[#B42318]">정보를 불러오지 못했어요</p>
          <p className="mt-1 wrap-any text-[11.5px] leading-relaxed text-[#B42318]/80">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-3 rounded-[11px] bg-[#B42318] px-3.5 py-[8px] text-[12px] font-extrabold text-white"
          >
            다시 시도
          </button>
        </div>
      ) : null}
      <div className="flex gap-[3px] rounded-[14px] bg-[#EEF1F6] p-1">
        <button
          type="button"
          onClick={() => setSegment("food")}
          className={`flex-1 rounded-[11px] py-2.5 text-[12.5px] font-extrabold transition ${
            segment === "food" ? "bg-white text-brand shadow-[0_1px_4px_rgba(16,24,40,.12)]" : "text-ink-muted"
          }`}
        >
          🍔 먹거리·맛집
        </button>
        <button
          type="button"
          onClick={() => setSegment("parking")}
          className={`flex-1 rounded-[11px] py-2.5 text-[12.5px] font-extrabold transition ${
            segment === "parking" ? "bg-white text-brand shadow-[0_1px_4px_rgba(16,24,40,.12)]" : "text-ink-muted"
          }`}
        >
          🚗 주차·교통
        </button>
      </div>

      {segment === "parking" ? (
        <>
          <div className="flex items-center gap-2.5 rounded-md2 border border-[#D7E6FA] bg-[#F2F8FF] p-3.5">
            <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-[#DCEAFF] text-lg">
              ℹ️
            </div>
            <div>
              <div className="text-[13px] font-extrabold text-[#0B4A96]">
                2026 시즌부터 전설로 주차장은 사전예약제
              </div>
              <div className="mt-[3px] text-[11.5px] leading-relaxed text-ink-faint">
                현장 판매가 없어 사전에 잡지 않으면 입차할 수 없어요.
              </div>
              <a
                href="https://www.ticketlink.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-extrabold text-brand-600 underline underline-offset-2"
              >
                티켓링크에서 주차권 예약
                <span aria-hidden="true" className="text-[10.5px] opacity-80">
                  ↗
                </span>
              </a>
            </div>
          </div>

          {PARKING.map((card, cardIndex) => (
            <article
              key={card.title}
              data-parking-guide={cardIndex}
              className="rounded-md2 border border-line bg-white p-3.5 shadow-card"
            >
              <div className="mb-1 flex items-center gap-2.5">
                <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-brand-50 text-lg">
                  {card.ic}
                </div>
                <div>
                  <h3 className="text-[14.5px] font-extrabold tracking-tight2">{card.title}</h3>
                  <div className="mt-0.5 text-[11px] font-semibold text-ink-faint">{card.sub}</div>
                </div>
              </div>
              {card.kvs.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-3.5 border-b border-dashed border-[#EDF0F4] py-2 text-[12.5px] last:border-none"
                >
                  <span className="flex-none font-semibold text-ink-muted">{k}</span>
                  <span className="text-right font-extrabold tracking-tight text-ink">{v}</span>
                </div>
              ))}
              {card.note ? (
                <div className="mt-2.5 flex gap-1.5 wrap-any rounded-[11px] bg-[#F8FAFC] px-[11px] py-2.5 text-xs leading-relaxed text-[#475467] ring-1 ring-[#EAECF0]">
                  <span aria-hidden="true" className="flex-none">
                    ℹ️
                  </span>
                  <span>{card.note}</span>
                </div>
              ) : null}
              {card.link ? (
                <a
                  href={card.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 flex items-center justify-center gap-1 rounded-[11px] bg-brand px-3 py-2.5 text-[12px] font-extrabold text-white shadow-brand transition active:scale-[.99]"
                >
                  {card.link.label}
                  <span aria-hidden="true" className="text-[11px] opacity-80">
                    ↗
                  </span>
                </a>
              ) : null}
              {card.warn ? (
                <div className="mt-2.5 wrap-any rounded-[11px] bg-[#FEF3F2] px-[11px] py-2.5 text-xs leading-relaxed text-[#B42318]">
                  ⚠️ {card.warn}
                </div>
              ) : null}
              {card.tip ? (
                <div className="mt-2.5 wrap-any rounded-[11px] bg-[#F2F8FF] px-[11px] py-2.5 text-xs leading-relaxed text-[#0B4A96]">
                  💡 {card.tip}
                </div>
              ) : null}
            </article>
          ))}

          <SectionHead
            title="🦁 직관러 주차 팁"
            sub="직접 주차해 본 직관러의 장소·요금·도보 시간이에요."
            count={userParkings.length}
            onAdd={openParkingSheet}
          />

          {userParkings.length ? (
            <div className="flex flex-col gap-2.5">
              {userParkings.map((parking) => (
                <UserParkingCard
                  key={parking.id}
                  parking={parking}
                  canManage={parking.mine || isAdmin}
                  onEdit={() => setEditingParking(parking)}
                  onDelete={() => void deleteUserParking(parking.id)}
                  onReport={() =>
                    setReportTarget({
                      type: "user_parking",
                      id: parking.id,
                      hint: `${parking.nickname}님의 주차 팁 · ${parking.name}`,
                    })
                  }
                  showHidden={isAdmin}
                  restoring={restoringParking === parking.id}
                  onRestoreHidden={() => {
                    setRestoringParking(parking.id);
                    void restoreReportedContent("user_parking", parking.id).finally(() =>
                      setRestoringParking(null),
                    );
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md2 border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[18px] text-center">
              <div className="mb-[6px] text-[24px]">🚗</div>
              <p className="text-[12.5px] font-extrabold text-ink-2">아직 올라온 주차 팁이 없어요</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
                자주 쓰는 주차장을 첫 번째로 남겨주세요.
              </p>
            </div>
          )}

          <p className="wrap-any px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
            주차 요금·운영 시간은 2026 시즌 구단 공지 기준입니다. 방문 전 구단 앱 공지와 티켓링크 예약
            페이지를 다시 확인하세요.
          </p>
        </>
      ) : (
        <>
          <div className="-mx-4 flex border-b border-line px-3">
            {tabs.map(([id, label, count]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex-1 whitespace-nowrap py-[10px] text-[13px] font-extrabold tracking-tight2 transition ${
                  tab === id ? "text-brand" : "text-ink-faint"
                }`}
              >
                {label}
                <span className="ml-[3px] text-[10.5px] font-extrabold opacity-70">{count}</span>
                {tab === id ? (
                  <span className="absolute inset-x-3 bottom-[-1px] h-[2.5px] rounded-full bg-brand" />
                ) : null}
              </button>
            ))}
          </div>

          {tab === "user" ? (
            <div className="flex items-center gap-2.5 rounded-md2 border border-[#D7E6FA] bg-[#F2F8FF] p-3.5">
              <div className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-[#DCEAFF] text-lg">
                🦁
              </div>
              <div>
                <div className="text-[13px] font-extrabold text-[#0B4A96]">
                  직관러가 직접 다녀온 맛집
                </div>
                <div className="mt-[3px] wrap-any text-[11.5px] leading-relaxed text-ink-faint">
                  구장 안팎에서 먹어본 메뉴와 팁을 남겨주세요. 직접 올린 글은 내가 삭제할 수 있어요.
                </div>
              </div>
            </div>
          ) : null}

          {showFilters ? (
            <div className="-mx-4 flex gap-[7px] overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(
                [
                  ["all", "전체", foods.length],
                  ["in", "구장 안", insideCount],
                  ["out", "구장 밖(입장 전)", foods.length - insideCount],
                ] as [FoodFilter, string, number][]
              ).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`inline-flex flex-none items-center gap-[5px] rounded-full border px-[13px] py-2 text-[12.5px] font-bold transition ${
                    filter === id
                      ? "border-brand bg-brand text-white shadow-[0_3px_10px_-2px_rgba(7,76,161,.5)]"
                      : "border-line bg-white text-[#475467]"
                  }`}
                >
                  {label}
                  <span className="ml-px text-[10.5px] font-extrabold opacity-70">{count}</span>
                </button>
              ))}
            </div>
          ) : null}

          {/* '전체' 탭에서는 직관러 맛집을 먼저 보여주고, 그 아래에 야구장 푸드가 이어집니다. */}
          {tab !== "stadium" ? (
            <>
              <SectionHead
                title="🦁 직관러 맛집"
                sub="직접 다녀온 직관러가 올린 맛집이에요. 나도 한 곳 올려보세요."
                count={userFoods.length}
                onAdd={openFoodSheet}
                addLabel="맛집 추가"
              />

              {userFoods.length ? (
                <div className="flex flex-col gap-2.5">
                  {userFoods.map((food) => (
                    <UserFoodCard
                      key={food.id}
                      food={food}
                      canManage={food.mine || isAdmin}
                      onEdit={() => setEditingFood(food)}
                      onDelete={() => void deleteUserFood(food.id)}
                      onReport={() =>
                        setReportTarget({
                          type: "user_food",
                          id: food.id,
                          hint: `${food.nickname}님의 맛집 · ${food.name}`,
                        })
                      }
                      onOpenPhoto={(index) =>
                        setLightbox({ urls: food.photoUrls ?? [], index })
                      }
                    />
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openFoodSheet}
                  className="w-full rounded-md2 border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[18px] text-center"
                >
                  <div className="mb-[6px] text-[24px]">🍗</div>
                  <p className="text-[12.5px] font-extrabold text-ink-2">아직 올라온 맛집이 없어요</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
                    첫 직관러 맛집을 남겨주세요.
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-brand px-[13px] py-[7px] text-[11.5px] font-extrabold text-white shadow-[0_3px_10px_-2px_rgba(7,76,161,.5)]">
                    <Icon name="plus" size={12} strokeWidth={2.6} /> 맛집 추가
                  </span>
                </button>
              )}
            </>
          ) : null}

          {tab === "all" ? (
            <div className="mt-1.5 flex items-center gap-2.5 px-0.5">
              <h2 className="text-[13px] font-extrabold tracking-tight2 text-ink-2">🏟️ 야구장 푸드</h2>
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10.5px] font-extrabold text-ink-faint">{filtered.length}</span>
            </div>
          ) : null}

          {tab !== "user" ? (
            <div className="flex flex-col gap-2.5">
              <FoodPicker foods={filtered} selected={picked} onSelect={setPicked} />
              {pickedFood ? <FoodCard food={pickedFood} /> : <FoodOverview foods={filtered} />}
            </div>
          ) : null}

          {tab !== "user" ? (
            <p className="wrap-any px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
              매장·위치·메뉴는 2026 시즌 구단 식음매장 안내와 직관 후기 기준이에요. 가격·운영은 바뀔 수 있으니 방문 전 구단 공지로 확인하세요. 평점·웨이팅은 앱 자체 표본입니다.
            </p>
          ) : null}
        </>
      )}

      <UserFoodSheet
        open={foodSheetOpen || Boolean(editingFood)}
        onClose={() => {
          setFoodSheetOpen(false);
          setEditingFood(null);
        }}
        editing={editingFood}
      />
      <UserParkingSheet
        open={parkingSheetOpen || Boolean(editingParking)}
        onClose={() => {
          setParkingSheetOpen(false);
          setEditingParking(null);
        }}
        editing={editingParking}
      />

      {lightbox ? (
        <PhotoLightbox
          state={lightbox}
          onClose={() => setLightbox(null)}
          onPick={(index) => setLightbox({ ...lightbox, index })}
          label="맛집 사진"
        />
      ) : null}

      <ReportSheet
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetType={reportTarget?.type ?? "user_food"}
        targetId={reportTarget?.id ?? ""}
        targetHint={reportTarget?.hint}
      />
    </div>
  );
}
