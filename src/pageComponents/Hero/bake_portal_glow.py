#!/usr/bin/env python3
"""
Bakes the portal glow (the old box-shadow stack + haze + ground pool) into ONE
transparent PNG that Hero.jsx zooms together with the portal core.

    python3 bake_portal_glow.py            # writes portal-glow.png + portal-glow-preview.png
    -> copy portal-glow.png to  public/images/Hero/portal-glow.png

Geometry is in "design px" (1rem = 16px), matching the portal at desktop size:
    portal core = 9.125rem x 20.1875rem = 146 x 323 px
The PNG covers the core plus a 360px margin on every side, which is what the
CSS `.portalHalo` rule assumes (-246.58% / -111.46% insets). If you change
MARGIN / PORTAL_W / PORTAL_H, update those two percentages in Hero.module.css.
"""
import numpy as np
from PIL import Image

PORTAL_W, PORTAL_H = 146.0, 323.0     # design px
MARGIN = 360.0                        # design px on every side
SCALE = 0.5                           # output px per design px (glow is soft, half-res is plenty)
GLOW = 0.5                            # old --glow variable
BOOST = 1.0                           # overall intensity knob: raise for a stronger glow

W_D, H_D = PORTAL_W + 2 * MARGIN, PORTAL_H + 2 * MARGIN
W, H = int(round(W_D * SCALE)), int(round(H_D * SCALE))

# pixel-centre coordinates in design px, origin at portal's top-left
xs = (np.arange(W) + 0.5) / SCALE - MARGIN
ys = (np.arange(H) + 0.5) / SCALE - MARGIN
X, Y = np.meshgrid(xs, ys)


def gauss_blur(a, sigma_px):
    r = max(1, int(sigma_px * 3))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma_px) ** 2)
    k /= k.sum()
    def conv(v):
        return np.convolve(np.pad(v, r), k, mode="valid")   # zero-padded, same length as v
    a = np.apply_along_axis(conv, 0, a)
    a = np.apply_along_axis(conv, 1, a)
    return a


def rect_mask(expand):
    """Soft-edged-free rectangle of the portal box expanded by `expand` design px."""
    return (
        (X >= -expand) & (X <= PORTAL_W + expand) &
        (Y >= -expand) & (Y <= PORTAL_H + expand)
    ).astype(np.float64)


# accumulate premultiplied colour + "over" alpha
P = np.zeros((H, W, 3))      # sum of colour * alpha
SUM_A = np.zeros((H, W))     # sum of alpha (additive, ~ what `screen` does on a dark sky)


def add_layer(rgb, alpha):
    global P, SUM_A
    P += np.asarray(rgb, dtype=np.float64)[None, None, :] / 255.0 * alpha[..., None]
    SUM_A += alpha


# ---- 1. the old box-shadow stack on .portalGlow (blur, spread, colour, alpha) ----
shadows = [
    (6,   2,   (255, 255, 255), 1.00),
    (20,  8,   (225, 240, 255), 0.95),
    (45,  16,  (190, 220, 255), 0.85),
    (90,  30,  (160, 200, 255), 0.65),
    (160, 60,  (130, 180, 255), 0.42),
    (240, 90,  (100, 160, 255), 0.25),
    (340, 130, (80,  140, 255), 0.12),
]
for blur, spread, rgb, a in shadows:
    m = gauss_blur(rect_mask(spread), (blur / 2.0) * SCALE)   # CSS sigma = blur/2
    add_layer(rgb, m * a * GLOW)


