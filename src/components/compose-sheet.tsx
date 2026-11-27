"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Sheet } from "@/components/sheet";
import {
  ADMIN_ONLY_CATEGORY_IDS,
  writeCategoriesFor,
  type FilterId,
} from "@/lib/data/categories";
import { zoneFullName, ZONE_ORDER } from "@/lib/data/zones";
import {
  MAX_POST_PHOTOS,
  formatPhotoSize,
  preparePhoto,
  type PreparedPhoto,
} from "@/lib/image";
import type { CategoryId, Post } from "@/lib/types";

/** 좌석을 함께 남기는 카테고리 — 직관후기 · 실시간현장만 */
const SEAT_CATEGORY_IDS: CategoryId[] = ["review", "live"];

interface ComposeSheetProps {
  open: boolean;
  onClose: () => void;
  /** 수정할 글 — 넘기면 '수정' 모드로 열립니다 */
  editing?: Post | null;
  /** 등록·수정 성공 시 (예: 피드 새로고침·스크롤) */
  onPosted?: () => void;
  /**
   * 열 때 기본으로 골라 둘 카테고리 — 라팍톡에서 보고 있던 칩.
   * '전체'이거나 쓸 수 없는 카테고리(비마스터의 '공지')면 '직관후기'로 엽니다.
   * 마스터가 '공지' 탭에서 열면 '공지'가 그대로 기본 선택됩니다.
   */
  initialCategory?: FilterId | null;
}

/** 홈에서 보던 카테고리 → 글쓰기 기본 카테고리 */
function defaultWriteCategory(id: FilterId | null | undefined, isAdmin: boolean): CategoryId {
  if (!id || id === "all") return "review";
  if (!isAdmin && ADMIN_ONLY_CATEGORY_IDS.includes(id)) return "review";
  return id;
}

