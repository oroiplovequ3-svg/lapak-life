"""카톡·SNS 공유 썸네일(OG 이미지) 생성기.

public/og-inblue.png (1200×630)를 만듭니다. 카톡·트위터·페북 미리보기에 쓰이고,
src/app/layout.tsx 의 openGraph.images / twitter.images 가 이 파일을 가리킵니다.

    python scripts/build-og-image.py

마스코트(public/images/lapak-mascot.png)는 원본을 **읽기만** 하고, 가장자리에서
이어지는 하늘색 배경만 지워 씁니다. 캐릭터 자체는 손대지 않습니다.
"""

from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
FONT = "/usr/share/fonts/pickle-hwp/NotoSansCJKkr-Regular.otf"

W, H = 1200, 630
BRAND_DARK = (4, 47, 102)      # #042F66
BRAND = (7, 76, 161)           # #074CA1
BRAND_LIGHT = (42, 123, 228)   # #2A7BE4
WHITE = (255, 255, 255)
SOFT = (207, 224, 250)
FAINT = (168, 198, 236)


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size)


def diagonal_gradient(size: tuple[int, int]) -> Image.Image:
    """왼쪽 위 → 오른쪽 아래로 흐르는 브랜드 그라데이션."""
    w, h = size
    small = Image.new("RGB", (64, 64))
    px = small.load()
    for y in range(64):
        for x in range(64):
            t = (x / 63 * 0.62 + y / 63 * 0.38)
            if t < 0.5:
                k = t / 0.5
                a, b = BRAND_DARK, BRAND
            else:
                k = (t - 0.5) / 0.5
                a, b = BRAND, BRAND_LIGHT
            px[x, y] = tuple(round(a[i] + (b[i] - a[i]) * k) for i in range(3))
    return small.resize((w, h), Image.BICUBIC)


def cut_out_mascot() -> Image.Image:
    """가장자리에서 이어진 하늘색 배경만 지우고 알파를 살짝 부드럽게 다듬습니다."""
    src = Image.open(PUBLIC / "images" / "lapak-mascot.png").convert("RGBA")
    w, h = src.size
    pixels = src.load()
    bg = pixels[0, 0][:3]
    tolerance = 46

    def is_bg(c: tuple[int, int, int]) -> bool:
        return sum((c[i] - bg[i]) ** 2 for i in range(3)) <= tolerance * tolerance

    seen = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        index = y * w + x
        if seen[index]:
            continue
        if not is_bg(pixels[x, y][:3]):
            continue
        seen[index] = 1
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    mask = Image.new("L", (w, h), 255)
    mask_pixels = mask.load()
    for y in range(h):
        row = y * w
        for x in range(w):
            if seen[row + x]:
                mask_pixels[x, y] = 0
    mask = mask.filter(ImageFilter.GaussianBlur(1.4))

    out = src.copy()
    out.putalpha(mask)
    return out.crop(out.getbbox())


def pill(draw: ImageDraw.ImageDraw, x: int, y: int, text: str) -> int:
    f = font(25)
    pad_x, height = 24, 48
    width = int(draw.textlength(text, font=f)) + pad_x * 2
    # 반투명 흰색을 직접 블렌딩해 알파 합성 문제 없이 같은 톤을 냅니다.
    draw.rounded_rectangle((x, y, x + width, y + height), radius=24, fill=(64, 118, 190))
    draw.text((x + pad_x, y + height / 2 + 1), text, font=f, fill=(240, 246, 255), anchor="lm")
    return width


def draw_bold(draw, xy, text, f, fill, stroke=2):
    """한글 폰트가 Regular뿐이라 같은 색 테두리를 겹쳐 굵게 보이게 합니다."""
    draw.text(xy, text, font=f, fill=fill, stroke_width=stroke, stroke_fill=fill)


def main() -> None:
    canvas = diagonal_gradient((W, H)).convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    # 홈 배너와 같은 결의 반투명 원·링 장식
    od.ellipse((880, -180, 1420, 360), fill=(255, 255, 255, 22))
    od.ellipse((-190, 400, 260, 850), outline=(255, 255, 255, 26), width=52)
    od.ellipse((742, 118, 1152, 528), fill=(255, 255, 255, 24))
    overlay = overlay.filter(ImageFilter.GaussianBlur(1))
    canvas = Image.alpha_composite(canvas, overlay)

    draw = ImageDraw.Draw(canvas)

    left = 82
    y = 92
    pill(draw, left, y, "2026 시즌 · 삼성 라이온즈 팬")

    y += 78
    draw_bold(draw, (left - 3, y), "인블루", font(94), WHITE, stroke=3)
    y += 118
    draw.text((left + 2, y), "(INBLUE)", font=font(36), fill=(190, 216, 248))

    y += 74
    draw_bold(draw, (left, y), "삼성 라이온즈 팬 커뮤니티", font(44), WHITE, stroke=1)
    y += 62
    draw.text(
        (left + 1, y),
        "좌석 시야 · 맛집 · 주차 · 직관 기록",
        font=font(31),
        fill=SOFT,
    )

    # 아래쪽 주소
    draw.line((left, 522, left + 74, 522), fill=(255, 255, 255, 150), width=5)
    draw.text((left, 556), "inblue-fan.vercel.app", font=font(27), fill=FAINT, anchor="ls")

    # 마스코트 — 오른쪽 아래에 크게
    mascot = cut_out_mascot()
    target_h = 542
    scale = target_h / mascot.height
    mascot = mascot.resize((round(mascot.width * scale), target_h), Image.LANCZOS)
    mx = W - 58 - mascot.width
    my = H - 16 - mascot.height
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse(
        (mx + mascot.width * 0.12, my + target_h - 34, mx + mascot.width * 0.96, my + target_h + 26),
        fill=(3, 32, 72, 90),
    )
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(16)))
    canvas.alpha_composite(mascot, (mx, my))

    out = canvas.convert("RGB")
    out.save(PUBLIC / "og-inblue.png", "PNG", optimize=True)
    print("saved", PUBLIC / "og-inblue.png", out.size)


if __name__ == "__main__":
    main()
