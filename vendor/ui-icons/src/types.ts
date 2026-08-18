/** One SVG primitive inside a Heroicons glyph (path, circle, …). */
export type IconGlyph = {
  tag: "path" | "circle" | "rect" | "line" | "polyline" | "polygon";
  attrs: Record<string, string>;
};

export type IconProps = {
  /** Preferred — remix/ui uses `class`. */
  class?: string;
  /** Accepted for React-style call sites; mapped to `class`. */
  className?: string;
  title?: string;
};

export type IconVariant = "outline" | "solid";