export function ComposeSheet({
  open,
  onClose,
  editing = null,
  onPosted,
  initialCategory = null,
}: ComposeSheetProps) {
  const { createPost, updatePost, user, configured, isAdmin } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<CategoryId>("review");
  /** 마스터만 공지를 고를 수 있습니다 (DB RLS 도 같은 규칙) */
  const categories = writeCategoriesFor(isAdmin);
  const [seatZone, setSeatZone] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 열 때마다 새 글 / 수정할 글로 채웁니다. (수정이면 붙어 있던 사진을 그대로 보여 줍니다)
  useEffect(() => {
    if (!open) return;
    setCategory(editing?.category ?? defaultWriteCategory(initialCategory, isAdmin));
    setSeatZone(editing?.seatZone ?? "");
    setBody(editing?.body ?? "");
    setPhotos(
      (editing?.photoUrls ?? []).map((url, index) => ({
        id: `keep-${index}`,
        dataUrl: url,
        width: 0,
        height: 0,
        bytes: 0,
        name: `기존 사진 ${index + 1}`,
      })),
    );
    setBusy(false);
    setSubmitting(false);
    // initialCategory 는 시트를 열 때의 값만 씁니다(카테고리를 바꿔도 다시 채우지 않음).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  /** 소통해요·굿즈에서는 좌석 항목을 숨기고 저장도 하지 않는다 */
  const withSeat = SEAT_CATEGORY_IDS.includes(category);
  const seatCode = withSeat ? seatZone || null : null;
  const photosChanged =
    photos.length !== (editing?.photoUrls ?? []).length ||
    photos.some((photo) => !photo.id.startsWith("keep-"));

  const submit = async () => {
    const text = body.trim();
    if (!text || submitting || busy) return;
    setSubmitting(true);
    const input = {
      category,
      body: text,
      seatZone: seatCode,
      seatDetail: seatCode ? zoneFullName(seatCode) : null,
      photoUrls: photos.map((photo) => photo.dataUrl),
    };
    const ok = editing
      ? await updatePost(editing.id, input)
      : await createPost(input);
    setSubmitting(false);
    if (ok) {
      setBody("");
      setSeatZone("");
      setPhotos([]);
      onClose();
      onPosted?.();
    }
  };

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // 같은 사진을 다시 고를 수 있도록 값을 비웁니다.
    event.target.value = "";
    if (!picked.length) return;

    const room = MAX_POST_PHOTOS - photos.length;
    if (room <= 0) {
      toast(`사진은 ${MAX_POST_PHOTOS}장까지 첨부할 수 있어요`);
      return;
    }
    if (picked.length > room) {
      toast(`사진은 ${MAX_POST_PHOTOS}장까지라 ${room}장만 추가할게요`);
    }

    setBusy(true);
    for (const file of picked.slice(0, room)) {
      try {
        const prepared = await preparePhoto(file);
        setPhotos((prev) =>
          prev.length >= MAX_POST_PHOTOS ? prev : [...prev, prepared],
        );
      } catch (error) {
        toast(error instanceof Error ? error.message : "사진을 첨부하지 못했어요");
      }
    }
    setBusy(false);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const totalSize = photos.reduce((sum, photo) => sum + photo.bytes, 0);

  return (
    <Sheet
      open={open}
      title={editing ? "글 수정" : "새 글 쓰기"}
      onClose={onClose}
      dirty={body.trim().length > 0 || seatZone !== (editing?.seatZone ?? "") || photosChanged}
      dirtyMessage={editing ? "수정 중인 내용이 사라져요. 닫을까요?" : "작성 중인 글이 사라져요. 닫을까요?"}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[13px] bg-white py-3 text-[13px] font-extrabold text-ink-2 ring-1 ring-line"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!body.trim() || submitting || busy}
            className="flex-1 rounded-[13px] bg-brand py-3 text-[13px] font-extrabold text-white shadow-brand disabled:bg-[#E4E7EC] disabled:text-ink-faint disabled:shadow-none"
          >
            {submitting ? "저장 중…" : editing ? "수정 완료" : "등록하기"}
          </button>
        </div>
      }
    >
      <span className="text-xs font-extrabold text-ink-2">카테고리</span>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              category === c.id
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {category === "notice" ? (
        <p className="rounded-[11px] bg-[#EEF4FD] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#063E84]">
          📌 공지 글은 라팍톡·공지 탭 <b className="font-extrabold">맨 위에 고정</b>되어 모든
          회원에게 보여요. 안내·알림 소식을 적어 주세요.
        </p>
      ) : null}

      {withSeat && (
        <>
          <span className="text-xs font-extrabold text-ink-2">
            좌석 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
          </span>
          <div className="relative">
            <select
              value={seatZone}
              onChange={(event) => setSeatZone(event.target.value)}
              className="w-full appearance-none rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] pr-9 text-[13px] font-bold text-ink-2 outline-none"
            >
              <option value="">좌석을 선택하지 않음</option>
              {ZONE_ORDER.map((code) => (
                <option key={code} value={code}>
                  {zoneFullName(code)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
              <Icon name="chevron" size={15} />
            </span>
          </div>
        </>
      )}

      <span className="text-xs font-extrabold text-ink-2">내용</span>
      <textarea
        value={body}
        maxLength={300}
        onChange={(event) => setBody(event.target.value)}
        placeholder="라팍에서 있었던 일을 남겨보세요. 좌석 후기, 응원 팁, 먹거리 정보 모두 좋아요."
        rows={5}
        className="min-h-[120px] w-full shrink-0 resize-none rounded-[14px] border border-line bg-[#FAFBFC] px-[13px] py-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />
      <div className="-mt-2 text-right text-[10.5px] font-bold text-[#B4BCC9]">
        {body.length} / 300
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xs font-extrabold text-ink-2">
          사진 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
        </span>
        <span className="text-[10.5px] font-bold text-ink-faint">
          {photos.length} / {MAX_POST_PHOTOS}
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-[12px] border border-line bg-[#F5F7FA]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt={photo.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(photo.id)}
              aria-label="사진 삭제"
              className="absolute right-1 top-1 grid h-[22px] w-[22px] place-items-center rounded-full bg-ink/65 text-white shadow-sm backdrop-blur-sm"
            >
              <Icon name="close" size={11} strokeWidth={2.8} />
            </button>
            <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1 pt-3 text-[9px] font-bold text-white">
              {photo.bytes ? formatPhotoSize(photo.bytes) : "기존 사진"}
            </span>
          </div>
        ))}

        {photos.length < MAX_POST_PHOTOS ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={`grid aspect-square place-items-center rounded-[12px] border border-dashed transition active:scale-[.98] ${
              busy
                ? "border-brand-100 bg-brand-50 text-brand"
                : "border-[#CFD8E5] bg-[#FAFBFC] text-ink-faint"
            }`}
          >
            <span className="flex flex-col items-center gap-[3px]">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-[0_1px_3px_rgba(16,24,40,.12)]">
                <Icon name="plus" size={15} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-extrabold">
                {busy ? "줄이는 중…" : "사진 추가"}
              </span>
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => void addPhotos(event)}
        className="hidden"
        aria-label="글 사진 선택"
      />

      <p className="-mt-1 break-keep text-[10.5px] leading-relaxed text-[#AEB6C2]">
        최대 {MAX_POST_PHOTOS}장 · 폰으로 찍은 사진도 등록할 때 자동으로 줄여서 올려요.
        {totalSize ? ` 지금 ${formatPhotoSize(totalSize)}` : ""}
      </p>

      {configured && !user && !editing && (
        <p className="rounded-[11px] bg-brand-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
          등록하려면 구글 로그인이 필요해요. 로그인한 뒤에 남겨주세요.
        </p>
      )}

      {editing && !editing.mine && isAdmin ? (
        <p className="rounded-[11px] bg-[#FFF7E8] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#B54708]">
          마스터 권한으로 다른 직관러의 글을 수정합니다.
        </p>
      ) : null}
    </Sheet>
  );
}
