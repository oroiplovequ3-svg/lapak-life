"use client";

import { useMemo } from "react";

import {
  BLOCKS,
  COLORS,
  CONCOURSE,
  FIELD,
  GATES,
  LABELS,
  OUTER_WALL,
  type Block,
  type Label,
  VIEWBOX,
} from "@/lib/seat/map-geometry";

interface SeatMapProps {
  /** "all" 또는 구역 코드 (C, T3, BZ, I1, T1, SB, OF, SKY) */
  selected: string;
  onSelect: (zone: string) => void;
}

/** 선택된 구역 위에 얹는 외곽선 */
function zoneOutline(zone: string): string {
  return BLOCKS.filter((b) => b.zone === zone)
    .map((b) => b.path)
    .join(" ");
}

const DARK_TEXT_FILLS: string[] = [
  COLORS.centerGreen,
  COLORS.centerYellow,
  COLORS.ofFamily,
  COLORS.ofTable,
  COLORS.jungleLight,
];

function BlockText({ b }: { b: Block }) {
  if (!b.label || !b.fs) return null;
  const dark = DARK_TEXT_FILLS.includes(b.fill);
  return (
    <text
      x={b.cx}
      y={b.cy + b.fs * 0.35}
      fontSize={b.fs}
      fontWeight={800}
      fill={dark ? "#4A3B10" : "#FFFFFF"}
      textAnchor="middle"
      transform={b.angle ? `rotate(${b.angle} ${b.cx} ${b.cy})` : undefined}
    >
      {b.label}
    </text>
  );
}

function MapLabel({ l }: { l: Label }) {
  return (
    <text
      x={l.x}
      y={l.y}
      fontSize={l.size}
      fontWeight={l.weight ?? 700}
      fill={l.fill}
      textAnchor="middle"
      transform={l.angle ? `rotate(${l.angle} ${l.x} ${l.y})` : undefined}
    >
      {l.text}
    </text>
  );
}

/**
 * 대구 삼성라이온즈파크(라팍) 좌석 배치도.
 *
 * 사용자가 올린 구단 좌석안내도를 그대로 옮긴 도면으로, 조각을 누르면
 * 해당 구역이 선택됩니다. 좌표는 원본 이미지 픽셀(1206×1092) 기준이라
 * viewBox 만 지정하면 폭에 맞춰 비율이 유지됩니다.
 */
export function SeatMap({ selected, onSelect }: SeatMapProps) {
  const outline = useMemo(
    () => (selected === "all" ? "" : zoneOutline(selected)),
    [selected],
  );
  const dimmed = selected !== "all";
  const stripes = useMemo(
    () => Array.from({ length: 44 }, (_, i) => 290 + i * 15).filter((_, i) => i % 2 === 1),
    [],
  );

  const isOn = (b: Block) => !dimmed || b.zone === selected;

  return (
    <svg
      viewBox={VIEWBOX}
      className="block h-auto w-full select-none"
      role="img"
      aria-label="라팍 좌석 배치도"
    >
      <defs>
        <clipPath id="lapak-grass-clip">
          <path d={FIELD.grass} />
        </clipPath>
      </defs>

      {/* 외곽 벽 · 통로 */}
      <path d={OUTER_WALL} fill={COLORS.outerWall} />
      <path d={CONCOURSE} fill={COLORS.concourse} />

      {/* 그라운드 */}
      <g opacity={dimmed ? 0.55 : 1}>
      <path d={FIELD.track} fill={COLORS.track} />
      <path d={FIELD.grass} fill={COLORS.grassA} />
      <g clipPath="url(#lapak-grass-clip)">
        {stripes.map((x) => (
          <rect key={x} x={x} y={150} width={15} height={620} fill={COLORS.grassB} />
        ))}
      </g>
      <path
        d={FIELD.infieldBand}
        fill="none"
        stroke={COLORS.track}
        strokeWidth={42}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={FIELD.mound.x}
        cy={FIELD.mound.y}
        r={FIELD.mound.r + 7}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={4}
      />
      <circle cx={FIELD.mound.x} cy={FIELD.mound.y} r={FIELD.mound.r} fill={COLORS.track} />
      <path d={FIELD.homePlate} fill="#FFFFFF" />
      {FIELD.bases.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 11}
          y={y - 11}
          width={22}
          height={22}
          fill="#FFFFFF"
          transform={`rotate(45 ${x} ${y})`}
        />
      ))}
      </g>

      {/* 좌석 셀 */}
      {BLOCKS.filter((b) => !b.plain).map((b, i) => (
        <path
          key={`c-${i}`}
          d={b.path}
          fill={b.fill}
          stroke="#FFFFFF"
          strokeWidth={1.6}
          strokeLinejoin="round"
          opacity={isOn(b) ? 1 : 0.28}
          className="cursor-pointer transition-opacity duration-150"
          onClick={() => onSelect(b.zone)}
        />
      ))}

      {/* 중앙·상층 블록 */}
      {BLOCKS.filter((b) => b.plain).map((b, i) => (
        <path
          key={`p-${i}`}
          d={b.path}
          fill={b.fill}
          stroke="#FFFFFF"
          strokeWidth={1.6}
          strokeLinejoin="round"
          opacity={isOn(b) ? 1 : 0.28}
          className="cursor-pointer transition-opacity duration-150"
          onClick={() => onSelect(b.zone)}
        />
      ))}

      {outline ? (
        <>
          <path
            d={outline}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={13}
            strokeLinejoin="round"
            pointerEvents="none"
          />
          <path
            d={outline}
            fill="none"
            stroke="#0A58CA"
            strokeWidth={8}
            strokeLinejoin="round"
            pointerEvents="none"
          />
        </>
      ) : null}

      {/* 좌석 번호 */}
      <g pointerEvents="none">
        {BLOCKS.map((b, i) => (
          <g key={`t-${i}`} opacity={isOn(b) ? 1 : 0.22}>
            <BlockText b={b} />
          </g>
        ))}
      </g>

      {/* 구역 이름 */}
      <g pointerEvents="none">
        {LABELS.map((l, i) => (
          <g key={`l-${i}`} opacity={!dimmed || !l.zone || l.zone === selected ? 1 : 0.3}>
            <MapLabel l={l} />
          </g>
        ))}
      </g>

      {/* 출입구 */}
      <g pointerEvents="none">
        {GATES.map((g) => (
          <g key={g.text}>
            <rect x={g.x - 58} y={g.y - 32} width={116} height={44} rx={6} fill="#C4CEDA" />
            <text
              x={g.x}
              y={g.y - 9}
              fontSize={18}
              fontWeight={800}
              fill="#FFFFFF"
              textAnchor="middle"
            >
              {g.text}
            </text>
            <text
              x={g.x}
              y={g.y + 7}
              fontSize={12}
              fontWeight={700}
              fill="#EEF3F9"
              textAnchor="middle"
            >
              {g.sub}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** 좌석 도식 아래 붙이는 범례 색 */
export const SEAT_LEGEND = [
  { label: "3루 홈", color: COLORS.blue },
  { label: "테이블·중앙", color: COLORS.centerYellow },
  { label: "1루 내야", color: COLORS.purple },
  { label: "외야", color: COLORS.outfield },
  { label: "SKY", color: COLORS.navy },
] as const;
