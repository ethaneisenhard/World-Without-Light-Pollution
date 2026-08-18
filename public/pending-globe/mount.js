/**
 * BrowserUI boot-splash globe — boot-safe (no Remix / esbuild).
 * window.__AS_PENDING_GLOBE.mount(host, opts) → { root, start, stop, destroy }
 *
 * 1:1 with BrowserUI apps/studio/index.html boot splash + connectOrthographicGlobe:
 * starfield + soft atmospheric halo + thin brand ring + dark ocean +
 * d3 geoOrthographic land / graticule spin (stars stay fixed).
 *
 * Always spins — loading indicator ignores prefers-reduced-motion.
 * d3 + topojson are vendored under /pending-globe/ (no CDN).
 */
(function (global) {
  var ATLAS_URL = "/pending-globe/countries-110m.json";
  var GLOBE_SVG_URL = "/pending-globe/globe.svg";
  var D3_URL = "/pending-globe/d3.min.js";
  var TOPO_URL = "/pending-globe/topojson-client.min.js";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var SCENE_W = 1200;
  var SCENE_H = 700;
  var CENTER_X = 600;
  var CENTER_Y = 350;
  var GLOBE_RADIUS = 220;
  var STAR_COUNT = 200;
  var DEFAULT_ROTATION_SPEED = 0.25;
  var seq = 0;

  /** Same query string as this script (buildId cache-bust on Tailnet / PWA). */
  function siblingAssetUrl(fileName, explicit) {
    if (explicit) return explicit;
    try {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        var src = scripts[i].src || "";
        if (src.indexOf("pending-globe/mount") !== -1) {
          return src.replace(
            /mount\.js(\?[^#]*)?(#.*)?$/i,
            fileName + "$1$2",
          );
        }
      }
    } catch (e) {}
    return new URL("/pending-globe/" + fileName, location.href).href;
  }

  function resolveGlobeSvgUrl(explicit) {
    return siblingAssetUrl("globe.svg", explicit);
  }

  function ensureStyles() {
    if (document.getElementById("as-pending-globe-css")) return;
    var s = document.createElement("style");
    s.id = "as-pending-globe-css";
    s.textContent =
      ".as-pending-globe{display:inline-flex;align-items:center;justify-content:center;" +
      "flex-shrink:0;pointer-events:none;vertical-align:middle;" +
      "width:min(100%,clamp(280px,90vmin,560px));aspect-ratio:12/7;height:auto;" +
      "line-height:0}" +
      ".as-pending-globe__svg{width:100%;height:100%;display:block}";
    document.head.appendChild(s);
  }

  function resolveSizePx(opts) {
    if (opts.sizePx != null && opts.sizePx > 0) return Math.round(opts.sizePx);
    return null;
  }

  /** Deterministic LCG so starfield is stable across remounts. */
  function seededRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function paintStars(starField) {
    var rand = seededRandom(0x41535f47); /* "AS_G" */
    for (var i = 0; i < STAR_COUNT; i++) {
      var c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", String(rand() * SCENE_W));
      c.setAttribute("cy", String(rand() * SCENE_H));
      c.setAttribute("r", String(rand() * 1.2));
      c.setAttribute("fill", "white");
      c.setAttribute("opacity", String(rand() * 0.6));
      starField.appendChild(c);
    }
  }

  var libsPromise = null;

  function loadScriptOnce(src, globalName) {
    return new Promise(function (resolve, reject) {
      if (global[globalName]) {
        resolve(global[globalName]);
        return;
      }
      var existing = document.querySelector(
        'script[data-as-pending-globe-lib="' + globalName + '"]',
      );
      if (existing) {
        var tries = 0;
        var t = setInterval(function () {
          tries += 1;
          if (global[globalName]) {
            clearInterval(t);
            resolve(global[globalName]);
            return;
          }
          if (tries >= 100) {
            clearInterval(t);
            reject(new Error(globalName + " load timeout"));
          }
        }, 50);
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.setAttribute("data-as-pending-globe-lib", globalName);
      s.onload = function () {
        if (global[globalName]) resolve(global[globalName]);
        else reject(new Error(globalName + " missing after load"));
      };
      s.onerror = function () {
        reject(new Error("failed to load " + src));
      };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  function ensureGlobeLibs() {
    if (libsPromise) return libsPromise;
    var d3Src = siblingAssetUrl("d3.min.js");
    var topoSrc = siblingAssetUrl("topojson-client.min.js");
    libsPromise = loadScriptOnce(d3Src, "d3").then(function (d3) {
      return loadScriptOnce(topoSrc, "topojson").then(function (topojson) {
        return { d3: d3, topojson: topojson };
      });
    });
    return libsPromise;
  }

  /**
   * @param {HTMLElement} host
   * @param {{ sizePx?: number, ariaLabel?: string, atlasUrl?: string, globeSvgUrl?: string, rotationSpeed?: number }} [opts]
   */
  function mount(host, opts) {
    opts = opts || {};
    var sizePx = resolveSizePx(opts);
    var atlasUrl = opts.atlasUrl || siblingAssetUrl("countries-110m.json");
    var rotationSpeed =
      opts.rotationSpeed != null ? opts.rotationSpeed : DEFAULT_ROTATION_SPEED;
    var idSuffix = "-" + ++seq;

    ensureStyles();

    var root = document.createElement("span");
    root.className = "as-pending-globe";
    root.setAttribute("data-as-pending-globe", "1");
    root.setAttribute("role", "img");
    root.setAttribute("aria-label", opts.ariaLabel || "Loading");
    if (sizePx != null) {
      root.style.width = sizePx + "px";
      root.style.height = "auto";
    }

    /* BrowserUI boot scene — inline SVG (not <img>, not CSS spinner). */
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "as-pending-globe__svg");
    svg.setAttribute("viewBox", "0 0 " + SCENE_W + " " + SCENE_H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("data-as-pending-globe-wireframe", "1");
    svg.setAttribute("data-as-pending-globe-scene", "1");

    var defs = document.createElementNS(SVG_NS, "defs");
    var glow = document.createElementNS(SVG_NS, "filter");
    glow.setAttribute("id", "as-pending-globe-glow" + idSuffix);
    glow.setAttribute("x", "-50%");
    glow.setAttribute("y", "-50%");
    glow.setAttribute("width", "200%");
    glow.setAttribute("height", "200%");
    var blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "15");
    blur.setAttribute("result", "blur");
    var merge = document.createElementNS(SVG_NS, "feMerge");
    var mn0 = document.createElementNS(SVG_NS, "feMergeNode");
    mn0.setAttribute("in", "blur");
    var mn1 = document.createElementNS(SVG_NS, "feMergeNode");
    mn1.setAttribute("in", "SourceGraphic");
    merge.append(mn0, mn1);
    glow.append(blur, merge);

    var gradient = document.createElementNS(SVG_NS, "radialGradient");
    gradient.setAttribute("id", "as-pending-globe-gradient" + idSuffix);
    gradient.setAttribute("cx", "50%");
    gradient.setAttribute("cy", "50%");
    gradient.setAttribute("r", "50%");
    gradient.setAttribute("fx", "30%");
    gradient.setAttribute("fy", "30%");
    var stop0 = document.createElementNS(SVG_NS, "stop");
    stop0.setAttribute("offset", "0%");
    stop0.setAttribute("stop-color", "#232a35");
    var stop1 = document.createElementNS(SVG_NS, "stop");
    stop1.setAttribute("offset", "70%");
    stop1.setAttribute("stop-color", "#0f172a");
    var stop2 = document.createElementNS(SVG_NS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#020617");
    gradient.append(stop0, stop1, stop2);

    var mask = document.createElementNS(SVG_NS, "mask");
    mask.setAttribute("id", "as-pending-globe-mask" + idSuffix);
    var maskCircle = document.createElementNS(SVG_NS, "circle");
    maskCircle.setAttribute("cx", String(CENTER_X));
    maskCircle.setAttribute("cy", String(CENTER_Y));
    maskCircle.setAttribute("r", String(GLOBE_RADIUS));
    maskCircle.setAttribute("fill", "white");
    mask.appendChild(maskCircle);
    defs.append(glow, gradient, mask);
    svg.appendChild(defs);

    var starField = document.createElementNS(SVG_NS, "g");
    starField.setAttribute("data-as-pending-globe-stars", "1");
    paintStars(starField);

    var globe = document.createElementNS(SVG_NS, "g");
    globe.setAttribute("data-as-pending-globe-body", "1");

    var halo = document.createElementNS(SVG_NS, "circle");
    halo.setAttribute("cx", String(CENTER_X));
    halo.setAttribute("cy", String(CENTER_Y));
    halo.setAttribute("r", "235");
    halo.setAttribute("fill", "url(#as-pending-globe-gradient" + idSuffix + ")");
    halo.setAttribute("opacity", "0.4");
    halo.setAttribute("filter", "url(#as-pending-globe-glow" + idSuffix + ")");

    var ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("cx", String(CENTER_X));
    ring.setAttribute("cy", String(CENTER_Y));
    ring.setAttribute("r", "225");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#4f8cff");
    ring.setAttribute("stroke-width", "0.5");
    ring.setAttribute("opacity", "0.3");

    var ocean = document.createElementNS(SVG_NS, "circle");
    ocean.setAttribute("cx", String(CENTER_X));
    ocean.setAttribute("cy", String(CENTER_Y));
    ocean.setAttribute("r", String(GLOBE_RADIUS));
    ocean.setAttribute("fill", "url(#as-pending-globe-gradient" + idSuffix + ")");

    var masked = document.createElementNS(SVG_NS, "g");
    masked.setAttribute("mask", "url(#as-pending-globe-mask" + idSuffix + ")");

    /* Empty until atlas + d3 ready — same as BrowserUI index.html boot SVG. */
    var graticule = document.createElementNS(SVG_NS, "path");
    graticule.setAttribute("data-as-pending-globe-graticule", "1");
    graticule.setAttribute("fill", "none");
    graticule.setAttribute("stroke", "#3d4654");
    graticule.setAttribute("stroke-width", "0.5");
    graticule.setAttribute("opacity", "0.5");

    var land = document.createElementNS(SVG_NS, "path");
    land.setAttribute("data-as-pending-globe-land", "1");
    land.setAttribute("fill", "#4f8cff");
    land.setAttribute("fill-opacity", "0.4");
    land.setAttribute("stroke", "#4f8cff");
    land.setAttribute("stroke-width", "0.8");

    masked.append(graticule, land);
    globe.append(halo, ring, ocean, masked);
    svg.append(starField, globe);
    root.appendChild(svg);
    host.appendChild(root);

    var raf = 0;
    var stopped = false;
    var spinning = false;

    function stopRaf() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      spinning = false;
    }

    async function startOrthographicSpin() {
      if (stopped || spinning) return;
      spinning = true;
      try {
        var libs = await ensureGlobeLibs();
        if (stopped) {
          spinning = false;
          return;
        }
        var d3 = libs.d3;
        var topojson = libs.topojson;
        var res = await fetch(atlasUrl, { credentials: "same-origin" });
        if (!res.ok) throw new Error("atlas " + res.status);
        var world = await res.json();
        if (stopped) {
          spinning = false;
          return;
        }
        if (!world.objects || !world.objects.land) throw new Error("no land");
        var landData = topojson.feature(world, world.objects.land);
        var projection = d3
          .geoOrthographic()
          .scale(GLOBE_RADIUS)
          .translate([CENTER_X, CENTER_Y])
          .rotate([0, -20, 0])
          .clipAngle(90);
        var pathGen = d3.geoPath().projection(projection);
        var rotation = [0, -20, 0];
        var graticuleGen = d3.geoGraticule();

        function tick() {
          if (stopped) return;
          rotation[0] += rotationSpeed;
          projection.rotate(rotation);
          land.setAttribute("d", pathGen(landData) || "");
          graticule.setAttribute("d", pathGen(graticuleGen()) || "");
          raf = requestAnimationFrame(tick);
        }
        tick();
      } catch (e) {
        spinning = false;
        /* Keep static BrowserUI scene (halo + ocean). Retry on next start(). */
        if (typeof console !== "undefined" && console.warn) {
          console.warn("[as-pending-globe] orthographic spin failed:", e);
        }
      }
    }

    return {
      root: root,
      start: function () {
        stopped = false;
        if (raf) return;
        if (spinning) return;
        void startOrthographicSpin();
      },
      stop: function () {
        stopped = true;
        stopRaf();
      },
      destroy: function () {
        stopped = true;
        stopRaf();
        root.remove();
      },
    };
  }

  global.__AS_PENDING_GLOBE = {
    ATLAS_URL: ATLAS_URL,
    GLOBE_SVG_URL: GLOBE_SVG_URL,
    D3_URL: D3_URL,
    TOPO_URL: TOPO_URL,
    mount: mount,
    resolveGlobeSvgUrl: resolveGlobeSvgUrl,
  };
})(typeof window !== "undefined" ? window : globalThis);
