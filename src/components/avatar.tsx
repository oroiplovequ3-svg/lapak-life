import { cn, initialOf } from "@/lib/utils";

interface AvatarProps {
  nickname: string;
  avatarUrl?: string | null;
  /** 지름(px) */
  size?: number;
  /** 기본(이니셜) 아바타일 때의 색·글자 크기 등 */
  className?: string;
}

/**
 * 작성자 아바타.
 * - 프로필 사진이 있으면 원형 사진
 * - 없으면 기존처럼 닉네임 첫 글자 원
 * 글·댓글·후기·맛집·주차 팁·내 직관에서 같은 모양으로 씁니다.
 */
export function Avatar({ nickname, avatarUrl, size = 36, className }: AvatarProps) {
  const style = { width: size, height: size };

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        aria-hidden
        style={style}
        className={cn(
          "flex-none rounded-full border border-line-soft bg-brand-50 object-cover",
          className,
        )}
      />
    );
  }

  return (
    <div
      style={style}
      aria-hidden
      className={cn(
        "grid flex-none place-items-center overflow-hidden rounded-full font-extrabold",
        className,
      )}
    >
      {initialOf(nickname)}
    </div>
  );
}
