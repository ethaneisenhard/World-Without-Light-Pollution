import {
  CONSENT_CATEGORIES,
  OPTIONAL_CONSENT_CATEGORIES,
  type ConsentCategory,
} from "./categories.js";

export type ConsentCategoryMap = Record<ConsentCategory, boolean>;

export interface ConsentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function consentStorageKey(siteId: string, policyVersion: string): string {
  return `as_consent_v1:${siteId}:${policyVersion}`;
}

export function defaultConsentMap(
  regionDefaults: "opt-in" | "opt-out" | "auto" = "opt-in",
): ConsentCategoryMap {
  const map = {} as ConsentCategoryMap;
  for (const cat of CONSENT_CATEGORIES) {
    if (cat === "strictly_necessary") {
      map[cat] = true;
      continue;
    }
    if (regionDefaults === "opt-out") {
      map[cat] = cat === "functional" || cat === "analytics";
    } else {
      map[cat] = false;
    }
  }
  return map;
}

/**
 * Prefer `localStorage` in the browser so Accept/Reject survives reloads
 * (Studio Live soft-reload, full navigation). Memory fallback for SSR / tests.
 */
export function resolveConsentStorage(
  explicit?: ConsentStorage,
): ConsentStorage {
  if (explicit) return explicit;
  try {
    const ls = (globalThis as { localStorage?: ConsentStorage }).localStorage;
    if (ls && typeof ls.getItem === "function" && typeof ls.setItem === "function") {
      return ls;
    }
  } catch {
    /* private mode / denied */
  }
  return createMemoryStorage();
}

export function createConsentApi(opts: {
  siteId: string;
  policyVersion: string;
  storage?: ConsentStorage;
  regionDefaults?: "opt-in" | "opt-out" | "auto";
  onChange?: (categories: ConsentCategoryMap) => void;
}) {
  const storage = resolveConsentStorage(opts.storage);
  const key = consentStorageKey(opts.siteId, opts.policyVersion);
  let categories = loadOrDefault(storage, key, opts.regionDefaults ?? "opt-in");

  function persist() {
    storage.setItem(key, JSON.stringify(categories));
    opts.onChange?.(categories);
  }

  return {
    get categories() {
      return { ...categories };
    },
    has(category: ConsentCategory | string): boolean {
      return Boolean(categories[category as ConsentCategory]);
    },
    grant(category: ConsentCategory | string) {
      if (!(CONSENT_CATEGORIES as readonly string[]).includes(category)) return;
      if (category === "strictly_necessary") return;
      categories = { ...categories, [category]: true };
      persist();
    },
    revoke(category: ConsentCategory | string) {
      if (!(CONSENT_CATEGORIES as readonly string[]).includes(category)) return;
      if (category === "strictly_necessary") return;
      categories = { ...categories, [category]: false };
      persist();
    },
    acceptAll() {
      const next = { ...categories };
      for (const cat of OPTIONAL_CONSENT_CATEGORIES) next[cat] = true;
      categories = next;
      persist();
    },
    rejectNonEssential() {
      const next = { ...categories };
      for (const cat of OPTIONAL_CONSENT_CATEGORIES) next[cat] = false;
      categories = next;
      persist();
    },
    setMany(selection: Partial<ConsentCategoryMap>) {
      const next = { ...categories, ...selection, strictly_necessary: true };
      categories = next;
      persist();
    },
    hasStoredConsent(): boolean {
      return storage.getItem(key) !== null;
    },
    storageKey: key,
  };
}

export type ConsentApi = ReturnType<typeof createConsentApi>;

function loadOrDefault(
  storage: ConsentStorage,
  key: string,
  regionDefaults: "opt-in" | "opt-out" | "auto",
): ConsentCategoryMap {
  const raw = storage.getItem(key);
  if (!raw) return defaultConsentMap(regionDefaults);
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentCategoryMap>;
    return { ...defaultConsentMap(regionDefaults), ...parsed, strictly_necessary: true };
  } catch {
    return defaultConsentMap(regionDefaults);
  }
}

function createMemoryStorage(): ConsentStorage {
  const map = new Map<string, string>();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}
