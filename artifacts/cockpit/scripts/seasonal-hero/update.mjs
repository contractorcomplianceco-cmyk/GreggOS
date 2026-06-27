#!/usr/bin/env node
/**
 * Seasonal water-hero palette updater.
 *
 * Pulls live sea-surface temperature for the Tampa Bay coast from the
 * Open-Meteo Marine API (public, no key, CORS-friendly) and writes
 * src/seasonal-hero.css with a palette interpolated between a COOL teal set
 * (cold water) and a WARM coral set (warm water). Falls back to a month-based
 * warmth estimate if the API is unreachable, so the hero never goes stale.
 *
 * Run by the weekday 07:00 ET cron, which then commits + pushes the result.
 *
 * Usage: node scripts/seasonal-hero/update.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../../src/seasonal-hero.css");

// Tampa Bay / St. Petersburg coast
const LAT = 27.76;
const LON = -82.63;
const MARINE_URL = `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&current=sea_surface_temperature&timezone=America%2FNew_York`;

// SST range (°C) used to normalize "warmth" 0..1 for this coast.
const SST_COLD = 16; // winter low
const SST_WARM = 32; // summer high

// Palette endpoints. warmth=0 -> COOL teal, warmth=1 -> WARM coral.
const COOL = {
  base1: "#0e5566",
  base2: "#0b4350",
  base3: "#062029",
  glow: "#1fb6c4",
  wave1: "#7df0f0",
  wave2: "#3fe0e0",
  wave3: "#1fb6c4",
  eyebrow: "#5fe7e7",
};
const WARM = {
  base1: "#15596b", // teal still anchors the deep base so text stays legible
  base2: "#173f4a",
  base3: "#0a232b",
  glow: "#ff8a5c", // sunset coral glow on the water
  wave1: "#ffd2a8", // warm sand-foam crest
  wave2: "#ff9e6d", // coral
  wave3: "#f4623a", // deep coral
  eyebrow: "#ffb38a",
};

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mix(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
}

function monthWarmth() {
  // Northern-hemisphere seasonal curve, peak in Aug (month 7), trough in Feb (1)
  const m = new Date().getMonth(); // 0..11
  return (1 - Math.cos(((m - 1) / 12) * 2 * Math.PI)) / 2; // 0..1
}

async function getWarmth() {
  try {
    const res = await fetch(MARINE_URL, { signal: AbortSignal.timeout(15000) });
    const json = await res.json();
    const sst = json?.current?.sea_surface_temperature;
    if (typeof sst === "number" && Number.isFinite(sst)) {
      const w = (sst - SST_COLD) / (SST_WARM - SST_COLD);
      return { warmth: Math.max(0, Math.min(1, w)), sst, source: "open-meteo SST" };
    }
  } catch (e) {
    // fall through to month-based estimate
  }
  return { warmth: monthWarmth(), sst: null, source: "month estimate (API unreachable)" };
}

async function main() {
  const { warmth, sst, source } = await getWarmth();
  const p = {
    base1: mix(COOL.base1, WARM.base1, warmth),
    base2: mix(COOL.base2, WARM.base2, warmth),
    base3: mix(COOL.base3, WARM.base3, warmth),
    glow: mix(COOL.glow, WARM.glow, warmth),
    wave1: mix(COOL.wave1, WARM.wave1, warmth),
    wave2: mix(COOL.wave2, WARM.wave2, warmth),
    wave3: mix(COOL.wave3, WARM.wave3, warmth),
    eyebrow: mix(COOL.eyebrow, WARM.eyebrow, warmth),
  };
  const season = warmth < 0.34 ? "cool" : warmth < 0.67 ? "temperate" : "warm";

  const css = `/* ============================================================
   AUTO-GENERATED — do not edit by hand.
   Written by scripts/seasonal-hero/update.mjs (weekday 07:00 ET cron).
   Imported after index.css so these override the default cool-teal hero.

   Generated: ${new Date().toISOString()}
   Source:    ${source}${sst != null ? ` (SST ${sst.toFixed(1)}°C)` : ""}
   Warmth:    ${warmth.toFixed(3)}  ->  season "${season}"
   ============================================================ */
:root {
  --hero-base-1: ${p.base1};
  --hero-base-2: ${p.base2};
  --hero-base-3: ${p.base3};
  --hero-glow:   ${p.glow};
  --hero-wave-1: ${p.wave1};
  --hero-wave-2: ${p.wave2};
  --hero-wave-3: ${p.wave3};
  --hero-eyebrow: ${p.eyebrow};
  --hero-season: "${season}";
}
`;

  writeFileSync(OUT, css, "utf8");
  console.log(`[seasonal-hero] ${source}${sst != null ? ` SST=${sst}°C` : ""} warmth=${warmth.toFixed(3)} season=${season}`);
  console.log(`[seasonal-hero] wrote ${OUT}`);
}

main().catch((e) => {
  console.error("[seasonal-hero] failed:", e);
  process.exit(1);
});
