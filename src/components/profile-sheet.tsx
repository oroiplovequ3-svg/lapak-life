"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Sheet } from "@/components/sheet";
import { formatPhotoSize, prepareAvatar, type PreparedPhoto } from "@/lib/image";
import { NICKNAME_TAKEN_MESSAGE } from "@/lib/repo/types";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 16;

/** 프로필 설정 — 프로필 사진 변경 · 닉네임 정하기 */
export function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const { profile, repoMode, updateProfile, isNicknameAvailable } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(profile.nickname);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [clearPhoto, setClearPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  /** 이미 누가 쓰는 이름일 때 보여 주는 안내 */
  const [taken, setTaken] = useState<string | null>(null);
  const [checkingName, setCheckingName] = useState(false);
  const nameCheckSeq = useRef(0);

  // 시트를 열 때마다 지금 프로필로 채웁니다.
  useEffect(() => {
    if (!open) return;
    setNickname(profile.nickname);
    setPhoto(null);
    setClearPhoto(false);
    setBusy(false);
    setSaving(false);
    setTaken(null);
    setCheckingName(false);
  }, [open, profile.nickname]);

  const trimmed = nickname.trim();
  const lengthOk = trimmed.length >= NICKNAME_MIN && trimmed.length <= NICKNAME_MAX;
  const sameAsMine = trimmed.toLowerCase() === profile.nickname.trim().toLowerCase();

  // 입력을 잠깐 멈추면 중복 여부를 먼저 확인해 둡니다. (저장하기 전에 미리 알려 주려고)
  useEffect(() => {
    if (!open) return;
    if (!lengthOk || sameAsMine) {
      nameCheckSeq.current += 1;
      setTaken(null);
      setCheckingName(false);
      return;
    }
    const seq = ++nameCheckSeq.current;
    const timer = window.setTimeout(() => {
      setCheckingName(true);
      void isNicknameAvailable(trimmed).then((available) => {
        if (seq !== nameCheckSeq.current) return;
        setTaken(available ? null : NICKNAME_TAKEN_MESSAGE);
        setCheckingName(false);
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [open, trimmed, lengthOk, sameAsMine, isNicknameAvailable]);
  const previewUrl = clearPhoto ? null : (photo?.dataUrl ?? profile.avatarUrl);
  const changed =
    trimmed !== profile.nickname || Boolean(photo) || (clearPhoto && Boolean(profile.avatarUrl));

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const prepared = await prepareAvatar(file);
      setPhoto(prepared);
      setClearPhoto(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "사진을 올리지 못했어요");
    }
    setBusy(false);
  };

  const resetPhoto = () => {
    setPhoto(null);
    setClearPhoto(true);
  };

  const submit = async () => {
    if (saving || busy) return;
    if (!lengthOk) {
      toast(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 정해주세요`);
      return;
    }
    if (!changed) {
      onClose();
      return;
    }

    // 저장 직전에 한 번 더 확인 — 입력하는 동안 누가 먼저 가져갔을 수 있어요.
    if (!sameAsMine) {
      setSaving(true);
      const available = await isNicknameAvailable(trimmed);
      setSaving(false);
      if (!available) {
        setTaken(NICKNAME_TAKEN_MESSAGE);
        setCheckingName(false);
        toast(NICKNAME_TAKEN_MESSAGE);
        return;
      }
    }

    setSaving(true);
    const ok = await updateProfile({
      nickname: trimmed,
      avatarDataUrl: photo ? photo.dataUrl : clearPhoto ? null : undefined,
    });
    setSaving(false);

    if (ok) {
      setPhoto(null);
      setClearPhoto(false);
      onClose();
    }
  };

  return (
    <Sheet open={open} title="프로필 설정" onClose={onClose}>
      {/* 프로필 사진 */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="프로필 사진 선택"
          className="relative rounded-full transition active:scale-[.98] disabled:opacity-60"
        >
          <Avatar
            nickname={trimmed || profile.nickname}
            avatarUrl={previewUrl}
            size={92}
            className="bg-gradient-to-br from-brand-500 to-brand text-[32px] text-white shadow-[0_10px_22px_-10px_rgba(7,76,161,.75)]"
          />
          <span className="absolute -bottom-0.5 -right-0.5 grid h-[30px] w-[30px] place-items-center rounded-full border-[2.5px] border-white bg-brand text-white shadow-sm">
            <Icon name="camera" size={14} strokeWidth={2.1} />
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-full bg-brand-50 px-3 py-1.5 text-[11.5px] font-extrabold text-brand-600 disabled:opacity-60"
          >
            {busy ? "사진 준비 중…" : photo ? "다른 사진 고르기" : "사진 변경"}
          </button>
          {previewUrl ? (
            <button
              type="button"
              onClick={resetPhoto}
              className="rounded-full bg-[#F3F5F9] px-3 py-1.5 text-[11.5px] font-bold text-ink-muted"
            >
              기본 사진으로
            </button>
          ) : null}
        </div>

        <p className="text-[10.5px] leading-relaxed text-[#AEB6C2]">
          {photo
            ? `선택한 사진 ${formatPhotoSize(photo.bytes)} · 가운데를 기준으로 동그랗게 잘라서 보여줘요`
            : "정사각형으로 잘라 올려요. 폰 사진도 자동으로 줄여서 저장합니다."}
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(event) => void pickPhoto(event)}
          className="hidden"
          aria-label="프로필 사진 파일 선택"
        />
      </div>

      {/* 닉네임 */}
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-extrabold text-ink-2">닉네임</span>
        <span
          className={`text-[10.5px] font-bold ${
            trimmed.length > NICKNAME_MAX ? "text-[#B42318]" : "text-ink-faint"
          }`}
        >
          {trimmed.length} / {NICKNAME_MAX}
        </span>
      </div>
      <input
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        maxLength={NICKNAME_MAX + 8}
        placeholder="예: 라팍직관러"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13.5px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />
      <p
        className={`-mt-2 break-keep text-[10.5px] leading-relaxed ${
          taken ? "font-bold text-[#B42318]" : lengthOk ? "text-[#AEB6C2]" : "text-[#B42318]"
        }`}
      >
        {taken
          ? taken
          : trimmed.length < NICKNAME_MIN
            ? `닉네임은 ${NICKNAME_MIN}자 이상 입력해 주세요.`
            : trimmed.length > NICKNAME_MAX
              ? `닉네임은 ${NICKNAME_MAX}자까지 쓸 수 있어요.`
              : checkingName
                ? "닉네임을 확인하는 중…"
                : "글·댓글·후기·맛집에 이 이름과 사진으로 표시돼요."}
      </p>

      {repoMode === "demo" ? (
        <p className="rounded-[11px] bg-brand-50 px-3 py-2.5 text-[11px] leading-relaxed text-brand">
          지금은 데모 모드예요. 프로필은 이 브라우저에만 저장되고, Supabase를 연결하면 계정에
          저장됩니다.
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
          onClick={() => void submit()}
          disabled={!lengthOk || saving || busy || Boolean(taken)}
          className="flex-1 rounded-[13px] bg-brand py-3 text-[13px] font-extrabold text-white shadow-brand disabled:bg-[#E4E7EC] disabled:text-ink-faint disabled:shadow-none"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </Sheet>
  );
}
