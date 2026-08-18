/**
 * Codex / Petdex gallery catalog — slugs from public manifests, not Bot faces.
 */

import {
  STUDIO_PET_GALLERY_LINKS,
  STUDIO_PET_SHIPPED_IDS,
  isValidStudioPetId,
  studioPetCatalogLabel,
} from "./design-pure.js";

export type CodexGalleryPet = {
  id: string;
  label: string;
};

export const CODEX_PET_GALLERY_LINKS = STUDIO_PET_GALLERY_LINKS;

export const CODEX_PET_MANIFEST_URL = "https://codex-pet.com/api/manifest";

export function parseCodexGalleryPet(raw: unknown): CodexGalleryPet | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const slugRaw =
    (typeof rec.slug === "string" && rec.slug) ||
    (typeof rec.id === "string" && rec.id) ||
    "";
  const id = slugRaw.trim().toLowerCase();
  if (!isValidStudioPetId(id)) return null;
  const label =
    (typeof rec.displayName === "string" && rec.displayName.trim()) ||
    (typeof rec.label === "string" && rec.label.trim()) ||
    studioPetCatalogLabel(id);
  return { id, label };
}

export function parseCodexPetManifest(raw: unknown): CodexGalleryPet[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { pets?: unknown }).pets)
      ? (raw as { pets: unknown[] }).pets
      : [];
  const out: CodexGalleryPet[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const row = parseCodexGalleryPet(item);
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export function filterCodexGalleryPets(
  pets: readonly CodexGalleryPet[],
  query: string,
  limit = 24,
): CodexGalleryPet[] {
  const q = query.trim().toLowerCase();
  const shipped = STUDIO_PET_SHIPPED_IDS.map((id) => ({
    id,
    label: studioPetCatalogLabel(id),
  }));
  const merged: CodexGalleryPet[] = [];
  const seen = new Set<string>();
  for (const row of [...shipped, ...pets]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  const filtered = q
    ? merged.filter(
        (p) => p.id.includes(q) || p.label.toLowerCase().includes(q),
      )
    : merged;
  return filtered.slice(0, Math.max(1, limit));
}
