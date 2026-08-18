/** Shared Live / Design / site theme query — no I/O. */

export const AS_THEME_PARAM = "as-theme";

export type AsThemeMode = "light" | "dark";

export function parseAsThemeParam(
  value: string | null | undefined,
): AsThemeMode | null {
  if (value === "light" || value === "dark") return value;
  return null;
}

/** Append or replace `as-theme` on a URL (absolute or path+query). */
export function appendAsThemeParam(url: string, mode: AsThemeMode): string {
  try {
    const base =
      url.startsWith("http://") || url.startsWith("https://")
        ? undefined
        : "http://as.local";
    const u = new URL(url, base);
    u.searchParams.set(AS_THEME_PARAM, mode);
    if (base) {
      return `${u.pathname}${u.search}${u.hash}`;
    }
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${AS_THEME_PARAM}=${mode}`;
  }
}

/**
 * Inline FOUC boot + optional toggle binder for ideal-stack sites / sandbox.
 * Resolves: URL `as-theme` → localStorage → defaultMode.
 */
export function siteThemeBootInlineScript(opts: {
  storageKey: string;
  defaultMode?: AsThemeMode;
  /** Selector for toggle button(s); click flips mode. */
  toggleSelector?: string;
}): string {
  const storageKey = JSON.stringify(opts.storageKey);
  const defaultMode = JSON.stringify(opts.defaultMode ?? "light");
  const toggleSelector = opts.toggleSelector
    ? JSON.stringify(opts.toggleSelector)
    : "null";
  return `(function(){
  var KEY=${storageKey};
  var DEF=${defaultMode};
  var TOGGLE=${toggleSelector};
  function fromUrl(){
    try{
      var m=(location.search||"").match(/[?&]as-theme=(light|dark)(?:&|$)/);
      return m?m[1]:null;
    }catch(e){return null;}
  }
  function read(){
    var q=fromUrl();
    if(q)return q;
    try{var s=localStorage.getItem(KEY);if(s==="light"||s==="dark")return s;}catch(e){}
    return DEF;
  }
  function apply(mode){
    var dark=mode==="dark";
    document.documentElement.classList.toggle("dark",dark);
    document.documentElement.dataset.theme=mode;
    document.documentElement.style.colorScheme=mode;
    try{localStorage.setItem(KEY,mode);}catch(e){}
    var nodes=TOGGLE?document.querySelectorAll(TOGGLE):[];
    for(var i=0;i<nodes.length;i++){
      nodes[i].setAttribute("aria-pressed",dark?"true":"false");
      nodes[i].setAttribute("aria-label",dark?"Switch to light mode":"Switch to dark mode");
      // Keep Heroicon SVG children — do not replace with emoji.
    }
  }
  function toggle(){
    apply(document.documentElement.classList.contains("dark")?"light":"dark");
  }
  apply(read());
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){apply(read());});
  }
  if(TOGGLE){
    document.addEventListener("click",function(e){
      var t=e.target;
      if(!t||!t.closest)return;
      var btn=t.closest(TOGGLE);
      if(btn){e.preventDefault();toggle();}
    });
  }
  window.__asTheme={apply:apply,toggle:toggle,read:read};
})();`;
}
