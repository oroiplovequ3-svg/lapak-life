"use client";

import { useState } from "react";

import { MAP_IMAGE, SHAPE_BY_CODE, VIEWBOX, ZONE_SHAPES } from "@/lib/seat/map-geometry";
import { ZONE_BY_CODE } from "@/lib/data/zones";

interface SeatMapProps {
  /** "all" 또는 구역 코드 (C, T3, BZ, I1, T1, SB, OF, SKY) */
  selected: string;
  onSelect: (zone: string) => void;
}

/**
 * 대구 삼성라이온즈파크(라팍) 좌석 배치도.
 *
 * 구단 좌석안내도 원본 이미지를 리사이즈·보정 없이 그대로 띄우고(Next 이미지
 * 최적화도 거치지 않도록 원본 파일을 직접 씀), 그 위에 투명한 SVG 오버레이만
 * 얹습니다. 아무 구역도 고르지 않았을 때는 오버레이가 완전히 투명해서 원본
 * 그림이 100% 그대로 보이고, 구역을 고르면 그 구역 실루엣만 파랗게 표시되며
 * 나머지는 살짝 가라앉습니다.
 */
export function SeatMap({ selected, onSelect }: SeatMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active =
    selected && selected !== "all"
      ? SHAPE_BY_CODE[selected as keyof typeof SHAPE_BY_CODE]
      : undefined;

  return (
    <div className="relative overflow-hidden rounded-[10px] bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- 원본 좌석도 픽셀을 그대로 보여주려고 최적화를 건너뜁니다 */}
      <img
        src={MAP_IMAGE.src}
        width={MAP_IMAGE.width}
        height={MAP_IMAGE.height}
        alt="라팍 좌석 배치도"
        draggable={false}
        decoding="async"
        className="block h-auto w-full select-none"
      />

      <svg
        viewBox={VIEWBOX}
        className="absolute inset-0 h-full w-full"
        role="group"
        aria-label="좌석 구역 선택"
      >
        {ZONE_SHAPES.map((z) => {
          const isActive = active?.code === z.code;
          const isDimmed = Boolean(active) && !isActive;
          const isHovered = hovered === z.code && !isActive;
          return (
            <path
              key={z.code}
              d={z.path}
              fillRule="evenodd"
              fill={
                isActive
                  ? "rgba(37, 99, 235, 0.22)"
                  : isHovered
                    ? "rgba(37, 99, 235, 0.1)"
                    : isDimmed
                      ? "rgba(255, 255, 255, 0.38)"
                      : "transparent"
              }
              stroke={isActive ? "#1D4ED8" : "transparent"}
              strokeWidth={isActive ? 4 : 0}
              strokeLinejoin="round"
              className="cursor-pointer transition-[fill] duration-150"
              onClick={() => onSelect(z.code)}
              onMouseEnter={() => setHovered(z.code)}
              onMouseLeave={() => setHovered((h) => (h === z.code ? null : h))}
            >
              <title>{ZONE_BY_CODE[z.code]?.name ?? z.code}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}
