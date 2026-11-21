"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Icon, Stars } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Sheet } from "@/components/sheet";
import { ZONE_ORDER, ZONE_BY_CODE } from "@/lib/data/zones";
import {
  MAX_REVIEW_PHOTOS,
  formatPhotoSize,
  prepareReviewPhoto,
  type PreparedPhoto,
} from "@/lib/image";

interface ReviewSheetProps {
  open: boolean;
  onClose: () => void;
  initialZone?: string;
  /** 등록 후 이동할 구역 */
  onPosted?: (zoneCode: string) => void;
}

export function ReviewSheet({ open, onClose, initialZone = "T3", onPosted }: ReviewSheetProps) {
  const { createReview } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [zone, setZone] = useState(initialZone);
  const [seatDetail, setSeatDetail] = useState("");
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 시트를 열 때마다 지금 고른 구역이 미리 선택되게 맞춥니다.
  useEffect(() => {
    if (open) setZone(initialZone);
  }, [open, initialZone]);

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
    const ok = await createReview({
      zoneCode: zone,
      seatDetail: seatDetail.trim(),
      stars,
      body: text,
      photoUrls: photos.map((photo) => photo.dataUrl),
    });
    setSubmitting(false);
    if (ok) {
      reset();
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
    <Sheet open={open} title="직관 시야 후기 쓰기" onClose={onClose}>
      <span className="text-xs font-extrabold text-ink-2">구역</span>
      <div className="flex flex-wrap gap-1.5">
        {ZONE_ORDER.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setZone(code)}
            className={`rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              zone === code
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {ZONE_BY_CODE[code]?.short ?? code}
          </button>
        ))}
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
              {formatPhotoSize(photo.bytes)}
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
          {submitting ? "등록 중…" : "후기 등록"}
        </button>
      </div>
    </Sheet>
  );
}

export function StarsPreview({ value }: { value: number }) {
  return <Stars value={value} />;
}
