/**
 * Night-lab embeds — one registry of compact playgrounds + markdown split.
 * Pages author `[[lab:<id>]]`; compose looks up a row (not a host `if`).
 */

export type NightLabSceneId =
  | "street"
  | "car"
  | "room"
  | "phone"
  | "tv"
  | "clutter";
export type NightLabControl = "lumens" | "kelvin" | "fixture" | "red" | "diffuse";

export type NightLabEmbed = {
  id: string;
  scene: NightLabSceneId;
  /** Quiet name for the scene — never UI instructions. */
  caption: string;
  fixture?: string;
  lumens?: number;
  kelvin?: number;
  red?: boolean;
  /** 0–100. Bare spear → frosted cover. */
  diffuse?: number;
  controls: readonly NightLabControl[];
};

export type NightLabBlock =
  | { kind: "md"; text: string }
  | { kind: "lab"; embedId: string };

/** Heading + copy + the lab that belongs to it. */
export type NightLabArticleBlock =
  | NightLabBlock
  | { kind: "kind"; text: string; embedId: string };

const LAB_TOKEN = /\[\[lab:([a-z0-9-]+)\]\]/g;

export const NIGHT_LAB_EMBEDS: Record<string, NightLabEmbed> = {
  skyglow: {
    id: "skyglow",
    scene: "street",
    caption: "Skyglow",
    fixture: "cobra",
    lumens: 4000,
    kelvin: 4000,
    controls: ["lumens", "kelvin", "fixture"],
  },
  glare: {
    id: "glare",
    scene: "car",
    caption: "Glare",
    fixture: "high",
    lumens: 3200,
    kelvin: 6000,
    controls: ["lumens", "fixture", "red", "diffuse"],
  },
  trespass: {
    id: "trespass",
    scene: "room",
    caption: "Light trespass",
    fixture: "overhead",
    lumens: 800,
    kelvin: 4000,
    controls: ["lumens", "fixture", "kelvin", "diffuse"],
  },
  clutter: {
    id: "clutter",
    scene: "clutter",
    caption: "Clutter",
    fixture: "messy",
    lumens: 6000,
    kelvin: 4500,
    controls: ["fixture", "lumens", "kelvin"],
  },
  safety: {
    id: "safety",
    scene: "street",
    caption: "Safety vs brightness",
    fixture: "cobra",
    lumens: 5000,
    kelvin: 5000,
    controls: ["lumens", "kelvin", "fixture", "diffuse"],
  },
  kelvin: {
    id: "kelvin",
    scene: "street",
    caption: "Color temperature",
    fixture: "cobra",
    lumens: 2500,
    kelvin: 5000,
    controls: ["kelvin", "lumens"],
  },
  dim: {
    id: "dim",
    scene: "street",
    caption: "Dim after hours",
    fixture: "cobra",
    lumens: 4000,
    kelvin: 2700,
    controls: ["lumens", "fixture", "red"],
  },
  red: {
    id: "red",
    scene: "room",
    caption: "Red night light",
    fixture: "lamp",
    lumens: 250,
    kelvin: 2200,
    red: true,
    controls: ["red", "lumens", "kelvin"],
  },
  headlamp: {
    id: "headlamp",
    scene: "car",
    caption: "Headlamps",
    fixture: "high",
    lumens: 2000,
    kelvin: 4000,
    controls: ["fixture", "lumens", "red", "diffuse"],
  },
  shield: {
    id: "shield",
    scene: "street",
    caption: "Shielding",
    fixture: "cobra",
    lumens: 2000,
    kelvin: 3000,
    controls: ["fixture", "lumens", "diffuse"],
  },
  diffuse: {
    id: "diffuse",
    scene: "street",
    caption: "Cover / diffusion",
    fixture: "cobra",
    lumens: 3200,
    kelvin: 3000,
    diffuse: 0,
    controls: ["diffuse", "lumens", "fixture"],
  },
  bedroom: {
    id: "bedroom",
    scene: "room",
    caption: "Bedroom",
    fixture: "overhead",
    lumens: 600,
    kelvin: 5000,
    controls: ["kelvin", "lumens", "fixture", "diffuse"],
  },
  phone: {
    id: "phone",
    scene: "phone",
    caption: "Phone screen",
    lumens: 400,
    kelvin: 6500,
    controls: ["red", "lumens", "kelvin"],
  },
  iphone: {
    id: "iphone",
    scene: "phone",
    caption: "Phone screen",
    lumens: 180,
    kelvin: 1800,
    red: true,
    controls: ["red", "lumens", "kelvin"],
  },
  tv: {
    id: "tv",
    scene: "tv",
    caption: "Television",
    fixture: "hdr",
    lumens: 900,
    kelvin: 6500,
    controls: ["fixture", "lumens", "kelvin", "red"],
  },
  kitchen: {
    id: "kitchen",
    scene: "room",
    caption: "Kitchen / ceiling",
    fixture: "overhead",
    lumens: 1100,
    kelvin: 4000,
    controls: ["lumens", "kelvin", "fixture", "diffuse"],
  },
  porch: {
    id: "porch",
    scene: "street",
    caption: "Porch flood",
    fixture: "cobra",
    lumens: 3500,
    kelvin: 5000,
    controls: ["lumens", "kelvin", "fixture", "diffuse"],
  },
  town: {
    id: "town",
    scene: "street",
    caption: "Your street",
    fixture: "cobra",
    lumens: 4000,
    kelvin: 4000,
    controls: ["lumens", "kelvin", "fixture"],
  },
};

