#!/usr/bin/env python3
"""Holiday Market Hours — Topstep social graphic, 1600×900 PNG."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

W, H = 1600, 900

# ── Brand palette ──────────────────────────────────────────────────────────
NIGHT     = (16,  22,  29)    # #10161D
DUNE      = (239, 237, 233)   # #EFEDE9
WHITE     = (255, 255, 255)
ICE       = (105, 182, 210)   # #69B6D2
GOLD_FLAT = (226, 163, 85)    # #E2A355

GOLD_STOPS = [          # Trader Gold gradient
    (0.00, (170, 114,  58)),
    (0.45, (210, 156,  92)),
    (0.75, (242, 206, 149)),
    (1.00, (196, 135,  67)),
]

def lerp(a, b, t):
    t = max(0.0, min(1.0, float(t)))
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gold_at(t):
    for i in range(len(GOLD_STOPS) - 1):
        t0, c0 = GOLD_STOPS[i]
        t1, c1 = GOLD_STOPS[i + 1]
        if t <= t1:
            return lerp(c0, c1, (t - t0) / (t1 - t0))
    return GOLD_STOPS[-1][1]

# ── Fonts ──────────────────────────────────────────────────────────────────
FDIR = '/tmp/hm_fonts'

def fnt(kind, size):
    paths = {
        'h':  f'{FDIR}/Montserrat-ExtraBold.ttf',
        'wsl': f'{FDIR}/WorkSans-Light.ttf',
        'wsm': f'{FDIR}/WorkSans-Medium.ttf',
    }
    return ImageFont.truetype(paths[kind], size)

# ── Measure helper ─────────────────────────────────────────────────────────
_md = ImageDraw.Draw(Image.new('RGB', (2, 2)))

def measure(text, font):
    bb = _md.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0], bb[3] - bb[1]

def textbb(x, y, text, font):
    return _md.textbbox((x, y), text, font=font)

# ── Gradient text compositor ───────────────────────────────────────────────
def gradient_text(img, text, font, x, y, grad_fn):
    """Render gradient-filled text onto img (RGB). Returns new RGB image."""
    base = img.convert('RGBA')

    # White text mask
    mask = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(mask).text((x, y), text, font=font, fill=(255, 255, 255, 255))

    bb = textbb(x, y, text, font)
    x0, x1 = bb[0], bb[2]
    tw = max(x1 - x0, 1)

    # Build gradient array (H × W × 4)
    grd = np.zeros((H, W, 4), dtype=np.uint8)
    gold_row = np.array([gold_at(i / tw) for i in range(tw)], dtype=np.uint8)
    grd[:, x0:x1, :3] = gold_row[np.newaxis, :, :]
    grd[:, x0:x1, 3]  = 255

    # Mask gradient by text alpha
    ma = np.array(mask)[:, :, 3].astype(np.float32) / 255.0
    grd[:, :, 3] = (ma * (grd[:, :, 3].astype(np.float32) / 255.0) * 255).astype(np.uint8)

    result = Image.alpha_composite(base, Image.fromarray(grd, 'RGBA'))
    return result.convert('RGB')

# ── Background ─────────────────────────────────────────────────────────────
# Subtle left-to-right gradient: Night → slightly deeper blue-black
cols = np.arange(W, dtype=np.float32).reshape(1, W, 1)
t_bg = (cols / W) * 0.4
night = np.array(NIGHT,     dtype=np.float32).reshape(1, 1, 3)
deep  = np.array((9, 12, 17), dtype=np.float32).reshape(1, 1, 3)
bg    = (night + (deep - night) * t_bg).clip(0, 255).astype(np.uint8)
bg    = np.repeat(bg, H, axis=0)
img   = Image.fromarray(bg, 'RGB')
draw  = ImageDraw.Draw(img)

# Faint inner glow on the left (content area feels a touch warmer/lighter)
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gd   = ImageDraw.Draw(glow)
for i, alpha in enumerate(range(0, 160, 5)):
    r = i * 4
    gd.ellipse([-r + 80, H // 2 - r, r + 80, H // 2 + r],
               fill=(27, 41, 69, max(0, 8 - i)))
img = Image.alpha_composite(img.convert('RGBA'), glow).convert('RGB')
draw = ImageDraw.Draw(img)

# ── Determine headline font size ───────────────────────────────────────────
MAX_W = 1400

for HL_SZ in range(210, 79, -2):
    hf = fnt('h', HL_SZ)
    w, _ = measure('MARKET HOURS', hf)
    if w <= MAX_W:
        break

HF  = fnt('h', HL_SZ)
SF  = fnt('wsl', 36)
EF  = fnt('wsm', 26)

_, hh = measure('HOLIDAY',      HF)
_, mh = measure('MARKET HOURS', HF)

print(f'Headline size: {HL_SZ}px | MARKET HOURS width: {w}px')
print(f'HOLIDAY h={hh}  MARKET HOURS h={mh}')

# ── Vertical layout — center block on canvas ───────────────────────────────
EY_GAP    = 12   # eyebrow → rule gap
RU_H      = 2    # rule height
RU_GAP    = 18   # rule → headline gap
HL_GAP    = 10   # HOLIDAY → MARKET HOURS gap
DIV_GAP   = 42   # MARKET HOURS → divider gap
DIV_H     = 3    # divider height
SUB_GAP   = 28   # divider → subtitle gap
_, sub_h  = measure('Plan your trades accordingly.', SF)
_, ey_h   = measure('T O P S T E P', EF)

total_h = ey_h + EY_GAP + RU_H + RU_GAP + hh + HL_GAP + mh + DIV_GAP + DIV_H + SUB_GAP + sub_h

# Sit the block slightly above center for visual weight
TOP_Y = (H - total_h) // 2 - 18

EY_Y  = TOP_Y
RU_Y  = EY_Y  + ey_h  + EY_GAP
HL1_Y = RU_Y  + RU_H  + RU_GAP
HL2_Y = HL1_Y + hh    + HL_GAP
DIV_Y = HL2_Y + mh    + DIV_GAP
SUB_Y = DIV_Y + DIV_H + SUB_GAP

print(f'Y layout: EY={EY_Y}  HL1={HL1_Y}  HL2={HL2_Y}  DIV={DIV_Y}  SUB={SUB_Y}')
print(f'Content spans y={EY_Y} – {SUB_Y + sub_h}  (canvas height {H})')

LX = 100  # left margin

# ── Eyebrow: "T O P S T E P" ──────────────────────────────────────────────
draw.text((LX, EY_Y), 'T O P S T E P', font=EF, fill=ICE)

# Thin gold rule
draw.rectangle([LX, RU_Y, LX + 52, RU_Y + RU_H], fill=GOLD_FLAT)

# ── "HOLIDAY" — Trader Gold gradient ──────────────────────────────────────
img  = gradient_text(img, 'HOLIDAY', HF, LX, HL1_Y, gold_at)
draw = ImageDraw.Draw(img)

# ── "MARKET HOURS" — White ────────────────────────────────────────────────
draw.text((LX, HL2_Y), 'MARKET HOURS', font=HF, fill=WHITE)

# ── Gold gradient divider rule ─────────────────────────────────────────────
RULE_W = 500
rule_xs = np.arange(RULE_W, dtype=np.float32) / RULE_W
rule_colors = np.array([gold_at(float(t)) for t in rule_xs], dtype=np.uint8)
rule_img = Image.fromarray(
    np.tile(rule_colors[np.newaxis, :, :], (DIV_H, 1, 1)), 'RGB'
)
img.paste(rule_img, (LX, DIV_Y))
draw = ImageDraw.Draw(img)

# ── Subtitle ───────────────────────────────────────────────────────────────
draw.text((LX, SUB_Y), 'Plan your trades accordingly.', font=SF, fill=DUNE)

# ── Bottom accent line — full-width very faint gold ────────────────────────
BACC_Y = H - 42
fade_w = W
fade_xs = np.arange(fade_w, dtype=np.float32) / fade_w
fade_alpha = (np.sin(fade_xs * np.pi) * 55).astype(np.uint8)   # bell curve fade
bacc_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
bacc_arr   = np.array(bacc_layer)
mid_gold   = np.array(gold_at(0.45), dtype=np.uint8)
bacc_arr[BACC_Y:BACC_Y + 2, :, :3] = mid_gold
bacc_arr[BACC_Y:BACC_Y + 2, :, 3]  = np.tile(fade_alpha, (2, 1))
img  = Image.alpha_composite(img.convert('RGBA'),
                              Image.fromarray(bacc_arr, 'RGBA')).convert('RGB')
draw = ImageDraw.Draw(img)

# ── Save ───────────────────────────────────────────────────────────────────
OUT = '/home/user/git_test/holiday_market_hours.png'
img.save(OUT, 'PNG')
print(f'\n✓ Saved → {OUT}  ({img.size[0]}×{img.size[1]})')
