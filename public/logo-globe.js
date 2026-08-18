/**
 * Logo globe — the Studio "pending-globe" spinning earth, compacted for the
 * header logo. Same d3@7 orthographic projection, same TopoJSON world atlas,
 * same dark-ocean + blue-land palette as apps/studio/public/pending-globe.
 * Globe only (no starfield / halo) so it reads at ~36px.
 */
(function (global) {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var D3_URL = "/pending-globe/d3.min.js";
  var TOPO_URL = "/pending-globe/topojson-client.min.js";
  var ATLAS_URL = "/pending-globe/countries-110m.json";
  var VIEW = 440;
  var CX = 220;
  var CY = 220;
  var RADIUS = 200;
  var ROTATION_SPEED = 0.25;

  var libsPromise = null;

  function loadScript(src, globalName) {
    return new Promise(function (resolve, reject) {
      if (global[globalName]) return resolve(global[globalName]);
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        if (global[globalName]) resolve(global[globalName]);
        else reject(new Error(globalName + " missing after load"));
      };
      s.onerror = function () {
        reject(new Error("failed to load " + src));
      };
      document.head.appendChild(s);
    });
  }

  function ensureLibs() {
    if (!libsPromise) {
      libsPromise = loadScript(D3_URL, "d3").then(function (d3) {
        return loadScript(TOPO_URL, "topojson").then(function (topojson) {
          return { d3: d3, topojson: topojson };
        });
      });
    }
    return libsPromise;
  }

  function mount(host) {
    if (!host || host.getAttribute("data-as-logo-globe-mounted")) return;
    host.setAttribute("data-as-logo-globe-mounted", "1");

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + VIEW + " " + VIEW);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "logo-globe__svg");

    var defs = document.createElementNS(SVG_NS, "defs");
    var grad = document.createElementNS(SVG_NS, "radialGradient");
    grad.setAttribute("id", "walp-logo-globe-grad");
    grad.setAttribute("cx", "50%");
    grad.setAttribute("cy", "50%");
    grad.setAttribute("r", "50%");
    grad.setAttribute("fx", "30%");
    grad.setAttribute("fy", "30%");
    [
      ["0%", "#232a35"],
      ["70%", "#0f172a"],
      ["100%", "#020617"],
    ].forEach(function (pair) {
      var stop = document.createElementNS(SVG_NS, "stop");
      stop.setAttribute("offset", pair[0]);
      stop.setAttribute("stop-color", pair[1]);
      grad.appendChild(stop);
    });
    var mask = document.createElementNS(SVG_NS, "mask");
    mask.setAttribute("id", "walp-logo-globe-mask");
    var maskCircle = document.createElementNS(SVG_NS, "circle");
    maskCircle.setAttribute("cx", String(CX));
    maskCircle.setAttribute("cy", String(CY));
    maskCircle.setAttribute("r", String(RADIUS));
    maskCircle.setAttribute("fill", "white");
    mask.appendChild(maskCircle);
    defs.appendChild(grad);
    defs.appendChild(mask);
    svg.appendChild(defs);

    var ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("cx", String(CX));
    ring.setAttribute("cy", String(CY));
    ring.setAttribute("r", String(RADIUS + 1));
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#4f8cff");
    ring.setAttribute("stroke-width", "1");
    ring.setAttribute("opacity", "0.35");

    var ocean = document.createElementNS(SVG_NS, "circle");
    ocean.setAttribute("cx", String(CX));
    ocean.setAttribute("cy", String(CY));
    ocean.setAttribute("r", String(RADIUS));
    ocean.setAttribute("fill", "url(#walp-logo-globe-grad)");

    var masked = document.createElementNS(SVG_NS, "g");
    masked.setAttribute("mask", "url(#walp-logo-globe-mask)");

    var graticule = document.createElementNS(SVG_NS, "path");
    graticule.setAttribute("fill", "none");
    graticule.setAttribute("stroke", "#3d4654");
    graticule.setAttribute("stroke-width", "0.5");
    graticule.setAttribute("opacity", "0.5");

    var land = document.createElementNS(SVG_NS, "path");
    land.setAttribute("fill", "#4f8cff");
    land.setAttribute("fill-opacity", "0.4");
    land.setAttribute("stroke", "#4f8cff");
    land.setAttribute("stroke-width", "0.8");

    masked.appendChild(graticule);
    masked.appendChild(land);
    svg.appendChild(ring);
    svg.appendChild(ocean);
    svg.appendChild(masked);
    host.appendChild(svg);

    var stopped = false;

    function spin() {
      ensureLibs()
        .then(function (libs) {
          return fetch(ATLAS_URL, { credentials: "same-origin" })
            .then(function (r) {
              if (!r.ok) throw new Error("atlas " + r.status);
              return r.json();
            })
            .then(function (world) {
              if (stopped) return;
              if (!world.objects || !world.objects.land) {
                throw new Error("no land");
              }
              var d3 = libs.d3;
              var landData = libs.topojson.feature(world, world.objects.land);
              var projection = d3
                .geoOrthographic()
                .scale(RADIUS)
                .translate([CX, CY])
                .rotate([0, -20, 0])
                .clipAngle(90);
              var pathGen = d3.geoPath().projection(projection);
              var graticuleGen = d3.geoGraticule();
              var rotation = [0, -20, 0];
              function tick() {
                if (stopped) return;
                rotation[0] += ROTATION_SPEED;
                projection.rotate(rotation);
                land.setAttribute("d", pathGen(landData) || "");
                graticule.setAttribute("d", pathGen(graticuleGen()) || "");
                window.requestAnimationFrame(tick);
              }
              tick();
            });
        })
        .catch(function (e) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn("[logo-globe] spin failed:", e);
          }
          /* static fallback circle remains */
        });
    }

    spin();

    return {
      destroy: function () {
        stopped = true;
        svg.remove();
      },
    };
  }

  global.__AS_LOGO_GLOBE = { mount: mount };
})(typeof window !== "undefined" ? window : globalThis);
