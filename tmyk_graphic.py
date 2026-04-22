#!/usr/bin/env python3
"""Topstep-branded 'The More You Know' graphic – 1600x900 PNG."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import math, os

W, H   = 1600, 900
OUT    = os.path.join(os.path.dirname(__file__), "tmyk_topstep.png")
FONTS  = os.path.join(os.path.dirname(__file__), "assets", "fonts")

# ── palette ──────────────────────────────────────────────────────────────────
NIGHT    = (16,  22,  29)
SLATE    = (27,  41,  69)
ICE      = (105, 182, 210)
GLACIER  = (185, 212, 212)
GOLD_0   = (170, 114,  58)
GOLD_45  = (210, 156,  92)
GOLD_75  = (242, 206, 149)
GOLD_100 = (196, 135,  67)
GOLD_ACC = (226, 163,  85)
GOLD_TXT = (246, 220, 168)
WHITE    = (255, 255, 255)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def trader_gold(t):
    stops = [(0.0, GOLD_0), (0.45, GOLD_45), (0.75, GOLD_75), (1.0, GOLD_100)]
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]; t1, c1 = stops[i+1]
        if t <= t1:
            return lerp(c0, c1, (t - t0) / (t1 - t0))
    return GOLD_100


# ── cubic bezier ─────────────────────────────────────────────────────────────
def bezier(t, pts):
    p0, p1, p2, p3 = pts
    mt = 1 - t
    return (mt**3*p0[0] + 3*mt**2*t*p1[0] + 3*mt*t**2*p2[0] + t**3*p3[0],
            mt**3*p0[1] + 3*mt**2*t*p1[1] + 3*mt*t**2*p2[1] + t**3*p3[1])

def bezier_tangent(t, pts):
    p0, p1, p2, p3 = pts
    mt = 1 - t
    dx = 3*(mt**2*(p1[0]-p0[0]) + 2*mt*t*(p2[0]-p1[0]) + t**2*(p3[0]-p2[0]))
    dy = 3*(mt**2*(p1[1]-p0[1]) + 2*mt*t*(p2[1]-p1[1]) + t**2*(p3[1]-p2[1]))
    return (dx, dy)


# ── arc definition ────────────────────────────────────────────────────────────
# tail (lower-left) → head (upper-right)
ARC = [(50, 840), (300, 130), (960, 90), (1460, 255)]
N   = 1400   # sample density


def arc_spine(n=N):
    """Return (x, y) centre-line points of the arc."""
    return [bezier(i / n, ARC) for i in range(n + 1)]


def arc_normals(spine):
    """Unit normal (perpendicular, pointing 'above' the curve) at each spine point."""
    normals = []
    for i in range(len(spine)):
        if i < len(spine) - 1:
            tx = spine[i+1][0] - spine[i][0]
            ty = spine[i+1][1] - spine[i][1]
        else:
            tx = spine[i][0] - spine[i-1][0]
            ty = spine[i][1] - spine[i-1][1]
        mag = math.sqrt(tx*tx + ty*ty) or 1.0
        # normal pointing outward (away from the concave side = "above" the arc)
        normals.append((-ty / mag, tx / mag))
    return normals


def offset_polyline(spine, normals, offset):
    """Shift every point along the normal by `offset` pixels."""
    return [(spine[i][0] + normals[i][0] * offset,
             spine[i][1] + normals[i][1] * offset)
            for i in range(len(spine))]


def draw_polyline(layer, pts, color, width, alpha=255):
    d = ImageDraw.Draw(layer)
    col = (*color, alpha) if len(color) == 3 else color
    flat = [coord for p in pts for coord in p]
    d.line(flat, fill=col, width=width, joint="curve")


# ── sparkle ──────────────────────────────────────────────────────────────────
def draw_sparkle(canvas, cx, cy, r_outer=72, r_inner=18, spikes=4,
                 color=GOLD_75, glow_color=GOLD_ACC):
    # large diffuse bloom — several passes for a soft halo
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    for rad, a in [
        (r_outer * 5.0, 18),
        (r_outer * 3.5, 38),
        (r_outer * 2.2, 70),
        (r_outer * 1.4, 120),
        (r_outer * 0.8, 180),
    ]:
        gd.ellipse([cx-rad, cy-rad, cx+rad, cy+rad], fill=(*glow_color, a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=r_outer * 1.1))
    canvas.alpha_composite(glow)

    # lens-flare streaks first (behind the star shape)
    fl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fl)
    for angle, alen, aw, aa in [
        (0,            r_outer * 2.6, 5, 210),
        (math.pi/2,    r_outer * 2.6, 5, 210),
        (math.pi/4,    r_outer * 1.5, 3, 160),
        (3*math.pi/4,  r_outer * 1.5, 3, 160),
        (math.pi/8,    r_outer * 1.1, 2, 100),
        (3*math.pi/8,  r_outer * 1.1, 2, 100),
        (5*math.pi/8,  r_outer * 1.1, 2, 100),
        (7*math.pi/8,  r_outer * 1.1, 2, 100),
    ]:
        x1 = cx + math.cos(angle)*alen;  y1 = cy + math.sin(angle)*alen
        x2 = cx - math.cos(angle)*alen;  y2 = cy - math.sin(angle)*alen
        fd.line([x1, y1, x2, y2], fill=(*WHITE, aa), width=aw)
    fl = fl.filter(ImageFilter.GaussianBlur(radius=1.5))
    canvas.alpha_composite(fl)

    # 4-point star shape
    sl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sl)
    pts = []
    for k in range(spikes * 2):
        angle = math.pi / spikes * k - math.pi / 2
        r = r_outer if k % 2 == 0 else r_inner
        pts.append((cx + r*math.cos(angle), cy + r*math.sin(angle)))
    sd.polygon(pts, fill=(*color, 255))
    # bright centre dot
    cr = r_outer * 0.25
    sd.ellipse([cx-cr, cy-cr, cx+cr, cy+cr], fill=(*WHITE, 255))
    canvas.alpha_composite(sl)


# ── fonts ─────────────────────────────────────────────────────────────────────
def load_font(size, weight=800):
    for name, w in [(f"WorkSans-{weight}.ttf", weight)]:
        p = os.path.join(FONTS, name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    for fb in ["/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
               "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
        if os.path.exists(fb):
            return ImageFont.truetype(fb, size)
    return ImageFont.load_default()


# ── gradient text ──────────────────────────────────────────────────────────────
def gradient_text(canvas, text, font, cx, cy, c_left, c_right):
    tmp  = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bbox = ImageDraw.Draw(tmp).textbbox((0, 0), text, font=font, anchor="lt")
    tw   = bbox[2] - bbox[0]
    th   = bbox[3] - bbox[1]
    tx   = cx - tw / 2
    ty   = cy - th / 2 - bbox[1]

    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).text((tx, ty), text, font=font, fill=255, anchor="lt")

    grad = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(grad)
    for px in range(int(tx), int(tx + tw) + 2):
        t   = (px - tx) / max(tw, 1)
        col = lerp(c_left, c_right, t)
        gd.line([(px, 0), (px, H)], fill=(*col, 255))
    grad.putalpha(mask)
    canvas.alpha_composite(grad)


# ══════════════════════════════════════════════════════════════════════════════
def render():
    # 1 ── background ──────────────────────────────────────────────────────────
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    cx_bg, cy_bg = W * 0.55, H * 0.38
    for y in range(H):
        for x in range(W):
            d = math.sqrt((x - cx_bg)**2 + (y - cy_bg)**2) / (W * 0.72)
            t = max(0.0, min(1.0, 1.0 - d * 0.88))
            arr[y, x] = lerp(NIGHT, SLATE, t * 0.45)
    canvas = Image.fromarray(arr, 'RGB').convert('RGBA')

    # 2 ── build arc geometry ───────────────────────────────────────────────────
    spine   = arc_spine(N)
    normals = arc_normals(spine)

    # Taper: each segment fades in opacity toward the comet head (t→1)
    # We also taper the stripe widths from thick-at-tail to thin-at-head

    # ribbon band definitions: (offset_px, width_px, color_fn, base_alpha, blur)
    # offset along outward normal; positive = "above" the arc
    BANDS = [
        # outer glacier halo — widest, most diffuse
        (+80, 60, lambda t: GLACIER,                           0.58, 6.0),
        (+58, 44, lambda t: GLACIER,                           0.88, 4.0),
        # ice stripe — vibrant teal
        (+34, 36, lambda t: ICE,                               0.95, 3.0),
        (+16, 28, lambda t: ICE,                               1.00, 2.5),
        # gold transition band
        (+2,  24, lambda t: lerp(ICE, GOLD_45, min(t*1.4,1)), 1.00, 2.0),
        # gold body
        (-14, 20, lambda t: trader_gold(t),                    1.00, 1.8),
        (-27, 16, lambda t: lerp(GOLD_45, GOLD_75, t),         1.00, 1.5),
        # bright core
        (-38, 10, lambda t: lerp(GOLD_75, GOLD_TXT, t*0.8),   1.00, 1.2),
        (-45,  5, lambda t: lerp(GOLD_TXT, WHITE, t*0.6),      1.00, 0.8),
    ]

    # 3 ── wide outer glow composited BEFORE the bands ────────────────────────
    glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sub_spine  = spine[::3]
    gd         = ImageDraw.Draw(glow_layer)
    for i in range(len(sub_spine) - 1):
        t_val = i / max(len(sub_spine) - 1, 1)
        t_inv = 1 - t_val
        w   = max(4, int(200 * (0.12 + 0.88 * t_inv)))
        col = (*lerp(GLACIER, ICE, t_val * 0.6), 28)
        gd.line([sub_spine[i], sub_spine[i+1]], fill=col, width=w)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=38))
    canvas.alpha_composite(glow_layer)

    # For each band, draw on a temporary layer then blur+composite
    for offset, base_w, color_fn, base_alpha, blur_r in BANDS:
        layer   = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        shifted = offset_polyline(spine, normals, offset)

        sub   = shifted[::2]
        sub_n = max(len(sub) - 1, 1)

        d = ImageDraw.Draw(layer)
        for i in range(len(sub) - 1):
            t_val = i / sub_n
            t_inv = 1 - t_val
            # taper: full width at tail → 15 % at head
            w   = max(2, int(base_w * (0.15 + 0.85 * t_inv)))
            a   = int(base_alpha * 255)
            col = (*color_fn(t_val), a)
            d.line([sub[i], sub[i+1]], fill=col, width=w)

        layer = layer.filter(ImageFilter.GaussianBlur(radius=blur_r))
        canvas.alpha_composite(layer)

    # 4 ── comet head sparkle ──────────────────────────────────────────────────
    hx, hy = bezier(1.0, ARC)
    draw_sparkle(canvas, hx, hy, r_outer=110, r_inner=28, spikes=4,
                 color=GOLD_75, glow_color=GOLD_ACC)
    # bright centre flash
    sx, sy = bezier(0.978, ARC)
    draw_sparkle(canvas, sx, sy, r_outer=36, r_inner=10, spikes=4,
                 color=WHITE, glow_color=GOLD_TXT)

    # 5 ── text ────────────────────────────────────────────────────────────────
    font_lg = load_font(152, weight=800)

    text_cx = W * 0.50
    text_cy = H * 0.715

    # text bloom
    bloom = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bd    = ImageDraw.Draw(bloom)
    bd.text((text_cx, text_cy - 78), "THE MORE",   font=font_lg, fill=(*GOLD_ACC, 50), anchor="mm")
    bd.text((text_cx, text_cy + 78), "YOU KNOW",   font=font_lg, fill=(*GOLD_ACC, 50), anchor="mm")
    bloom = bloom.filter(ImageFilter.GaussianBlur(radius=26))
    canvas.alpha_composite(bloom)

    # line 1
    gradient_text(canvas, "THE MORE", font_lg, text_cx, text_cy - 78, GOLD_TXT, GOLD_ACC)
    # line 2
    gradient_text(canvas, "YOU KNOW", font_lg, text_cx, text_cy + 78, GOLD_ACC, GOLD_TXT)

    # divider rule
    rule_w = 580
    rd = ImageDraw.Draw(canvas)
    rd.line([(text_cx - rule_w/2, text_cy), (text_cx + rule_w/2, text_cy)],
            fill=(*ICE, 160), width=2)

    # 6 ── "T" logo ────────────────────────────────────────────────────────────
    logo_font = load_font(96, weight=900)
    lx, ly    = 72, 56

    logo_bloom = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(logo_bloom).text((lx + 32, ly + 48), "T",
                                    font=logo_font, fill=(*GOLD_ACC, 100), anchor="mm")
    logo_bloom = logo_bloom.filter(ImageFilter.GaussianBlur(radius=18))
    canvas.alpha_composite(logo_bloom)

    gradient_text(canvas, "T", logo_font, lx + 32, ly + 48, GOLD_TXT, GOLD_ACC)

    # 7 ── vignette ────────────────────────────────────────────────────────────
    vig_arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        for x in range(W):
            ex = min(x, W - 1 - x) / (W * 0.12)
            ey = min(y, H - 1 - y) / (H * 0.12)
            e  = min(ex, ey, 1.0)
            a  = int((1 - e) * 140)
            if a > 0:
                vig_arr[y, x] = (0, 0, 0, a)
    vig = Image.fromarray(vig_arr, 'RGBA')
    canvas.alpha_composite(vig)

    # 8 ── export ──────────────────────────────────────────────────────────────
    canvas.convert('RGB').save(OUT, 'PNG', optimize=True)
    print(f"Saved: {OUT}  ({W}x{H})")


if __name__ == "__main__":
    render()
