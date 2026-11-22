"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

import { ZONE_BY_CODE } from "@/lib/data/zones";
import { MAP_IMAGE, SHAPE_BY_CODE, VIEWBOX, ZONE_SHAPES } from "@/lib/seat/map-geometry";

interface SeatMapProps {
  /** "all" 또는 구역 코드 (ZONE_SHAPES 참고) */
  selected: string;
  onSelect: (zone: string) => void;
}

/**
 * 손가락으로 눌렀을 때 이 거리(원본 좌표) 안이면 가장 가까운 구역을 골라 줍니다.
 * 390px 화면에서 원본 좌표 1단위 ≈ 0.28px 이므로 약 17px. 도면에서 4px 두께밖에
 * 안 되는 루프탑·외야 테이블석 띠처럼 얇은 구역도 근처를 누르면 선택됩니다.
 */
const SNAP_DISTANCE = 62;
/** 경계선 위 점을 몇 개나 재서 가장 가까운 구역을 찾을지 */
const SAMPLE_COUNT = 64;

interface Point {
  x: number;
  y: number;
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
  const [focused, setFocused] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  /** 구역별 경계선 샘플 점 (처음 한 번만 계산) */
  const samplesRef = useRef<Map<string, Point[]> | null>(null);

  const active =
    selected && selected !== "all"
      ? SHAPE_BY_CODE[selected as keyof typeof SHAPE_BY_CODE]
      : undefined;

  /** 각 구역 path 의 경계선 위 점들을 미리 재 둡니다. */
  function buildSamples(svg: SVGSVGElement): Map<string, Point[]> {
    if (samplesRef.current) return samplesRef.current;
    const map = new Map<string, Point[]>();
    svg.querySelectorAll<SVGPathElement>("path[data-zone]").forEach((path) => {
      const code = path.dataset.zone;
      if (!code) return;
      try {
        const total = path.getTotalLength();
        if (!total) return;
        const points: Point[] = [];
        for (let i = 0; i <= SAMPLE_COUNT; i += 1) {
          const point = path.getPointAtLength((total * i) / SAMPLE_COUNT);
          points.push({ x: point.x, y: point.y });
        }
        map.set(code, points);
      } catch {
        // 측정할 수 없는 path 는 건너뜁니다(직접 누르기는 그대로 동작).
      }
    });
    samplesRef.current = map;
    return map;
  }

  /**
   * 도면을 눌렀을 때 — 정확히 구역 안이면 그 구역, 아니면 가장 가까운 구역.
   * 얇은 구역(루프탑·외야 테이블석·VIP 등)을 손가락으로 고를 수 있게 합니다.
   */
  function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
    const direct = (event.target as Element | null)?.getAttribute?.("data-zone");
    if (direct) {
      onSelect(direct);
      return;
    }

    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((event.clientX - rect.left) / rect.width) * MAP_IMAGE.width;
    const y = ((event.clientY - rect.top) / rect.height) * MAP_IMAGE.height;

    let bestCode: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const [code, points] of buildSamples(svg)) {
      for (const point of points) {
        const dx = point.x - x;
        const dy = point.y - y;
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCode = code;
        }
      }
    }

    if (bestCode && Math.sqrt(bestDistance) <= SNAP_DISTANCE) onSelect(bestCode);
  }

  return (
    <div
      className="relative overflow-hidden rounded-[10px] bg-white"
      onClick={handleClick}
    >
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
        ref={svgRef}
        viewBox={VIEWBOX}
        className="absolute inset-0 h-full w-full"
        role="group"
        aria-label="좌석 구역 선택 — 구역을 누르거나 키보드로 고를 수 있어요"
      >
        {ZONE_SHAPES.map((z) => {
          const isActive = active?.code === z.code;
          const isDimmed = Boolean(active) && !isActive;
          const isHovered = hovered === z.code && !isActive;
          const isFocused = focused === z.code;
          const name = ZONE_BY_CODE[z.code]?.name ?? z.code;
          return (
            <path
              key={z.code}
              d={z.path}
              data-zone={z.code}
              fillRule="evenodd"
              fill={
                isActive || isFocused
                  ? "rgba(37, 99, 235, 0.22)"
                  : isHovered
                    ? "rgba(37, 99, 235, 0.1)"
                    : isDimmed
                      ? "rgba(255, 255, 255, 0.38)"
                      : "transparent"
              }
              stroke={isActive || isFocused ? "#1D4ED8" : "transparent"}
              strokeWidth={isActive || isFocused ? 4 : 0}
              strokeLinejoin="round"
              className="cursor-pointer transition-[fill] duration-150 outline-none"
              role="button"
              tabIndex={0}
              aria-label={`${name} 선택`}
              aria-pressed={isActive}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(z.code);
                }
              }}
              onFocus={() => setFocused(z.code)}
              onBlur={() => setFocused((current) => (current === z.code ? null : current))}
              onMouseEnter={() => setHovered(z.code)}
              onMouseLeave={() => setHovered((h) => (h === z.code ? null : h))}
            >
              <title>{name}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}
