"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/avatar";
import { ComposeSheet } from "@/components/compose-sheet";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";
import { PostMedia } from "@/components/media-illustration";
import { Pagination } from "@/components/pagination";
import {
  PhotoLightbox,
  PhotoTiles,
  type PhotoLightboxState,
} from "@/components/photo-gallery";
import { PostNo } from "@/components/post-no";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { HiddenBadge, ReportButton, RestoreButton } from "@/components/report-controls";
import { ReportSheet } from "@/components/report-sheet";
import { categoryOf, FEED_FILTERS, type FilterId } from "@/lib/data/categories";
import { ZONE_BY_CODE } from "@/lib/data/zones";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment, Post } from "@/lib/types";

/** 라팍톡 피드 한 페이지에 보여줄 글 수 (전체·카테고리 모두 5개씩) */
const POSTS_PER_PAGE = 5;

/**
 * 카드 상세 줄에 쓸 좌석 문구 — 바로 위 배지가 이미 같은 구역(예: 스윗박스)을
 * 보여 주므로 "스윗박스 / 스윗박스"처럼 두 번 나오지 않게 구역 이름을 덜어냅니다.
 */
function seatDetailText(post: Post): string {
  const detail = (post.seatDetail ?? "").trim();
  if (!detail) return "";
  const zone = post.seatZone ? ZONE_BY_CODE[post.seatZone] : undefined;
  const names = [
    post.badge !== "나" ? post.badge : null,
    zone?.short,
    zone?.name,
    zone?.sub,
  ]
    .filter((name): name is string => Boolean(name && name.trim()))
    .sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (detail === name) return "";
    if (detail.startsWith(name)) {
      return detail
        .slice(name.length)
        .replace(/^[\s·,/]+/, "")
        .trim();
    }
  }
  return detail;
}

function CommentRow({
  comment,
  canManage,
  onSave,
  onDelete,
}: {
  comment: Comment;
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
              void restoreReportedContent("comment", comment.id).finally(() => setRestoring(false));
            }}
          />
        </div>
      ) : null}
      <div className="flex items-start gap-[7px]">
      <Avatar
        nickname={comment.nickname}
        avatarUrl={comment.avatarUrl}
        size={25}
        className="bg-brand-50 text-[10.5px] text-brand"
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
            className="w-full rounded-xl border border-[#C7D7F0] bg-white px-3 py-[8px] text-[12.5px] text-ink outline-none"
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
          <p className="min-w-0 flex-1 wrap-any pt-px text-[12.5px] leading-relaxed text-ink-2">
            <span className="mr-[5px] text-xs font-extrabold text-ink">{comment.nickname}</span>
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
                  <Icon name="edit" size={12} />
                </button>
                <DeleteButton what="댓글" size={12} onDelete={onDelete} className="mt-[-4px]" />
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
        targetType="comment"
        targetId={comment.id}
        targetHint={`${comment.nickname}님의 댓글`}
      />
    </div>
  );
}

