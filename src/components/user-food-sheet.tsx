"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Sheet } from "@/components/sheet";
import {
  MAX_USER_FOOD_PHOTOS,
  formatPhotoSize,
  preparePhoto,
  type PreparedPhoto,
} from "@/lib/image";
import type { UserFood } from "@/lib/types";

interface UserFoodSheetProps {
  open: boolean;
  onClose: () => void;
  /** 수정할 맛집 — 넘기면 '수정' 모드로 열립니다 */
  editing?: UserFood | null;
}

/** 맛집·주차 → 직관러 맛집 등록 바텀시트 */
export function UserFoodSheet({ open, onClose, editing = null }: UserFoodSheetProps) {
  const { addUserFood, updateUserFood, isAdmin } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [inStadium, setInStadium] = useState(true);
  const [menu, setMenu] = useState("");
  const [tip, setTip] = useState("");
  const [rating, setRating] = useState(5);
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const valid = name.trim().length >= 1;

  // 열 때마다 새 맛집 / 수정할 맛집으로 채웁니다.
  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setMenu(editing?.menu ?? "");
    setTip(editing?.tip ?? "");
    setRating(editing?.rating ?? 5);
    setInStadium(editing?.inStadium ?? true);
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
  }, [open, editing]);

  const reset = () => {
    setName("");
    setMenu("");
    setTip("");
    setRating(5);
    setInStadium(true);
    setPhotos([]);
  };

  const submit = async () => {
    if (!valid || submitting || busy) return;
    setSubmitting(true);
    const input = {
      name: name.trim(),
      menu: menu.trim(),
      tip: tip.trim(),
      rating,
      inStadium,
      photoUrls: photos.map((photo) => photo.dataUrl),
    };
    const ok = editing ? await updateUserFood(editing.id, input) : await addUserFood(input);
    setSubmitting(false);
    if (ok) {
      if (!editing) reset();
      onClose();
    }
  };

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // 같은 사진을 다시 고를 수 있도록 값을 비웁니다.
    event.target.value = "";
    if (!picked.length) return;

    const room = MAX_USER_FOOD_PHOTOS - photos.length;
    if (room <= 0) {
      toast(`사진은 ${MAX_USER_FOOD_PHOTOS}장까지 첨부할 수 있어요`);
      return;
    }
    if (picked.length > room) {
      toast(`사진은 ${MAX_USER_FOOD_PHOTOS}장까지라 ${room}장만 추가할게요`);
    }

    setBusy(true);
    for (const file of picked.slice(0, room)) {
      try {
        const prepared = await preparePhoto(file);
        setPhotos((prev) =>
          prev.length >= MAX_USER_FOOD_PHOTOS ? prev : [...prev, prepared],
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
      title={editing ? "직관러 맛집 수정" : "직관러 맛집 추가"}
      onClose={onClose}
    >
      <span className="text-xs font-extrabold text-ink-2">가게 이름</span>
      <input
        value={name}
        maxLength={40}
        onChange={(event) => setName(event.target.value)}
        placeholder="예: 3루 통닭, 대공원역 국밥집"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">위치</span>
      <div className="flex gap-1.5">
        {(
          [
            [true, "구장 안"],
            [false, "구장 밖(입장 전)"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setInStadium(value)}
            className={`flex-1 rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              inStadium === value
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        추천 메뉴 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={menu}
        maxLength={80}
        onChange={(event) => setMenu(event.target.value)}
        placeholder="예: 간장치킨 + 감자튀김 (12,000원)"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">별점</span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`별점 ${value}점`}
            onClick={() => setRating(value)}
            className={`grid h-9 w-9 place-items-center rounded-[11px] transition ${
              value <= rating ? "bg-[#FFF6E7] text-[#F79009]" : "bg-[#F5F7FA] text-[#D5DBE3]"
            }`}
          >
            <Icon name="star" size={18} strokeWidth={1.2} filled={value <= rating} />
          </button>
        ))}
        <span className="ml-1 text-[12px] font-extrabold text-ink-faint">{rating}.0</span>
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        한 줄 팁 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <textarea
        value={tip}
        maxLength={120}
        rows={3}
        onChange={(event) => setTip(event.target.value)}
        placeholder="예: 8회 이후엔 반값 세일, 줄 서는 시간대는 6시 전후예요."
        className="w-full resize-none rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] leading-relaxed text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />
      <div className="-mt-2 text-right text-[10.5px] font-bold text-[#B4BCC9]">
        {tip.length} / 120
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-xs font-extrabold text-ink-2">
          사진 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
        </span>
        <span className="text-[10.5px] font-bold text-ink-faint">
          {photos.length} / {MAX_USER_FOOD_PHOTOS}
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

        {photos.length < MAX_USER_FOOD_PHOTOS ? (
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
        aria-label="직관러 맛집 사진 선택"
      />

      <p className="-mt-1 break-keep text-[10.5px] leading-relaxed text-[#AEB6C2]">
        최대 {MAX_USER_FOOD_PHOTOS}장 · 폰으로 찍은 사진도 등록할 때 자동으로 줄여서 올려요.
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
          disabled={!valid || submitting || busy}
          className="flex-1 rounded-[13px] bg-brand py-3 text-[13px] font-extrabold text-white shadow-brand disabled:bg-[#E4E7EC] disabled:text-ink-faint disabled:shadow-none"
        >
          {submitting ? "저장 중…" : editing ? "수정 완료" : "맛집 등록"}
        </button>
      </div>

      {editing && !editing.mine && isAdmin ? (
        <p className="break-keep text-[10.5px] font-bold leading-relaxed text-[#B54708]">
          마스터 권한으로 다른 직관러의 맛집을 수정합니다.
        </p>
      ) : null}
    </Sheet>
  );
}
