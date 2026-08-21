/**
 * Lumen Lab — interactive 2D "atmosphere" simulator.
 *
 * Three scenes (car headlights, street lamp, room), three controls per scene:
 *   • Lumens   — total light output (brightness / intensity)
 *   • Kelvin   — color temperature (warm amber ↔ cool blue)
 *   • Fixture  — diffusion / shielding / height (the SAME light, mounted right)
 *   • Color    — White (Kelvin) vs Red (deep red, night-vision, zero blue)
 *
 * Dragging any control live-updates the scene: the light's color, the size and
 * reach of its glow, the pool on the ground, the haze in the sky, and how many
 * stars survive the skyglow. Shielding *reduces* skyglow at identical lumens —
 * the whole point of the lab: LEDs aren't the enemy, brightness + color + aim are.
 *
 * Educational overlays (CSS-positioned markers + key) name what the picture
 * is doing: lumens vs lux vs Kelvin vs shielding vs skyglow.
 *
 * Self-mounts on `[data-as-lumen-lab]` when this file loads (deferred).
 * No build step — plain vanilla JS, same IIFE pattern as logo-globe.js.
 */
(function (global) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var VIEW_W = 720;
  var VIEW_H = 440;

  // Deep-red "night vision" light — not a Kelvin temperature (it's monochromatic).
  var RED = { r: 255, g: 42, b: 22 };

  // ── Color science ────────────────────────────────────────────────────────

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  /** Tanner Helland approximation: Kelvin → sRGB. */
  function kelvinToRgb(k) {
    var t = k / 100;
    var r, g, b;
    if (t <= 66) r = 255;
    else r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    if (t <= 66) g = 99.4708025861 * Math.log(t) - 161.1195681661;
    else g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    if (t >= 66) b = 255;
    else if (t <= 19) b = 0;
    else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return {
      r: Math.round(clamp01(r / 255) * 255),
      g: Math.round(clamp01(g / 255) * 255),
      b: Math.round(clamp01(b / 255) * 255),
    };
  }

  function rgbHex(c) {
    return (
      "#" +
      [c.r, c.g, c.b]
        .map(function (v) {
          return ("0" + v.toString(16)).slice(-2);
        })
        .join("")
    );
  }

  function rgba(c, a) {
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")";
  }

  /** Nudge a color toward white (blown-out filament/LED core). */
  function towardWhite(c, f) {
    return {
      r: Math.round(c.r + (255 - c.r) * f),
      g: Math.round(c.g + (255 - c.g) * f),
      b: Math.round(c.b + (255 - c.b) * f),
    };
  }

  function seededRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function starDots(count, seed, x0, y0, x1, y1) {
    var rand = seededRandom(seed);
    var out = "";
    for (var i = 0; i < count; i++) {
      var x = x0 + rand() * (x1 - x0);
      var y = y0 + rand() * (y1 - y0);
      var r = 0.4 + rand() * 0.9;
      var o = 0.25 + rand() * 0.7;
      out +=
        '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(2) +
        '" fill="#ffffff" opacity="' + o.toFixed(2) + '"/>';
    }
    return out;
  }

  function fmtLumens(v) {
    return Number(v).toLocaleString("en-US") + " lm";
  }

  function fmtKelvin(v) {
    return Number(v).toLocaleString("en-US") + " K";
  }

  function fmtDiffuse(v) {
    if (v < 20) return "Bare / direct";
    if (v < 55) return "Partly covered";
    return "Frosted cover";
  }

  /** Cover fades the spear, grows the soft pool. Same lumens — less punch. */
  function applyDiffusePaint(svg, s) {
    var beam = svg.querySelector('[data-nl="beam"]');
    if (beam) beam.setAttribute("opacity", String(1 - 0.82 * s.diffuse));
    var cover = svg.querySelector('[data-nl="cover"]');
    if (cover) {
      cover.setAttribute("opacity", String(s.diffuse * 0.88));
      cover.setAttribute("fill", rgba(towardWhite(s.color, 0.72), 0.55 + 0.35 * s.diffuse));
    }
    var wash = svg.querySelector('[data-nl="wash"]');
    if (wash) {
      var wrx = Number(wash.getAttribute("data-base-rx"));
      var wry = Number(wash.getAttribute("data-base-ry"));
      wash.setAttribute("rx", String(wrx * (0.75 + 0.85 * s.diffuse)));
      wash.setAttribute("ry", String(wry * (0.8 + 0.7 * s.diffuse)));
      wash.setAttribute("fill", s.rgba(0.08 + 0.18 * s.bright * s.diffuse));
      wash.setAttribute("opacity", String(s.diffuse * (0.35 + 0.45 * s.bright)));
    }
    var pool = svg.querySelector('[data-nl="pool"]');
    if (pool && pool.getAttribute("data-base-rx")) {
      pool.setAttribute(
        "rx",
        String(Number(pool.getAttribute("data-base-rx")) * (1 + 0.4 * s.diffuse)),
      );
    }
    var blur = svg.querySelector('[data-nl="soft-blur"]');
    if (blur) blur.setAttribute("stdDeviation", String(16 + 26 * s.diffuse));
    var glow = svg.querySelector('[data-nl="glow"]');
    if (glow) {
      var base = Number(glow.getAttribute("data-base-r"));
      glow.setAttribute(
        "r",
        String(base * (0.7 + 0.5 * s.bright) * (1 + 0.5 * s.diffuse)),
      );
      glow.setAttribute(
        "fill",
        s.rgba((0.38 + 0.32 * s.bright) * (1 - 0.4 * s.diffuse)),
      );
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  function makeState(scene, lumens, kelvin, fixtureId, redMode, diffuse) {
    var t = clamp01((lumens - scene.lumens.min) / (scene.lumens.max - scene.lumens.min));
    var color = redMode ? RED : kelvinToRgb(kelvin);
    var bright = Math.pow(t, 0.55);
    var blueFactor = redMode ? 0 : clamp01((kelvin - 3000) / 3500);
    var shield = shieldFor(scene, fixtureId);
    var d = clamp01(diffuse);
    // Blue-rich light scatters more → more skyglow; shielding cuts uplight.
    // A downward cover also takes the spear out of the beam — less punchy scatter.
    var skyglow = clamp01(bright * (0.3 + 0.7 * blueFactor) * shield * (1 - 0.22 * d));
    return {
      lumens: lumens,
      kelvin: kelvin,
      fixtureId: fixtureId,
      redMode: redMode,
      diffuse: d,
      t: t,
      bright: bright,
      blueFactor: blueFactor,
      shield: shield,
      skyglow: skyglow,
      starOpacity: clamp01(1 - skyglow * 1.15),
      color: color,
      core: towardWhite(color, redMode ? 0.5 : 0.62),
      hex: rgbHex(color),
      rgba: function (a) {
        return rgba(color, a);
      },
    };
  }

  function shieldFor(scene, fixtureId) {
    for (var i = 0; i < scene.fixtures.length; i++) {
      if (scene.fixtures[i].id === fixtureId) return scene.fixtures[i].shield;
    }
    return 1;
  }

  function computeVerdict(s) {
    if (s.redMode)
      return { tone: "good", label: "Red light", note: "Zero blue — preserves night vision, wildlife-safe, no glare." };
    if (s.diffuse >= 0.65 && s.t < 0.75)
      return { tone: "good", label: "Soft cover", note: "Same lumens, no spear — a frosted cover turns glare into a pool." };
    if (s.diffuse < 0.18 && s.t >= 0.55)
      return { tone: "warn", label: "Bare bulb", note: "A direct beam. A cover turns the same lumens into a pool." };
    if (s.kelvin <= 3000 && s.t < 0.55)
      return { tone: "good", label: "Warm & modest", note: "Kind to the sky — the right light, aimed down." };
    if (s.kelvin <= 3000)
      return { tone: "warn", label: "Warm and bright", note: "Lovely color. A little less would be enough when the street is empty." };
    if (s.kelvin >= 5000 && s.t >= 0.5)
      return { tone: "warn", label: "Cool and bright", note: "Warmer and a bit lower would be easier on eyes and on the sky." };
    if (s.kelvin >= 4000)
      return { tone: "warn", label: "Cool white", note: "Under 3000K keeps more of the night." };
    return { tone: "warn", label: "Almost there", note: "Aim it down, ease it after hours." };
  }

  // ── Scenes (static backdrop + swappable fixture) ─────────────────────────

  var SOFT_FILTER =
    '<filter id="nl-soft" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur data-nl="soft-blur" stdDeviation="24"/></filter>';

  var scenes = [
    {
      id: "car",
      label: "Car headlights",
      teach: "High beams throw glare into your eyes and the sky. Aimed low — or deep red — lights the road instead.",
      meterLabel: "Skyglow",
      redSupport: true,
      fixtures: [
        { id: "high", label: "High beams", shield: 1.0 },
        { id: "low", label: "Low beams", shield: 0.3 },
      ],
      defaultFixture: "high",
      lumens: { min: 200, max: 4000, value: 3200 },
      kelvin: { min: 1800, max: 6500, value: 6000 },
      presets: [
        { label: "Cool LED", lumens: 3200, kelvin: 6000 },
        { label: "Halogen", lumens: 1500, kelvin: 3200 },
        { label: "Aimed low", lumens: 1200, kelvin: 3000 },
        { label: "Red night", lumens: 800, kelvin: 1800, red: true },
        { label: "Frosted cover", lumens: 1400, kelvin: 3000, diffuse: 80 },
      ],
      staticHtml:
        "<defs>" +
        '<linearGradient id="nl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a14"/><stop offset="1" stop-color="#101828"/></linearGradient>' +
        '<linearGradient id="nl-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15161b"/><stop offset="1" stop-color="#0a0a0d"/></linearGradient>' +
        '<linearGradient id="nl-beam-grad" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" data-nl="beam-a" stop-color="#ffffff" stop-opacity="0.85"/>' +
        '<stop offset="0.6" data-nl="beam-b" stop-color="#ffffff" stop-opacity="0.2"/>' +
        '<stop offset="1" data-nl="beam-c" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
        SOFT_FILTER + "</defs>" +
        '<rect width="720" height="300" fill="url(#nl-sky)"/>' +
        '<rect data-nl="skyglow" width="720" height="300" fill="#ffffff" opacity="0"/>' +
        '<g data-nl="stars">' + starDots(70, 0x434152, 8, 8, 712, 250) + "</g>" +
        '<circle cx="620" cy="80" r="20" fill="#eef1f8" opacity="0.95"/>' +
        '<circle cx="612" cy="75" r="19" fill="#101828"/>' +
        '<g fill="#0b0e16"><rect x="560" y="150" width="70" height="150"/><rect x="650" y="180" width="52" height="120"/></g>' +
        '<rect x="0" y="300" width="720" height="140" fill="url(#nl-ground)"/>' +
        '<rect x="0" y="300" width="720" height="10" fill="#1b1d24"/>' +
        '<g stroke="#3a3f4d" stroke-width="2" stroke-dasharray="18 16" opacity="0.7"><line x1="0" y1="370" x2="720" y2="370"/></g>' +
        '<g fill="#0a0c12">' +
        '<rect x="116" y="330" width="150" height="42" rx="12"/>' +
        '<path d="M150 330 L170 300 L224 300 L244 330 Z"/>' +
        '<rect x="128" y="306" width="34" height="22" rx="4" fill="#20304c" opacity="0.7"/>' +
        "</g>" +
        '<g fill="#08090d"><circle cx="142" cy="376" r="16"/><circle cx="238" cy="376" r="16"/></g>' +
        '<circle cx="142" cy="376" r="7" fill="#1c2436"/><circle cx="238" cy="376" r="7" fill="#1c2436"/>',
      fixtureHtml: function (fixtureId) {
        if (fixtureId === "low") {
          return (
            '<ellipse data-nl="horizon-haze" cx="500" cy="300" rx="320" ry="50" fill="#ffffff" opacity="0"/>' +
            '<polygon data-nl="beam" points="266,340 266,360 720,400 720,280" fill="url(#nl-beam-grad)"/>' +
            '<ellipse data-nl="wash" data-base-rx="210" data-base-ry="36" cx="500" cy="368" rx="210" ry="36" fill="#ffffff" opacity="0"/>' +
            '<circle data-nl="glow" data-base-r="58" cx="262" cy="348" r="58" fill="#ffffff" opacity="0.5" filter="url(#nl-soft)"/>' +
            '<ellipse data-nl="cover" cx="262" cy="350" rx="16" ry="10" fill="#e8e2d4" opacity="0"/>' +
            '<ellipse data-nl="source" cx="262" cy="342" rx="5" ry="4" fill="#ffffff"/>' +
            '<ellipse data-nl="source-2" cx="262" cy="360" rx="5" ry="4" fill="#ffffff" opacity="0.9"/>'
          );
        }
        return (
          '<ellipse data-nl="horizon-haze" cx="600" cy="300" rx="380" ry="60" fill="#ffffff" opacity="0"/>' +
          '<polygon data-nl="beam" points="266,334 266,358 720,430 720,150" fill="url(#nl-beam-grad)"/>' +
          '<ellipse data-nl="wash" data-base-rx="260" data-base-ry="42" cx="520" cy="370" rx="260" ry="42" fill="#ffffff" opacity="0"/>' +
          '<circle data-nl="glow" data-base-r="80" cx="262" cy="344" r="80" fill="#ffffff" opacity="0.5" filter="url(#nl-soft)"/>' +
          '<ellipse data-nl="cover" cx="262" cy="346" rx="18" ry="12" fill="#e8e2d4" opacity="0"/>' +
          '<ellipse data-nl="source" cx="262" cy="334" rx="5" ry="4" fill="#ffffff"/>' +
          '<ellipse data-nl="source-2" cx="262" cy="356" rx="5" ry="4" fill="#ffffff" opacity="0.9"/>'
        );
      },
      update: function (svg, s) {
        svg.querySelector('[data-nl="source"]').setAttribute("fill", rgba(s.core, 1));
        var source2 = svg.querySelector('[data-nl="source-2"]');
        if (source2) source2.setAttribute("fill", rgba(s.core, 0.9));
        svg.querySelector('[data-nl="beam-a"]').setAttribute("stop-color", s.rgba(0.72 + 0.2 * s.bright));
        svg.querySelector('[data-nl="beam-b"]').setAttribute("stop-color", s.rgba(0.16 + 0.08 * s.bright));
        svg.querySelector('[data-nl="beam-c"]').setAttribute("stop-color", s.rgba(0));
        svg.querySelector('[data-nl="stars"]').setAttribute("opacity", String(s.starOpacity));
        svg.querySelector('[data-nl="skyglow"]').setAttribute("fill", s.rgba(0.3));
        svg.querySelector('[data-nl="skyglow"]').setAttribute("opacity", String(s.skyglow * 0.7));
        svg.querySelector('[data-nl="horizon-haze"]').setAttribute("fill", s.rgba(0.26));
        svg.querySelector('[data-nl="horizon-haze"]').setAttribute("opacity", String(s.skyglow * 0.45));
        applyDiffusePaint(svg, s);
      },
    },
    {
      id: "street",
      label: "Street lamp",
      teach: "A pale dome over the roofs. Aimed down and warmer, the sidewalk stays and the sky comes back.",
      meterLabel: "Skyglow",
      redSupport: true,
      fixtures: [
        { id: "cobra", label: "Street lamp, no shade", shield: 1.0 },
        { id: "bollard", label: "Street lamp with a shade", shield: 0.15 },
      ],
      defaultFixture: "cobra",
      lumens: { min: 100, max: 10000, value: 4000 },
      kelvin: { min: 1800, max: 6500, value: 4000 },
      presets: [
        { label: "No shade", lumens: 4000, kelvin: 4000 },
        { label: "With a shade", lumens: 2000, kelvin: 2700 },
        { label: "Dimmed at 3am", lumens: 800, kelvin: 2200 },
        { label: "Red night", lumens: 600, kelvin: 1800, red: true },
        { label: "Frosted cover", lumens: 2200, kelvin: 2700, diffuse: 85 },
      ],
      staticHtml:
        "<defs>" +
        '<linearGradient id="nl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a14"/><stop offset="1" stop-color="#101828"/></linearGradient>' +
        '<linearGradient id="nl-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15161b"/><stop offset="1" stop-color="#0a0a0d"/></linearGradient>' +
        '<linearGradient id="nl-beam-grad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" data-nl="beam-a" stop-color="#ffffff" stop-opacity="0.8"/>' +
        '<stop offset="0.55" data-nl="beam-b" stop-color="#ffffff" stop-opacity="0.22"/>' +
        '<stop offset="1" data-nl="beam-c" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
        SOFT_FILTER + "</defs>" +
        '<rect width="720" height="300" fill="url(#nl-sky)"/>' +
        '<rect data-nl="skyglow" width="720" height="300" fill="#ffffff" opacity="0"/>' +
        '<g data-nl="stars">' + starDots(90, 0x53545241, 8, 8, 712, 260) + "</g>" +
        '<circle cx="126" cy="78" r="24" fill="#eef1f8" opacity="0.95"/>' +
        '<circle cx="116" cy="72" r="22" fill="#101828"/>' +
        '<g fill="#0b0e16"><rect x="44" y="176" width="86" height="124"/><rect x="150" y="206" width="64" height="94"/><rect x="234" y="152" width="52" height="148"/></g>' +
        '<g fill="#1c2436" opacity="0.9">' +
        '<rect x="58" y="192" width="12" height="16"/><rect x="82" y="192" width="12" height="16"/>' +
        '<rect x="162" y="220" width="10" height="14"/><rect x="184" y="220" width="10" height="14"/>' +
        '<rect x="246" y="168" width="9" height="13"/><rect x="266" y="168" width="9" height="13"/></g>' +
        '<rect x="0" y="300" width="720" height="140" fill="url(#nl-ground)"/>' +
        '<rect x="0" y="300" width="720" height="12" fill="#1b1d24"/>' +
        '<g stroke="#3a3f4d" stroke-width="2" stroke-dasharray="18 16" opacity="0.7"><line x1="0" y1="370" x2="720" y2="370"/></g>' +
        '<g fill="#0a0c12"><circle cx="392" cy="296" r="9"/><path d="M376 316 C376 300 408 300 408 316 Z"/></g>',
      fixtureHtml: function (fixtureId) {
        if (fixtureId === "bollard") {
          return (
            '<rect x="148" y="270" width="8" height="38" fill="#0b0d13"/>' +
            '<rect x="142" y="264" width="20" height="8" rx="3" fill="#181c28"/>' +
            '<ellipse data-nl="horizon-haze" cx="154" cy="300" rx="150" ry="36" fill="#ffffff" opacity="0"/>' +
            '<polygon data-nl="beam" points="144,272 160,272 204,308 104,308" fill="url(#nl-beam-grad)"/>' +
            '<ellipse data-nl="wash" data-base-rx="90" data-base-ry="16" cx="154" cy="308" rx="90" ry="16" fill="#ffffff" opacity="0"/>' +
            '<ellipse data-nl="pool" data-base-rx="46" cx="154" cy="306" rx="46" ry="8" fill="#ffffff" opacity="0.18"/>' +
            '<circle data-nl="glow" data-base-r="46" cx="152" cy="268" r="46" fill="#ffffff" opacity="0.5" filter="url(#nl-soft)"/>' +
            '<ellipse data-nl="cover" cx="152" cy="268" rx="14" ry="8" fill="#e8e2d4" opacity="0"/>' +
            '<circle data-nl="source" cx="152" cy="268" r="5" fill="#ffffff"/>'
          );
        }
        return (
          '<rect x="560" y="128" width="6" height="172" fill="#0b0d13"/>' +
          '<rect x="532" y="132" width="58" height="7" rx="3" fill="#0b0d13"/>' +
          '<rect x="536" y="122" width="16" height="12" rx="2" fill="#181c28"/>' +
          '<ellipse data-nl="horizon-haze" cx="550" cy="300" rx="340" ry="70" fill="#ffffff" opacity="0"/>' +
          '<polygon data-nl="beam" points="540,140 560,140 640,316 470,316" fill="url(#nl-beam-grad)"/>' +
          '<ellipse data-nl="wash" data-base-rx="190" data-base-ry="28" cx="555" cy="318" rx="190" ry="28" fill="#ffffff" opacity="0"/>' +
          '<ellipse data-nl="pool" data-base-rx="120" cx="555" cy="316" rx="120" ry="15" fill="#ffffff" opacity="0.18"/>' +
          '<circle data-nl="glow" data-base-r="110" cx="550" cy="140" r="110" fill="#ffffff" opacity="0.5" filter="url(#nl-soft)"/>' +
          '<ellipse data-nl="cover" cx="544" cy="128" rx="20" ry="11" fill="#e8e2d4" opacity="0"/>' +
          '<circle data-nl="source" cx="550" cy="140" r="6" fill="#ffffff"/>'
        );
      },
      update: function (svg, s) {
        svg.querySelector('[data-nl="source"]').setAttribute("fill", rgba(s.core, 1));
        svg.querySelector('[data-nl="beam-a"]').setAttribute("stop-color", s.rgba(0.72 + 0.2 * s.bright));
        svg.querySelector('[data-nl="beam-b"]').setAttribute("stop-color", s.rgba(0.18 + 0.1 * s.bright));
        svg.querySelector('[data-nl="beam-c"]').setAttribute("stop-color", s.rgba(0));
        svg.querySelector('[data-nl="pool"]').setAttribute("fill", s.rgba(0.1 + 0.24 * s.bright));
        svg.querySelector('[data-nl="stars"]').setAttribute("opacity", String(s.starOpacity));
        svg.querySelector('[data-nl="skyglow"]').setAttribute("fill", s.rgba(0.3));
        svg.querySelector('[data-nl="skyglow"]').setAttribute("opacity", String(s.skyglow * 0.75));
        svg.querySelector('[data-nl="horizon-haze"]').setAttribute("fill", s.rgba(0.28));
        svg.querySelector('[data-nl="horizon-haze"]').setAttribute("opacity", String(s.skyglow * 0.5));
        applyDiffusePaint(svg, s);
      },
    },
    {
      id: "room",
      label: "Room",
      teach: "Indoor light leaking out the window. Warm, dim, and shaded keeps the night outside.",
      meterLabel: "Light spill",
      redSupport: true,
      fixtures: [
        { id: "overhead", label: "Bare overhead", shield: 1.0 },
        { id: "lamp", label: "Shaded lamp", shield: 0.25 },
      ],
      defaultFixture: "overhead",
      lumens: { min: 50, max: 2000, value: 800 },
      kelvin: { min: 1800, max: 6500, value: 2700 },
      presets: [
        { label: "Daylight bulb", lumens: 1600, kelvin: 5000 },
        { label: "Warm white", lumens: 800, kelvin: 2700 },
        { label: "Night lamp", lumens: 250, kelvin: 2200 },
        { label: "Red night", lumens: 180, kelvin: 1800, red: true },
      ],
      staticHtml:
        "<defs>" +
        '<linearGradient id="nl-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171a24"/><stop offset="1" stop-color="#12141d"/></linearGradient>' +
        '<linearGradient id="nl-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1712"/><stop offset="1" stop-color="#0f0d0a"/></linearGradient>' +
        '<linearGradient id="nl-beam-grad" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" data-nl="beam-a" stop-color="#ffffff" stop-opacity="0.7"/>' +
        '<stop offset="1" data-nl="beam-c" stop-color="#ffffff" stop-opacity="0"/></linearGradient>' +
        SOFT_FILTER + "</defs>" +
        '<rect width="720" height="258" fill="url(#nl-wall)"/>' +
        '<rect x="0" y="258" width="720" height="182" fill="url(#nl-floor)"/>' +
        '<rect x="0" y="258" width="720" height="4" fill="#000000" opacity="0.4"/>' +
        '<g>' +
        '<rect x="298" y="58" width="124" height="104" rx="6" fill="#0a0f1d" stroke="#2a3142" stroke-width="3"/>' +
        '<line x1="360" y1="58" x2="360" y2="162" stroke="#2a3142" stroke-width="3"/>' +
        '<line x1="298" y1="110" x2="422" y2="110" stroke="#2a3142" stroke-width="3"/>' +
        '<g data-nl="room-stars">' + starDots(14, 0x524f4f, 306, 64, 416, 156) + "</g>" +
        "</g>" +
        '<g fill="#0c0d13">' +
        '<rect x="56" y="228" width="150" height="30" rx="8"/>' +
        '<rect x="56" y="200" width="34" height="34" rx="6"/>' +
        '<rect x="100" y="200" width="34" height="34" rx="6"/>' +
        '<rect x="144" y="200" width="34" height="34" rx="6"/>' +
        '<rect x="68" y="258" width="18" height="34"/><rect x="176" y="258" width="18" height="34"/>' +
        "</g>" +
        '<g fill="#0c0d13">' +
        '<rect x="556" y="232" width="72" height="40" rx="6"/>' +
        '<path d="M548 258 L560 232 L568 232 L580 258 Z"/>' +
        '<rect x="568" y="210" width="10" height="26"/>' +
        "</g>",
      fixtureHtml: function (fixtureId) {
        if (fixtureId === "lamp") {
          return (
            '<rect data-nl="ambient" width="720" height="440" fill="#ffffff" opacity="0"/>' +
            '<path d="M586 232 L602 232 L598 212 L590 212 Z" fill="#0c0d13"/>' +
            '<path d="M576 212 L608 212 L600 178 L584 178 Z" fill="#151822"/>' +
            '<polygon data-nl="beam" points="576,180 608,180 660,300 520,300" fill="url(#nl-beam-grad)"/>' +
            '<ellipse data-nl="wash" data-base-rx="120" data-base-ry="22" cx="592" cy="332" rx="120" ry="22" fill="#ffffff" opacity="0"/>' +
            '<ellipse data-nl="pool" data-base-rx="80" cx="592" cy="330" rx="80" ry="14" fill="#ffffff" opacity="0.12"/>' +
            '<circle data-nl="glow" data-base-r="60" cx="592" cy="182" r="60" fill="#ffffff" opacity="0.45" filter="url(#nl-soft)"/>' +
            '<ellipse data-nl="cover" cx="592" cy="188" rx="22" ry="10" fill="#e8e2d4" opacity="0"/>' +
            '<circle data-nl="source" cx="592" cy="184" r="6" fill="#ffffff"/>'
          );
        }
        return (
          '<rect data-nl="ambient" width="720" height="440" fill="#ffffff" opacity="0"/>' +
          '<line x1="360" y1="0" x2="360" y2="66" stroke="#0c0d13" stroke-width="3"/>' +
          '<path d="M330 66 L390 66 L382 92 L338 92 Z" fill="#0c0d13"/>' +
          '<ellipse data-nl="wash" data-base-rx="210" data-base-ry="32" cx="360" cy="332" rx="210" ry="32" fill="#ffffff" opacity="0"/>' +
          '<ellipse data-nl="pool" data-base-rx="150" cx="360" cy="330" rx="150" ry="22" fill="#ffffff" opacity="0.12"/>' +
          '<circle data-nl="glow" data-base-r="90" cx="360" cy="92" r="90" fill="#ffffff" opacity="0.45" filter="url(#nl-soft)"/>' +
          '<ellipse data-nl="cover" cx="360" cy="94" rx="28" ry="12" fill="#e8e2d4" opacity="0"/>' +
          '<circle data-nl="source" cx="360" cy="96" r="9" fill="#ffffff"/>'
        );
      },
      update: function (svg, s) {
        svg.querySelector('[data-nl="source"]').setAttribute("fill", rgba(s.core, 1));
        var beamA = svg.querySelector('[data-nl="beam-a"]');
        if (beamA) {
          beamA.setAttribute("stop-color", s.rgba(0.5 + 0.2 * s.bright));
          svg.querySelector('[data-nl="beam-c"]').setAttribute("stop-color", s.rgba(0));
        }
        var pool = svg.querySelector('[data-nl="pool"]');
        pool.setAttribute("fill", s.rgba(0.06 + 0.2 * s.bright));
        svg.querySelector('[data-nl="ambient"]').setAttribute("fill", s.rgba(0.07));
        svg.querySelector('[data-nl="ambient"]').setAttribute(
          "opacity",
          String(s.bright * (0.35 + 0.65 * s.shield) * (0.75 + 0.4 * s.diffuse)),
        );
        svg.querySelector('[data-nl="room-stars"]').setAttribute("opacity", String(s.starOpacity));
        applyDiffusePaint(svg, s);
      },
    },
    {
      id: "phone",
      label: "Phone screen",
      teach: "The screen fills the pillow. Dim it, or let it go red — the window keeps its stars.",
      meterLabel: "Blue glare",
      redSupport: true,
      fixtures: [{ id: "hand", label: "In your hand", shield: 1.0 }],
      defaultFixture: "hand",
      lumens: { min: 20, max: 800, value: 400 },
      kelvin: { min: 1800, max: 6500, value: 6500 },
      presets: [
        { label: "Full blast", lumens: 700, kelvin: 6500 },
        { label: "Night Shift", lumens: 180, kelvin: 2700 },
        { label: "Red night", lumens: 90, kelvin: 1800, red: true },
      ],
      staticHtml:
        "<defs>" +
        '<linearGradient id="nl-ph-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12141c"/><stop offset="1" stop-color="#0c0e14"/></linearGradient>' +
        '<linearGradient id="nl-ph-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16130e"/><stop offset="1" stop-color="#0b0a08"/></linearGradient>' +
        '<filter id="nl-ph-soft" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur data-nl="soft-blur" stdDeviation="22"/></filter>' +
        "</defs>" +
        '<rect width="720" height="270" fill="url(#nl-ph-wall)"/>' +
        '<rect x="0" y="270" width="720" height="170" fill="url(#nl-ph-floor)"/>' +
        '<rect x="48" y="52" width="168" height="132" rx="6" fill="#070b16" stroke="#2a3142" stroke-width="3"/>' +
        '<g data-nl="room-stars">' + starDots(18, 0x50484f4e, 58, 62, 204, 172) + "</g>" +
        '<rect x="80" y="292" width="220" height="18" rx="6" fill="#0c0d13"/>' +
        '<rect x="96" y="248" width="72" height="48" rx="8" fill="#0c0d13"/>' +
        '<ellipse cx="368" cy="168" rx="38" ry="44" fill="#1a1512"/>' +
        '<rect x="332" y="204" width="72" height="96" rx="18" fill="#1a1512"/>' +
        '<ellipse cx="348" cy="158" rx="7" ry="5" fill="#0a0807"/>' +
        '<ellipse cx="386" cy="158" rx="7" ry="5" fill="#0a0807"/>',
      fixtureHtml: function () {
        return (
          '<rect data-nl="ambient" width="720" height="440" fill="#ffffff" opacity="0"/>' +
          '<circle data-nl="glow" data-base-r="90" cx="430" cy="188" r="90" fill="#ffffff" opacity="0.5" filter="url(#nl-ph-soft)"/>' +
          '<rect x="408" y="198" width="46" height="78" rx="8" fill="#0b0d12" stroke="#3a4254" stroke-width="3"/>' +
          '<rect data-nl="source" x="414" y="210" width="34" height="56" rx="3" fill="#ffffff"/>' +
          '<ellipse data-nl="cover" cx="431" cy="238" rx="16" ry="22" fill="#e8e2d4" opacity="0"/>' +
          '<ellipse data-nl="pool" data-base-rx="70" cx="400" cy="176" rx="70" ry="36" fill="#ffffff" opacity="0.12"/>'
        );
      },
      update: function (svg, s) {
        svg.querySelector('[data-nl="source"]').setAttribute("fill", rgba(s.core, 1));
        svg.querySelector('[data-nl="ambient"]').setAttribute("fill", s.rgba(0.08));
        svg.querySelector('[data-nl="ambient"]').setAttribute("opacity", String(s.bright * 0.55));
        svg.querySelector('[data-nl="room-stars"]').setAttribute("opacity", String(s.starOpacity));
        applyDiffusePaint(svg, s);
      },
    },
    {
      id: "tv",
      label: "Television",
      teach: "HDR at midnight is a window-sized flood. Dim the set — the room should not outshine the show.",
      meterLabel: "Room wash",
      redSupport: true,
      fixtures: [
        { id: "hdr", label: "HDR vivid", shield: 1.0 },
        { id: "cinema", label: "Dim cinema", shield: 0.28 },
      ],
      defaultFixture: "hdr",
      lumens: { min: 80, max: 1600, value: 900 },
      kelvin: { min: 1800, max: 6500, value: 6500 },
      presets: [
        { label: "HDR vivid", lumens: 1200, kelvin: 6500 },
        { label: "Evening", lumens: 400, kelvin: 3000 },
        { label: "Red night", lumens: 180, kelvin: 1800, red: true },
      ],
      staticHtml:
        "<defs>" +
        '<linearGradient id="nl-tv-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141722"/><stop offset="1" stop-color="#10131c"/></linearGradient>' +
        '<linearGradient id="nl-tv-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1610"/><stop offset="1" stop-color="#0d0b09"/></linearGradient>' +
        '<filter id="nl-tv-soft" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur data-nl="soft-blur" stdDeviation="26"/></filter>' +
        "</defs>" +
        '<rect width="720" height="268" fill="url(#nl-tv-wall)"/>' +
        '<rect x="0" y="268" width="720" height="172" fill="url(#nl-tv-floor)"/>' +
        '<rect x="36" y="48" width="88" height="110" rx="5" fill="#070b16" stroke="#2a3142" stroke-width="3"/>' +
        '<g data-nl="room-stars">' + starDots(12, 0x5456, 44, 56, 116, 148) + "</g>" +
        '<rect x="120" y="318" width="480" height="28" rx="10" fill="#0c0d13"/>' +
        '<rect x="168" y="292" width="72" height="36" rx="8" fill="#0c0d13"/>' +
        '<rect x="480" y="292" width="72" height="36" rx="8" fill="#0c0d13"/>',
      fixtureHtml: function () {
        return (
          '<rect data-nl="ambient" width="720" height="440" fill="#ffffff" opacity="0"/>' +
          '<rect x="176" y="72" width="368" height="214" rx="10" fill="#0a0c12"/>' +
          '<rect data-nl="source" x="190" y="86" width="340" height="186" rx="4" fill="#ffffff"/>' +
          '<circle data-nl="glow" data-base-r="160" cx="360" cy="180" r="160" fill="#ffffff" opacity="0.45" filter="url(#nl-tv-soft)"/>' +
          '<ellipse data-nl="cover" cx="360" cy="180" rx="150" ry="80" fill="#e8e2d4" opacity="0"/>' +
          '<ellipse data-nl="pool" data-base-rx="200" cx="360" cy="330" rx="200" ry="22" fill="#ffffff" opacity="0.12"/>' +
          '<rect x="340" y="286" width="40" height="16" fill="#0a0c12"/>'
        );
      },
      update: function (svg, s) {
        svg.querySelector('[data-nl="source"]').setAttribute("fill", rgba(s.core, 0.55 + 0.45 * s.bright * s.shield));
        svg.querySelector('[data-nl="ambient"]').setAttribute("fill", s.rgba(0.07));
        svg.querySelector('[data-nl="ambient"]').setAttribute(
          "opacity",
          String(s.bright * (0.25 + 0.7 * s.shield)),
        );
        svg.querySelector('[data-nl="room-stars"]').setAttribute("opacity", String(s.starOpacity));
        applyDiffusePaint(svg, s);
      },
    },
    {
      id: "clutter",
      label: "Sign clutter",
      teach: "One aimed light is easier to follow than a row of competing floods.",
      meterLabel: "Visual noise",
      redSupport: false,
      fixtures: [
        { id: "messy", label: "Competing signs", shield: 1.0 },
        { id: "calm", label: "One aimed light", shield: 0.22 },
      ],
      defaultFixture: "messy",
      lumens: { min: 200, max: 9000, value: 6000 },
      kelvin: { min: 1800, max: 6500, value: 4500 },
      presets: [
        { label: "Strip mall", lumens: 7000, kelvin: 5000 },
        { label: "One fixture", lumens: 1800, kelvin: 2700 },
      ],
      staticHtml:
        "<defs>" +
        '<linearGradient id="nl-cl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a14"/><stop offset="1" stop-color="#101828"/></linearGradient>' +
        '<linearGradient id="nl-cl-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15161b"/><stop offset="1" stop-color="#0a0a0d"/></linearGradient>' +
        '<filter id="nl-cl-soft" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur data-nl="soft-blur" stdDeviation="20"/></filter>' +
        "</defs>" +
        '<rect width="720" height="300" fill="url(#nl-cl-sky)"/>' +
        '<rect data-nl="skyglow" width="720" height="300" fill="#ffffff" opacity="0"/>' +
        '<g data-nl="stars">' + starDots(70, 0x434c55, 8, 8, 712, 250) + "</g>" +
        '<g fill="#0b0e16"><rect x="24" y="168" width="120" height="132"/><rect x="168" y="188" width="96" height="112"/><rect x="290" y="154" width="140" height="146"/><rect x="456" y="176" width="110" height="124"/><rect x="590" y="198" width="92" height="102"/></g>' +
        '<rect x="0" y="300" width="720" height="140" fill="url(#nl-cl-ground)"/>' +
        '<rect x="0" y="300" width="720" height="12" fill="#1b1d24"/>' +
        '<g stroke="#3a3f4d" stroke-width="2" stroke-dasharray="18 16" opacity="0.7"><line x1="0" y1="370" x2="720" y2="370"/></g>',
      fixtureHtml: function (fixtureId) {
        var pole =
          '<rect x="360" y="120" width="6" height="180" fill="#0b0d13"/>' +
          '<circle data-nl="source" cx="363" cy="128" r="6" fill="#ffffff"/>' +
          '<circle data-nl="glow" data-base-r="80" cx="363" cy="128" r="80" fill="#ffffff" opacity="0.4" filter="url(#nl-cl-soft)"/>' +
          '<ellipse data-nl="cover" cx="363" cy="122" rx="18" ry="10" fill="#e8e2d4" opacity="0"/>' +
          '<ellipse data-nl="pool" data-base-rx="90" cx="363" cy="316" rx="90" ry="12" fill="#ffffff" opacity="0.16"/>';
        if (fixtureId === "calm") return pole;
        return (
          pole +
          '<g data-nl="signs">' +
          '<rect x="40" y="188" width="72" height="28" rx="3" fill="#ffffff" opacity="0.85"/>' +
          '<rect x="186" y="204" width="56" height="22" rx="3" fill="#ffffff" opacity="0.75"/>' +
          '<rect x="310" y="168" width="88" height="32" rx="3" fill="#ffffff" opacity="0.9"/>' +
          '<rect x="474" y="196" width="64" height="24" rx="3" fill="#ffffff" opacity="0.8"/>' +
          '<rect x="604" y="214" width="52" height="20" rx="3" fill="#ffffff" opacity="0.7"/>' +
          "</g>"
        );
      },
      update: function (svg, s) {
        svg.querySelector('[data-nl="source"]').setAttribute("fill", rgba(s.core, 1));
        var pool = svg.querySelector('[data-nl="pool"]');
        if (pool) pool.setAttribute("fill", s.rgba(0.1 + 0.22 * s.bright));
        svg.querySelector('[data-nl="stars"]').setAttribute("opacity", String(s.starOpacity));
        svg.querySelector('[data-nl="skyglow"]').setAttribute("fill", s.rgba(0.32));
        svg.querySelector('[data-nl="skyglow"]').setAttribute("opacity", String(s.skyglow * 0.8));
        var signs = svg.querySelector('[data-nl="signs"]');
        if (signs) {
          var boxes = signs.querySelectorAll("rect");
          for (var i = 0; i < boxes.length; i++) {
            boxes[i].setAttribute("fill", s.rgba(0.45 + 0.4 * s.bright));
          }
        }
        applyDiffusePaint(svg, s);
      },
    },
  ];

  // Street first — that's the lesson most people came for.
  scenes.sort(function (a, b) {
    var order = { street: 1, car: 2, room: 3, phone: 4, tv: 5, clutter: 6 };
    return (order[a.id] || 9) - (order[b.id] || 9);
  });

  var MARKS = [
    {
      id: "stars",
      label: "Stars",
      tip: "Night sky you can still see. Skyglow washes these out.",
    },
    {
      id: "sky",
      label: "Skyglow",
      tip: "Lumens that missed the ground and scattered into the air. This is light pollution.",
    },
    {
      id: "source",
      label: "Fixture",
      tip: "Lumens — total light this fixture emits, in every direction.",
    },
    {
      id: "pool",
      label: "Ground pool",
      tip: "Lux — light that actually landed. This is the only light that helps you see.",
    },
    {
      id: "beam",
      label: "Glare",
      tip: "Direct light is a spear (high candela). A cover spreads it — same lumens, less punch.",
    },
    {
      id: "spill",
      label: "Light spill",
      tip: "Indoor light leaking outside. A shade keeps the night where it belongs.",
    },
  ];

  var KEY = [
    { id: "lumens", term: "Lumens", mean: "How much light the fixture emits — not how well you can see." },
    { id: "lux", term: "Lux", mean: "Light that actually lands (the pool on the ground)." },
    { id: "kelvin", term: "Kelvin", mean: "Color. Above 3000K = more blue = more skyglow." },
    { id: "shield", term: "Shielding", mean: "Same lumens, different aim. Down = useful. Up = waste." },
    { id: "diffuse", term: "Diffusion", mean: "A cover spreads the same lumens. Direct = a harsh spear. Diffuse = a soft pool." },
    { id: "skyglow", term: "Skyglow", mean: "Wasted light that steals the stars." },
  ];

  // ── Mount ────────────────────────────────────────────────────────────────

  function mount(host) {
    if (!host || host.getAttribute("data-nl-mounted")) return;
    host.setAttribute("data-nl-mounted", "1");

    var compact = host.getAttribute("data-nl-compact") === "1";
    var lockSceneId = host.getAttribute("data-nl-scene") || "";
    var lockFixture = host.getAttribute("data-nl-fixture") || "";
    var startLumens = host.getAttribute("data-nl-lumens");
    var startKelvin = host.getAttribute("data-nl-kelvin");
    var startRed = host.getAttribute("data-nl-red") === "1";
    var startDiffuse = host.getAttribute("data-nl-diffuse");
    var controlSet = (host.getAttribute("data-nl-controls") || "lumens,kelvin,fixture,red,diffuse").split(",");

    host.innerHTML = "";
    var root = document.createElement("div");
    root.className = compact ? "nl-lab nl-lab--compact" : "nl-lab";

    var tabs = document.createElement("div");
    tabs.className = "nl-lab__tabs";
    tabs.setAttribute("role", "tablist");

    var teach = document.createElement("p");
    teach.className = "nl-lab__teach";

    var stage = document.createElement("div");
    stage.className = "nl-lab__stage";

    var sceneWrap = document.createElement("div");
    sceneWrap.className = "nl-lab__scene";
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + VIEW_W + " " + VIEW_H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Lighting scene preview");
    var frame = document.createElement("div");
    frame.className = "nl-lab__frame";
    frame.appendChild(svg);
    sceneWrap.appendChild(frame);

    var marksLayer = document.createElement("div");
    marksLayer.className = "nl-lab__marks";
    marksLayer.setAttribute("aria-label", "What you are looking at");
    var markLive = {};
    MARKS.forEach(function (m) {
      var wrap = document.createElement("div");
      wrap.className = "nl-lab__mark nl-lab__mark--" + m.id;
      wrap.setAttribute("data-nl-mark", m.id);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nl-lab__mark-btn";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-describedby", "nl-lab-tip-" + m.id);
      var live = document.createElement("span");
      live.className = "nl-lab__mark-label";
      live.textContent = m.label;
      btn.innerHTML = '<span class="nl-lab__mark-i" aria-hidden="true">i</span> ';
      btn.appendChild(live);
      var tip = document.createElement("span");
      tip.className = "nl-lab__tip";
      tip.id = "nl-lab-tip-" + m.id;
      tip.setAttribute("role", "tooltip");
      tip.textContent = m.tip;
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var open = !wrap.classList.contains("is-open");
        marksLayer.querySelectorAll(".nl-lab__mark.is-open").forEach(function (n) {
          n.classList.remove("is-open");
          var b = n.querySelector(".nl-lab__mark-btn");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        wrap.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
      wrap.append(btn, tip);
      marksLayer.appendChild(wrap);
      markLive[m.id] = live;
    });
    sceneWrap.appendChild(marksLayer);
    sceneWrap.addEventListener("click", function () {
      marksLayer.querySelectorAll(".nl-lab__mark.is-open").forEach(function (n) {
        n.classList.remove("is-open");
        var b = n.querySelector(".nl-lab__mark-btn");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    });

    var panel = document.createElement("div");
    panel.className = "nl-lab__panel";

    var readout = document.createElement("div");
    readout.className = "nl-lab__readout";
    var chip = document.createElement("span");
    chip.className = "nl-lab__chip";
    chip.setAttribute("aria-hidden", "true");
    var lumValue = document.createElement("span");
    lumValue.className = "nl-lab__value";
    var kelValue = document.createElement("span");
    kelValue.className = "nl-lab__value";
    readout.append(chip, lumValue, kelValue);

    function infoBtn(tipText) {
      var wrap = document.createElement("span");
      wrap.className = "nl-lab__info";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nl-lab__info-btn";
      btn.setAttribute("aria-label", tipText);
      btn.textContent = "i";
      var tip = document.createElement("span");
      tip.className = "nl-lab__info-tip";
      tip.setAttribute("role", "tooltip");
      tip.textContent = tipText;
      wrap.append(btn, tip);
      return wrap;
    }

    function makeField(labelText, tipText, min, max, value) {
      var field = document.createElement("div");
      field.className = "nl-lab__field";
      var label = document.createElement("label");
      label.className = "nl-lab__label";
      var name = document.createElement("span");
      name.className = "nl-lab__label-name";
      name.append(document.createTextNode(labelText + " "), infoBtn(tipText));
      var val = document.createElement("b");
      val.setAttribute("data-v", "");
      label.append(name, val);
      var range = document.createElement("input");
      range.type = "range";
      range.className = "nl-lab__range";
      range.min = String(min);
      range.max = String(max);
      range.step = "1";
      range.value = String(value);
      field.append(label, range);
      return { field: field, range: range, valueNode: val };
    }

    var lumField = makeField(
      "Lumens",
      "Total light the fixture emits. More lumens does not mean you can see better — it often means more glare.",
      0,
      0,
      0,
    );
    var kelField = makeField(
      "Kelvin",
      "Color temperature. Warm amber is under 3000K. Cool blue-white above 4000K scatters farther and drives skyglow.",
      0,
      0,
      0,
    );

    var fixtureRow = document.createElement("div");
    fixtureRow.className = "nl-lab__segrow";
    var fixtureLabel = document.createElement("div");
    fixtureLabel.className = "nl-lab__seglabel";
    var fixtureName = document.createElement("span");
    fixtureName.className = "nl-lab__label-name";
    fixtureName.append(
      document.createTextNode("Fixture / shielding "),
      infoBtn("Same lumens, different aim. A shield points light at the ground instead of the sky."),
    );
    fixtureLabel.appendChild(fixtureName);
    var fixtureSeg = document.createElement("div");
    fixtureSeg.className = "nl-lab__seg";
    fixtureRow.append(fixtureLabel, fixtureSeg);

    var diffField = makeField(
      "Cover / diffusion",
      "Bare bulb = a harsh spear of light. A frosted cover spreads the same lumens into a soft pool — less glare, same seeing.",
      0,
      100,
      0,
    );

    var colorRow = document.createElement("div");
    colorRow.className = "nl-lab__segrow";
    var colorLabel = document.createElement("div");
    colorLabel.className = "nl-lab__seglabel";
    var colorName = document.createElement("span");
    colorName.className = "nl-lab__label-name";
    colorName.append(
      document.createTextNode("White or red "),
      infoBtn("White uses Kelvin. Red is deep red — no blue, so night vision stays."),
    );
    colorLabel.appendChild(colorName);
    var colorSeg = document.createElement("div");
    colorSeg.className = "nl-lab__seg nl-lab__seg--pair";
    colorSeg.setAttribute("role", "group");
    colorSeg.setAttribute("aria-label", "White or red");

    function makeColorBtn(id, label, extraClass) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "nl-lab__segbtn" + (extraClass ? " " + extraClass : "");
      b.setAttribute("aria-pressed", "false");
      var dot = document.createElement("span");
      dot.className = "nl-lab__dot" + (id === "red" ? "" : " nl-lab__dot--white");
      b.append(dot, document.createTextNode(label));
      b.addEventListener("click", function () {
        redMode = id === "red";
        syncColorBtns();
        render();
      });
      return b;
    }
    var whiteBtn = makeColorBtn("white", "White");
    var redBtn = makeColorBtn("red", "Red", "nl-lab__segbtn--red");
    colorSeg.append(whiteBtn, redBtn);
    colorRow.append(colorLabel, colorSeg);

    function syncColorBtns() {
      whiteBtn.setAttribute("aria-pressed", redMode ? "false" : "true");
      redBtn.setAttribute("aria-pressed", redMode ? "true" : "false");
    }

    var meter = document.createElement("div");
    meter.className = "nl-lab__meter";
    meter.innerHTML =
      '<div class="nl-lab__meter-label"><span>Skyglow</span><span data-v>0%</span></div>' +
      '<div class="nl-lab__meter-bar"><span class="nl-lab__meter-fill"></span></div>';
    var meterValue = meter.querySelector("[data-v]");
    var meterFill = meter.querySelector(".nl-lab__meter-fill");

    var presets = document.createElement("div");
    presets.className = "nl-lab__presets";

    var verdict = document.createElement("div");
    verdict.className = "nl-lab__verdict";
    verdict.innerHTML =
      '<div class="nl-lab__verdict-label"></div><div class="nl-lab__verdict-note"></div>';
    var verdictLabel = verdict.querySelector(".nl-lab__verdict-label");
    var verdictNote = verdict.querySelector(".nl-lab__verdict-note");

    var key = document.createElement("div");
    key.className = "nl-lab__key";
    key.setAttribute("aria-label", "Lighting terms");
    var keyTitle = document.createElement("p");
    keyTitle.className = "nl-lab__key-title";
    keyTitle.textContent = "Lumens, lux, Kelvin";
    var keyGrid = document.createElement("dl");
    keyGrid.className = "nl-lab__key-grid";
    KEY.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "nl-lab__key-item nl-lab__key-item--" + item.id;
      var dt = document.createElement("dt");
      dt.textContent = item.term;
      var dd = document.createElement("dd");
      dd.textContent = item.mean;
      row.append(dt, dd);
      keyGrid.appendChild(row);
    });
    key.append(keyTitle, keyGrid);

    panel.append(readout, lumField.field, kelField.field, fixtureRow, diffField.field, colorRow, meter, presets, verdict);
    stage.append(sceneWrap, panel);
    root.append(tabs, teach, stage, key);
    host.appendChild(root);

    var activeIndex = 0;
    if (lockSceneId) {
      for (var si = 0; si < scenes.length; si++) {
        if (scenes[si].id === lockSceneId) {
          activeIndex = si;
          break;
        }
      }
    }
    var fixtureId = scenes[0].defaultFixture;
    var redMode = false;
    var svgKey = "";

    function currentScene() {
      return scenes[activeIndex];
    }

    function renderSceneTabs() {
      tabs.innerHTML = "";
      scenes.forEach(function (scene, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "nl-lab__tab";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
        b.textContent = scene.label;
        b.addEventListener("click", function () {
          if (activeIndex === i) return;
          activeIndex = i;
          applyScene();
        });
        tabs.appendChild(b);
      });
    }

    function renderFixtures() {
      fixtureSeg.innerHTML = "";
      var scene = currentScene();
      scene.fixtures.forEach(function (f) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "nl-lab__segbtn";
        b.setAttribute("aria-pressed", f.id === fixtureId ? "true" : "false");
        b.textContent = f.label;
        b.addEventListener("click", function () {
          fixtureId = f.id;
          sceneWrap.setAttribute("data-nl-fixture", f.id);
          renderFixtures();
          render();
        });
        fixtureSeg.appendChild(b);
      });
      if (compact) {
        colorRow.hidden = controlSet.indexOf("red") < 0;
      } else {
        colorRow.hidden = !scene.redSupport;
      }
    }

    function renderPresets() {
      presets.innerHTML = "";
      currentScene().presets.forEach(function (p) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "nl-lab__preset";
        b.textContent = p.label;
        b.addEventListener("click", function () {
          lumField.range.value = String(p.lumens);
          kelField.range.value = String(p.kelvin);
          diffField.range.value = String(p.diffuse != null ? p.diffuse : 0);
          redMode = !!p.red;
          syncColorBtns();
          render();
        });
        presets.appendChild(b);
      });
    }

    function applyScene() {
      var scene = currentScene();
      lumField.range.min = String(scene.lumens.min);
      lumField.range.max = String(scene.lumens.max);
      lumField.range.value = startLumens || String(scene.lumens.value);
      kelField.range.min = String(scene.kelvin.min);
      kelField.range.max = String(scene.kelvin.max);
      kelField.range.value = startKelvin || String(scene.kelvin.value);
      fixtureId = lockFixture || scene.defaultFixture;
      sceneWrap.setAttribute("data-nl-fixture", fixtureId);
      redMode = startRed;
      syncColorBtns();
      meter.querySelector(".nl-lab__meter-label span").textContent = scene.meterLabel;
      teach.textContent = scene.teach;
      sceneWrap.setAttribute("data-nl-scene", scene.id);
      if (startDiffuse != null && startDiffuse !== "") {
        diffField.range.value = startDiffuse;
      } else {
        diffField.range.value = "0";
      }
      if (compact) {
        tabs.hidden = true;
        key.hidden = true;
        presets.hidden = true;
        lumField.field.hidden = controlSet.indexOf("lumens") < 0;
        kelField.field.hidden = controlSet.indexOf("kelvin") < 0;
        fixtureRow.hidden = controlSet.indexOf("fixture") < 0;
        diffField.field.hidden = controlSet.indexOf("diffuse") < 0;
        colorRow.hidden = controlSet.indexOf("red") < 0;
      }
      renderSceneTabs();
      renderFixtures();
      renderPresets();
      render();
    }

    function render() {
      var scene = currentScene();
      var lumens = Number(lumField.range.value);
      var kelvin = Number(kelField.range.value);
      var diffuse = Number(diffField.range.value) / 100;
      var s = makeState(scene, lumens, kelvin, fixtureId, redMode, diffuse);

      // Rebuild only when the scene or fixture changes (not on slider ticks).
      var key = activeIndex + ":" + fixtureId;
      if (key !== svgKey) {
        svg.innerHTML = scene.staticHtml + scene.fixtureHtml(fixtureId);
        svgKey = key;
      }
      scene.update(svg, s);

      lumField.valueNode.textContent = fmtLumens(lumens);
      kelField.valueNode.textContent = redMode ? "Night-vision red" : fmtKelvin(kelvin);
      diffField.valueNode.textContent = fmtDiffuse(Number(diffField.range.value));
      kelField.range.disabled = redMode;
      lumField.range.style.accentColor = s.hex;
      kelField.range.style.accentColor = redMode ? rgbHex(RED) : s.hex;

      chip.style.background = s.hex;
      lumValue.innerHTML = "<strong>" + fmtLumens(lumens) + "</strong>";
      kelValue.innerHTML = "<strong>" + (redMode ? "Red light" : fmtKelvin(kelvin)) + "</strong>";

      meterFill.style.width = (s.skyglow * 100).toFixed(0) + "%";
      meterValue.textContent = (s.skyglow * 100).toFixed(0) + "%";

      var v = computeVerdict(s);
      verdict.setAttribute("data-tone", v.tone);
      verdictLabel.textContent = v.label;
      verdictNote.textContent = v.note;

      var skyPct = (s.skyglow * 100).toFixed(0) + "%";
      markLive.stars.textContent = s.starOpacity < 0.35 ? "Stars gone" : "Stars";
      markLive.sky.textContent = "Skyglow " + skyPct;
      markLive.source.textContent = fmtLumens(lumens);
      switch (scene.id) {
        case "room":
          markLive.pool.textContent = "Floor pool";
          markLive.spill.textContent = "Light spill";
          break;
        case "phone":
          markLive.pool.textContent = "Face wash";
          markLive.spill.textContent = "In your eyes";
          break;
        case "tv":
          markLive.pool.textContent = "Couch wash";
          markLive.spill.textContent = "Room flood";
          break;
        case "clutter":
          markLive.pool.textContent = "Street";
          markLive.spill.textContent = "Sign fight";
          break;
        default:
          markLive.pool.textContent = "Ground pool";
          markLive.spill.textContent = "Light spill";
      }
      markLive.beam.textContent =
        s.diffuse >= 0.55 ? "Soft wash" : s.t > 0.6 ? "Harsh glare" : "Direct beam";
    }

    lumField.range.addEventListener("input", render);
    kelField.range.addEventListener("input", render);
    diffField.range.addEventListener("input", render);

    applyScene();

    return {
      destroy: function () {
        root.remove();
        host.removeAttribute("data-nl-mounted");
      },
    };
  }

  global.__AS_LUMEN_LAB = { mount: mount };

  // Self-mount on load (this file is loaded with `defer`, so the DOM is ready).
  function autoMount() {
    var hosts = document.querySelectorAll("[data-as-lumen-lab]");
    for (var i = 0; i < hosts.length; i++) {
      mount(hosts[i]);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
})(typeof window !== "undefined" ? window : globalThis);
