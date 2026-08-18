import { describe, expect, it } from "vitest";
import {
  renderDesignHomeBody,
  type DesignHomeInput,
} from "./home-pure.js";

const sample: DesignHomeInput = {
  brand: {
    name: "Northline",
    initials: "NL",
    tagline: "Ship the work that matters.",
  },
  overview:
    "Tokens, type, and components for the marketing site — open a section below.",
  links: [
    {
      id: "system",
      title: "Design system",
      description: "Colors, type, space, and radius — editable token atlas.",
      navPath: "design/design-system.json",
      href: "/__as/design/system",
    },
    {
      id: "components",
      title: "Component library",
      description: "Sandbox every primitive and composite.",
      navPath: "design/components",
      href: "/__as/design/components",
    },
  ],
  swatches: [
    { name: "accent", value: "#0f766e" },
    { name: "ink", value: "#12151a" },
    { name: "paper", value: "#f3efe6" },
  ],
};

describe("renderDesignHomeBody", () => {
  it("renders brand + CTAs with nav paths", () => {
    const html = renderDesignHomeBody(sample);
    expect(html).toContain("Northline");
    expect(html).toContain("NL");
    expect(html).toContain("Ship the work that matters.");
    expect(html).toContain('data-as-design-nav="design/design-system.json"');
    expect(html).toContain('data-as-design-nav="design/components"');
    expect(html).toContain("Design system");
    expect(html).toContain("Component library");
    expect(html).toContain("#0f766e");
  });
});
