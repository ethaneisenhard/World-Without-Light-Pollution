/**
 * Studio auth pages — same color-mode key as shell (`glassbox-studio:color-mode`).
 * Default preference is `system`; one shell-style sun/moon toggle flips light ↔ dark.
 */

import { moonOutlineSvg, sunOutlineSvg } from "@glassbox-studio/ui-icons/ssr";

export const STUDIO_AUTH_COLOR_MODE_STORAGE_KEY = "glassbox-studio:color-mode";

/** Match shell `SHELL_THEME_TOGGLE` (studio-ui-chrome-classes). */
const BTN =
  "as-press inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-bui bg-transparent text-[13px] leading-none text-on-surface-muted transition-[border-color,background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-brand-600 hover:bg-surface-muted/80 hover:text-on-surface";

/** Single shell toggle — sun when dark (click → light), moon when light (click → dark). */
export function studioAuthColorModeControlsHtml(): string {
  const sun = sunOutlineSvg("size-4 shrink-0");
  const moon = moonOutlineSvg("size-4 shrink-0");
  return `<button type="button" class="${BTN}" data-as-auth-color-mode-toggle title="Switch color mode" aria-label="Switch color mode">
  <span data-as-color-mode-icon="sun" class="hidden" aria-hidden="true">${sun}</span>
  <span data-as-color-mode-icon="moon" aria-hidden="true">${moon}</span>
</button>`;
}

/** Client script — same toggle semantics as shell `toggleColorMode()`. */
export function studioAuthColorModeClientScript(): string {
  return `(function(){
  var KEY=${JSON.stringify(STUDIO_AUTH_COLOR_MODE_STORAGE_KEY)};
  function pref(){
    try {
      var s=localStorage.getItem(KEY);
      if(s==="light"||s==="dark"||s==="system") return s;
    } catch(e){}
    return "system";
  }
  function resolve(p){
    if(p==="dark") return "dark";
    if(p==="light") return "light";
    try {
      return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch(e){ return "light"; }
  }
  function paintResolved(r){
    var sun=document.querySelector('[data-as-color-mode-icon="sun"]');
    var moon=document.querySelector('[data-as-color-mode-icon="moon"]');
    var btn=document.querySelector("[data-as-auth-color-mode-toggle]");
    if(sun) sun.classList.toggle("hidden", r!=="dark");
    if(moon) moon.classList.toggle("hidden", r!=="light");
    if(btn){
      var next=r==="dark"?"Switch to light mode":"Switch to dark mode";
      btn.setAttribute("title", next);
      btn.setAttribute("aria-label", next);
    }
  }
  function apply(p){
    var r=resolve(p);
    document.documentElement.dataset.colorMode=p;
    document.documentElement.classList.toggle("dark", r==="dark");
    try {
      document.documentElement.style.setProperty("--as-splash-bg", "#0f0a1a");
      document.documentElement.style.setProperty("--as-splash-fg", "#ede9fe");
    } catch(e){}
    try { localStorage.setItem(KEY, p); } catch(e){}
    paintResolved(r);
  }
  var btn=document.querySelector("[data-as-auth-color-mode-toggle]");
  if(btn){
    btn.addEventListener("click", function(){
      var dark=resolve(pref())==="dark";
      apply(dark ? "light" : "dark");
    });
  }
  apply(pref());
  try {
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(){
      if(pref()==="system") apply("system");
    });
  } catch(e){}
})();`;
}
