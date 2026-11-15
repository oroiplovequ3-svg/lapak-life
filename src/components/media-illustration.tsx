"use client";

import { useId } from "react";

export function DayIllustration() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 168" className="block w-full" role="img" aria-label="라팍 낮 경기 일러스트">
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8DC1F2" />
          <stop offset="1" stopColor="#E6F2FF" />
        </linearGradient>
        <linearGradient id={`${uid}-field`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#40A063" />
          <stop offset="1" stopColor="#2A7A4B" />
        </linearGradient>
      </defs>
      <rect width="320" height="168" fill={`url(#${uid}-sky)`} />
      <circle cx="54" cy="30" r="23" fill="#FFF3C0" opacity=".35" />
      <circle cx="54" cy="30" r="13" fill="#FFF6CC" />
      <g fill="#ffffff" opacity=".82">
        <ellipse cx="128" cy="30" rx="23" ry="8" />
        <ellipse cx="146" cy="27" rx="14" ry="6" />
        <ellipse cx="250" cy="46" rx="17" ry="6" />
      </g>
      <path d="M0 84 L54 66 L96 80 L150 60 L206 78 L262 64 L320 82 L320 96 L0 96 Z" fill="#B9D8C8" opacity=".85" />
      <path d="M0 88 C70 74 250 74 320 88 L320 104 C250 92 70 92 0 104 Z" fill="#27384F" />
      <g fill="#FFE9A8" opacity=".5">
        <circle cx="44" cy="88" r="1.4" />
        <circle cx="96" cy="86" r="1.4" />
        <circle cx="150" cy="85" r="1.4" />
        <circle cx="206" cy="86" r="1.4" />
        <circle cx="262" cy="88" r="1.4" />
      </g>
      <rect y="102" width="320" height="66" fill={`url(#${uid}-field)`} />
      <path d="M0 120 H320 M0 141 H320" stroke="#57B882" strokeWidth="11" opacity=".32" />
      <path d="M160 168 L198 140 L160 112 L122 140 Z" fill="#E7D8BD" opacity=".95" />
      <path d="M160 168 L236 108 M160 168 L84 108" stroke="#EDF8F1" strokeWidth="1.6" opacity=".75" />
      <circle cx="160" cy="140" r="3.4" fill="#F6EEDC" />
    </svg>
  );
}

export function NightIllustration() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 168" className="block w-full" role="img" aria-label="라팍 야간 경기 일러스트">
      <defs>
        <linearGradient id={`${uid}-nsky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#081426" />
          <stop offset="1" stopColor="#16375F" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="12%" r="60%">
          <stop offset="0" stopColor="#9CC6F7" stopOpacity=".5" />
          <stop offset="1" stopColor="#9CC6F7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-nfield`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2C8B5C" />
          <stop offset="1" stopColor="#14603C" />
        </linearGradient>
      </defs>
      <rect width="320" height="168" fill={`url(#${uid}-nsky)`} />
      <rect width="320" height="168" fill={`url(#${uid}-glow)`} />
      <g fill="#FFE9B0">
        <circle cx="46" cy="20" r="1.8" />
        <circle cx="96" cy="12" r="1.3" />
        <circle cx="272" cy="16" r="1.8" />
        <circle cx="140" cy="6" r="1.2" />
      </g>
      <g>
        <rect x="34" y="18" width="5" height="52" fill="#33465F" />
        <rect x="18" y="10" width="38" height="12" rx="3" fill="#E9F2FF" />
        <rect x="281" y="18" width="5" height="52" fill="#33465F" />
        <rect x="264" y="10" width="38" height="12" rx="3" fill="#E9F2FF" />
      </g>
      <path d="M0 96 C70 70 250 70 320 96 L320 112 C250 88 70 88 0 112 Z" fill="#1B2C44" />
      <path d="M0 104 C70 82 250 82 320 104" stroke="#2E4A6E" strokeWidth="2" fill="none" />
      <rect y="104" width="320" height="64" fill={`url(#${uid}-nfield)`} />
      <path d="M0 126 H320 M0 146 H320" stroke="#3AA06B" strokeWidth="9" opacity=".4" />
      <path d="M30 168 L152 108 M290 168 L188 108" stroke="#E8F5EC" strokeWidth="1.8" opacity=".8" />
      <g fill="#F2F7FF" opacity=".9">
        <circle cx="80" cy="100" r="1.6" />
        <circle cx="118" cy="97" r="1.6" />
        <circle cx="160" cy="96" r="1.6" />
        <circle cx="204" cy="97" r="1.6" />
        <circle cx="240" cy="100" r="1.6" />
      </g>
      <rect x="132" y="118" width="56" height="26" rx="4" fill="#0B1B30" stroke="#3C6EA5" />
      <text
        x="160"
        y="136"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="#7FD6FF"
        fontFamily="monospace"
      >
        3 : 2
      </text>
    </svg>
  );
}

export function PostMedia({ media }: { media: "day" | "night" }) {
  return (
    <div className="mt-2.5 overflow-hidden rounded-[13px] bg-[#0B1B34] leading-none">
      {media === "day" ? <DayIllustration /> : <NightIllustration />}
    </div>
  );
}
