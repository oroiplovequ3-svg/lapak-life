"""좌석도 히트영역 생성기.

public/images/lapak-seatmap.jpg (원본 좌석안내도, 1206×1092)를 **읽기만** 하고
좌석 셀의 색 영역에서 구역 실루엣을 뽑아 src/lib/seat/map-geometry.ts 로 씁니다.

    pip install opencv-python numpy
    python scripts/build-seat-hitareas.py

원본 이미지는 절대 수정·리사이즈하지 않습니다. 좌표만 뽑아 씁니다.

구역 코드 (2026 시즌 좌석안내도 기준)
  3층 내야·중앙
    C    VIP석               (연두, 중앙테이블석 바로 앞 3·2·1)
    CT   중앙 테이블석        (노랑, 포수 뒤 정면 + 맨 뒤 VIP 두 칸)
    T3   3루 테이블석         (진밤색, 3루)
    T1   1루 테이블석         (진밤색, 1루)
    E3   3루 익사이팅석       (분홍, 파울라인 옆 1·2)
    E1   1루 익사이팅석       (분홍, 파울라인 옆 1·2)
    BZ   블루존               (파랑, 3루)
    N3   3루 내야지정석       (보라, 3루 6~13)
    I1   원정 응원석          (파랑, 1루 1~5)
    N1   1루 내야지정석       (보라, 1루 6~13)
  4층
    SB   스윗박스             (자주 띠 전체 — 3루 쪽 S1~S7 세로 띠 + 내야를 감싸는 띠)
    PF   파티플로어 라이브석   (갈색, 3루 끝)
  5층 SKY
    U3   3루 SKY 상단 지정석   (남색)
    UC   중앙 SKY 상단 지정석  (남색, 하단 중앙)
    U1   1루 SKY 상단 지정석   (남색)
    SKB  SKY 블루존           (하늘색 20~24)
    SF   SKY 요기보 패밀리존   (주황 SKY박스)
  외야·잔디
    OF   외야 지정석          (주황 LF·RF)
    OT   외야 테이블석        (도면에 따로 그려진 블록 없음 → 히트영역 없음)
    OC   외야 커플 테이블석    (연두 띠, 외야 라인 바로 뒤)
    RT   루프탑 테이블석       (연두, 11시 방향 LF 바깥)
    OP   외야 패밀리석        (연노랑 다이아, 2시 방향)
    DG   잔디 그린존          (진초록, 3시)
    CP   캠핑존               (연한 연두 띠, 잔디그린존 오른쪽)
"""
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
    'skybox':    (0xDE, 0x81, 0x31),
}
TOL = 24
MIN_AREA = 250
MID = 603  # 홈플레이트 기준 좌(3루) / 우(1루) 경계 x

# 히트영역을 뽑을 구역 코드 (이 순서대로 map-geometry.ts 에 씀)
ZONES = [
    'C', 'CT', 'T3', 'T1', 'E3', 'E1', 'BZ', 'N3', 'I1', 'N1',
    'SB', 'PF',
    'U3', 'UC', 'U1', 'SKB', 'SF',
    'OF', 'OC', 'RT', 'OP', 'DG', 'CP',
]
# SB 는 좌측 세로 띠와 내야를 감싸는 띠로 나눠 뽑은 뒤 하나로 붙입니다.
EXTRA = ['SB_BAND']


def assign(color, cx, cy, area, bbox):
    """색 + 위치로 구역 코드를 정합니다. 원본 도면의 실제 배치를 그대로 따릅니다."""
    if color == 'navy':
        if cy > 940:                     # 아래쪽 호: 3루 / 중앙 / 1루 SKY 상단
            if cx < 470:
                return 'U3'
            if cx < 730:
                return 'UC'
            return 'U1'
        return 'U3' if cx < 300 else 'U1'  # 양옆 세로 띠

    if color == 'lightblue':
        return 'SKB'

    if color == 'blue':                  # 3루 블루존 / 1루 원정 응원석
        return 'BZ' if cx < MID else 'I1'

    if color == 'purple':                # 3루 / 1루 내야지정석
        return 'N3' if cx < MID else 'N1'

    if color == 'pink':                  # 익사이팅석
        return 'E3' if cx < MID else 'E1'

    if color == 'maroon':                # 3루 / 1루 테이블석
        return 'T3' if cx < MID else 'T1'

    if color == 'magenta':
        # 가운데 'VIP' 두 칸은 중앙테이블석 뒤줄이라 CT 로 붙입니다.
        if 490 < cx < 710 and 950 < cy < 995 and area > 1500:
            return 'CT'
        # 자주 띠는 전부 스윗박스입니다. 좁은 세로 띠(S1~S7)는 따로 뽑아 이어 붙입니다.
        if bbox[0] + bbox[2] <= 240:
            return 'SB'
        return 'SB_BAND'

    if color == 'brown':
        return 'PF'

    if color in ('oforange', 'rooftop'):  # 외야 지정석
        return 'OF'

    if color == 'olive':
        if 790 < cy < 832 and 525 < cx < 670:   # 홈플레이트 바로 뒤 연두 3·2·1
            return 'C'
        if cy < 320 and area > 2000:            # 11시 방향 외야 데크(큰 블록)
            return 'RT'
        if cy < 320:                            # 외야 라인 바로 뒤 연두 띠
            return 'OC'
        return None

    if color == 'yellow':
        if cy > 820 and 455 < cx < 735:         # 중앙 테이블석
            return 'CT'
        if cy < 320:                            # 2시 방향 다이아 = 외야 패밀리석
            return 'OP'
        return None

    if color == 'darkgreen':
        return 'DG' if cx > 995 else None

    if color == 'midgreen':
        return 'CP' if cx > 995 else None

    if color == 'skybox':                       # 5층 맨 아래 주황 SKY박스
        if cy > 1040 and 500 < cx < 640 and area < 6000:
            return 'SF'
        return None
    return None


