/**
 * Glass Box product mark geometry — single SoT for GlassBoxMarkIcon + SSR twin.
 * Do not fork polygon/gradient values in app code or static SVG without updating this.
 */

export const GLASS_BOX_MARK_VIEW_BOX = "0 0 460 460" as const;

export const GLASS_BOX_MARK_GRADIENTS = {
  top: {
    x1: "0.15",
    y1: "0",
    x2: "0.85",
    y2: "1",
    stops: [
      { offset: "0%", color: "#FFE566" },
      { offset: "100%", color: "#FFD100" },
    ],
  },
  left: {
    x1: "0",
    y1: "0",
    x2: "0.2",
    y2: "1",
    stops: [
      { offset: "0%", color: "#3DDB5E" },
      { offset: "100%", color: "#00A651" },
    ],
  },
  right: {
    x1: "0.8",
    y1: "0",
    x2: "0",
    y2: "1",
    stops: [
      { offset: "0%", color: "#3D8BE8" },
      { offset: "100%", color: "#0066CC" },
    ],
  },
  /** Soft mid — not pure white (seams at small sizes). */
  glass: {
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "0",
    stops: [
      { offset: "0%", color: "#E8F7FF" },
      { offset: "50%", color: "#D6EEFF" },
      { offset: "100%", color: "#9AD8FF" },
    ],
  },
} as const;

export const GLASS_BOX_MARK_RED = "#E60012" as const;

/** Slight face overlaps so adjacent edges do not hairline at ~32px. */
export const GLASS_BOX_MARK_POLYGONS = {
  left: "-168,-78 1,36 1,246 -168,132",
  rightA: "-1,36 22,24 22,96 -1,108",
  rightB: "48,10 168,-78 168,12 48,108",
  rightC: "-1,174 22,162 22,234 -1,246",
  rightD: "48,148 168,54 168,132 48,226",
  red: "-1,108 22,96 48,84 168,12 168,54 48,136 22,148 -1,160",
  topA: "-168,-78 0,-168 -22,-155 1,36",
  topB: "22,-155 0,-168 168,-78 1,36",
  glassA: "-22,-155 0,-168 22,-155 22,18 0,36 -22,18",
  glassB:
    "-1,36 22,24 48,10 48,84 22,96 -1,108 -1,160 22,148 48,136 48,226 22,234 -1,246",
} as const;

export const GLASS_BOX_MARK_HIGHLIGHT =
  "-168,-78 0,-168 168,-78" as const;

export const GLASS_BOX_MARK_GROUP_TRANSFORM = "translate(230 191)" as const;
