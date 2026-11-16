"""좌석도 히트영역 생성기.

public/images/lapak-seatmap.jpg (원본 좌석안내도, 1206×1092)를 **읽기만** 하고
좌석 셀의 색 영역에서 구역 실루엣을 뽑아 src/lib/seat/map-geometry.ts 로 씁니다.

    pip install opencv-python numpy
    python scripts/build-seat-hitareas.py

원본 이미지는 절대 수정·리사이즈하지 않습니다. 좌표만 뽑아 씁니다.
"""
import json
import os
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'public', 'images', 'lapak-seatmap.jpg')
OUT = os.path.join(ROOT, 'src', 'lib', 'seat', 'map-geometry.ts')

im = cv2.imread(SRC)
H, W = im.shape[:2]

PAL = {
    'navy':      (0x0F, 0x27, 0x88),
    'blue':      (0x48, 0x74, 0xB1),
    'lightblue': (0x56, 0xA1, 0xE6),
    'purple':    (0x48, 0x1B, 0x7A),
    'magenta':   (0x92, 0x32, 0x7E),
    'pink':      (0xCA, 0x88, 0xAC),
    'maroon':    (0x47, 0x0F, 0x08),
    'oforange':  (0xD0, 0x61, 0x2E),
    'olive':     (0xC4, 0xBE, 0x4F),
    'yellow':    (0xEF, 0xC5, 0x56),
    'darkgreen': (0x1F, 0x49, 0x13),
    'midgreen':  (0x8A, 0xB9, 0x6C),
    'rooftop':   (0xA8, 0x3B, 0x28),
    'brown':     (0x8A, 0x6A, 0x43),
    'skybox':    (0xE8, 0xA8, 0x48),
}
TOL = 24
MIN_AREA = 380


def mask_of(rgb):
    r, g, b = rgb
    lo = np.array([max(0, b - TOL), max(0, g - TOL), max(0, r - TOL)], np.uint8)
    hi = np.array([min(255, b + TOL), min(255, g + TOL), min(255, r + TOL)], np.uint8)
    return cv2.inRange(im, lo, hi)


def assign(color, cx, cy, area):
    if color in ('navy', 'lightblue'):
        return 'SKY'
    if color == 'skybox':
        return 'SKY' if (cy > 1000 and 480 < cx < 720) else None
    if color in ('blue', 'purple', 'pink'):
        return 'BZ' if cx < 603 else 'I1'
    if color == 'maroon':
        return 'T3' if cx < 603 else 'T1'
    if color == 'magenta':
        if 490 < cx < 710 and 950 < cy < 995 and area > 1500:
            return 'C'
        return 'SB'
    if color == 'brown':
        return 'SB'
    if color == 'yellow':
        return 'C' if (cy > 820 and 455 < cx < 735) else None
    if color == 'olive':
        if 790 < cy < 832 and 525 < cx < 670:
            return 'C'
        return 'OF'
    if color in ('oforange', 'rooftop'):
        return 'OF'
    if color in ('darkgreen', 'midgreen'):
        return 'OF' if cx > 995 else None
    return None


cells = {z: [] for z in ['C', 'T3', 'BZ', 'I1', 'T1', 'SB', 'OF', 'SKY']}
for color, rgb in PAL.items():
    m = mask_of(rgb)
    n, cc, stats, cen = cv2.connectedComponentsWithStats((m > 0).astype(np.uint8), 8)
    for i in range(1, n):
        area = int(stats[i, 4])
        if area < MIN_AREA:
            continue
        cx, cy = cen[i]
        zone = assign(color, cx, cy, area)
        if not zone:
            continue
        comp = ((cc == i) & (m > 0)).astype(np.uint8)
        comp = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            if cv2.contourArea(c) < MIN_AREA * 0.6:
                continue
            ap = cv2.approxPolyDP(c, 3.0, True).reshape(-1, 2)
            if len(ap) >= 3:
                cells[zone].append([[int(x), int(y)] for x, y in ap])

outlines = {}
for z, cs in cells.items():
    m = np.zeros((H, W), np.uint8)
    for pts in cs:
        cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polys = []
    for c in cnts:
        if cv2.contourArea(c) < 700:
            continue
        ap = cv2.approxPolyDP(c, 4.5, True).reshape(-1, 2)
        if len(ap) >= 3:
            polys.append({'area': int(cv2.contourArea(c)),
                          'pts': [[int(x), int(y)] for x, y in ap]})
    polys.sort(key=lambda p: -p['area'])
    outlines[z] = polys

def path_of(polys):
    parts = []
    for p in polys:
        pts = p['pts']
        seg = 'M%d,%d' % (pts[0][0], pts[0][1])
        seg += ''.join('L%d,%d' % (x, y) for x, y in pts[1:])
        parts.append(seg + 'Z')
    return ''.join(parts)


L = []
L.append('/**')
L.append(' * 대구 삼성라이온즈파크(라팍) 좌석도 히트영역.')
L.append(' *')
L.append(' * 사용자가 올린 좌석안내도(public/images/lapak-seatmap.jpg, 1206×1092)를')
L.append(' * 그대로 화면에 띄우고, 그 위에 투명 SVG 오버레이로 얹는 구역 폴리곤입니다.')
L.append(' * 좌표는 원본 이미지 픽셀 그대로라 viewBox="0 0 1206 1092" 로 맞춰 씁니다.')
L.append(' *')
L.append(' * 좌석 셀의 실제 색 영역에서 외곽선을 추출해 만든 값이라 원본 그림의')
L.append(' * 구역 위치와 그대로 겹칩니다. scripts/build-seat-hitareas.py 산출물입니다.')
L.append(' */')
L.append('export const MAP_IMAGE = {')
L.append('  src: "/images/lapak-seatmap.jpg",')
L.append('  width: 1206,')
L.append('  height: 1092,')
L.append('} as const;')
L.append('')
L.append('export const VIEWBOX = "0 0 1206 1092";')
L.append('')
L.append('/** 클릭 가능한 좌석 구역 코드 (8개) */')
L.append('export type ZoneCode = "C" | "T3" | "BZ" | "I1" | "T1" | "SB" | "OF" | "SKY";')
L.append('')
L.append('export interface ZoneShape {')
L.append('  code: ZoneCode;')
L.append('  /** 오버레이 위에 얹는 구역 실루엣 (SVG path, 여러 조각이면 이어 붙임) */')
L.append('  path: string;')
L.append('}')
L.append('')
L.append('export const ZONE_SHAPES: ZoneShape[] = [')
for code in ['BZ', 'I1', 'T3', 'T1', 'C', 'SB', 'OF', 'SKY']:
    L.append('  {')
    L.append('    code: "%s",' % code)
    L.append('    path:')
    L.append('      "%s",' % path_of(outlines[code]))
    L.append('  },')
L.append('];')
L.append('')
L.append('/** 구역 코드 → 실루엣 (클릭·하이라이트에 씀) */')
L.append('export const SHAPE_BY_CODE = Object.fromEntries(')
L.append('  ZONE_SHAPES.map((s) => [s.code, s]),')
L.append(') as Record<ZoneCode, ZoneShape>;')
L.append('')

open(OUT, 'w').write('\n'.join(L))
print('wrote', OUT)
