/**
 * Project Live bridge — load Vite preview client (dev soft-reload).
 *
 * Studio writes files to disk. Meta points at content-vite-hmr's
 * `/as-preview-client.js` (Idiomorph soft-apply). Prod never includes this meta
 * in deployed HTML unless you leave it — demos only set it for local Live.
 *
 *   <meta name="as-vite-client" content="http://127.0.0.1:5193/as-preview-client.js" />
 *   <script src="/as-hmr-bridge.js" defer></script>
 */
(function () {
  var meta = document.querySelector('meta[name="as-vite-client"]');
  var src = meta && meta.getAttribute("content");
  if (!src) {
    console.info(
      "[as-hmr] no meta[name=as-vite-client] — Live reload idle (disk/Vite not wired)",
    );
    return;
  }
  var s = document.createElement("script");
  s.type = "module";
  s.src = src;
  s.onerror = function () {
    console.warn(
      "[as-hmr] preview client failed to load:",
      src,
      "— is content-vite-hmr running?",
    );
  };
  document.head.appendChild(s);
})();
