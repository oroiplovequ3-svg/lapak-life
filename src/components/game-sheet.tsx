"use client";

import { useApp } from "@/components/providers/app-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import {
  MAX_GAME_PHOTOS,
  formatPhotoSize,
  preparePhoto,
  type PreparedPhoto,
} from "@/lib/image";
import {
  gameResult,
  gamesOnDate,
  lastPlayedGame,
  stageLabel,
  venueLabel,
  type Samsung2026Game,
} from "@/lib/data/samsung-2026-schedule";
import { formatDotDate, todayISO } from "@/lib/utils";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

interface GameSheetProps {
  open: boolean;
  onClose: () => void;
}

/** 내 직관 · 직관 기록 추가 바텀시트 */
export function GameSheet({ open, onClose }: GameSheetProps) {
  const { addGame } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [playedOn, setPlayedOn] = useState(todayISO());
  // 같은 날 더블헤더가 편성되면 몇 번째 경기인지 (지금 2026 시즌 데이터에는 없음)
  const [gameIndex, setGameIndex] = useState(0);
  const [opponent, setOpponent] = useState("");
  const [homeAway, setHomeAway] = useState<"home" | "away">("home");
  const [scoreFor, setScoreFor] = useState("");
  const [scoreAgainst, setScoreAgainst] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const valid = opponent.trim() && scoreFor !== "" && scoreAgainst !== "";

  const dayGames = gamesOnDate(playedOn);
  const matchedGame: Samsung2026Game | null = dayGames[gameIndex] ?? dayGames[0] ?? null;
  const result = matchedGame ? gameResult(matchedGame) : null;
  const latestPlayed = lastPlayedGame();

  /** 일정에 있는 경기 값으로 상대·홈/원정·스코어를 채웁니다. 취소 경기는 스코어를 비워 둡니다. */
  const applyGame = (game: Samsung2026Game | null) => {
    if (!game) {
      setOpponent("");
      setHomeAway("home");
      setScoreFor("");
      setScoreAgainst("");
      return;
    }
    setOpponent(game.opponent);
    setHomeAway(game.homeAway);
    setScoreFor(game.scoreFor === null ? "" : String(game.scoreFor));
    setScoreAgainst(game.scoreAgainst === null ? "" : String(game.scoreAgainst));
  };

  /** 날짜를 바꾸면 그날 경기로 다시 채웁니다. (이전 자동 입력값이 남지 않도록 초기화) */
  const selectDate = (next: string) => {
    setPlayedOn(next);
    setGameIndex(0);
    applyGame(gamesOnDate(next)[0] ?? null);
  };

  // 시트를 열 때마다 현재 날짜 기준으로 다시 맞춥니다.
  useEffect(() => {
    if (!open) return;
    setGameIndex(0);
    applyGame(gamesOnDate(playedOn)[0] ?? null);
    // playedOn 은 열 때의 값만 씁니다 (열려 있는 동안 날짜 변경은 selectDate 가 처리).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    setOpponent("");
    setScoreFor("");
    setScoreAgainst("");
    setNote("");
    setPhotos([]);
  };

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // 같은 사진을 다시 고를 수 있도록 값을 비웁니다.
    event.target.value = "";
    if (!picked.length) return;

    const room = MAX_GAME_PHOTOS - photos.length;
    if (room <= 0) {
      toast(`사진은 ${MAX_GAME_PHOTOS}장까지 첨부할 수 있어요`);
      return;
    }
    if (picked.length > room) {
      toast(`사진은 ${MAX_GAME_PHOTOS}장까지라 ${room}장만 추가할게요`);
    }

    setBusy(true);
    for (const file of picked.slice(0, room)) {
      try {
        const prepared = await preparePhoto(file);
        setPhotos((prev) => (prev.length >= MAX_GAME_PHOTOS ? prev : [...prev, prepared]));
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

  const submit = async () => {
    if (!valid || busy) return;
    setSubmitting(true);
    const ok = await addGame({
      playedOn,
      opponent: opponent.trim(),
      homeAway,
      // 좌석 구역은 기록에서 받지 않습니다(구역 없이 저장).
      zoneCode: null,
      scoreFor: Number(scoreFor),
      scoreAgainst: Number(scoreAgainst),
      note: note.trim(),
      photoUrls: photos.map((photo) => photo.dataUrl),
    });
    setSubmitting(false);
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <Sheet open={open} title="직관 기록 추가" onClose={onClose}>
      <span className="text-xs font-extrabold text-ink-2">경기 날짜</span>
      <input
        type="date"
        value={playedOn}
        max={todayISO()}
        onChange={(event) => selectDate(event.target.value)}
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none"
      />

      {matchedGame ? (
        <div className="-mt-0.5 rounded-[13px] border border-brand-100 bg-brand-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-extrabold text-brand-600">
              {stageLabel(matchedGame)} · {venueLabel(matchedGame)}
            </span>
            <span className="rounded-full bg-white px-1.5 py-[1px] text-[9.5px] font-extrabold text-brand-500 shadow-[0_1px_2px_rgba(16,24,40,.06)]">
              자동 입력
            </span>
          </div>
          <div className="mt-[3px] flex items-center gap-1.5">
            <span className="text-[13px] font-extrabold tracking-tight text-ink">
              vs {matchedGame.opponent}
            </span>
            {matchedGame.canceled ? (
              <span className="rounded-md bg-white px-1.5 py-[1px] text-[10.5px] font-extrabold text-[#B54708]">
                {matchedGame.canceled}
              </span>
            ) : (
              <>
                <span className="text-[13px] font-extrabold tracking-tight text-ink-2">
                  {matchedGame.scoreFor} : {matchedGame.scoreAgainst}
                </span>
                {result ? (
                  <span
                    className={`rounded-md px-1.5 py-[1px] text-[10.5px] font-extrabold ${
                      result === "win"
                        ? "bg-[#ECFDF3] text-[#039855]"
                        : result === "loss"
                          ? "bg-[#FEF3F2] text-[#B42318]"
                          : "bg-[#FFFAEB] text-[#B54708]"
                    }`}
                  >
                    {result === "win" ? "승" : result === "loss" ? "패" : "무"}
                  </span>
                ) : null}
              </>
            )}
          </div>
          {matchedGame.canceled ? (
            <p className="mt-1 text-[10px] font-semibold leading-relaxed text-[#B54708]">
              취소된 경기라 스코어는 자동으로 채우지 않았어요 · 기록하려면 직접 입력해 주세요.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="-mt-0.5 break-keep text-[10.5px] font-semibold leading-relaxed text-[#AEB6C2]">
          등록된 2026 시즌 경기가 없는 날짜예요 — 직접 입력할 수 있어요.
        </p>
      )}

      {dayGames.length > 1 ? (
        <div className="flex gap-1.5">
          {dayGames.map((game, index) => (
            <button
              key={`${game.date}-${index}`}
              type="button"
              onClick={() => {
                setGameIndex(index);
                applyGame(game);
              }}
              className={`flex-1 rounded-full border px-3 py-[6px] text-[11px] font-bold transition ${
                index === gameIndex
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-[#475467]"
              }`}
            >
              {index + 1}차전
            </button>
          ))}
        </div>
      ) : null}

      {!matchedGame && latestPlayed ? (
        <button
          type="button"
          onClick={() => selectDate(latestPlayed.date)}
          className="-mt-0.5 flex items-center justify-between gap-2 rounded-[13px] border border-dashed border-[#CFD8E5] bg-white px-3 py-2 text-left"
        >
          <span className="text-[10.5px] font-bold leading-relaxed text-ink-faint">
            최근 경기로 채우기 · {formatDotDate(latestPlayed.date)} {stageLabel(latestPlayed)} vs{" "}
            {latestPlayed.opponent}
          </span>
          <span className="flex-none text-[10.5px] font-extrabold text-brand-600">선택</span>
        </button>
      ) : null}

      <span className="text-xs font-extrabold text-ink-2">상대팀</span>
      <input
        value={opponent}
        onChange={(event) => setOpponent(event.target.value)}
        placeholder="예: kt, KIA, 롯데"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <span className="text-xs font-extrabold text-ink-2">홈 / 원정</span>
      <div className="flex gap-1.5">
        {(
          [
            ["home", matchedGame?.venue === "포항" ? "포항 (홈)" : "라팍 (홈)"],
            ["away", "원정"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setHomeAway(value)}
            className={`flex-1 rounded-full border px-3 py-[7px] text-xs font-bold transition ${
              homeAway === value
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-[#475467]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="text-xs font-extrabold text-ink-2">스코어 (삼성 : 상대)</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={scoreFor}
          onChange={(event) => setScoreFor(event.target.value)}
          placeholder="삼성"
          className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-center text-[15px] font-extrabold text-ink outline-none"
        />
        <span className="text-ink-faint">:</span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={scoreAgainst}
          onChange={(event) => setScoreAgainst(event.target.value)}
          placeholder="상대"
          className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-center text-[15px] font-extrabold text-ink outline-none"
        />
      </div>

      <span className="text-xs font-extrabold text-ink-2">
        메모 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
      </span>
      <input
        value={note}
        maxLength={60}
        onChange={(event) => setNote(event.target.value)}
        placeholder="예: 가족 직관, 홈런볼 획득"
        className="w-full rounded-[13px] border border-line bg-[#FAFBFC] px-3 py-[11px] text-[13px] font-bold text-ink outline-none focus:border-[#C7D7F0] focus:bg-white"
      />

      <div className="flex items-baseline justify-between">
        <span className="text-xs font-extrabold text-ink-2">
          사진 <span className="text-[10.5px] font-bold text-ink-faint">(선택)</span>
        </span>
        <span className="text-[10.5px] font-bold text-ink-faint">
          {photos.length} / {MAX_GAME_PHOTOS}
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
              {formatPhotoSize(photo.bytes)}
            </span>
          </div>
        ))}

        {photos.length < MAX_GAME_PHOTOS ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="직관 기록 사진 추가"
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
              <span className="text-[10px] font-extrabold">{busy ? "줄이는 중…" : "사진 추가"}</span>
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
        aria-label="직관 기록 사진 선택"
      />

      <p className="-mt-1 break-keep text-[10.5px] leading-relaxed text-[#AEB6C2]">
        최대 {MAX_GAME_PHOTOS}장 · 폰으로 찍은 사진도 저장할 때 자동으로 줄여서 담아요.
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
          {submitting ? "저장 중…" : "기록 저장"}
        </button>
      </div>
    </Sheet>
  );
}
