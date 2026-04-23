#!/usr/bin/env python3
"""Topstep 'The More You Know' – straight diagonal, wide colour bands, solid star."""

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


# ── fonts ─────────────────────────────────────────────────────────────────────
def load_font(size, weight=800):
    p = os.path.join(FONTS, f"WorkSans-{weight}.ttf")
    if os.path.exists(p):
        return ImageFont.truetype(p, size)
    for fb in ["/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
               "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
        if os.path.exists(fb):
            return ImageFont.truetype(fb, size)
    return ImageFont.load_default()


# ── text helpers ───────────────────────────────────────────────────────────────
def _text_origin(text, font, cx, cy):
    """Return (tx, ty) top-left draw position for centred text at (cx, cy)."""
    tmp  = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bbox = ImageDraw.Draw(tmp).textbbox((0, 0), text, font=font, anchor="lt")
    tw   = bbox[2] - bbox[0]
    th   = bbox[3] - bbox[1]
    return cx - tw / 2, cy - th / 2 - bbox[1]


def text_shadow(canvas, text, font, cx, cy, dx=0, dy=5, blur=6, alpha=210):
    """Dark drop shadow — call before gradient_text."""
    tx, ty = _text_origin(text, font, cx, cy)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((tx + dx, ty + dy), text,
                            font=font, fill=(*NIGHT, alpha), anchor="lt")
    sh = sh.filter(ImageFilter.GaussianBlur(radius=blur))
    canvas.alpha_composite(sh)


def gradient_text(canvas, text, font, cx, cy, c_left, c_right):
    tx, ty = _text_origin(text, font, cx, cy)
    tmp    = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bbox   = ImageDraw.Draw(tmp).textbbox((0, 0), text, font=font, anchor="lt")
    tw     = bbox[2] - bbox[0]

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


def draw_diagonal_text(canvas):
    """Render 'THE MORE YOU KNOW' running along the trail direction."""
    # Trail angle: how many degrees the trail tilts upward from horizontal
    angle_deg = math.degrees(math.atan2(
        -(P_HEAD[1] - P_TAIL[1]),   # negate: screen-y is inverted
         P_HEAD[0] - P_TAIL[0]))    # ≈ 28.7°

    font = load_font(118, weight=800)
    text = "THE MORE YOU KNOW"

    # ── measure text ─────────────────────────────────────────────────────────
    tmp  = Image.new('RGBA', (3000, 400), (0, 0, 0, 0))
    bbox = ImageDraw.Draw(tmp).textbbox((0, 0), text, font=font, anchor="lt")
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = 90   # padding so rotation doesn't clip descenders/ascenders

    TC_W, TC_H = tw + pad * 2, th + pad * 2
    tc   = Image.new('RGBA', (TC_W, TC_H), (0, 0, 0, 0))
    tx_  = pad
    ty_  = pad - bbox[1]

    # ── shadow ────────────────────────────────────────────────────────────────
    sh = Image.new('RGBA', (TC_W, TC_H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((tx_ + 4, ty_ + 8), text,
                            font=font, fill=(*NIGHT, 220), anchor="lt")
    sh = sh.filter(ImageFilter.GaussianBlur(radius=10))
    tc.alpha_composite(sh)

    # ── gold gradient fill ────────────────────────────────────────────────────
    mask = Image.new('L', (TC_W, TC_H), 0)
    ImageDraw.Draw(mask).text((tx_, ty_), text, font=font, fill=255, anchor="lt")

    grad = Image.new('RGBA', (TC_W, TC_H), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(grad)
    for px in range(tx_, tx_ + tw + 2):
        t   = (px - tx_) / max(tw, 1)
        col = lerp(GOLD_ACC, GOLD_TXT, t)   # darker at tail → lighter near star
        gd.line([(px, 0), (px, TC_H)], fill=(*col, 255))
    grad.putalpha(mask)
    tc.alpha_composite(grad)

    # ── rotate to match trail angle ───────────────────────────────────────────
    rotated = tc.rotate(angle_deg, expand=True, resample=Image.BICUBIC)

    # ── position: centre of text sits at ~54 % along the trail ───────────────
    t_c = 0.47
    cx  = P_TAIL[0] + TRAIL_U[0] * t_c * TRAIL_LEN
    cy  = P_TAIL[1] + TRAIL_U[1] * t_c * TRAIL_LEN

    paste_x = int(cx - rotated.width  / 2)
    paste_y = int(cy - rotated.height / 2)

    # Composite via a full-canvas intermediate so off-edge pixels are ignored
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    # Crop the rotated image to the canvas area before compositing
    src_x0 = max(0, -paste_x);  src_y0 = max(0, -paste_y)
    dst_x0 = max(0,  paste_x);  dst_y0 = max(0,  paste_y)
    dst_x1 = min(W,  paste_x + rotated.width)
    dst_y1 = min(H,  paste_y + rotated.height)
    src_x1 = src_x0 + (dst_x1 - dst_x0)
    src_y1 = src_y0 + (dst_y1 - dst_y0)
    if dst_x1 > dst_x0 and dst_y1 > dst_y0:
        layer.alpha_composite(
            rotated.crop((src_x0, src_y0, src_x1, src_y1)),
            (dst_x0, dst_y0))
    canvas.alpha_composite(layer)


# ── trail geometry ────────────────────────────────────────────────────────────
# tail bleeds off lower-left; head is where the star sits
P_TAIL = np.array([-120.0, 920.0])
P_HEAD = np.array([1320.0, 130.0])


def _trail_axes():
    v      = P_HEAD - P_TAIL
    length = float(np.linalg.norm(v))
    u      = v / length                     # unit along trail
    n      = np.array([u[1], -u[0]])        # normal (rotated -90°) → points upper-left
    return length, u, n


TRAIL_LEN, TRAIL_U, TRAIL_N = _trail_axes()


# ── pixel-accurate trail rendering ───────────────────────────────────────────
def draw_trail(canvas):
    """
    Numpy-based trail: each pixel colour is determined by its perpendicular
    position within the tapered wedge.  Two main bold bands (Ice/Glacier and
    Gold) with soft internal glow, sharp band boundary, minimal blur.
    """
    length, u, n = TRAIL_LEN, TRAIL_U, TRAIL_N

    # Per-pixel projections
    ys = np.arange(H, dtype=np.float32)
    xs = np.arange(W, dtype=np.float32)
    XX, YY = np.meshgrid(xs, ys)

    dx = XX - P_TAIL[0];  dy = YY - P_TAIL[1]
    T  = dx * u[0] + dy * u[1]          # along trail   [0, length]
    D  = dx * n[0] + dy * n[1]          # perp distance (+ = upper side)

    T_n = T / length                     # [0, 1]

    # Quadratic taper: stays wide through most of trail, tapers sharply near head
    HW_TAIL, HW_HEAD = 120.0, 5.0
    t_sq   = np.clip(T_n, 0, 1) ** 2
    half_w = HW_TAIL + (HW_HEAD - HW_TAIL) * t_sq

    D_n = D / (half_w + 1e-6)           # normalised perp, [-1, +1]

    # ── alpha mask ────────────────────────────────────────────────────────────
    in_trail = (T_n >= 0) & (T_n <= 1.0) & (np.abs(D_n) <= 1.2)

    # Tail fade (0→5%), head dissolves over last 20%
    tail_fade = np.clip(T_n / 0.05, 0, 1)
    head_fade = np.where(T_n < 0.80, 1.0,
                         np.exp(-((T_n - 0.80) / 0.10) ** 2))

    # Gaussian cross-section: bright at the two band centres, fades to edges.
    # This makes the ribbon feel like glowing light, not a painted stripe.
    # Band centres at D_n ≈ -0.42 (gold) and +0.35 (ice)
    gold_env = np.exp(-0.5 * ((D_n - (-0.42)) / 0.46) ** 2)
    ice_env  = np.exp(-0.5 * ((D_n - ( 0.35)) / 0.42) ** 2)
    envelope = np.clip(np.maximum(gold_env, ice_env) * 0.95, 0, 1)

    alpha_f = in_trail.astype(np.float32) * tail_fade * head_fade * envelope

    # ── colour: two main bands + thin bright seam ─────────────────────────────
    #
    # D_n layout: + = upper-left (Ice/Glacier), - = lower-right (Gold)
    #
    colour_stops = [
        (-1.00, np.array([ 70,  38,   8], dtype=np.float32)),  # outer shadow
        (-0.88, np.array(GOLD_0,         dtype=np.float32)),    # gold dark outer
        (-0.55, np.array(GOLD_45,        dtype=np.float32)),    # gold mid
        (-0.12, np.array(GOLD_75,        dtype=np.float32)),    # gold bright
        (-0.04, np.array(GOLD_TXT,       dtype=np.float32)),    # seam → gold side
        ( 0.00, np.array(GOLD_TXT,       dtype=np.float32)),    # seam (warm)
        (+0.04, np.array(GLACIER,        dtype=np.float32)),    # seam → ice side
        (+0.14, np.array(ICE,            dtype=np.float32)),    # ice starts
        (+0.52, np.array(ICE,            dtype=np.float32)),    # ice continues
        (+0.78, np.array(GLACIER,        dtype=np.float32)),    # glacier outer
        (+1.00, np.array([ 42,  72,  75], dtype=np.float32)),  # outer shadow
    ]

    color_arr = np.zeros((H, W, 3), dtype=np.float32)
    for i in range(len(colour_stops) - 1):
        d0, c0 = colour_stops[i]
        d1, c1 = colour_stops[i + 1]
        in_seg = (D_n >= d0) & (D_n < d1)
        frac   = np.clip((D_n - d0) / (d1 - d0), 0, 1)
        for ch in range(3):
            color_arr[:, :, ch] += in_seg * (c0[ch] + (c1[ch] - c0[ch]) * frac)

    # Handle the last stop boundary
    last_mask = (D_n >= colour_stops[-1][0])
    color_arr += last_mask[..., None] * colour_stops[-1][1]

    # ── internal glow: bright hot cores within each band ──────────────────────
    gold_glow = np.exp(-0.5 * ((D_n - (-0.50)) / 0.28) ** 2)
    ice_glow  = np.exp(-0.5 * ((D_n - (+0.34)) / 0.25) ** 2)
    seam_glow = np.exp(-0.5 * (D_n / 0.04) ** 2)

    color_arr += gold_glow[..., None] * np.array([55, 32,  6], dtype=np.float32)
    color_arr += ice_glow[ ..., None] * np.array([ 5, 30, 50], dtype=np.float32)
    color_arr += seam_glow[..., None] * np.array([30, 28, 20], dtype=np.float32)

    color_arr = np.clip(color_arr, 0, 255)

    # ── assemble RGBA ─────────────────────────────────────────────────────────
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, :3] = color_arr.astype(np.uint8)
    rgba[:, :,  3] = (alpha_f * 255).clip(0, 255).astype(np.uint8)

    trail_img = Image.fromarray(rgba, 'RGBA')
    # Minimal anti-alias blur only (keeps bands crisp)
    trail_img = trail_img.filter(ImageFilter.GaussianBlur(radius=1.2))
    canvas.alpha_composite(trail_img)


def draw_trail_glow(canvas):
    """Ambient glow behind the entire ribbon."""
    N    = 200
    step = TRAIL_LEN / N
    gl   = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(gl)
    for i in range(N):
        t   = i / N
        pt0 = (P_TAIL[0] + TRAIL_U[0] * t * TRAIL_LEN,
               P_TAIL[1] + TRAIL_U[1] * t * TRAIL_LEN)
        pt1 = (P_TAIL[0] + TRAIL_U[0] * (t + 1/N) * TRAIL_LEN,
               P_TAIL[1] + TRAIL_U[1] * (t + 1/N) * TRAIL_LEN)
        w   = max(4, int(340 * (0.08 + 0.92 * (1 - t))))
        gd.line([pt0, pt1], fill=(*lerp(GLACIER, ICE, 0.4), 18), width=w)
    gl = gl.filter(ImageFilter.GaussianBlur(radius=44))
    canvas.alpha_composite(gl)


# ── solid 5-pointed star ─────────────────────────────────────────────────────
def five_star(cx, cy, r_out, r_in):
    pts = []
    for k in range(10):
        a = math.pi / 5 * k - math.pi / 2
        r = r_out if k % 2 == 0 else r_in
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def draw_star(canvas, cx, cy):
    R  = 100
    Ri = int(R * 0.382)

    # Soft but restrained glow (one pass, moderate opacity)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    gd.ellipse([cx - R*1.8, cy - R*1.8, cx + R*1.8, cy + R*1.8],
               fill=(*GOLD_ACC, 60))
    gd.ellipse([cx - R*1.2, cy - R*1.2, cx + R*1.2, cy + R*1.2],
               fill=(*GOLD_75,  90))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=R * 0.55))
    canvas.alpha_composite(glow)

    # Star body — dark base + highlight gradient
    sl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sl)

    # Shadow/base fill
    sd.polygon(five_star(cx, cy, R, Ri), fill=(*GOLD_0, 255))

    # Mid highlight
    sd.polygon(five_star(cx, cy - R*0.05, int(R*0.92), int(Ri*0.92)),
               fill=(*GOLD_45, 255))

    # Bright face
    sd.polygon(five_star(cx, cy - R*0.10, int(R*0.80), int(Ri*0.80)),
               fill=(*GOLD_75, 255))

    # Specular highlight (upper-left tip area)
    sd.polygon(five_star(cx - R*0.06, cy - R*0.14, int(R*0.62), int(Ri*0.62)),
               fill=(*GOLD_TXT, 255))

    canvas.alpha_composite(sl)


