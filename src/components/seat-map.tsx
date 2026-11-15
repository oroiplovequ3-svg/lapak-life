"use client";

import { useId } from "react";

const CX = 160;
const CY = 150;
const R_IN = 84;
const R_OUT = 108;
const R_SKY = 130;
const FLAT = Math.cos(Math.PI / 8);

function point(angleDeg: number, radius: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [CX + (radius / FLAT) * Math.cos(a), CY + (radius / FLAT) * Math.sin(a)];
}

const f = (n: number) => n.toFixed(1);

function segmentPath(mid: number, rIn: number, rOut: number): string {
  const a = point(mid - 22.5, rOut);
  const b = point(mid + 22.5, rOut);
  const c = point(mid + 22.5, rIn);
  const d = point(mid - 22.5, rIn);
  return `M${f(a[0])},${f(a[1])} L${f(b[0])},${f(b[1])} L${f(c[0])},${f(c[1])} L${f(d[0])},${f(d[1])} Z`;
}

function innerOctagon(): string {
  let d = "";
  for (let k = 0; k < 8; k++) {
    const p = point(22.5 + 45 * k, R_IN);
    d += `${k === 0 ? "M" : "L"}${f(p[0])},${f(p[1])} `;
  }
  return `${d}Z`;
}

const BAND = [
  { zone: "C", mid: 90 },
  { zone: "T1", mid: 45 },
  { zone: "I1", mid: 0 },
  { zone: "OF", mid: 315 },
  { zone: "OF", mid: 270 },
  { zone: "OF", mid: 225 },
  { zone: "BZ", mid: 180 },
  { zone: "T3", mid: 135 },
] as const;

const BASE_FILL: Record<string, string> = {
  T3: "#CFE0F8",
  BZ: "#BED6F6",
  I1: "#E6EAF1",
  T1: "#DEE4EE",
  C: "#D5E1F4",
  OF: "#D8EDDF",
};

const CENTER_LABEL: Record<string, [string, string]> = {
  C: ["중앙", "VIP"],
  T1: ["1루", "테이블"],
  I1: ["1루", "내야"],
  BZ: ["블루존", "응원"],
  T3: ["3루", "테이블"],
};

const LABEL_ANCHOR: Record<string, [number, number]> = {
  C: point(90, 96),
  T1: point(45, 96),
  I1: point(0, 96),
  BZ: point(180, 96),
  T3: point(135, 96),
};

const HOME = [160, 196] as const;
const FIRST = [199, 157] as const;
const SECOND = [160, 118] as const;
const THIRD = [121, 157] as const;

function baseSquare(p: readonly [number, number]) {
  return (
    <rect
      x={p[0] - 2.8}
      y={p[1] - 2.8}
      width={5.6}
      height={5.6}
      fill="#ffffff"
      transform={`rotate(45 ${p[0]} ${p[1]})`}
    />
  );
}

interface SeatMapProps {
  /** "all" 또는 구역 코드 */
  selected: string;
  onSelect: (zone: string) => void;
}

/**
 * 라팍 팔각형 구장 도식 (프로토타입 SVG를 React로 옮김).
 * 도식 조각이나 SKY 링을 누르면 해당 구역이 선택됩니다.
 */
export function SeatMap({ selected, onSelect }: SeatMapProps) {
  const clipId = useId().replace(/:/g, "");

  const bandOn = (zone: string) => selected !== "all" && selected === zone;
  const ringOn = selected === "SKY" || selected === "SB";
  const dim = (zone: string) => (selected !== "all" && !bandOn(zone) ? 0.62 : 1);

  return (
    <svg
      viewBox="0 0 320 300"
      className="block h-auto w-full"
      role="img"
      aria-label="라팍 좌석 구역 도식"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={innerOctagon()} />
        </clipPath>
      </defs>

      <g
        onClick={() => onSelect("SKY")}
        className="cursor-pointer transition-opacity hover:opacity-80"
        role="button"
        aria-label="SKY 상층 · 스윗박스 선택"
      >
        {Array.from({ length: 8 }, (_, k) => (
          <path
            key={`sky-${k}`}
            d={segmentPath(45 * k, R_OUT, R_SKY)}
            fill={ringOn ? "#0A58CA" : "#E2E9F5"}
            stroke="#ffffff"
            strokeWidth={1.4}
            opacity={selected !== "all" && !ringOn ? 0.62 : 1}
          />
        ))}
      </g>

      {BAND.map((band, index) => (
        <path
          key={`band-${index}`}
          d={segmentPath(band.mid, R_IN, R_OUT)}
          fill={bandOn(band.zone) ? "#0A58CA" : BASE_FILL[band.zone]}
          stroke="#ffffff"
          strokeWidth={1.6}
          opacity={dim(band.zone)}
          className="cursor-pointer transition-[fill,opacity] hover:opacity-80"
          onClick={() => onSelect(band.zone)}
        />
      ))}

      <path d={innerOctagon()} fill="#E7F4E9" stroke="#ffffff" strokeWidth={2.2} />

      <g clipPath={`url(#${clipId})`} pointerEvents="none">
        <path
          d={`M${HOME[0]},${HOME[1]} L${FIRST[0]},${FIRST[1]} L${SECOND[0]},${SECOND[1]} L${THIRD[0]},${THIRD[1]} Z`}
          fill="#EFE1C8"
          stroke="#EFE1C8"
          strokeWidth={15}
          strokeLinejoin="round"
        />
        <path
          d={`M${HOME[0]},${HOME[1]} L246,110 M${HOME[0]},${HOME[1]} L74,110`}
          stroke="#ffffff"
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.85}
        />
        <circle cx="160" cy="157" r="6.4" fill="#E7D9BE" stroke="#ffffff" strokeWidth={1.1} />
        <circle cx="160" cy="157" r="1.6" fill="#ffffff" />
        {baseSquare(FIRST)}
        {baseSquare(SECOND)}
        {baseSquare(THIRD)}
        <path
          d={`M${HOME[0] - 3.6},${HOME[1] + 3.6} h7.2 v-3.6 l-3.6,-2.8 l-3.6,2.8 Z`}
          fill="#ffffff"
        />
      </g>

      <g pointerEvents="none" className="select-none">
        {Object.entries(CENTER_LABEL).map(([zone, [line1, line2]]) => {
          const [x, y] = LABEL_ANCHOR[zone];
          return (
            <text
              key={`label-${zone}`}
              x={f(x)}
              y={f(y - 2)}
              textAnchor="middle"
              fontSize="8.4"
              fontWeight="800"
              fill={bandOn(zone) ? "#ffffff" : "#4B5C78"}
            >
              <tspan x={f(x)} dy="0">
                {line1}
              </tspan>
              <tspan x={f(x)} dy="8.6">
                {line2}
              </tspan>
            </text>
          );
        })}

        <text
          x={CX}
          y={CY - 96 - 2}
          textAnchor="middle"
          fontSize="8.4"
          fontWeight="800"
          fill={bandOn("OF") ? "#ffffff" : "#3F6B4E"}
        >
          <tspan x={CX} dy="0">
            외야
          </tspan>
          <tspan x={CX} dy="8.6">
            잔디·패밀리
          </tspan>
        </text>

        <text
          x={CX}
          y={CY - 119 + 2.6}
          textAnchor="middle"
          fontSize="7.8"
          fontWeight="800"
          fill={ringOn ? "#ffffff" : "#7A879B"}
        >
          SKY 상층 · 스윗박스 4F
        </text>
      </g>
    </svg>
  );
}
