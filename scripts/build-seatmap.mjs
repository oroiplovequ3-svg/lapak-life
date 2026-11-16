/**
 * 라팍 좌석 도면 지오메트리 생성기 (v4).
 *
 * 사용자가 올린 구단 좌석안내도를 기준으로 필드 외곽 폴리곤과 층별 밴드를
 * 오프셋해 좌석 셀 다각형을 계산하고 src/lib/seat/map-geometry.ts 로
 * 내보냅니다. 좌표계는 원본 이미지 픽셀(1206x1092) 그대로입니다.
 *
 *   node scripts/build-seatmap.mjs
 */
import fs from "node:fs";
import path from "node:path";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (v) => Math.hypot(v[0], v[1]);
const unit = (v) => {
  const l = len(v) || 1;
  return [v[0] / l, v[1] / l];
};
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const r1 = (n) => Math.round(n * 10) / 10;

/* 필드 외곽(경고트랙 바깥) — 시계방향
 * 0 상단좌 1 상단우 2 우측코너 3 하단우 4 하단좌 5 좌측코너 */
const FIELD = [
  [531, 190],
  [675, 190],
  [900, 424],
  [661, 735],
  [545, 735],
  [306, 424],
];
const N = FIELD.length;

const edgeDir = (i) => unit(sub(FIELD[(i + 1) % N], FIELD[i]));
const normals = FIELD.map((_, i) => {
  const d = edgeDir(i);
  return [d[1], -d[0]];
});

const COLORS = {
  grassA: "#7CBB4F",
  grassB: "#A6CD79",
  track: "#F2A93B",
  outfield: "#D9662F",
  ofFamily: "#C9BF62",
  ofInnerGreen: "#A9C43C",
  rooftop: "#A62B22",
  ofTable: "#D9C23F",
  navy: "#0D288C",
  skyBlue: "#55A3EB",
  magenta: "#9C4088",
  vip: "#A32C87",
  party: "#8A6A43",
  purple: "#491978",
  pink: "#D792B2",
  blue: "#4574B5",
  table: "#4C0F06",
  centerYellow: "#EFC24F",
  centerGreen: "#C6D45B",
  jungleDark: "#2E6B34",
  jungleLight: "#8DBB5A",
  outerWall: "#D7E0EC",
  outerLine: "#9AA9BD",
  concourse: "#F7F9FC",
  walkway: "#DDE4EE",
  ink: "#5B6675",
};

const ZONE = {
  center: "C",
  table3: "T3",
  blue: "BZ",
  infield1: "I1",
  table1: "T1",
  suite: "SB",
  outfield: "OF",
  sky: "SKY",
};

/* 밴드 경계. 꼭짓점마다 A(이전 엣지 오프셋)·B(다음 엣지 오프셋) 두 점 → 베벨
 * 점 12개 [A0,B0,...,A5,B5]
 *   엣지 i   p in [2i+1, 2i+2]
 *   모서리 i p in [2i, 2i+1] */
function boundary(depths) {
  const pts = [];
  for (let j = 0; j < N; j++) {
    const prev = (j - 1 + N) % N;
    pts.push(add(FIELD[j], mul(normals[prev], depths[prev])));
    pts.push(add(FIELD[j], mul(normals[j], depths[j])));
  }
  return pts;
}

const M = 12;
const ptOn = (b, p) => {
  const q = ((p % M) + M) % M;
  const i = Math.floor(q + 1e-9) % M;
  return lerp(b[i], b[(i + 1) % M], q - Math.floor(q + 1e-9));
};

function walk(b, p0, p1) {
  const out = [ptOn(b, p0)];
  let p = Math.floor(p0 + 1e-9) + 1;
  while (p < p1 - 1e-6) {
    out.push(b[((p % M) + M) % M]);
    p += 1;
  }
  const last = ptOn(b, p1);
  if (len(sub(last, out[out.length - 1])) > 0.8) out.push(last);
  return out;
}

const P = (i, t) => 2 * i + 1 + t;
const E = (i) => [P(i, 0), P(i, 1)];

// per-edge: 0 top, 1 rf, 2 first, 3 back, 4 third, 5 lf
const B1 = [11, 13, 13, 13, 13, 13];
const B2 = [78, 100, 130, 130, 130, 108];
const B3 = [98, 136, 158, 158, 158, 148];
const B4 = [110, 186, 246, 300, 246, 200];
const B5 = [126, 206, 266, 318, 266, 218];

