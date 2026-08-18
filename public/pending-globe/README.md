# Pending globe (BrowserUI boot splash)

Spinning globe for Studio rebuild / loading overlays — **1:1 with BrowserUI** boot splash (`apps/studio/index.html` + `connectOrthographicGlobe`).

| File | Role |
| --- | --- |
| `globe.svg` | Static fallback scene (stars + halo + thin ring) when `mount.js` missing |
| `mount.js` | Boot-safe API (`window.__AS_PENDING_GLOBE`) — full scene + d3 land spin |
| `d3.min.js` | Vendored d3@7 (UMD) — orthographic projection |
| `topojson-client.min.js` | Vendored topojson-client@3 (UMD) — land feature extract |
| `countries-110m.json` | World atlas (TopoJSON land) |

## How it paints

```
inline SVG scene (stars + atmospheric halo + thin brand ring + dark ocean)
  → load local d3 + topojson + atlas (no CDN)
  → d3 orthographic land / graticule spin (stars/halo stay fixed)
```

**Not** a thick CSS `border` spinner. **Not** fake wireframe ellipses. **Not** CSS-rotating the whole globe image.

Matches BrowserUI:

- ViewBox `1200×700`, globe radius `220`
- Soft glow halo + ring `stroke-width: 0.5` / `opacity: 0.3`
- Dark ocean gradient `#232a35 → #0f172a → #020617`
- ~200 white starfield dots (stars stay fixed while land spins)
- Land fill `#4f8cff` @ 0.4 opacity
- Rotation speed `0.25`, initial rotate `[0, -20, 0]`

**Always spins** — loading indicator ignores `prefers-reduced-motion`.

Dev Control Plane uses `globe.svg` `<img>` only if `mount.js` is missing, then upgrades to the API.

**Phone preview (held overlay):** open Studio with `?asDcpPreview=1` — paints scene + “Building Studio (preview)” until you tap Dismiss.

**Size:** omit `sizePx` — CSS `min(100%, clamp(280px, 90vmin, 560px))` + `aspect-ratio: 12/7`. Pass `sizePx` only for fixed chips (width; height follows aspect).

**Mobile / Tailnet:** Worker `no-store` includes `globe.svg` + `mount.js` + vendored libs. Query `?as=` matches shell buildId so Safari/PWA re-fetch.

Provenance: BrowserUI `index.html` boot splash + `@browserui/dom` `connectOrthographicGlobe`.
