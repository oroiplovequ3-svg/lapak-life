/**
 * 첨부 사진(시야 후기 · 직관 기록)을 브라우저에서 바로 쓸 수 있는 크기로 줄입니다.
 * - 폰으로 찍은 4~8MB 사진도 긴 변 1000px · JPEG로 다시 그려 장당 140KB 아래로 맞춥니다.
 * - 데모 모드(localStorage)에서도 용량이 터지지 않고, Supabase Storage에 올릴 때도 그대로 씁니다.
 */

export const MAX_REVIEW_PHOTOS = 3;

/** 직관 기록 카드에 붙일 수 있는 사진 수 */
export const MAX_GAME_PHOTOS = 3;

/** 장당 목표 용량 */
export const PHOTO_TARGET_BYTES = 140 * 1024;

const MAX_EDGE = 1000;

export interface PreparedPhoto {
  /** 편집(삭제)용 로컬 키 */
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
  name: string;
}

export function formatPhotoSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes}B`;
  return `${Math.round(bytes / 1024)}KB`;
}

function approxBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  return Math.round(((dataUrl.length - comma - 1) * 3) / 4);
}

interface Drawable {
  width: number;
  height: number;
  source: CanvasImageSource;
  release: () => void;
}

async function loadDrawable(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      // imageOrientation: 폰 사진의 EXIF 회전 정보를 반영합니다.
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        release: () => bitmap.close(),
      };
    } catch {
      // HEIC 처럼 createImageBitmap이 실패하는 형식은 <img>로 한 번 더 시도합니다.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("이 사진은 브라우저에서 열 수 없어요. JPG·PNG로 다시 올려주세요."));
      el.src = url;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      source: image,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** 파일 → 축소된 JPEG data URL */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 첨부할 수 있어요");
  }

  const image = await loadDrawable(file);
  try {
    let scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height || 1));
    let quality = 0.72;
    let dataUrl = "";
    let width = 0;
    let height = 0;

    // 목표 용량에 들어올 때까지 화질 → 해상도 순으로 조금씩 줄입니다.
    for (let attempt = 0; attempt < 7; attempt += 1) {
      width = Math.max(1, Math.round(image.width * scale));
      height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("이 사진을 처리하지 못했어요");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image.source, 0, 0, width, height);

      dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (approxBytes(dataUrl) <= PHOTO_TARGET_BYTES) break;
      if (quality > 0.46) quality -= 0.08;
      else scale *= 0.84;
    }

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dataUrl,
      width,
      height,
      bytes: approxBytes(dataUrl),
      name: file.name || "photo.jpg",
    };
  } finally {
    image.release();
  }
}

/** 시야 후기에서 쓰던 이름 (기존 코드 호환) */
export const prepareReviewPhoto = preparePhoto;
