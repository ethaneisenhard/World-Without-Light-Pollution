#!/usr/bin/env python3
"""Generate the hero starfield SVG (public/hero-night-sky.svg).

Deterministic (seeded) — deep-navy #000336 background, ~210 blurred white
stars at varied opacity/size, plus a handful of shooting-star streaks.
"""
import math
import os
import random

random.seed(7)
W, H = 2000, 1400
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "hero-night-sky.svg")

stars = []
for _ in range(210):
    x = random.uniform(0, W)
    y = random.uniform(0, H)
    rx = random.uniform(1.6, 6.4)
    ry = rx * random.uniform(0.7, 1.0)
    op = round(random.uniform(0.06, 0.95), 3)
    blur = random.choices([0, 10, 20], weights=[6, 3, 2])[0]
    stars.append((x, y, rx, ry, op, blur))


def star_el(x, y, rx, ry, op, blur):
    s = f'<ellipse cx="{x:.2f}" cy="{y:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" fill="#fff"'
    if op < 1:
        s += f' opacity="{op:.3f}"'
    if blur:
        s += f' filter="url(#b{blur})"'
    return s + "/>"


shoots = []
for _ in range(9):
    cx = random.uniform(300, 1800)
    cy = random.uniform(150, 1250)
    angle = random.uniform(-64, -50)
    length = random.uniform(110, 200)
    shoots.append((cx, cy, angle, length))

parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">']
parts.append("<defs>")
parts.append(
    '<filter id="b10" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>'
)
parts.append(
    '<filter id="b20" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="20"/></filter>'
)
parts.append("</defs>")
parts.append(f'<rect width="{W}" height="{H}" fill="#000336"/>')
for s in stars:
    parts.append(star_el(*s))

for (cx, cy, angle, length) in shoots:
    rad = math.radians(angle)
    dx = math.cos(rad) * length
    dy = math.sin(rad) * length
    x1, y1 = cx - dx, cy - dy
    x2, y2 = cx + dx, cy + dy
    parts.append(
        f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
        f'stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.85" filter="url(#b10)"/>'
    )
    parts.append(
        f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
        f'stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>'
    )
parts.append("</svg>")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    f.write("\n".join(parts))
print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes)")