function PostCard({
  post,
  highlight,
  onEdit,
}: {
  post: Post;
  highlight?: boolean;
  onEdit: () => void;
}) {
  const {
    toggleLike,
    loadComments,
    addComment,
    updateComment,
    deletePost,
    deleteComment,
    commentsByPost,
    commentsLoaded,
    isAdmin,
    restoreReportedContent,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pop, setPop] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [lightbox, setLightbox] = useState<PhotoLightboxState | null>(null);
  const toast = useToast();

  const comments = commentsByPost[post.id] ?? [];
  const canManage = post.mine || isAdmin;
  const seatDetail = seatDetailText(post);

  /** 이 글의 공유 링크 — /?post=딥링크로 들어오면 이 글로 바로 이동합니다. */
  const shareUrl = () =>
    typeof window === "undefined"
      ? `https://inblue-fan.vercel.app/?post=${post.id}`
      : `${window.location.origin}/?post=${post.id}`;

  const share = async () => {
    const url = shareUrl();
    const text = post.body.length > 70 ? `${post.body.slice(0, 70)}…` : post.body;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "인블루 · 라팍톡", text, url });
        return;
      } catch (error) {
        // 사용자가 공유 창을 직접 닫았을 때는 복사 안내도 띄우지 않습니다.
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("게시글 링크를 복사했어요");
    } catch {
      toast("공유 링크를 복사하지 못했어요. 주소창의 링크를 복사해 주세요.");
    }
  };

  const toggle = () => {
    setOpen((prev) => !prev);
    if (!open) void loadComments(post.id);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await addComment(post.id, text);
    setSending(false);
    if (ok) setDraft("");
  };

  return (
    <article
      className={`rounded-md2 border border-line bg-white px-3.5 pb-[11px] pt-[13px] shadow-card ${
        highlight ? "animate-flash" : ""
      }`}
      data-post-id={post.id}
    >
      <div className="flex items-center gap-2">
        <Avatar
          nickname={post.nickname}
          avatarUrl={post.avatarUrl}
          size={36}
          className={
            post.mine
              ? "bg-gradient-to-br from-brand-500 to-brand text-[13.5px] text-white"
              : "bg-brand-50 text-[13.5px] text-brand"
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <span className="wrap-any text-[13.5px] font-extrabold tracking-tight">{post.nickname}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                post.mine ? "bg-brand text-white" : "bg-brand-50 text-brand-600"
              }`}
            >
              {post.badge}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-[5px] text-[11px] text-ink-faint">
            <PostNo no={post.postNo} />
            {post.postNo ? (
              <span className="h-0.5 w-0.5 rounded-full bg-[#D0D5DD]" />
            ) : null}
            {seatDetail ? <span className="wrap-any">{seatDetail}</span> : null}
            {seatDetail ? <span className="h-0.5 w-0.5 rounded-full bg-[#D0D5DD]" /> : null}
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
        <span
          className="rounded-md px-[7px] py-[2.5px] text-[10.5px] font-extrabold"
          style={{ color: "#0A58CA", background: "#EAF1FD" }}
        >
          {categoryOf(post.category).label}
        </span>
        {canManage ? (
          <span className="ml-[-2px] flex flex-none items-center">
            <button
              type="button"
              aria-label="글 수정"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-[#C4CBD6] transition hover:text-brand"
            >
              <Icon name="edit" size={14} />
            </button>
            <DeleteButton what="글" size={14} onDelete={() => deletePost(post.id)} />
          </span>
        ) : null}
      </div>

      {post.isHidden && isAdmin ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <HiddenBadge className="flex-1" />
          <RestoreButton
            busy={restoring}
            onClick={() => {
              setRestoring(true);
              void restoreReportedContent("post", post.id).finally(() => setRestoring(false));
            }}
          />
        </div>
      ) : null}

      <p className="mt-[9px] whitespace-pre-wrap wrap-any text-sm leading-[1.65] text-[#1D2939]">
        {post.body}
      </p>

      {post.media ? <PostMedia media={post.media} /> : null}

      <PhotoTiles
        urls={post.photoUrls}
        label="글 사진"
        onOpen={(index) => setLightbox({ urls: post.photoUrls, index })}
      />

      <div className="mt-[11px] flex items-center gap-[15px] border-t border-line-soft pt-[9px]">
        <button
          type="button"
          onClick={() => {
            setPop(true);
            window.setTimeout(() => setPop(false), 360);
            void toggleLike(post.id);
          }}
          className={`inline-flex items-center gap-[5px] border-none bg-transparent p-0 text-xs font-bold ${
            post.liked ? "text-[#E23B4E]" : "text-ink-muted"
          }`}
        >
          <span className={pop ? "animate-pop" : ""}>
            <Icon name="heart" size={15} filled={post.liked} />
          </span>
          <span>{post.likeCount}</span>
        </button>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-[5px] border-none bg-transparent p-0 text-xs font-bold text-ink-muted"
        >
          <Icon name="comment" size={15} />
          <span>댓글 {post.commentCount}</span>
        </button>
        <button
          type="button"
          onClick={() => void share()}
          aria-label="게시글 공유"
          className="inline-flex items-center gap-[5px] border-none bg-transparent p-0 text-xs font-bold text-ink-muted transition active:text-brand"
        >
          <Icon name="share" size={15} />
          <span>공유</span>
        </button>
        <span className="ml-auto flex flex-none items-center gap-1">
          <ReportButton
            count={post.reportCount ?? 0}
            manage={canManage}
            onReport={() => setReportOpen(true)}
          />
        </span>
      </div>

      {open ? (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-line-soft pt-2.5">          {commentsLoaded[post.id] && comments.length === 0 ? (
            <p className="py-1 text-[11.5px] text-ink-faint">첫 댓글을 남겨보세요.</p>
          ) : null}
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              canManage={comment.mine || isAdmin}
              onSave={(body) => updateComment(post.id, comment.id, body)}
              onDelete={() => void deleteComment(post.id, comment.id)}
            />
          ))}
          <div className="flex items-center gap-[7px]">
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
              className="min-w-0 flex-1 rounded-xl border border-line bg-[#F9FAFB] px-3 py-[9px] text-[12.5px] text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className="flex-none rounded-[11px] bg-brand px-[13px] py-[9px] text-xs font-extrabold text-white disabled:bg-[#E4E7EC] disabled:text-ink-faint"
            >
              등록
            </button>
          </div>
        </div>
      ) : null}

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetHint={`${post.nickname}님의 글`}
      />

      {lightbox ? (
        <PhotoLightbox
          state={lightbox}
          label="글 사진"
          onClose={() => setLightbox(null)}
          onPick={(index) => setLightbox({ ...lightbox, index })}
        />
      ) : null}
    </article>
  );
}

interface HomeScreenProps {
  onCompose: () => void;
  highlightedPostId: string | null;
  onGoSeat?: () => void;
  onGoFood?: () => void;
}

export function HomeScreen({ onCompose, highlightedPostId, onGoSeat, onGoFood }: HomeScreenProps) {
  const { posts, ready, loadError, reload } = useApp();
  const [filter, setFilter] = useState<FilterId>("all");
  const [bannerClosed, setBannerClosed] = useState(false);
  /** 수정 중인 글 (있으면 수정 시트를 엽니다) */
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  /** 지금 보고 있는 페이지 (5개씩) */
  const [page, setPage] = useState(1);
  const feedRef = useRef<HTMLDivElement | null>(null);

  // 검색·내 글에서 특정 글로 들어오면, 지금 고른 카테고리에 가려 보이지 않는 일이 없도록
  // 전체 필터로 돌려 놓습니다.
  useEffect(() => {
    if (highlightedPostId) setFilter("all");
  }, [highlightedPostId]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: posts.length };
    for (const post of posts) {
      result[post.category] = (result[post.category] ?? 0) + 1;
    }
    return result;
  }, [posts]);

  const list = useMemo(
    () => (filter === "all" ? posts : posts.filter((post) => post.category === filter)),
    [posts, filter],
  );
  const pageCount = Math.max(1, Math.ceil(list.length / POSTS_PER_PAGE));
  // 글이 지워지거나 카테고리를 바꿔 페이지 수가 줄면 범위를 넘지 않게 맞춥니다.
  const currentPage = Math.min(page, pageCount);
  const pagedList = list.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  // 카테고리를 바꾸면 그 카테고리의 첫 페이지부터 보여줍니다.
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // 새 글을 쓰면 맨 위(1페이지)로 돌아가 방금 쓴 글이 보이게 합니다.
  const prevCount = useRef(posts.length);
  useEffect(() => {
    if (posts.length > prevCount.current) setPage(1);
    prevCount.current = posts.length;
  }, [posts.length]);

  // 공유 링크(?post=)나 신고 관리에서 들어온 글이 2페이지 뒤에 있으면 그 페이지로 이동하고,
  // 화면에 그려진 뒤 그 카드로 스크롤합니다.
  const jumpedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!highlightedPostId) {
      jumpedFor.current = null;
      return;
    }
    if (jumpedFor.current === highlightedPostId) return;
    const index = posts.findIndex((post) => post.id === highlightedPostId);
    if (index < 0) return;
    jumpedFor.current = highlightedPostId;
    setPage(Math.floor(index / POSTS_PER_PAGE) + 1);
    const timer = window.setTimeout(() => {
      document
        .querySelector(`[data-post-id="${highlightedPostId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 240);
    return () => window.clearTimeout(timer);
  }, [highlightedPostId, posts]);

  /** 페이지를 바꾸면 피드 맨 위로 올라갑니다. */
  function goPage(next: number) {
    const target = Math.min(Math.max(1, next), pageCount);
    if (target === currentPage) return;
    setPage(target);
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-[30px] pt-3.5">
      {bannerClosed || isSupabaseConfigured ? null : (
        <div className="flex items-center gap-2 rounded-[14px] bg-[#0F172A] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#E6EDF8] shadow-card">
          <span className="flex-none rounded-md bg-[#2F6FE0] px-1.5 py-[3px] text-[9px] font-extrabold tracking-widest text-white">
            DEMO
          </span>
          <span>
            <b className="font-bold text-white">데모 모드</b> · 글과 기록은 샘플 데이터예요.
          </span>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setBannerClosed(true)}
            className="ml-auto grid h-[22px] w-[22px] flex-none place-items-center rounded-lg bg-white/10 text-xs text-white"
          >
            ✕
          </button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#063E84] via-brand to-brand-500 px-[17px] pb-[15px] pt-[17px] text-white shadow-brand">
        <div className="pointer-events-none absolute -right-14 -top-[72px] h-[190px] w-[190px] rounded-full bg-white/[.18] blur-[1px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-[30px] h-[170px] w-[170px] rounded-full border-[26px] border-white/[.06]" />
        {/* 글과 마스코트를 한 줄에 두고, 마스코트 발끝을 글 마지막 줄에 맞춰 CTA 버튼 바로 위에 서게 합니다. */}
        <div className="relative flex items-end gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/80">
              <span className="inline-flex items-center gap-[5px] rounded-full bg-white/[.16] px-[9px] py-[3px] text-[10.5px] font-extrabold tracking-wide">
                <i className="h-[5px] w-[5px] animate-blink rounded-full bg-[#5CE1A0] shadow-[0_0_0_3px_rgba(92,225,160,.22)]" />
                2026 시즌
              </span>
              <span>라팍 · 오프시즌</span>
            </div>
            <h2 className="mt-2.5 text-[22px] font-extrabold leading-[1.28] tracking-tight3">
              12년 만의 정상,
              <br />
              <span className="text-[#FFD77A]">V9</span>의 계절이 끝났다
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/80">
              한국시리즈 4승 1패 · 정규시즌 2위
              <br />
              다음 시즌 직관 준비는 여기서 시작해요.
            </p>
          </div>
          <Image
            src="/images/lapak-mascot-hero.png"
            alt=""
            aria-hidden
            width={440}
            height={543}
            className="pointer-events-none -mb-[7px] h-[124px] w-auto flex-none select-none drop-shadow-[0_10px_16px_rgba(3,20,50,.32)]"
          />
        </div>
        <div className="relative mt-3.5 flex gap-2">
          <button
            type="button"
            onClick={onGoSeat}
            className="flex-1 rounded-xl bg-white/[.92] py-2.5 text-[12.5px] font-extrabold text-brand"
          >
            좌석 시야 보기
          </button>
          <button
            type="button"
            onClick={onGoFood}
            className="flex-1 rounded-xl bg-white/[.14] py-2.5 text-[12.5px] font-extrabold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.24)]"
          >
            먹거리·주차
          </button>
        </div>
      </section>

      {/* 칩 6개가 390px 한 줄(358px)에는 다 들어가지 않아 가로 스크롤로 마지막 칩이 잘렸습니다.
          390·430px 모두에서 3×2 그리드로 한 번에 다 보이게 두고, 칩 안 글자는 줄바꿈하지 않습니다. */}
      <div className="grid grid-cols-3 gap-[6px]">
        {FEED_FILTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`flex items-center justify-center gap-[5px] whitespace-nowrap rounded-full border px-2 py-2 text-[12.5px] font-bold transition ${
              filter === c.id
                ? "border-brand bg-brand text-white shadow-[0_3px_10px_-2px_rgba(7,76,161,.5)]"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {c.label}
            <span className="text-[10.5px] font-extrabold opacity-70">
              {counts[c.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div ref={feedRef} className="flex scroll-mt-3 flex-col gap-2.5">
        {loadError ? (
          <div className="rounded-md2 border border-[#FECDCA] bg-[#FEF3F2] p-4 text-center">
            <p className="text-[13px] font-extrabold text-[#B42318]">글을 불러오지 못했어요</p>
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
        ) : !ready ? (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulseSoft h-[120px] rounded-md2 border border-line bg-white shadow-card"
              />
            ))}
          </>
        ) : list.length ? (
          pagedList.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              highlight={highlightedPostId === post.id}
              onEdit={() => setEditingPost(post)}
            />
          ))
        ) : (
          <div className="rounded-md2 border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[22px] text-center">
            <div className="mb-[7px] text-[26px]">{filter === "event" ? "🎉" : "💬"}</div>
            {filter === "event" ? (
              <>
                <p className="text-[13px] font-extrabold text-ink-2">
                  아직 등록된 이벤트가 없어요
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
                  이벤트 소식이 준비되면 운영자가 이곳에 올려드릴게요.
                </p>
              </>
            ) : posts.length > 0 ? (
              <>
                <p className="text-[13px] font-extrabold text-ink-2">
                  이 카테고리에 아직 글이 없어요
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
                  다른 카테고리를 보거나 여기에 첫 글을 남겨보세요.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-extrabold text-ink-2">아직 글이 없어요</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
                  첫 글을 남겨보세요.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <Pagination
        page={currentPage}
        pageCount={pageCount}
        onChange={goPage}
        label="라팍톡 글 목록 페이지"
      />

      <p className="wrap-any px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
        인블루 · 삼성 라이온즈 팬이라면 누구나 글을 남길 수 있는 커뮤니티입니다.
      </p>

      {/* 구글 OAuth 브랜딩 심사처럼 초기 HTML만 보는 크롤러도 찾을 수 있게,
          개인정보처리방침·이용약관은 홈 화면 하단에 실제 <a href>로 둡니다. */}
      <div className="flex items-center justify-center gap-2 pb-0.5 text-[10.5px] font-semibold text-[#9AA3B0]">
        <Link href="/terms" className="underline underline-offset-2">
          이용약관
        </Link>
        <span aria-hidden="true" className="text-[#CBD2DC]">
          ·
        </span>
        <Link href="/privacy" className="underline underline-offset-2">
          개인정보처리방침
        </Link>
      </div>

      {/* FAB는 뷰포트가 아니라 앱 컨테이너(최대 430px) 기준으로 앉아야 합니다.
          바깥 레이어를 컨테이너 폭에 맞춰 두어 390·430·데스크톱 모두 오른쪽 안쪽 16px에 놓입니다. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 mx-auto flex w-full max-w-[430px] justify-end px-4">
        <button
          type="button"
          onClick={onCompose}
          aria-label="새 글 쓰기"
          className="pointer-events-auto grid h-[54px] w-[54px] place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand text-white shadow-[0_10px_22px_-6px_rgba(7,76,161,.7),0_2px_6px_rgba(16,24,40,.12)] transition active:scale-90"
        >
          <Icon name="plus" size={24} strokeWidth={2.2} />
        </button>
      </div>

      <ComposeSheet
        open={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        editing={editingPost}
      />
    </div>
  );
}
