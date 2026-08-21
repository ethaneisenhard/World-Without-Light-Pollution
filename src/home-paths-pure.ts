/**
 * Home path bands — story copy from home.md, chrome (lab / CTAs / band) from a registry.
 */

export type HomePathId = "learn" | "town" | "self";

export type HomePathLink = { href: string; label: string };

export type HomePathBackground = "transparent" | "muted" | "surface";

export type HomePathCtaPlace = "copy" | "end";

export type HomePathChrome = {
  eyebrow: string;
  background: HomePathBackground;
  embedId?: string;
  cta: HomePathLink;
  ctaPlace?: HomePathCtaPlace;
  ctaVariant?: "primary" | "secondary";
  more?: readonly HomePathLink[];
};

export type HomePathCopy = {
  id: HomePathId;
  title: string;
  story: string;
};

export type HomePathView = HomePathCopy & HomePathChrome;

const HOME_PATH_ORDER: readonly HomePathId[] = ["learn", "town", "self"];

/** Heading text in home.md → path id. */
const HOME_PATH_HEADING: Record<string, HomePathId> = {
  learn: "learn",
  "after lights-out": "learn",
  "in your room": "learn",
  "the phone on your pillow": "learn",
  "for your town": "town",
  "the lamp with no shade": "town",
  "for yourself": "self",
  "three things before bed": "self",
};

export const HOME_PATH_CHROME: Record<HomePathId, HomePathChrome> = {
  learn: {
    eyebrow: "In your room",
    background: "muted",
    embedId: "iphone",
    cta: {
      href: "/myths#iphone-red-screen-on-a-triple-click",
      label: "Turn the iPhone red",
    },
    ctaPlace: "copy",
    ctaVariant: "secondary",
  },
  town: {
    eyebrow: "On your street",
    background: "surface",
    embedId: "town",
    cta: { href: "/petition", label: "Sign the petition" },
    more: [
      { href: "/email-your-county", label: "Email your county" },
      { href: "/maps", label: "Maps of your sky" },
    ],
  },
  self: {
    eyebrow: "Tonight",
    background: "transparent",
    cta: {
      href: "/resources#7-headlamps-fixtures-and-what-to-buy",
      label: "Headlamps and fixtures",
    },
    more: [{ href: "/resources", label: "Full toolkit" }],
  },
};

export const HOME_PATH_FALLBACKS: Record<HomePathId, HomePathCopy> = {
  learn: {
    id: "learn",
    title: "The phone on your pillow",
    story:
      "It's late. The room is dark except the phone — a cool flood on the pillow, the ceiling, your face. The window goes blank. Slide it to red. Night vision stays. A few stars come back in the glass.",
  },
  town: {
    id: "town",
    title: "The lamp with no shade",
    story:
      "Midnight on your block. A tall street lamp without a shade throws light up and out. The sidewalk is bright. The Milky Way is gone. Shade it, warm it, dim it after midnight. The road stays.",
  },
  self: {
    id: "self",
    title: "Three things before bed",
    story:
      "Red on the phone. A warmer porch bulb. A headlamp that does not shout. Small light, aimed where you walk.",
  },
};

function headingToPathId(heading: string): HomePathId | null {
  const key = heading.trim().toLowerCase();
  return HOME_PATH_HEADING[key] ?? null;
}

/** `##` sections after the hero paragraph → path stories. */
export function homePathsFromDoc(body: string): HomePathView[] {
  const parsed = new Map<HomePathId, HomePathCopy>();
  const chunks = body.split(/^## /m);
  for (const chunk of chunks.slice(1)) {
    const nl = chunk.indexOf("\n");
    const heading = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
    const id = headingToPathId(heading);
    if (!id) continue;
    const story = (nl < 0 ? "" : chunk.slice(nl))
      .trim()
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ");
    if (!story) continue;
    parsed.set(id, { id, title: heading, story });
  }

  return HOME_PATH_ORDER.map((id) => {
    const copy = parsed.get(id) ?? HOME_PATH_FALLBACKS[id];
    return { ...copy, ...HOME_PATH_CHROME[id] };
  });
}