# ══════════════════════════════════════════════════════════════════════════════
def render():
    # 1 ── background ──────────────────────────────────────────────────────────
    ys = np.arange(H, dtype=np.float32)
    xs = np.arange(W, dtype=np.float32)
    XX, YY = np.meshgrid(xs, ys)
    t_bg = np.clip((XX / W) * 0.25 + (YY / H) * 0.25, 0, 1)
    arr  = np.zeros((H, W, 3), dtype=np.uint8)
    for c in range(3):
        arr[:, :, c] = (NIGHT[c] + (SLATE[c] - NIGHT[c]) * t_bg * 0.45).astype(np.uint8)
    canvas = Image.fromarray(arr, 'RGB').convert('RGBA')

    # 2 ── ambient glow behind trail ───────────────────────────────────────────
    draw_trail_glow(canvas)

    # 3 ── crisp two-band trail ────────────────────────────────────────────────
    draw_trail(canvas)

    # 4 ── solid star at head ──────────────────────────────────────────────────
    draw_star(canvas, float(P_HEAD[0]), float(P_HEAD[1]))

    # 5 ── diagonal headline text along the trail ─────────────────────────────
    draw_diagonal_text(canvas)

    # 6 ── "T" logo ────────────────────────────────────────────────────────────
    logo_font = load_font(96, weight=900)
    lx, ly    = 72, 56
    lb = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(lb).text((lx + 32, ly + 48), "T",
                            font=logo_font, fill=(*GOLD_ACC, 90), anchor="mm")
    lb = lb.filter(ImageFilter.GaussianBlur(radius=16))
    canvas.alpha_composite(lb)
    gradient_text(canvas, "T", logo_font, lx + 32, ly + 48, GOLD_TXT, GOLD_ACC)

    # 7 ── vignette ────────────────────────────────────────────────────────────
    ex = np.minimum(XX, W - 1 - XX) / (W * 0.12)
    ey = np.minimum(YY, H - 1 - YY) / (H * 0.12)
    va = ((1.0 - np.minimum(np.minimum(ex, ey), 1.0)) * 145).clip(0, 255).astype(np.uint8)
    vig = np.zeros((H, W, 4), dtype=np.uint8)
    vig[:, :, 3] = va
    canvas.alpha_composite(Image.fromarray(vig, 'RGBA'))

    # 8 ── export ──────────────────────────────────────────────────────────────
    canvas.convert('RGB').save(OUT, 'PNG', optimize=True)
    print(f"Saved: {OUT}  ({W}x{H})")


if __name__ == "__main__":
    render()