# ---- 2. the old radial "closest-side" ellipses (haze, ::before, ::after, ground) ----
def ellipse(cx, cy, rx, ry, stops, opacity):
    t = np.sqrt(((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2)
    pos = np.array([s[0] for s in stops])
    cols = np.array([s[1] for s in stops], dtype=np.float64)
    al = np.array([s[2] for s in stops])
    a = np.interp(t, pos, al, right=0.0)
    # colour per pixel (interpolate each channel)
    rgb = np.stack([np.interp(t, pos, cols[:, i]) for i in range(3)], axis=-1)
    P_add = rgb / 255.0 * (a * opacity)[..., None]
    return P_add, a * opacity


def add_ellipse(*args):
    global P, SUM_A
    P_add, a = ellipse(*args)
    P += P_add
    SUM_A += a


cx, cy = PORTAL_W / 2, PORTAL_H / 2

# .portalHaze   inset -100% -160%   opacity glow*.85
add_ellipse(cx, cy, PORTAL_W * 4.2 / 2, PORTAL_H * 3.0 / 2, [
    (0.00, (205, 228, 255), 0.40), (0.40, (165, 205, 255), 0.20),
    (0.65, (130, 180, 255), 0.08), (0.85, (130, 180, 255), 0.00)], GLOW * 0.85)

# .portal::before  inset -80% -140%  opacity glow*.95
add_ellipse(cx, cy, PORTAL_W * 3.8 / 2, PORTAL_H * 2.6 / 2, [
    (0.00, (225, 242, 255), 0.75), (0.25, (200, 230, 255), 0.55),
    (0.45, (170, 210, 255), 0.35), (0.65, (135, 185, 255), 0.18),
    (0.82, (100, 160, 255), 0.05), (0.95, (100, 160, 255), 0.00)], GLOW * 0.95)

# .portal::after  360% x 80%, bottom -35%   (ground light pool)
h_after = PORTAL_H * 0.80
cy_after = PORTAL_H * 1.35 - h_after / 2
add_ellipse(cx, cy_after, PORTAL_W * 3.6 / 2, h_after / 2, [
    (0.00, (230, 245, 255), 0.70), (0.30, (195, 225, 255), 0.45),
    (0.55, (155, 200, 255), 0.22), (0.75, (120, 175, 255), 0.06),
    (0.90, (120, 175, 255), 0.00)], GLOW * 0.95)

# .portalGroundGlow  300% x 60%, bottom -30%
h_gg = PORTAL_H * 0.60
cy_gg = PORTAL_H * 1.30 - h_gg / 2
add_ellipse(cx, cy_gg, PORTAL_W * 3.0 / 2, h_gg / 2, [
    (0.00, (215, 235, 255), 0.50), (0.35, (175, 212, 255), 0.25),
    (0.65, (135, 185, 255), 0.08), (0.85, (135, 185, 255), 0.00)], GLOW * 0.90)

# ---- 3. combine, cut out the core (the CSS gradient div draws that), fade at borders ----
A = np.clip(SUM_A * BOOST, 0, 1)
# colour = alpha-weighted AVERAGE of the layer colours (no per-channel clipping -> no hue shift)
rgb = np.where(SUM_A[..., None] > 1e-6, P / np.maximum(SUM_A[..., None], 1e-6), 0.0)
rgb = np.clip(rgb, 0, 1)

# transparent inside the portal box (shrunk 3px so there is no hairline seam at the edge)
inside = (X >= 3) & (X <= PORTAL_W - 3) & (Y >= 3) & (Y <= PORTAL_H - 3)
A = np.where(inside, 0.0, A)

# smooth fade over the outer 20% of the margin so the PNG edge can never show
def edge_fade(v, lo, hi, width):
    d = np.minimum(v - lo, hi - v)
    t = np.clip(d / width, 0, 1)
    return t * t * (3 - 2 * t)

fw = MARGIN * 0.20
A *= edge_fade(X, -MARGIN, PORTAL_W + MARGIN, fw) * edge_fade(Y, -MARGIN, PORTAL_H + MARGIN, fw)

# tiny dither so the very soft gradients do not band
rng = np.random.default_rng(7)
a8 = np.clip(np.round(A * 255 + rng.uniform(-0.5, 0.5, A.shape)), 0, 255).astype(np.uint8)
c8 = np.clip(np.round(rgb * 255), 0, 255).astype(np.uint8)
out = np.dstack([c8, a8])

Image.fromarray(out, "RGBA").save("portal-glow.png", optimize=True)

# preview over a dark sky with the core drawn in, so you can eyeball it
prev = np.zeros((H, W, 3)) + np.array([10, 12, 24]) / 255.0
al = (a8 / 255.0)[..., None]
prev = prev * (1 - al) + (c8 / 255.0) * al
core = (X >= 0) & (X <= PORTAL_W) & (Y >= 0) & (Y <= PORTAL_H)
prev[core] = np.array([245, 248, 255]) / 255.0
Image.fromarray((np.clip(prev, 0, 1) * 255).astype(np.uint8)).save("portal-glow-preview.png")

print(f"canvas {W}x{H}px  (design {W_D:.0f}x{H_D:.0f}px)")
print(f"CSS insets: left/right -{MARGIN / PORTAL_W * 100:.2f}%  top/bottom -{MARGIN / PORTAL_H * 100:.2f}%")
print(f"CSS size:   width {W_D / PORTAL_W * 100:.2f}%  height {H_D / PORTAL_H * 100:.2f}%")
