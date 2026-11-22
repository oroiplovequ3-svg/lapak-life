"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Icon, Stars } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Sheet } from "@/components/sheet";
import { ZONE_ORDER, zoneFullName } from "@/lib/data/zones";
import {
  MAX_REVIEW_PHOTOS,
  formatPhotoSize,
  prepareReviewPhoto,
  type PreparedPhoto,
} from "@/lib/image";
import type { ZoneReview } from "@/lib/types";

interface ReviewSheetProps {
  open: boolean;
  onClose: () => void;
  initialZone?: string;
  /** 수정할 후기 — 넘기면 '수정' 모드로 열립니다 */
  editing?: ZoneReview | null;
  /** 등록 후 이동할 구역 */
  onPosted?: (zoneCode: string) => void;
}

export function ReviewSheet({
  open,
  onClose,
  initialZone = "T3",
  editing = null,
  onPosted,
}: ReviewSheetProps) {
  const { createReview, updateReview, isAdmin } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [zone, setZone] = useState(initialZone);
  const [seatDetail, setSeatDetail] = useState("");
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 시트를 열 때마다 수정할 후기 또는 지금 고른 구역으로 채웁니다.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setZone(editing.zoneCode);
      setSeatDetail(editing.seatDetail);
      setStars(editing.stars);
      setBody(editing.body);
      setPhotos(
        (editing.photoUrls ?? []).map((url, index) => ({
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
      return;
    }
    setZone(initialZone);
    setSeatDetail("");
    setStars(5);
    setBody("");
    setPhotos([]);
    setBusy(false);
    setSubmitting(false);
  }, [open, initialZone, editing]);

  const reset = () => {
    setBody("");
    setSeatDetail("");
    setStars(5);
    setPhotos([]);
  };

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setSubmitting(true);
    const input = {
      zoneCode: zone,
      seatDetail: seatDetail.trim(),
      stars,
      body: text,
      photoUrls: photos.map((photo) => photo.dataUrl),
    };
    const ok = editing
      ? await updateReview(editing.id, input)
      : await createReview(input);
    setSubmitting(false);
    if (ok) {
      if (!editing) reset();
      onClose();
      onPosted?.(zone);
    }
  };

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // 같은 사진을 다시 고를 수 있도록 값을 비웁니다.
    event.target.value = "";
    if (!picked.length) return;

    const room = MAX_REVIEW_PHOTOS - photos.length;
    if (room <= 0) {
      toast(`사진은 ${MAX_REVIEW_PHOTOS}장까지 첨부할 수 있어요`);
      return;
    }
    if (picked.length > room) {
      toast(`사진은 ${MAX_REVIEW_PHOTOS}장까지라 ${room}장만 추가할게요`);
    }

    setBusy(true);
    for (const file of picked.slice(0, room)) {
      try {
        const prepared = await prepareReviewPhoto(file);
        setPhotos((prev) =>
          prev.length >= MAX_REVIEW_PHOTOS ? prev : [...prev, prepared],
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
      title={editing ? "직관 시야 후기 수정" : "직관 시야 후기 쓰기"}
      onClose={onClose}
      dirty={
        editing
          ? body !== editing.body ||
            seatDetail !== editing.seatDetail ||
            zone !== editing.zoneCode ||
            stars !== editing.stars
          : Boolean(body.trim() || seatDetail.trim() || photos.length)
      }
      dirtyMessage={
        editing ? "수정 중인 후기가 사라져요. 닫을까요?" : "작성 중인 후기가 사라져요. 닫을까요?"
      }
    >
      <span className="text-xs font-extrabold text-ink-2">구역</span>
      <div className="relative">
        <select
          value={zone}
          onChange={(event) => setZone(event.target.value)}
          aria-label="후기를 남길 구역"
          className="w-full appearance-none rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] pr-9 text-[13px] font-bold text-ink-2 outline-none"
        >
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

      <span className="text-xs font-extrabold text-ink-2">
        좌석 상세 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={seatDetail}
        onChange={(event) => setSeatDetail(event.target.value)}
        placeholder="예: T3-2 · 3열 10번"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">별점</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setStars(n)} aria-label={`${n}점`}>
            <span className={n <= stars ? "text-[#F79009]" : "text-[#E4E7EC]"}>
              <Icon name="star" size={26} strokeWidth={1.4} filled />
            </span>
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">한 줄 후기</span>
      <textarea
        value={body}
        maxLength={300}
        onChange={(event) => setBody(event.target.value)}
        placeholder="시야·햇빛·응원 분위기 등 실제로 느낀 점을 남겨주세요."
        rows={5}
        className="w-full shrink-0 resize-none rounded-[14px] border border-line bg-[#FAFBFC] px-[13px] py-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />
      <div className="-mt-2 text-right text-[10.5px] font-bold text-[#B4BCC9]">
        {body.length} / 300
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xs font-extrabold text-ink-2">
          사진 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
        </span>
        <span className="text-[10.5px] font-bold text-ink-faint">
          {photos.length} / {MAX_REVIEW_PHOTOS}
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-[12px] border border-line bg-[#F5F7FA]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt={photo.name}
              className="h-full w-full object-cover"
            />
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

        {photos.length < MAX_REVIEW_PHOTOS ? (
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
        aria-label="시야 후기 사진 선택"
      />

      <p className="-mt-1 break-keep text-[10.5px] leading-relaxed text-[#AEB6C2]">
        최대 {MAX_REVIEW_PHOTOS}장 · 폰으로 찍은 사진도 등록할 때 자동으로 줄여서 올려요.
        {photos.length ? ` 지금 ${formatPhotoSize(totalSize)}` : ""}
      </p>

      {editing && !editing.mine && isAdmin ? (
        <p className="break-keep text-[10.5px] font-bold leading-relaxed text-[#B54708]">
          마스터 권한으로 다른 직관러의 후기를 수정합니다.
        </p>
      ) : null}

      <div className="flex gap-2 pt-0.5">
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
          {submitting ? "저장 중…" : editing ? "수정 완료" : "후기 등록"}
        </button>
      </div>
    </Sheet>
  );
}

export function StarsPreview({ value }: { value: number }) {
  return <Stars value={value} />;
}
