/** Shared Live / Design / site theme query — no I/O. */

export const AS_THEME_PARAM = "as-theme";

export type AsThemeMode = "light" | "dark";

export type AsThemePreference = "light" | "dark" | "system";

export function parseAsThemeParam(
  value: string | null | undefined,
): AsThemeMode | null {
  if (value === "light" || value === "dark") return value;
  return null;
}

export function parseAsThemePreference(
  value: string | null | undefined,
): AsThemePreference | null {
  if (value === "light" || value === "dark" || value === "system") return value;
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

export function resolveSiteThemeMode(input: {
  urlTheme?: AsThemeMode | null;
  storedPreference?: string | null;
  defaultPreference?: AsThemePreference;
  systemPrefersDark: boolean;
}): { preference: AsThemePreference; resolved: AsThemeMode } {
  if (input.urlTheme === "light" || input.urlTheme === "dark") {
    return { preference: input.urlTheme, resolved: input.urlTheme };
  }
  const stored = parseAsThemePreference(input.storedPreference);
  const preference = stored ?? input.defaultPreference ?? "system";
  switch (preference) {
    case "dark":
      return { preference, resolved: "dark" };
    case "light":
      return { preference, resolved: "light" };
    case "system":
      return {
        preference,
        resolved: input.systemPrefersDark ? "dark" : "light",
      };
    default: {
      const _exhaustive: never = preference;
      return _exhaustive;
    }
  }
}

/** SSR html attrs. Worker cannot know OS, so system paints no class; boot script owns first paint. */
export function siteThemeDocumentAttrs(input: {
  preference?: AsThemePreference;
  resolved?: AsThemeMode;
}): {
  htmlClass: string;
  dataTheme: string;
  dataColorMode: AsThemePreference;
  colorScheme: string;
} {
  const preference = input.preference ?? "system";
  switch (preference) {
    case "dark":
      return {
        htmlClass: "dark",
        dataTheme: "dark",
        dataColorMode: "dark",
        colorScheme: "dark",
      };
    case "light":
      return {
        htmlClass: "",
        dataTheme: "light",
        dataColorMode: "light",
        colorScheme: "light",
      };
    case "system":
      return {
        htmlClass: input.resolved === "dark" ? "dark" : "",
        dataTheme: input.resolved ?? "light",
        dataColorMode: "system",
        colorScheme: "light dark",
      };
    default: {
      const _exhaustive: never = preference;
      return _exhaustive;
    }
  }
}

/**
 * Inline FOUC boot + optional toggle binder for ideal-stack sites / sandbox.
 * Resolves: URL `as-theme` → explicit toggle (`:choice`) → defaultMode (system).
 * First visit follows `prefers-color-scheme`. Toggle persists. OS changes apply
 * until the visitor toggles. Older boot scripts wrote light/dark on every load;
 * those values are ignored so system can win again.
 */
export function siteThemeBootInlineScript(opts: {
  storageKey: string;
  defaultMode?: AsThemePreference;
  /** Selector for toggle button(s); click flips mode. */
  toggleSelector?: string;
}): string {
  const storageKey = JSON.stringify(opts.storageKey);
  const defaultMode = JSON.stringify(opts.defaultMode ?? "system");
  const toggleSelector = opts.toggleSelector
    ? JSON.stringify(opts.toggleSelector)
    : "null";
  return `(function(){
  var KEY=${storageKey};
  var CHOICE=KEY+":choice";
  var DEF=${defaultMode};
  var TOGGLE=${toggleSelector};
  function fromUrl(){
    try{
      var m=(location.search||"").match(/[?&]as-theme=(light|dark)(?:&|$)/);
      return m?m[1]:null;
    }catch(e){return null;}
  }
  function systemDark(){
    try{return matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){return false;}
  }
  function readPref(){
    var q=fromUrl();
    if(q)return q;
    try{
      var c=localStorage.getItem(CHOICE);
      if(c==="light"||c==="dark"||c==="system")return c;
    }catch(e){}
    return DEF;
  }
  function resolve(pref){
    if(pref==="dark")return "dark";
    if(pref==="light")return "light";
    return systemDark()?"dark":"light";
  }
  function paint(mode){
    var dark=mode==="dark";
    var pref=readPref();
    document.documentElement.classList.toggle("dark",dark);
    document.documentElement.dataset.theme=mode;
    document.documentElement.dataset.colorMode=pref;
    document.documentElement.style.colorScheme=pref==="system"?"light dark":mode;
    var nodes=TOGGLE?document.querySelectorAll(TOGGLE):[];
    for(var i=0;i<nodes.length;i++){
      nodes[i].setAttribute("aria-pressed",dark?"true":"false");
      nodes[i].setAttribute("aria-label",dark?"Switch to light mode":"Switch to dark mode");
    }
  }
  function applyPref(pref,persist){
    if(persist){
      try{localStorage.setItem(CHOICE,pref);}catch(e){}
    }
    paint(resolve(pref));
  }
  function toggle(){
    applyPref(document.documentElement.classList.contains("dark")?"light":"dark",true);
  }
  applyPref(readPref(),false);
  try{
    var mq=matchMedia("(prefers-color-scheme: dark)");
    var onScheme=function(){
      if(fromUrl())return;
      if(readPref()!=="system")return;
      paint(resolve("system"));
    };
    if(mq.addEventListener)mq.addEventListener("change",onScheme);
    else if(mq.addListener)mq.addListener(onScheme);
  }catch(e){}
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){applyPref(readPref(),false);});
  }
  if(TOGGLE){
    document.addEventListener("click",function(e){
      var t=e.target;
      if(!t||!t.closest)return;
      var btn=t.closest(TOGGLE);
      if(btn){e.preventDefault();toggle();}
    });
  }
  window.__asTheme={apply:function(mode){applyPref(mode,true);},toggle:toggle,read:readPref};
})();`;
}