const R0 = boundary([0, 0, 0, 0, 0, 0]);
const R1 = boundary(B1);
const R2 = boundary(B2);
const R3 = boundary(B3);
const R4 = boundary(B4);
const R5 = boundary(B5);

const blocks = [];
const poly = (pts) => `M${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" L")} Z`;

function makeCell(bIn, bOut, p0, p1) {
  const inner = walk(bIn, p0, p1);
  const outer = walk(bOut, p1, p0);
  const pts = [...inner, ...outer];
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const innerMid = lerp(inner[0], inner[inner.length - 1], 0.5);
  const outerMid = lerp(outer[0], outer[outer.length - 1], 0.5);
  return {
    path: poly(pts),
    cx,
    cy,
    depth: len(sub(outerMid, innerMid)),
    width: len(sub(inner[inner.length - 1], inner[0])),
  };
}

function run(o) {
  const { bIn, bOut, p0, p1, count, zone, fill, labels, angle = 0, pad = 0.03 } = o;
  const span = p1 - p0;
  const cellSpan = span / count;
  const gap = count > 1 ? Math.min(pad, cellSpan * 0.03) : 0;
  for (let i = 0; i < count; i++) {
    const a = p0 + cellSpan * i + gap;
    const b = p0 + cellSpan * (i + 1) - gap;
    const g = makeCell(bIn, bOut, a, b);
    if (g.depth < 8 || g.width < 5) continue;
    const fs = Math.max(9, Math.min(g.depth * 0.48, g.width * 0.6, o.maxFs ?? 36));
    const label = labels && fs >= 11 ? labels[i] : undefined;
    blocks.push({ zone, fill, ...g, label, angle, fs: Math.round(fs * 10) / 10, cell: true });
  }
}

/* ─────────── 3층 내야 ─────────── */

// 1루 (엣지 2: 우측 코너 → 홈). p 증가 = 홈 방향
run({ bIn: R1, bOut: R2, p0: P(2, 0.0), p1: P(2, 0.30), count: 7, zone: ZONE.infield1, fill: COLORS.purple, labels: ["11", "10", "10", "9", "9", "7", "6"], angle: 45 });
run({ bIn: R1, bOut: R2, p0: P(2, 0.30), p1: P(2, 0.40), count: 2, zone: ZONE.infield1, fill: COLORS.pink, labels: ["1", "2"], angle: 45 });
run({ bIn: R1, bOut: R2, p0: P(2, 0.40), p1: P(2, 0.62), count: 5, zone: ZONE.infield1, fill: COLORS.blue, labels: ["1", "2", "3", "4", "5"], angle: 45 });
run({ bIn: R1, bOut: R2, p0: P(2, 0.62), p1: P(2, 0.99), count: 4, zone: ZONE.table1, fill: COLORS.table, labels: ["4", "3", "2", "1"], angle: 45 });

// 3루 (엣지 4: 홈 → 좌측 코너). p 증가 = 코너 방향
run({ bIn: R1, bOut: R2, p0: P(4, 0.01), p1: P(4, 0.235), count: 4, zone: ZONE.table3, fill: COLORS.table, labels: ["1", "2", "3", "4"], angle: -45 });
run({ bIn: R1, bOut: R2, p0: P(4, 0.235), p1: P(4, 0.55), count: 7, zone: ZONE.blue, fill: COLORS.blue, labels: ["1", "2", "3", "4", "5", "6", "7"], angle: -45 });
run({ bIn: R1, bOut: R2, p0: P(4, 0.55), p1: P(4, 0.63), count: 2, zone: ZONE.blue, fill: COLORS.pink, labels: ["1", "2"], angle: -45 });
run({ bIn: R1, bOut: R2, p0: P(4, 0.63), p1: P(4, 0.90), count: 5, zone: ZONE.blue, fill: COLORS.purple, labels: ["9", "9", "10", "11", "10"], angle: -45 });
run({ bIn: R1, bOut: R2, p0: P(4, 0.90), p1: P(5, 0.0), count: 1, zone: ZONE.blue, fill: COLORS.walkway });

/* ─────────── 외야 ─────────── */

const LF_LABELS = Array.from({ length: 8 }, (_, i) => `LF${i + 1}`);
const RF_LABELS = Array.from({ length: 8 }, (_, i) => `RF${8 - i}`);