cells = {z: [] for z in ZONES + EXTRA}
for color, rgb in PAL.items():
    r, g, b = rgb
    lo = np.array([max(0, b - TOL), max(0, g - TOL), max(0, r - TOL)], np.uint8)
    hi = np.array([min(255, b + TOL), min(255, g + TOL), min(255, r + TOL)], np.uint8)
    m = cv2.inRange(im, lo, hi)
    n, cc, stats, cen = cv2.connectedComponentsWithStats((m > 0).astype(np.uint8), 8)
    for i in range(1, n):
        area = int(stats[i, 4])
        if area < MIN_AREA:
            continue
        cx, cy = cen[i]
        bbox = [int(stats[i, 0]), int(stats[i, 1]), int(stats[i, 2]), int(stats[i, 3])]
        zone = assign(color, cx, cy, area, bbox)
        if not zone:
            continue
        comp = ((cc == i) & (m > 0)).astype(np.uint8)
        comp = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
        cnts, _ = cv2.findContours(comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in cnts:
            if cv2.contourArea(c) < MIN_AREA * 0.5:
                continue
            ap = cv2.approxPolyDP(c, 3.0, True).reshape(-1, 2)
            if len(ap) >= 3:
                cells[zone].append([[int(x), int(y)] for x, y in ap])


def outline_of(cs, approx=4.5, min_area=500, close=9, open_=5, pad=0):
    m = np.zeros((H, W), np.uint8)
    for pts in cs:
        cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE,
                         cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close)))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN,
                         cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_, open_)))
    if pad:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (pad * 2 + 1, pad * 2 + 1))
        m = cv2.dilate(m, k)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polys = []
    for c in cnts:
        if cv2.contourArea(c) < min_area:
            continue
        ap = cv2.approxPolyDP(c, approx, True).reshape(-1, 2)
        if len(ap) >= 3:
            polys.append({'area': int(cv2.contourArea(c)),
                          'pts': [[int(x), int(y)] for x, y in ap]})
    polys.sort(key=lambda p: -p['area'])
    return polys


outlines = {z: outline_of(cs) for z, cs in cells.items()}
# 좁은 띠·작은 블록은 커널을 줄여 외곽선을 조이고, 손가락으로 누를 만하게 살짝 부풉니다.
for small in ('E3', 'E1'):
    outlines[small] = outline_of(cells[small], approx=3.0, close=5, open_=3, pad=2)
outlines['C'] = outline_of(cells['C'], approx=3.5, close=5, open_=3)
outlines['CP'] = outline_of(cells['CP'], approx=3.0, min_area=400, close=3, open_=3, pad=6)
# 스윗박스는 좁은 세로 띠(작은 커널)와 넓은 띠(큰 커널)를 따로 뽑아 경로를 이어 붙입니다.
outlines['SB'] = (outline_of(cells['SB'], approx=3.0, close=3, open_=3)
                  + outline_of(cells['SB_BAND'], approx=4.0, close=23, open_=3, pad=2))
outlines['OC'] = outline_of(cells['OC'], approx=2.5, min_area=150, close=7, open_=3, pad=2)
outlines['SF'] = outline_of(cells['SF'], approx=3.0, min_area=200, close=3, open_=3, pad=3)


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
L.append('/** 클릭 가능한 좌석 구역 코드 */')
L.append('export type ZoneCode =')
for i, z in enumerate(ZONES):
    L.append('  | "%s"%s' % (z, ';' if i == len(ZONES) - 1 else ''))
L.append('')
L.append('export interface ZoneShape {')
L.append('  code: ZoneCode;')
L.append('  /** 오버레이 위에 얹는 구역 실루엣 (SVG path, 여러 조각이면 이어 붙임) */')
L.append('  path: string;')
L.append('}')
L.append('')
L.append('export const ZONE_SHAPES: ZoneShape[] = [')
# 뒤에 그려지는 구역이 클릭을 먼저 받습니다 (좁은 익사이팅존을 맨 뒤로).
order = ['BZ', 'I1', 'N3', 'N1', 'CT', 'C', 'T3', 'T1', 'SB', 'PF',
         'U3', 'UC', 'U1', 'SKB', 'SF', 'OF', 'OC', 'RT', 'OP', 'DG', 'CP', 'E3', 'E1']
for code in order:
    L.append('  {')
    L.append('    code: "%s",' % code)
    L.append('    path:')
    L.append('      "%s",' % path_of(outlines[code]))
    L.append('  },')
L.append('];')
L.append('')
L.append('/** 구역 코드 → 실루엣 (클릭·하이라이트에 씀). 히트영역이 없는 구역은 빠집니다. */')
L.append('export const SHAPE_BY_CODE = Object.fromEntries(')
L.append('  ZONE_SHAPES.map((s) => [s.code, s]),')
L.append(') as Partial<Record<ZoneCode, ZoneShape>>;')
L.append('')

open(OUT, 'w').write('\n'.join(L))
print('wrote', OUT)
for code in order:
    print('%-4s polys=%d area=%d' % (code, len(outlines[code]),
                                     sum(p['area'] for p in outlines[code])))
