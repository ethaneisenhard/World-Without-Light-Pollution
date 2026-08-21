/**
 * Email your county — copy the letter. Mail open is a mailto on the page.
 * Self-mounts on [data-nl-county-letter]. Same IIFE pattern as lumen-lab.js.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-nl-county-letter]");
  if (!root) return;
  var ta = root.querySelector("#nl-county-letter-body");
  var btn = root.querySelector("[data-nl-copy]");
  if (!ta || !btn) return;

  function setCopied() {
    btn.textContent = "Copied";
    btn.setAttribute("aria-live", "polite");
    window.setTimeout(function () {
      btn.textContent = "Copy letter";
    }, 2000);
  }

  btn.addEventListener("click", function () {
    ta.focus();
    ta.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(setCopied).catch(function () {
        document.execCommand("copy");
        setCopied();
      });
      return;
    }
    document.execCommand("copy");
    setCopied();
  });
})();
