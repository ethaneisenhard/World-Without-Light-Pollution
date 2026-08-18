import { describe, expect, it } from "vitest";
import {
  filterCodexGalleryPets,
  parseCodexPetManifest,
} from "./codex-pet-gallery-pure.js";

describe("parseCodexPetManifest", () => {
  it("reads slug + displayName rows", () => {
    expect(
      parseCodexPetManifest({
        pets: [
          { slug: "boba", displayName: "Boba" },
          { slug: "Bad Id" },
          { id: "airring", label: "AirRing" },
        ],
      }),
    ).toEqual([
      { id: "boba", label: "Boba" },
      { id: "airring", label: "AirRing" },
    ]);
  });
});

describe("filterCodexGalleryPets", () => {
  it("keeps shipped pets first and filters by query", () => {
    const rows = filterCodexGalleryPets(
      [
        { id: "boba", label: "Boba" },
        { id: "doraemon", label: "Doraemon" },
      ],
      "bob",
      12,
    );
    expect(rows.map((r) => r.id)).toEqual(["boba"]);
  });

  it("lists shipped when the query is empty", () => {
    const rows = filterCodexGalleryPets([], "", 8);
    expect(rows.map((r) => r.id)).toEqual(["airring", "battle-beast"]);
  });
});