run({ bIn: R1, bOut: R2, p0: P(5, 0.02), p1: P(5, 0.98), count: 8, zone: ZONE.outfield, fill: COLORS.outfield, labels: LF_LABELS, angle: -45, maxFs: 15 });
run({ bIn: R1, bOut: R2, p0: P(1, 0.02), p1: P(1, 0.98), count: 8, zone: ZONE.outfield, fill: COLORS.outfield, labels: RF_LABELS, angle: 45, maxFs: 15 });
run({ bIn: R1, bOut: R2, p0: P(0, 0.02), p1: P(0, 0.13), count: 1, zone: ZONE.outfield, fill: COLORS.outfield, labels: ["LF9"], angle: 0, maxFs: 24 });
run({ bIn: R1, bOut: R2, p0: P(0, 0.13), p1: P(0, 0.24), count: 1, zone: ZONE.outfield, fill: COLORS.outfield, labels: ["LF10"], angle: 0, maxFs: 24 });
run({ bIn: R1, bOut: R2, p0: P(0, 0.76), p1: P(0, 0.87), count: 1, zone: ZONE.outfield, fill: COLORS.outfield, labels: ["RF10"], angle: 0, maxFs: 24 });
run({ bIn: R1, bOut: R2, p0: P(0, 0.87), p1: P(0, 0.98), count: 1, zone: ZONE.outfield, fill: COLORS.outfield, labels: ["RF9"], angle: 0, maxFs: 24 });

// 외야 안쪽 얇은 띠 (3루·중견 연두 / 1루·우익 다크레드)
run({ bIn: R0, bOut: R1, p0: P(5, 0.0), p1: P(5, 0.54), count: 1, zone: ZONE.outfield, fill: COLORS.ofInnerGreen, angle: -45 });
run({ bIn: R0, bOut: R1, p0: P(5, 0.54), p1: P(5, 1.0), count: 1, zone: ZONE.outfield, fill: COLORS.ofInnerGreen, angle: -45 });
run({ bIn: R0, bOut: R1, p0: P(0, 0.0), p1: P(0, 1.0), count: 1, zone: ZONE.outfield, fill: COLORS.ofInnerGreen, angle: 0 });
run({ bIn: R0, bOut: R1, p0: P(1, 0.0), p1: P(1, 1.0), count: 1, zone: ZONE.outfield, fill: COLORS.rooftop, angle: 45 });

// 외야 바깥 긴 블록
run({ bIn: R2, bOut: R3, p0: P(5, 0.04), p1: P(5, 0.52), count: 1, zone: ZONE.outfield, fill: COLORS.ofFamily, angle: -45, labels: ["외야패밀리석"], maxFs: 16 });
run({ bIn: R2, bOut: R3, p0: P(5, 0.52), p1: P(5, 0.96), count: 1, zone: ZONE.outfield, fill: COLORS.ofFamily, angle: -45, labels: ["외야패밀리석"], maxFs: 16 });
run({ bIn: R2, bOut: R3, p0: P(1, 0.04), p1: P(1, 0.52), count: 1, zone: ZONE.outfield, fill: COLORS.ofTable, angle: 45, labels: ["외야테이블"], maxFs: 16 });
run({ bIn: R2, bOut: R3, p0: P(1, 0.52), p1: P(1, 0.96), count: 1, zone: ZONE.outfield, fill: COLORS.ofTable, angle: 45, labels: ["외야테이블"], maxFs: 16 });

/* ─────────── 4층 스윗박스 띠 ─────────── */

run({ bIn: R2, bOut: R3, p0: P(4, 0.01), p1: P(4, 0.74), count: 10, zone: ZONE.suite, fill: COLORS.magenta, maxFs: 13 });
run({ bIn: R2, bOut: R3, p0: P(4, 0.74), p1: P(4, 0.95), count: 2, zone: ZONE.suite, fill: COLORS.party, labels: ["파티플로어석", ""], angle: -45, maxFs: 12 });
run({ bIn: R2, bOut: R3, p0: P(2, 0.01), p1: P(2, 0.98), count: 11, zone: ZONE.suite, fill: COLORS.magenta, maxFs: 13 });

/* ─────────── 5층 SKY ─────────── */

