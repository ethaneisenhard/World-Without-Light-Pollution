/**
 * Still-frame Glass Box for SSR boot splash — same pose as live `mount.js`
 * (cube + ocean + land + graticule). Colors via `--as-splash-*` CSS vars
 * so the first HTML frame matches workspace shell theme.
 *
 * Land/graticule paths: `boot-splash-still-geo.generated.ts`
 * (same d3 orthographic as mount.js). Live `mount.js` must keep cube constants
 * in sync.
 */

import { BOOT_SPLASH_PARAM_DEFAULTS } from "./boot-splash-pure.js";
import {
  BOOT_SPLASH_STILL_GRATICULE_D,
  BOOT_SPLASH_STILL_LAND_D,
} from "./boot-splash-still-geo.generated.js";

export const BOOT_SPLASH_STILL_CENTER_X = 600;
export const BOOT_SPLASH_STILL_CENTER_Y = 350;
export const BOOT_SPLASH_STILL_CUBE_SIZE = 400;
export const BOOT_SPLASH_STILL_GLOBE_RADIUS = 148;
/** Same as mount.js SCENE_W / SCENE_H — back-edge occlusion mask. */
export const BOOT_SPLASH_STILL_SCENE_W = 1200;
export const BOOT_SPLASH_STILL_SCENE_H = 700;
export const BOOT_SPLASH_STILL_MARK_PAD = 96;
export const BOOT_SPLASH_STILL_MARK_VIEW =
  Math.ceil(BOOT_SPLASH_STILL_CUBE_SIZE * Math.SQRT2) +
  BOOT_SPLASH_STILL_MARK_PAD;

export type BootSplashStillSeg = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type BootSplashStillScene = {
  viewBox: string;
  cx: number;
  cy: number;
  globeR: number;
  hullPoints: string;
  hullPath: string;
  frontSegs: BootSplashStillSeg[];
  backSegs: BootSplashStillSeg[];
  landD: string;
  graticuleD: string;
  frontStroke: number;
  backStroke: number;
  globeStroke: number;
  gratStroke: number;
  /** Live solidGlobe: GLOBE_RADIUS + globeStroke * 0.5 + 1 */
  backMaskR: number;
};

type Pt = { x: number; y: number; z: number };

const VERTICES: ReadonlyArray<{ x: number; y: number; z: number }> = (() => {
  const h = BOOT_SPLASH_STILL_CUBE_SIZE / 2;
  return [
    { x: -h, y: -h, z: -h },
    { x: h, y: -h, z: -h },
    { x: h, y: h, z: -h },
    { x: -h, y: h, z: -h },
    { x: -h, y: -h, z: h },
    { x: h, y: -h, z: h },
    { x: h, y: h, z: h },
    { x: -h, y: h, z: h },
  ];
})();

const EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

function project3D(
  x: number,
  y: number,
  z: number,
  boxPitch: number,
  boxYaw: number,
): Pt {
  const angleX = (boxPitch * Math.PI) / 180;
  const angleY = (boxYaw * Math.PI) / 180;
  const x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
  const z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
  const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
  const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);
  return {
    x: BOOT_SPLASH_STILL_CENTER_X + x1,
    y: BOOT_SPLASH_STILL_CENTER_Y + y2,
    z: z2,
  };
}

function convexHullPoints(points: readonly Pt[]): Array<{ x: number; y: number }> {
  const pts = points
    .map((p) => ({ x: p.x, y: p.y }))
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Array<{ x: number; y: number }> = [];
  const upper: Array<{ x: number; y: number }> = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i]!;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function edgeKey(u: number, v: number): string {
  return u < v ? `${u}-${v}` : `${v}-${u}`;
}

function hullVertexIndices(
  hull: ReadonlyArray<{ x: number; y: number }>,
  verts: readonly Pt[],
): number[] {
  return hull.map((hp) => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < verts.length; i += 1) {
      const p = verts[i]!;
      const d = (p.x - hp.x) * (p.x - hp.x) + (p.y - hp.y) * (p.y - hp.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  });
}

