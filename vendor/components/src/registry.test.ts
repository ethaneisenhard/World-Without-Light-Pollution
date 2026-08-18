import { describe, expect, it } from "vitest";
import {
  createDefaultDraft,
  listDesignComponents,
  renderWithDraft,
} from "./registry.js";

describe("@glassbox-studio/components registry", () => {
  it("lists full Wave 1 catalog", () => {
    const ids = listDesignComponents().map((m) => m.id).sort();
    expect(ids.length).toBeGreaterThanOrEqual(30);
    for (const id of [
      "box",
      "card",
      "hero",
      "header",
      "footer",
      "field",
      "input",
      "textarea",
      "contact-form",
      "nav-link",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("renders each component with inspect stamp", () => {
    for (const meta of listDesignComponents()) {
      const draft = createDefaultDraft(meta.id as never);
      const html = renderWithDraft(meta.id as never, draft);
      expect(html).toContain(`data-as-component="${meta.id}"`);
    }
  });
});
