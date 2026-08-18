/**
 * Sandbox chrome — Studio shell tokens (--as-*).
 * Prefixed `as-sb-*` so project preview CSS cannot collide.
 */

export const SANDBOX_CHROME_CSS = /* css */ `
.as-sb *,
.as-sb *::before,
.as-sb *::after {
  box-sizing: border-box;
}

.as-sb {
  margin: 0;
  min-height: 100%;
  height: 100%;
  font-family: var(--as-font-sans);
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--as-color-fg-primary);
  background: var(--as-sb-shell-bg, #0b0d10);
  -webkit-font-smoothing: antialiased;
}

.as-sb a {
  color: inherit;
  text-decoration: none;
}

.as-sb button,
.as-sb select,
.as-sb input,
.as-sb textarea {
  font: inherit;
  color: inherit;
}

.as-sb-root {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

/* ── Top chrome ── */
.as-sb-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 0 14px;
  border-bottom: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-sidebar);
  flex-shrink: 0;
}

.as-sb-topbar__meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

/* Design breadcrumb (shared chrome) */
.as-design-bc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--as-color-fg-secondary);
  line-height: 1.3;
}

.as-design-bc__sep {
  opacity: 0.45;
  font-weight: 600;
  user-select: none;
}

.as-design-bc__item {
  margin: 0;
  max-width: 14rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.as-design-bc__link {
  color: var(--as-color-fg-secondary);
  text-decoration: none;
  border-radius: 3px;
}

.as-design-bc__link:hover {
  color: var(--as-color-fg-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.as-design-bc__item--current {
  color: var(--as-color-fg-primary);
}

.as-sb-topbar__eyebrow {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--as-color-fg-secondary);
}

.as-sb-topbar__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--as-color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.as-sb-topbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.as-sb-theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--as-color-border-default);
  background: color-mix(in srgb, var(--as-color-bg-muted) 80%, transparent);
  color: var(--as-color-fg-primary);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}

.as-sb-theme-toggle:hover {
  background: var(--as-color-bg-muted);
}

.as-sb-mode {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--as-color-border-default);
  background: color-mix(in srgb, var(--as-color-bg-muted) 80%, transparent);
  flex-shrink: 0;
}

.as-sb-mode__tab {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  border: 1px solid transparent;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--as-color-fg-secondary);
  transition: background-color 120ms cubic-bezier(0.23, 1, 0.32, 1),
    color 120ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 120ms cubic-bezier(0.23, 1, 0.32, 1);
}

.as-sb-mode__tab:hover {
  color: var(--as-color-fg-primary);
  background: color-mix(in srgb, var(--as-color-bg-muted) 60%, transparent);
}

.as-sb-mode__tab[aria-selected="true"] {
  color: var(--as-color-fg-primary);
  border-color: color-mix(in srgb, var(--as-color-fg-accent) 35%, transparent);
  background: color-mix(in srgb, var(--as-color-fg-accent) 18%, transparent);
}

/* ── Body: canvas | inspector ── */
.as-sb-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--as-sb-inspector-width, 300px);
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 720px) {
  .as-sb-body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) minmax(240px, 42vh);
  }
}

/* ── Canvas / stage ── */
.as-sb-canvas {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background-color: var(--as-color-bg-canvas);
  background-image: radial-gradient(
    circle at 1px 1px,
    var(--as-sb-canvas-dot, color-mix(in srgb, var(--as-color-border-default) 70%, transparent)) 1px,
    transparent 0
  );
  background-size: var(--as-sb-dot-size, 16px) var(--as-sb-dot-size, 16px);
  padding: var(--as-sb-canvas-pad, 20px);
}

.as-sb-canvas__inner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 920px;
  margin: 0 auto;
}

.as-sb-card {
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-surface);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--as-color-fg-primary) 4%, transparent),
    0 8px 24px color-mix(in srgb, #000 18%, transparent);
}

.as-sb-card__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  padding: 0 12px;
  border-bottom: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-sidebar);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--as-color-fg-secondary);
}

.as-sb-card__label-mono {
  font-family: var(--as-font-mono);
  font-weight: 500;
  font-size: 10.5px;
}

.as-sb-stage {
  /* Solid stage — dots live on .as-sb-canvas only */
  isolation: isolate;
  padding: var(--as-sb-stage-pad, 28px);
  color: var(--as-sb-stage-fg, var(--as-color-fg-primary));
  background-color: var(--as-sb-stage-bg, var(--as-color-bg-muted));
  background-image: none;
}

.as-sb-stage--flush {
  padding: 0;
  background: transparent;
  background-image: none;
  color: inherit;
}

/* ── Inspector rail ── */
.as-sb-inspector {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-sidebar);
}

@media (max-width: 720px) {
  .as-sb-inspector {
    border-left: none;
    border-top: 1px solid var(--as-color-border-default);
  }
}

.as-sb-inspector__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 8px;
  flex-shrink: 0;
}

.as-sb-inspector__eyebrow {
  margin: 0 0 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--as-color-fg-secondary);
}

.as-sb-inspector__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--as-color-fg-primary);
}

.as-sb-inspector__reset {
  appearance: none;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-muted);
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--as-color-fg-secondary);
  transition: border-color 120ms ease, color 120ms ease, transform 100ms ease;
}

.as-sb-inspector__reset:hover {
  border-color: color-mix(in srgb, var(--as-color-fg-accent) 45%, transparent);
  color: var(--as-color-fg-primary);
}

.as-sb-inspector__reset:active {
  transform: scale(0.97);
}

.as-sb-inspector__lead {
  margin: 0;
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--as-color-border-default);
  font-size: 12px;
  line-height: 1.45;
  color: var(--as-color-fg-secondary);
  flex-shrink: 0;
}

.as-sb-inspector__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px 20px;
}

.as-sb-fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.as-sb-fieldset__legend {
  margin: 0 0 2px;
  padding: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--as-color-fg-secondary);
}

.as-sb-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.as-sb-field__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--as-color-fg-primary);
}

.as-sb-field__hint {
  margin: -2px 0 0;
  font-size: 11px;
  line-height: 1.35;
  color: var(--as-color-fg-secondary);
}

.as-sb-control {
  width: 100%;
  border-radius: 7px;
  border: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-surface);
  padding: 7px 10px;
  font-size: 12.5px;
  color: var(--as-color-fg-primary);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.as-sb-control:hover {
  border-color: var(--as-color-border-strong);
}

.as-sb-control:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--as-color-fg-accent) 55%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--as-color-fg-accent) 22%, transparent);
}

.as-sb-control--mono {
  font-family: var(--as-font-mono);
  font-size: 12px;
}

.as-sb-control--area {
  resize: vertical;
  min-height: 72px;
  line-height: 1.45;
}

/* Index / empty pages (legacy list) */
.as-sb-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 24px;
}

.as-sb-page h1 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

/* Components catalog — directory-style */
.as-sb-catalog {
  box-sizing: border-box;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 24px 48px;
}

.as-sb-catalog *,
.as-sb-catalog *::before,
.as-sb-catalog *::after {
  box-sizing: border-box;
}

.as-sb-catalog__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--as-color-border-default);
}

.as-sb-catalog__eyebrow {
  margin: 10px 0 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog__title {
  margin: 6px 0 0;
  font-size: clamp(1.75rem, 2.5vw, 2.25rem);
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--as-color-fg-primary);
}

.as-sb-catalog__lead {
  margin: 10px 0 0;
  max-width: 52ch;
  font-size: 14px;
  line-height: 1.55;
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.as-sb-catalog__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-muted);
  font-size: 11px;
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog__stat strong {
  color: var(--as-color-fg-primary);
  font-weight: 650;
}

.as-sb-catalog__layout {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

@media (max-width: 720px) {
  .as-sb-catalog__layout {
    flex-direction: column;
    gap: 16px;
  }
}

.as-sb-catalog__nav {
  display: flex;
  width: 11.5rem;
  flex-shrink: 0;
  flex-direction: column;
  gap: 6px;
}

@media (max-width: 720px) {
  .as-sb-catalog__nav {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
}

.as-sb-catalog__nav-label {
  margin-bottom: 4px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--as-color-fg-secondary);
}

@media (max-width: 720px) {
  .as-sb-catalog__nav-label {
    width: 100%;
    margin-bottom: 0;
  }
}

.as-sb-catalog__nav-btn {
  display: inline-flex;
  min-height: 36px;
  cursor: pointer;
  align-items: center;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  padding: 8px 12px;
  font: inherit;
  font-size: 13px;
  color: var(--as-color-fg-secondary);
  text-align: left;
}

.as-sb-catalog__nav-btn:hover {
  background: color-mix(in srgb, var(--as-color-fg-primary) 6%, transparent);
  color: var(--as-color-fg-primary);
}

.as-sb-catalog__nav-btn--active {
  border-color: var(--as-color-border-default);
  background: var(--as-color-bg-surface);
  color: var(--as-color-fg-primary);
  font-weight: 600;
}

.as-sb-catalog__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
}

.as-sb-catalog__search {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  border: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-surface);
  padding: 10px 14px;
}

.as-sb-catalog__search-icon {
  font-size: 16px;
  line-height: 1;
  color: var(--as-color-fg-secondary);
  opacity: 0.75;
}

.as-sb-catalog__search-input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 16px;
  color: var(--as-color-fg-primary);
  outline: none;
}

.as-sb-catalog__search-input::placeholder {
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 560px) {
  .as-sb-catalog__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .as-sb-catalog__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.as-sb-catalog__card {
  display: flex;
  gap: 12px;
  min-height: 100%;
  border-radius: 14px;
  border: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-surface);
  padding: 14px;
  color: inherit;
  text-decoration: none;
  transition:
    border-color 120ms ease,
    background 120ms ease,
    transform 120ms ease;
}

.as-sb-catalog__card:hover {
  border-color: color-mix(in srgb, var(--as-color-fg-accent) 45%, var(--as-color-border-default));
  background: color-mix(in srgb, var(--as-color-fg-accent) 6%, var(--as-color-bg-surface));
  transform: translateY(-1px);
}

.as-sb-catalog__card-mark {
  display: inline-flex;
  size: 40px;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--as-color-border-default);
  background: var(--as-color-bg-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--as-color-fg-accent);
}

.as-sb-catalog__card-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.as-sb-catalog__card-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.as-sb-catalog__card-title {
  font-size: 15px;
  font-weight: 650;
  color: var(--as-color-fg-primary);
}

.as-sb-catalog__badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--as-color-border-default);
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog__card-id {
  font-family: var(--as-font-mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog__card-desc {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog__card-cta {
  margin-top: auto;
  padding-top: 10px;
  font-size: 12px;
  font-weight: 650;
  color: var(--as-color-fg-accent);
}

.as-sb-catalog__empty {
  margin: 0;
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--as-color-fg-secondary);
}

.as-sb-catalog .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;

/** Embedded Studio theme-default vars — keeps engine free of ui-tokens import. */
export const SANDBOX_DEFAULT_THEME_CSS = /* css */ `
:root {
  --as-color-bg-canvas: #f4f5f7;
  --as-color-bg-surface: #ffffff;
  --as-color-bg-muted: #f1f5f9;
  --as-color-bg-sidebar: #ffffff;
  --as-color-fg-primary: #0f172a;
  --as-color-fg-secondary: #64748b;
  --as-color-fg-accent: #2563eb;
  --as-color-fg-onAccent: #ffffff;
  --as-color-border-default: #e2e8f0;
  --as-color-border-strong: #cbd5e1;
  --as-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --as-font-mono: ui-monospace, "SF Mono", "Cascadia Code", monospace;
  /* Sandbox chrome — light */
  --as-sb-shell-bg: #f8fafc;
  --as-sb-canvas-pad: 20px;
  --as-sb-canvas-dot: #c5cad3;
  --as-sb-stage-pad: 28px;
  --as-sb-stage-bg: #f4f4f5;
  --as-sb-stage-fg: #0f172a;
  --as-sb-dot-size: 16px;
}
.dark {
  --as-color-bg-canvas: #1e2128;
  --as-color-bg-surface: #14171c;
  --as-color-bg-muted: #1a1f28;
  --as-color-bg-sidebar: #14171c;
  --as-color-fg-primary: #e6e8eb;
  --as-color-fg-secondary: #9aa0a6;
  --as-color-fg-accent: #4f8cff;
  --as-color-fg-onAccent: #ffffff;
  --as-color-border-default: #232830;
  --as-color-border-strong: #2e3540;
  --as-font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --as-font-mono: ui-monospace, "SF Mono", "Cascadia Code", monospace;
  /* Sandbox chrome — dark */
  --as-sb-shell-bg: #0b0d10;
  --as-sb-canvas-pad: 20px;
  --as-sb-canvas-dot: #3a404c;
  --as-sb-stage-pad: 28px;
  --as-sb-stage-bg: #12151a;
  --as-sb-stage-fg: #e6e8eb;
  --as-sb-dot-size: 16px;
}
`;
