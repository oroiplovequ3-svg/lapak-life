"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/avatar";
import { ComposeSheet } from "@/components/compose-sheet";
import { DeleteButton } from "@/components/delete-button";
import { Icon } from "@/components/icons";
import { PostMedia } from "@/components/media-illustration";
import { useApp } from "@/components/providers/app-provider";
import { categoryOf, FEED_FILTERS, type FilterId } from "@/lib/data/categories";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment, Post } from "@/lib/types";

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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [saving, setSaving] = useState(false);

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
          <p className="min-w-0 flex-1 break-keep pt-px text-[12.5px] leading-relaxed text-ink-2">
            <span className="mr-[5px] text-xs font-extrabold text-ink">{comment.nickname}</span>
            {comment.body}
          </p>
          {canManage ? (
            <span className="flex flex-none items-center">
              <button
                type="button"
                aria-label="댓글 수정"
                onClick={() => setEditing(true)}
                className="rounded-lg p-1.5 text-[#C4CBD6] transition hover:text-brand"
              >
                <Icon name="edit" size={12} />
              </button>
              <DeleteButton what="댓글" size={12} onDelete={onDelete} className="mt-[-4px]" />
            </span>
          ) : null}
        </div>
      )}
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
  } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pop, setPop] = useState(false);

  const comments = commentsByPost[post.id] ?? [];
  const canManage = post.mine || isAdmin;

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
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[13.5px] font-extrabold tracking-tight">{post.nickname}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                post.mine ? "bg-brand text-white" : "bg-brand-50 text-brand-600"
              }`}
            >
              {post.badge}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-[5px] text-[11px] text-ink-faint">
            {post.seatDetail ? <span>{post.seatDetail}</span> : null}
            {post.seatDetail ? <span className="h-0.5 w-0.5 rounded-full bg-[#D0D5DD]" /> : null}
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

      <p className="mt-[9px] whitespace-pre-wrap break-keep text-sm leading-[1.65] text-[#1D2939]">
        {post.body}
      </p>

      {post.media ? <PostMedia media={post.media} /> : null}

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
        <span className="ml-auto inline-flex items-center gap-[5px] text-xs font-bold text-ink-faint">
          <Icon name="share" size={15} />
        </span>
      </div>

      {open ? (
        <div className="mt-2.5 flex flex-col gap-2 border-t border-line-soft pt-2.5">
          {commentsLoaded[post.id] && comments.length === 0 ? (
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
  const { posts, ready, loadError } = useApp();
  const [filter, setFilter] = useState<FilterId>("all");
  const [bannerClosed, setBannerClosed] = useState(false);
  /** 수정 중인 글 (있으면 수정 시트를 엽니다) */
  const [editingPost, setEditingPost] = useState<Post | null>(null);

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

  const list = filter === "all" ? posts : posts.filter((post) => post.category === filter);

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
        <Image
          src="/images/lapak-mascot-hero.png"
          alt=""
          aria-hidden
          width={192}
          height={260}
          className="pointer-events-none absolute bottom-[56px] right-2 h-[130px] w-auto select-none"
        />
        <div className="pointer-events-none absolute -right-14 -top-[72px] h-[190px] w-[190px] rounded-full bg-white/[.18] blur-[1px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-[30px] h-[170px] w-[170px] rounded-full border-[26px] border-white/[.06]" />
        <div className="relative flex items-center gap-1.5 text-[11.5px] font-bold text-white/80">
          <span className="inline-flex items-center gap-[5px] rounded-full bg-white/[.16] px-[9px] py-[3px] text-[10.5px] font-extrabold tracking-wide">
            <i className="h-[5px] w-[5px] animate-blink rounded-full bg-[#5CE1A0] shadow-[0_0_0_3px_rgba(92,225,160,.22)]" />
            2026 시즌
          </span>
          <span>라팍 · 오프시즌</span>
        </div>
        <h2 className="relative mt-2.5 text-[22px] font-extrabold leading-[1.28] tracking-tight3">
          12년 만의 정상,
          <br />
          <span className="text-[#FFD77A]">V9</span>의 계절이 끝났다
        </h2>
        <p className="relative mt-1.5 text-[12.5px] leading-relaxed text-white/80">
          한국시리즈 4승 1패 · 정규시즌 2위
          <br />
          다음 시즌 직관 준비는 여기서 시작해요.
        </p>
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

      <div className="-mx-4 flex gap-[7px] overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEED_FILTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`inline-flex flex-none items-center gap-[5px] rounded-full border px-[13px] py-2 text-[12.5px] font-bold transition ${
              filter === c.id
                ? "border-brand bg-brand text-white shadow-[0_3px_10px_-2px_rgba(7,76,161,.5)]"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {c.label}
            <span className="ml-px text-[10.5px] font-extrabold opacity-70">
              {counts[c.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {loadError ? (
          <div className="rounded-md2 border border-[#FECDCA] bg-[#FEF3F2] p-4 text-center">
            <p className="text-[13px] font-extrabold text-[#B42318]">글을 불러오지 못했어요</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#B42318]/80">{loadError}</p>
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
          list.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              highlight={highlightedPostId === post.id}
              onEdit={() => setEditingPost(post)}
            />
          ))
        ) : (
          <div className="rounded-md2 border border-dashed border-[#D9DEE7] bg-[#FBFCFE] px-4 py-[22px] text-center">
            <div className="mb-[7px] text-[26px]">💬</div>
            <p className="text-[13px] font-extrabold text-ink-2">아직 글이 없어요</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">
              첫 글을 남겨보세요.
            </p>
          </div>
        )}
      </div>

      <p className="break-keep px-2.5 pt-1 text-center text-[10.5px] leading-relaxed text-[#AEB6C2]">
        인블루 · 실시간으로 글이 올라가는 삼성 라이온즈 팬 커뮤니티입니다.
      </p>

      <button
        type="button"
        onClick={onCompose}
        aria-label="새 글 쓰기"
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-[max(16px,calc(50%-199px))] z-30 grid h-[54px] w-[54px] place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand text-white shadow-[0_10px_22px_-6px_rgba(7,76,161,.7),0_2px_6px_rgba(16,24,40,.12)] transition active:scale-90"
      >
        <Icon name="plus" size={24} strokeWidth={2.2} />
      </button>

      <ComposeSheet
        open={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        editing={editingPost}
      />
    </div>
  );
}