function depthSplitEdge(
  projVertices: readonly Pt[],
  u: number,
  v: number,
): Array<{ a: Pt; b: Pt; layer: "front" | "back" }> {
  const a = projVertices[u]!;
  const b = projVertices[v]!;
  const layerOf = (z: number): "front" | "back" => (z <= 0 ? "front" : "back");
  if (layerOf(a.z) === layerOf(b.z)) {
    return [{ a, b, layer: layerOf(a.z) }];
  }
  const t = a.z / (a.z - b.z);
  const mid: Pt = {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: 0,
  };
  return [
    { a, b: mid, layer: layerOf(a.z) },
    { a: mid, b, layer: layerOf(b.z) },
  ];
}

function fmt(n: number): string {
  return n.toFixed(2);
}

function hullPathD(hullPts: ReadonlyArray<{ x: number; y: number }>): string {
  if (hullPts.length < 3) return "";
  return (
    hullPts
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${fmt(p.x)} ${fmt(p.y)}`)
      .join("") + "Z"
  );
}

export type BootSplashStillPose = {
  boxYaw?: number;
  boxPitch?: number;
  tilt?: number;
};

/** Project the rest-pose Glass Box used as the SSR still frame. */
export function projectBootSplashStillScene(
  pose: BootSplashStillPose = {},
): BootSplashStillScene {
  const boxYaw = pose.boxYaw ?? BOOT_SPLASH_PARAM_DEFAULTS.boxYaw;
  const boxPitch = pose.boxPitch ?? BOOT_SPLASH_PARAM_DEFAULTS.boxPitch;

  const projVertices = VERTICES.map((v) =>
    project3D(v.x, v.y, v.z, boxPitch, boxYaw),
  );
  const hullPts = convexHullPoints(projVertices);
  const hullIdx = hullVertexIndices(hullPts, projVertices);
  const hullEdgeKeys: Record<string, true> = {};
  for (let i = 0; i < hullIdx.length; i += 1) {
    hullEdgeKeys[edgeKey(hullIdx[i]!, hullIdx[(i + 1) % hullIdx.length]!)] =
      true;
  }

  const behind: BootSplashStillSeg[] = [];
  const inFront: BootSplashStillSeg[] = [];
  for (const edge of EDGES) {
    if (hullEdgeKeys[edgeKey(edge[0], edge[1])]) continue;
    const split = depthSplitEdge(projVertices, edge[0], edge[1]);
    for (const seg of split) {
      const mapped: BootSplashStillSeg = {
        x1: seg.a.x,
        y1: seg.a.y,
        x2: seg.b.x,
        y2: seg.b.y,
      };
      if (seg.layer === "front") inFront.push(mapped);
      else behind.push(mapped);
    }
  }

  const markHalf = BOOT_SPLASH_STILL_MARK_VIEW / 2;

  return {
    viewBox: `${BOOT_SPLASH_STILL_CENTER_X - markHalf} ${BOOT_SPLASH_STILL_CENTER_Y - markHalf} ${BOOT_SPLASH_STILL_MARK_VIEW} ${BOOT_SPLASH_STILL_MARK_VIEW}`,
    cx: BOOT_SPLASH_STILL_CENTER_X,
    cy: BOOT_SPLASH_STILL_CENTER_Y,
    globeR: BOOT_SPLASH_STILL_GLOBE_RADIUS,
    hullPoints: hullPts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(" "),
    hullPath: hullPathD(hullPts),
    frontSegs: inFront,
    backSegs: behind,
    landD: BOOT_SPLASH_STILL_LAND_D,
    graticuleD: BOOT_SPLASH_STILL_GRATICULE_D,
    frontStroke: BOOT_SPLASH_PARAM_DEFAULTS.frontStroke,
    backStroke: BOOT_SPLASH_PARAM_DEFAULTS.backStroke,
    globeStroke: BOOT_SPLASH_PARAM_DEFAULTS.globeStroke,
    gratStroke: BOOT_SPLASH_PARAM_DEFAULTS.gratStroke,
    backMaskR:
      BOOT_SPLASH_STILL_GLOBE_RADIUS +
      BOOT_SPLASH_PARAM_DEFAULTS.globeStroke * 0.5 +
      1,
  };
}

function escapeAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Inline SVG markup for `#as-boot-splash` — theme via `--as-splash-*`. */
export function renderBootSplashStillSvg(
  pose: BootSplashStillPose = {},
): string {
  const s = projectBootSplashStillScene(pose);
  const clipId = "as-boot-splash-still-clip";
  const landClipId = "as-boot-splash-still-land-clip";
  const backMaskId = "as-boot-splash-still-back-mask";
  // Live solidGlobe paints occluded cube edges at frontStroke (not thin backStroke).
  const backLines = s.backSegs
    .map(
      (seg) =>
        `<line x1="${fmt(seg.x1)}" y1="${fmt(seg.y1)}" x2="${fmt(seg.x2)}" y2="${fmt(seg.y2)}" stroke="var(--as-splash-box-front)" stroke-width="${s.frontStroke}" stroke-linecap="butt"/>`,
    )
    .join("");
  const frontLines = s.frontSegs
    .map(
      (seg) =>
        `<line x1="${fmt(seg.x1)}" y1="${fmt(seg.y1)}" x2="${fmt(seg.x2)}" y2="${fmt(seg.y2)}" stroke="var(--as-splash-box-front)" stroke-width="${s.frontStroke}" stroke-linecap="butt"/>`,
    )
    .join("");
  return (
    `<svg data-as-boot-splash-still-frame="1" viewBox="${escapeAttr(s.viewBox)}" width="${BOOT_SPLASH_STILL_MARK_VIEW}" height="${BOOT_SPLASH_STILL_MARK_VIEW}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    `<defs>` +
    `<clipPath id="${clipId}"><polygon points="${escapeAttr(s.hullPoints)}"/></clipPath>` +
    `<clipPath id="${landClipId}"><path d="${escapeAttr(s.landD)}"/></clipPath>` +
    `<mask id="${backMaskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${BOOT_SPLASH_STILL_SCENE_W}" height="${BOOT_SPLASH_STILL_SCENE_H}">` +
    `<rect width="${BOOT_SPLASH_STILL_SCENE_W}" height="${BOOT_SPLASH_STILL_SCENE_H}" fill="#ffffff"/>` +
    `<circle cx="${s.cx}" cy="${s.cy}" r="${s.backMaskR}" fill="#000000"/>` +
    `</mask>` +
    `</defs>` +
    `<g data-as-boot-splash-still-back="1" fill="none" mask="url(#${backMaskId})">${backLines}</g>` +
    `<g clip-path="url(#${clipId})">` +
    `<circle cx="${s.cx}" cy="${s.cy}" r="${s.globeR}" fill="var(--as-splash-ocean)"/>` +
    `<path data-as-boot-splash-still-grat-ocean="1" d="${escapeAttr(s.graticuleD)}" fill="none" stroke="var(--as-splash-grat)" stroke-width="${s.gratStroke}" stroke-linecap="round"/>` +
    `<path data-as-boot-splash-still-land="1" d="${escapeAttr(s.landD)}" fill="var(--as-splash-land)" stroke="var(--as-splash-land)" stroke-width="0.75" stroke-linejoin="round"/>` +
    `<path data-as-boot-splash-still-grat-land="1" d="${escapeAttr(s.graticuleD)}" fill="none" stroke="var(--as-splash-grat-land,var(--as-splash-bg))" stroke-width="${s.gratStroke}" stroke-linecap="round" clip-path="url(#${landClipId})"/>` +
    `<circle cx="${s.cx}" cy="${s.cy}" r="${s.globeR}" fill="none" stroke="var(--as-splash-globe)" stroke-width="${s.globeStroke}"/>` +
    `</g>` +
    `<path d="${escapeAttr(s.hullPath)}" fill="none" stroke="var(--as-splash-box-front)" stroke-width="${s.frontStroke}" stroke-linejoin="miter" stroke-miterlimit="12" stroke-linecap="butt"/>` +
    `<g fill="none">${frontLines}</g>` +
    `</svg>`
  );
}