run({ bIn: R3, bOut: R4, p0: P(4, 0.01), p1: P(4, 0.20), count: 5, zone: ZONE.sky, fill: COLORS.navy, labels: ["15", "16", "17", "18", "19"], angle: -45, maxFs: 30 });
run({ bIn: R3, bOut: R4, p0: P(4, 0.20), p1: P(4, 0.37), count: 5, zone: ZONE.sky, fill: COLORS.skyBlue, labels: ["20", "21", "22", "23", "24"], angle: -45, maxFs: 30 });
run({ bIn: R3, bOut: R4, p0: P(4, 0.37), p1: P(4, 0.98), count: 7, zone: ZONE.sky, fill: COLORS.navy, labels: ["25", "26", "27", "28", "29", "30", "31"], angle: -45, maxFs: 30 });
run({ bIn: R3, bOut: R4, p0: P(2, 0.01), p1: P(2, 0.62), count: 9, zone: ZONE.sky, fill: COLORS.navy, labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9"], angle: 45, maxFs: 30 });



/* ─────────── 중앙 (홈 뒤) ─────────── */

// 연두 3·2·1
for (let i = 0; i < 3; i++) {
  const t0 = i / 3;
  const t1 = (i + 1) / 3;
  const b0 = lerp([552, 778], [654, 778], t0);
  const b1 = lerp([552, 778], [654, 778], t1);
  const a0 = lerp([532, 822], [674, 822], t0);
  const a1 = lerp([532, 822], [674, 822], t1);
  blocks.push({
    zone: ZONE.center,
    fill: COLORS.centerGreen,
    path: poly([b0, b1, a1, a0]),
    cx: (a0[0] + a1[0] + b0[0] + b1[0]) / 4,
    cy: (a0[1] + a1[1] + b0[1] + b1[1]) / 4,
    label: String(3 - i),
    fs: 18,
    plain: true,
  });
}
// 노랑 3·2·1
for (let i = 0; i < 3; i++) {
  const t0 = i / 3;
  const t1 = (i + 1) / 3;
  const a0 = lerp([532, 822], [674, 822], t0);
  const a1 = lerp([532, 822], [674, 822], t1);
  const c0 = lerp([486, 950], [722, 950], t0);
  const c1 = lerp([486, 950], [722, 950], t1);
  blocks.push({
    zone: ZONE.center,
    fill: COLORS.centerYellow,
    path: poly([a0, a1, c1, c0]),
    cx: (a0[0] + a1[0] + c0[0] + c1[0]) / 4,
    cy: (a0[1] + a1[1] + c0[1] + c1[1]) / 4,
    label: String(3 - i),
    fs: 24,
    plain: true,
  });
}
// VIP 2칸
for (let i = 0; i < 2; i++) {
  const x0 = 500 + i * 106;
  const x1 = x0 + 102;
  blocks.push({
    zone: ZONE.center,
    fill: COLORS.vip,
    path: poly([[x0, 988], [x1, 988], [x1, 954], [x0, 954]]),
    cx: (x0 + x1) / 2,
    cy: 971,
    label: "VIP",
    fs: 20,
    plain: true,
  });
}
// 5층 중앙 10~14
for (let i = 0; i < 5; i++) {
  const t0 = i / 5;
  const t1 = (i + 1) / 5;
  const a0 = lerp([470, 992], [736, 992], t0);
  const a1 = lerp([470, 992], [736, 992], t1);
  const c0 = lerp([460, 1030], [746, 1030], t0);
  const c1 = lerp([460, 1030], [746, 1030], t1);
  blocks.push({
    zone: ZONE.sky,
    fill: COLORS.navy,
    path: poly([a0, a1, c1, c0]),
    cx: (a0[0] + a1[0] + c0[0] + c1[0]) / 4,
    cy: (a0[1] + a1[1] + c0[1] + c1[1]) / 4,
    label: String(14 - i),
    fs: 20,
    plain: true,
  });
}
// SKY박스 (최하단 주황 띠)
blocks.push({ zone: ZONE.sky, fill: COLORS.track, path: poly([[518, 1054], [688, 1054], [688, 1032], [518, 1032]]), cx: 603, cy: 1047, label: "SKY박스", fs: 12, plain: true });

// 잔디그린존 · 캠핑존 (1루 외야 코너 바깥)
blocks.push({ zone: ZONE.outfield, fill: COLORS.jungleDark, path: poly([[1030, 410], [1062, 410], [1062, 700], [1030, 700]]), cx: 1046, cy: 555, label: "잔디그린존", angle: 90, fs: 18, plain: true });
blocks.push({ zone: ZONE.outfield, fill: COLORS.jungleLight, path: poly([[1066, 410], [1090, 410], [1090, 700], [1066, 700]]), cx: 1078, cy: 555, label: "캠핑존", angle: 90, fs: 13, plain: true });

/* ─────────── 라벨 ─────────── */

const labels = [
  { x: 452, y: 468, text: "3루", size: 30, fill: "#FFFFFF", weight: 800, zone: ZONE.blue },
  { x: 452, y: 502, text: "(HOME)", size: 23, fill: "#FFFFFF", weight: 800, zone: ZONE.blue },
  { x: 744, y: 468, text: "1루", size: 30, fill: "#FFFFFF", weight: 800, zone: ZONE.infield1 },
  { x: 744, y: 502, text: "(AWAY)", size: 23, fill: "#FFFFFF", weight: 800, zone: ZONE.infield1 },

  { x: 452, y: 742, text: "DUGOUT", size: 14, fill: "#AEB9C6", weight: 800, angle: -45 },
  { x: 752, y: 742, text: "DUGOUT", size: 14, fill: "#AEB9C6", weight: 800, angle: 45 },
  { x: 372, y: 546, text: "BULLPEN", size: 13, fill: "#AEB9C6", weight: 800, angle: -45 },
  { x: 836, y: 546, text: "BULLPEN", size: 13, fill: "#AEB9C6", weight: 800, angle: 45 },

  { x: 452, y: 782, text: "테이블석", size: 14, fill: "#F6DFD5", weight: 800, angle: -45, zone: ZONE.table3 },
  { x: 676, y: 782, text: "테이블석", size: 14, fill: "#F6DFD5", weight: 800, angle: 45, zone: ZONE.table1 },
  { x: 430, y: 692, text: "블루존", size: 16, fill: "#DCE8F6", weight: 800, angle: -45, zone: ZONE.blue },
  { x: 736, y: 676, text: "원정응원석", size: 12, fill: "#DCE8F6", weight: 800, angle: 45, zone: ZONE.infield1 },
  { x: 408, y: 604, text: "익사이팅석", size: 10, fill: "#6E3244", weight: 800, angle: -45, zone: ZONE.blue },
  { x: 760, y: 626, text: "익사이팅석", size: 10, fill: "#6E3244", weight: 800, angle: 45, zone: ZONE.infield1 },
  { x: 340, y: 516, text: "내야지정석", size: 14, fill: "#D9CCEC", weight: 800, angle: -45, zone: ZONE.blue },
  { x: 852, y: 536, text: "1·3루지정석", size: 11, fill: "#D9CCEC", weight: 800, angle: 45, zone: ZONE.infield1 },

  { x: 603, y: 846, text: "중앙테이블석", size: 14, fill: "#7A5A0E", weight: 800, zone: ZONE.center },

  { x: 276, y: 288, text: "외야패밀리석", size: 13, fill: "#5D5516", weight: 800, angle: -45, zone: ZONE.outfield },
  { x: 952, y: 236, text: "외야테이블", size: 12, fill: "#5D5516", weight: 800, angle: 45, zone: ZONE.outfield },
  { x: 706, y: 300, text: "외야루프탑", size: 10, fill: "#F3D2CC", weight: 800, angle: 45, zone: ZONE.outfield },

  { x: 250, y: 434, text: "파티플로어석", size: 10, fill: "#F0E2CE", weight: 800, angle: -45, zone: ZONE.suite },
  { x: 196, y: 600, text: "SKY자유석", size: 14, fill: "#C9D4F2", weight: 800, angle: -90, zone: ZONE.sky },
  { x: 872, y: 700, text: "SKY지정석", size: 13, fill: "#C9D4F2", weight: 800, angle: 45, zone: ZONE.sky },
  { x: 330, y: 762, text: "SKY지정석", size: 13, fill: "#C9D4F2", weight: 800, angle: -45, zone: ZONE.sky },
];

const gates = [
  { x: 740, y: 52, text: "GATE 2", sub: "외야 출입구" },
  { x: 218, y: 928, text: "GATE 21", sub: "3루 출입구" },
  { x: 986, y: 928, text: "GATE 1", sub: "1루 출입구" },
];

/* ─────────── 필드 그래픽 ─────────── */

const GRASS = boundary([-25, -25, -25, -25, -25, -25]);
const field = {
  track: poly(FIELD),
  grass: poly(GRASS),
  infieldBand: "M603,726 L486,650 L486,602 A117,117 0 0 1 720,602 L720,650 L603,726",
  mound: { x: 603, y: 552, r: 26 },
  homePlate: "M594,722 h18 v-8 l-9,-7 l-9,7 Z",
  bases: [
    [519, 642],
    [603, 574],
    [687, 642],
  ],
};

/* ─────────── 미리보기 SVG ─────────── */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripes = Array.from({ length: 44 }, (_, i) => {
  const x = 290 + i * 15;
  return i % 2 ? `<rect x="${x}" y="150" width="15" height="620" fill="${COLORS.grassB}"/>` : "";
}).join("");

const cellSvg = blocks.filter((b) => b.cell).map((b) => `<path d="${b.path}" fill="${b.fill}" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round"/>`).join("");
const plainSvg = blocks.filter((b) => b.plain).map((b) => `<path d="${b.path}" fill="${b.fill}" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round"/>`).join("");
const numSvg = blocks.filter((b) => b.label && b.cell).map((b) => `<text x="${b.cx}" y="${b.cy + b.fs * 0.35}" font-size="${b.fs}" font-weight="800" fill="#FFFFFF" text-anchor="middle" transform="rotate(${b.angle} ${r1(b.cx)} ${r1(b.cy)})">${esc(b.label)}</text>`).join("");
const plainLabSvg = blocks.filter((b) => b.label && b.plain).map((b) => {
  const dark = [COLORS.centerGreen, COLORS.centerYellow, COLORS.ofFamily, COLORS.ofTable, COLORS.jungleLight].includes(b.fill);
  return `<text x="${b.cx}" y="${b.cy + b.fs * 0.35}" font-size="${b.fs}" font-weight="800" fill="${dark ? "#4A3B10" : "#FFFFFF"}" text-anchor="middle" transform="rotate(${b.angle ?? 0} ${r1(b.cx)} ${r1(b.cy)})">${esc(b.label)}</text>`;
}).join("");
const labSvg = labels.map((l) => `<text x="${l.x}" y="${l.y}" font-size="${l.size}" font-weight="${l.weight}" fill="${l.fill}" text-anchor="middle" transform="${l.angle ? `rotate(${l.angle} ${l.x} ${l.y})` : ""}">${esc(l.text)}</text>`).join("");
const gateSvg = gates.map((g) => `<g><rect x="${g.x - 58}" y="${g.y - 32}" width="116" height="44" rx="6" fill="#C4CEDA"/><text x="${g.x}" y="${g.y - 9}" font-size="18" font-weight="800" fill="#FFFFFF" text-anchor="middle">${esc(g.text)}</text><text x="${g.x}" y="${g.y + 7}" font-size="12" font-weight="700" fill="#EEF3F9" text-anchor="middle">${esc(g.sub)}</text></g>`).join("");

const preview = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1206 1092" width="1206" height="1092">
<rect width="1206" height="1092" fill="#FFFFFF"/>
<path d="${poly(R5)}" fill="${COLORS.outerWall}"/>
<path d="${poly(R4)}" fill="${COLORS.concourse}"/>
<path d="${poly(FIELD)}" fill="${COLORS.track}"/>
<clipPath id="gc"><path d="${field.grass}"/></clipPath>
<path d="${field.grass}" fill="${COLORS.grassA}"/>
<g clip-path="url(#gc)">${stripes}</g>
<path d="${field.infieldBand}" fill="none" stroke="${COLORS.track}" stroke-width="50" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${field.mound.x}" cy="${field.mound.y}" r="${field.mound.r + 8}" fill="none" stroke="#FFFFFF" stroke-width="4"/>
<circle cx="${field.mound.x}" cy="${field.mound.y}" r="${field.mound.r}" fill="${COLORS.track}"/>
<path d="${field.homePlate}" fill="#FFFFFF"/>
${field.bases.map(([x, y]) => `<rect x="${x - 13}" y="${y - 13}" width="26" height="26" fill="#FFFFFF" transform="rotate(45 ${x} ${y})"/>`).join("")}
${cellSvg}
${plainSvg}
${numSvg}
${plainLabSvg}
${labSvg}
${gateSvg}
</svg>`;

fs.writeFileSync(path.resolve("../analysis/seat-preview.svg"), preview);

/* ─────────── TS 모듈 ─────────── */
const blockLines = blocks.map((b) => {
  const parts = [
    `zone:${JSON.stringify(b.zone)}`,
    `fill:${JSON.stringify(b.fill)}`,
    `path:${JSON.stringify(b.path)}`,
    `cx:${r1(b.cx)}`,
    `cy:${r1(b.cy)}`,
  ];
  if (b.label) parts.push(`label:${JSON.stringify(b.label)}`);
  if (b.angle) parts.push(`angle:${b.angle}`);
  if (b.fs) parts.push(`fs:${b.fs}`);
  if (b.plain) parts.push(`plain:true`);
  return `  { ${parts.join(", ")} },`;
}).join("\n");
const labelLines = labels.map((l) => {
  const parts = [`x:${l.x}`, `y:${l.y}`, `text:${JSON.stringify(l.text)}`, `size:${l.size}`, `fill:${JSON.stringify(l.fill)}`];
  if (l.weight) parts.push(`weight:${l.weight}`);
  if (l.angle) parts.push(`angle:${l.angle}`);
  if (l.zone) parts.push(`zone:${JSON.stringify(l.zone)}`);
  return `  { ${parts.join(", ")} },`;
}).join("\n");
const gateLines = gates.map((g) => `  { x:${g.x}, y:${g.y}, text:${JSON.stringify(g.text)}, sub:${JSON.stringify(g.sub)} },`).join("\n");
const colorLines = Object.entries(COLORS).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join("\n");

const ts = `/**
 * 대구 삼성라이온즈파크(라팍) 좌석 도면 지오메트리.
 *
 * 사용자가 올린 구단 좌석안내도를 기준으로 필드 외곽 폴리곤과 층별 밴드를
 * 오프셋해 만든 데이터입니다. 좌표계는 원본 이미지 픽셀(1206x1092)이고
 * SVG viewBox 로 그대로 환산해 렌더링합니다.
 *
 *  - 필드: 넓은 팔각형 — 상단 중견수 펜스가 짧고 좌우 파울라인이 45도로
 *    홈플레이트까지 좁아지는 형태
 *  - 3층(내야): 테이블석 · 블루존/원정응원석 · 익사이팅석 · 내야지정석
 *  - 4층: 스윗박스 띠 + 3루 끝 파티플로어석, 홈 뒤 VIP
 *  - 5층: SKY지정석(1~19) · SKY 블루(20~24) · SKY자유석(25~31) · SKY박스
 *  - 외야: LF1~10 / RF1~10 · 외야패밀리석 · 외야테이블 · 외야루프탑
 *  - 잔디그린존 · 캠핑존(1루 외야 코너), 출입구 3곳
 *
 * scripts/build-seatmap.mjs 가 생성합니다. 직접 고치지 마세요.
 */
export type Pt = [number, number];

export const VIEWBOX = "0 0 1206 1092";

export const COLORS = {
${colorLines}
} as const;

/** 클릭 가능한 좌석 구역 코드 (8개) */
export type ZoneCode = "C" | "T3" | "BZ" | "I1" | "T1" | "SB" | "OF" | "SKY";

export interface Block {
  zone: string;
  fill: string;
  path: string;
  cx: number;
  cy: number;
  label?: string;
  angle?: number;
  fs?: number;
  plain?: boolean;
}

export const BLOCKS: Block[] = [
${blockLines}
];

export interface Label {
  x: number;
  y: number;
  text: string;
  size: number;
  fill: string;
  weight?: number;
  angle?: number;
  zone?: string;
}

export const LABELS: Label[] = [
${labelLines}
];

export interface Gate {
  x: number;
  y: number;
  text: string;
  sub: string;
}

export const GATES: Gate[] = [
${gateLines}
];

export const OUTER_WALL = ${JSON.stringify(poly(R5))};
export const CONCOURSE = ${JSON.stringify(poly(R4))};

export const FIELD = {
  track: ${JSON.stringify(field.track)},
  grass: ${JSON.stringify(field.grass)},
  infieldBand: ${JSON.stringify(field.infieldBand)},
  mound: { x: ${field.mound.x}, y: ${field.mound.y}, r: ${field.mound.r} } as const,
  homePlate: ${JSON.stringify(field.homePlate)},
  bases: ${JSON.stringify(field.bases)} as Pt[],
};

/** 도면 중심축 (잔디 스트라이프) */
export const CENTER_X = 603;
`;

fs.writeFileSync(path.resolve("src/lib/seat/map-geometry.ts"), ts);
console.log(`v4 blocks ${blocks.length} (cells ${blocks.filter((b) => b.cell).length}) labels ${labels.length}`);
