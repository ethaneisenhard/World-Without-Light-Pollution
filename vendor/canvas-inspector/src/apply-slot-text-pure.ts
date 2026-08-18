/**
 * Patch slot copy in-place — keep live classes / props (no sandbox outerHTML).
 */

const ATTR_SLOT = "data-as-slot";
const ATTR_COMPONENT = "data-as-component";

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function setSlotCopy(host: Element, text: string): void {
  if (looksLikeHtml(text)) {
    host.innerHTML = text;
  } else {
    host.textContent = text;
  }
}

/** Find the node that should receive slot copy under a component root. */
export function findSlotHost(root: Element, slot: string): Element | null {
  if (root.getAttribute(ATTR_SLOT) === slot) return root;
  return root.querySelector(`[${ATTR_SLOT}="${CSS.escape(slot)}"]`);
}

/**
 * Prefer a leaf text/content/label host under `el` when present
 * (heading → span[data-as-slot=text], button → label slot).
 */
export function resolveCopyHost(el: Element): Element {
  return (
    findSlotHost(el, "text") ||
    findSlotHost(el, "content") ||
    findSlotHost(el, "label") ||
    el
  );
}

/**
 * Apply slot text map onto an existing component tree.
 * Returns true when at least one slot host was updated.
 *
 * Nested registry components inside a composite slot (blog-hero title → heading)
 * get their innermost copy slot updated so structure + classes stay.
 */
export function applySlotTextInDom(
  root: Element,
  slotText: Record<string, string>,
): boolean {
  let applied = false;
  for (const [slot, text] of Object.entries(slotText)) {
    if (typeof text !== "string") continue;
    const host = findSlotHost(root, slot);
    if (!host) continue;

    // Composite slot wrapping another component — patch that component's copy.
    const nested = host.querySelector(`[${ATTR_COMPONENT}]`);
    const target =
      nested && nested !== host ? resolveCopyHost(nested) : resolveCopyHost(host);

    setSlotCopy(target, text);
    applied = true;
  }
  return applied;
}