export function getNightLabEmbed(id: string): NightLabEmbed | null {
  return NIGHT_LAB_EMBEDS[id] ?? null;
}

export function articleHasNightLabs(source: string): boolean {
  return /\[\[lab:[a-z0-9-]+\]\]/.test(source);
}

export function splitMarkdownLabBlocks(source: string): NightLabBlock[] {
  const out: NightLabBlock[] = [];
  let last = 0;
  const re = new RegExp(LAB_TOKEN);
  let match = re.exec(source);
  while (match) {
    const before = source.slice(last, match.index).trim();
    if (before) out.push({ kind: "md", text: before });
    out.push({ kind: "lab", embedId: match[1] ?? "" });
    last = match.index + match[0].length;
    match = re.exec(source);
  }
  const rest = source.slice(last).trim();
  if (rest) out.push({ kind: "md", text: rest });
  if (out.length === 0) out.push({ kind: "md", text: source });
  return out;
}

/** Last ## / ### and the copy under it — the lab belongs to that heading. */
export function peelTrailingHeadingSection(
  md: string,
): { before: string; headingMd: string } | null {
  const lines = md.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{2,3} /.test(lines[i] ?? "")) last = i;
  }
  if (last < 0) return null;
  const headingMd = lines.slice(last).join("\n").trim();
  const before = lines.slice(0, last).join("\n").trim();
  return { before, headingMd };
}

/** Pair a heading section with the lab that follows so they paint as one card. */
export function groupLabArticleBlocks(
  blocks: NightLabBlock[],
): NightLabArticleBlock[] {
  const out: NightLabArticleBlock[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const cur = blocks[i];
    const next = blocks[i + 1];
    if (cur?.kind === "md" && next?.kind === "lab") {
      const peeled = peelTrailingHeadingSection(cur.text);
      if (peeled) {
        if (peeled.before) out.push({ kind: "md", text: peeled.before });
        out.push({ kind: "kind", text: peeled.headingMd, embedId: next.embedId });
        i += 1;
        continue;
      }
    }
    out.push(cur);
  }
  return out;
}

export function nightLabMountAttrs(embed: NightLabEmbed): Record<string, string> {
  const attrs: Record<string, string> = {
    "data-as-lumen-lab": "",
    "data-nl-compact": "1",
    "data-nl-embed": embed.id,
    "data-nl-scene": embed.scene,
    "data-nl-controls": embed.controls.join(","),
  };
  if (embed.fixture) attrs["data-nl-fixture"] = embed.fixture;
  if (embed.lumens != null) attrs["data-nl-lumens"] = String(embed.lumens);
  if (embed.kelvin != null) attrs["data-nl-kelvin"] = String(embed.kelvin);
  if (embed.red) attrs["data-nl-red"] = "1";
  if (embed.diffuse != null) attrs["data-nl-diffuse"] = String(embed.diffuse);
  return attrs;
}

export function nightLabMountAttrString(embed: NightLabEmbed): string {
  return Object.entries(nightLabMountAttrs(embed))
    .map(([key, value]) => {
      if (value === "") return key;
      return `${key}="${value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"`;
    })
    .join(" ");
}
