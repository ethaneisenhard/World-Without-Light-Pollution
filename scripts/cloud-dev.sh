#!/usr/bin/env bash
# Cloud Host Development Start — run from a writable /tmp copy.
# Host checkouts often have root-owned node_modules (EACCES on .mf) and
# broken workspace links. Copy sources, alias packages via wrangler.jsonc,
# persist miniflare under /tmp.
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DST="${AS_CLOUD_DEV_DST:-/tmp/as-cloud-dev-$(basename "$SRC")}"
W="${AS_CLOUD_DEV_WRANGLER:-}"
if [[ -z "$W" ]]; then
  for cand in \
    "$SRC/node_modules/wrangler/bin/wrangler.js" \
    "$(dirname "$SRC")/invention-world/node_modules/wrangler/bin/wrangler.js" \
    "$(dirname "$SRC")/glassbox-studio-template/node_modules/wrangler/bin/wrangler.js"; do
    if [[ -f "$cand" ]]; then W="$cand"; break; fi
  done
fi
if [[ -z "$W" || ! -f "$W" ]]; then
  echo "cloud-dev: wrangler.js not found (set AS_CLOUD_DEV_WRANGLER)" >&2
  exit 1
fi
PORT="${AS_CLOUD_DEV_PORT:-9296}"
INSPECTOR="${AS_CLOUD_DEV_INSPECTOR:-9235}"
PERSIST="${AS_CLOUD_DEV_PERSIST:-/tmp/as-mf-$(basename "$SRC")}"

rm -rf "$DST"
mkdir -p "$DST"
for d in src public content design client scripts email integrations data data-sources data-destinations docs; do
  if [[ -d "$SRC/$d" ]]; then cp -a "$SRC/$d" "$DST/"; fi
done
for f in wrangler.jsonc package.json tsconfig.json AUTH.md README.md AGENTS.md; do
  if [[ -f "$SRC/$f" ]]; then cp -a "$SRC/$f" "$DST/"; fi
done
cd "$DST"
exec node "$W" dev --local --port "$PORT" --inspector-port "$INSPECTOR" --persist-to "$PERSIST"
