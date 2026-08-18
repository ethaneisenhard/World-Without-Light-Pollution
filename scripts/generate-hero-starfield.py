#!/usr/bin/env python3
"""Generate the hero starfield SVG (public/hero-night-sky.svg).

Deep-space vertical gradient + faint Milky Way band + nebula accents,
power-law star population (a few bright with glow/cross-flare, many tiny
crisp), subtle cool/warm color variation, a few thin shooting stars.
Deterministic (seeded).
"""
import math
import os
import random

random.seed(11)
W, H = 2000, 1400
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "hero-night-sky.svg")

WHITE = "#ffffff"
COOL = "#dfe8ff"
WARM = "#ffe9c9"


def rr(a, b):
    return random.uniform(a, b)


def star_color():
    return random.choices(
        [WHITE, WHITE, WHITE, COOL, COOL, WARM], weights=[5, 5, 5, 3, 2, 2]
    )[0]


def star_el(x, y, r, fill, opacity, glow=None, flare=None):
    out = []
    if glow:
        out.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{glow:.2f}" fill="{fill}" '
            f'opacity="{opacity * 0.5:.3f}" filter="url(#glow)"/>'
        )
    out.append(
        f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{fill}" opacity="{opacity:.3f}"/>'
    )
    if flare:
        h = flare
        out.append(
            f'<path d="M{x:.2f} {y - h:.2f} L{x:.2f} {y + h:.2f} '
            f'M{x - h:.2f} {y:.2f} L{x + h:.2f} {y:.2f}" '
            f'stroke="#ffffff" stroke-width="0.5" opacity="0.35"/>'
        )
    return "".join(out)


parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
    f'preserveAspectRatio="xMidYMid slice">',
    "<defs>",
    '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
    '<stop offset="0" stop-color="#02030a"/>'
    '<stop offset="0.5" stop-color="#050a1c"/>'
    '<stop offset="1" stop-color="#0a1330"/></linearGradient>',
    '<filter id="soft" x="-100%" y="-100%" width="300%" height="300%">'
    '<feGaussianBlur stdDeviation="24"/></filter>',
    '<filter id="glow" x="-100%" y="-100%" width="300%" height="300%">'
    '<feGaussianBlur stdDeviation="2.4"/></filter>',
    '<radialGradient id="mw" cx="50%" cy="50%" r="50%">'
    '<stop offset="0" stop-color="#93b7ff" stop-opacity="0.10"/>'
    '<stop offset="0.6" stop-color="#4a6fd0" stop-opacity="0.05"/>'
    '<stop offset="1" stop-color="#4a6fd0" stop-opacity="0"/></radialGradient>',
    '<radialGradient id="neb" cx="50%" cy="50%" r="50%">'
    '<stop offset="0" stop-color="#3b2f7a" stop-opacity="0.10"/>'
    '<stop offset="1" stop-color="#3b2f7a" stop-opacity="0"/></radialGradient>',
    "</defs>",
    f'<rect width="{W}" height="{H}" fill="url(#sky)"/>',
    # Milky Way — wide soft diagonal band
    f'<ellipse cx="1000" cy="720" rx="1250" ry="340" fill="url(#mw)" '
    f'filter="url(#soft)" transform="rotate(-26 1000 720)"/>',
    # Nebula accents
    f'<ellipse cx="340" cy="360" rx="520" ry="360" fill="url(#neb)" filter="url(#soft)"/>',
    f'<ellipse cx="1700" cy="1120" rx="560" ry="380" fill="url(#neb)" filter="url(#soft)"/>',
]

stars = []
for _ in range(620):  # tiny crisp
    stars.append((rr(0, W), rr(0, H), rr(0.25, 0.7), star_color(), rr(0.15, 0.55), None, None))
for _ in range(150):  # medium
    stars.append((rr(0, W), rr(0, H), rr(0.7, 1.3), star_color(), rr(0.5, 0.85), None, None))
for _ in range(45):  # bright + subtle glow
    x, y, r = rr(0, W), rr(0, H), rr(1.3, 2.1)
    stars.append((x, y, r, star_color(), rr(0.85, 1.0), r * 2.6, None))
for _ in range(9):  # hero + glow + cross flare
    x, y, r = rr(0, W), rr(0, H), rr(1.8, 2.6)
    stars.append((x, y, r, WHITE, 1.0, r * 3.2, r * 5.0))

for s in stars:
    parts.append(star_el(*s))

# Shooting stars — thin gradient trails (head bright, tail fading)
shoots = []
for _ in range(3):
    x2, y2 = rr(700, 1900), rr(150, 700)
    ang = math.radians(rr(28, 42))
    length = rr(150, 240)
    x1, y1 = x2 - math.cos(ang) * length, y2 - math.sin(ang) * length
    gid = f"sh{len(shoots)}"
    shoots.append((gid, x1, y1, x2, y2))
    parts.append(
        f'<linearGradient id="{gid}" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
        f'gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>'
        f'<stop offset="0.7" stop-color="#ffffff" stop-opacity="0.5"/>'
        f'<stop offset="1" stop-color="#ffffff" stop-opacity="0.95"/></linearGradient>'
    )
for gid, x1, y1, x2, y2 in shoots:
    parts.append(
        f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
        f'stroke="url(#{gid})" stroke-width="1.6" stroke-linecap="round"/>'
    )
    parts.append(f'<circle cx="{x2:.2f}" cy="{y2:.2f}" r="1.5" fill="#ffffff" opacity="0.9"/>')

parts.append("</svg>")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    f.write("\n".join(parts))
print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes, {len(stars)} stars, {len(shoots)} shooting stars)")
