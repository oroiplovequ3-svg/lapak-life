import type { SVGProps } from "react";

const PATHS = {
  home: (
    <>
      <path d="M4 10.3 12 3.7l8 6.6" />
      <path d="M6.3 9.5V20.2h11.4V9.5" />
      <path d="M10.1 20.2v-4.7h3.8v4.7" />
    </>
  ),
  seat: (
    <>
      <ellipse cx="12" cy="12" rx="8.6" ry="6.3" />
      <path d="M4.4 14.6h15.2" />
      <path d="M8.6 9.6h6.8" />
    </>
  ),
  food: (
    <>
      <path d="M6.3 3.6v6.1a2.4 2.4 0 0 0 4.8 0V3.6" />
      <path d="M8.7 9.8v10.6" />
      <path d="M17.5 3.6c1.5 1.1 2.3 2.8 2.3 4.9 0 1.6-.9 2.9-2.3 3.5v8.4" />
    </>
  ),
  my: (
    <>
      <circle cx="12" cy="8.2" r="3.5" />
      <path d="M5.3 20.1c.6-3.6 3.5-5.6 6.7-5.6s6.1 2 6.7 5.6" />
    </>
  ),
  heart: <path d="M12 20.3 4.9 13.4a4.35 4.35 0 0 1 6.1-6.2l1 1 1-1a4.35 4.35 0 0 1 6.1 6.2Z" />,
  comment: (
    <path d="M20.2 11.6c0 3.9-3.7 7-8.2 7-1 0-2-.15-2.9-.42L4.4 19.6l1.35-3.5A6.6 6.6 0 0 1 3.8 11.6c0-3.9 3.7-7 8.2-7s8.2 3.1 8.2 7Z" />
  ),
  share: (
    <>
      <circle cx="6.5" cy="12" r="2.3" />
      <circle cx="17.5" cy="7.6" r="2.3" />
      <circle cx="17.5" cy="16.4" r="2.3" />
      <path d="M8.6 10.9 15.4 8.7M8.6 13.1l6.8 2.2" />
    </>
  ),
  bookmark: <path d="M7.2 4.6h9.6a1 1 0 0 1 1 1v13.9l-5.8-3.9-5.8 3.9V5.6a1 1 0 0 1 1-1Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="m15.7 15.7 4 4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.1 14.9a1.5 1.5 0 0 0 .3 1.65l.06.06a1.82 1.82 0 1 1-2.57 2.57l-.06-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.91 1.37v.17a1.82 1.82 0 1 1-3.64 0v-.09a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.06A1.82 1.82 0 1 1 4.37 16.7l.06-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.91H3.2a1.82 1.82 0 1 1 0-3.64h.09a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.06-.06A1.82 1.82 0 1 1 7.57 4.2l.06.06a1.5 1.5 0 0 0 1.65.3h.04a1.5 1.5 0 0 0 .91-1.37V3.1a1.82 1.82 0 1 1 3.64 0v.09a1.5 1.5 0 0 0 .91 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.06a1.82 1.82 0 1 1 2.57 2.57l-.06.06a1.5 1.5 0 0 0-.3 1.65v.04a1.5 1.5 0 0 0 1.37.91h.17a1.82 1.82 0 1 1 0 3.64h-.09a1.5 1.5 0 0 0-1.37.91Z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15.4V11a6 6 0 1 0-12 0v4.4L4.6 18h14.8Z" />
      <path d="M10 20.4a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  close: <path d="M6.6 6.6 17.4 17.4M17.4 6.6 6.6 17.4" />,
  camera: (
    <>
      <path d="M4.6 8.4h2.9l1.4-2h6.2l1.4 2h2.9a1.4 1.4 0 0 1 1.4 1.4v8.2a1.4 1.4 0 0 1-1.4 1.4H4.6a1.4 1.4 0 0 1-1.4-1.4V9.8a1.4 1.4 0 0 1 1.4-1.4Z" />
      <circle cx="12" cy="13.6" r="3.1" />
    </>
  ),
  star: <path d="M12 3.7l2.6 5.2 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8L3.6 9.75l5.8-.85Z" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  trash: (
    <>
      <path d="M4.8 7.2h14.4" />
      <path d="M9.4 7.2V5.4h5.2v1.8" />
      <path d="M6.8 7.2 7.7 20h8.6l.9-12.8" />
    </>
  ),
  google: (
    <>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17Z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46Z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7Z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07Z"
      />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

/** 브랜드 색을 그대로 쓰는 멀티컬러 아이콘 — currentColor·stroke 를 덮어쓰지 않습니다. */
const MULTICOLOR_ICONS: ReadonlySet<IconName> = new Set<IconName>(["google"]);

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
}

export function Icon({ name, size = 22, strokeWidth = 1.9, filled = false, ...rest }: IconProps) {
  const multicolor = MULTICOLOR_ICONS.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox={multicolor ? "0 0 48 48" : "0 0 24 24"}
      fill={multicolor ? "none" : filled ? "currentColor" : "none"}
      stroke={multicolor ? "none" : "currentColor"}
      strokeWidth={multicolor ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[1.5px] leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? "text-[#F79009]" : "text-[#E4E7EC]"}>
          <Icon name="star" size={size} strokeWidth={1.2} filled />
        </span>
      ))}
    </span>
  );
}
