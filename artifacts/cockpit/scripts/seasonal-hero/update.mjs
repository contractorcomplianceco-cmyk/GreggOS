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

// GREGG palette endpoints. Both ends stay inside the brand's black base +
// gold/sunset family; warmth just shifts from deep amber (cool water) to a
// brighter sunset gold (warm water). The base is always near-black so the
// white hero text and gold eyebrow stay legible year-round.
// warmth=0 -> COOL deep amber, warmth=1 -> WARM bright sunset gold.
const COOL = {
  base1: "#160f05",
  base2: "#0e0904",
  base3: "#060402",
  glow: "#b8601c", // deep amber glow on the water
  wave1: "#d6a24a", // aged gold crest
  wave2: "#b8842c",
  wave3: "#8a641b",
  eyebrow: "#d4b24e",
};
const WARM = {
  base1: "#1e1407", // near-black anchors the base so text stays legible
  base2: "#140d05",
  base3: "#080502",
  glow: "#ef6a1f", // bright sunset-orange glow on the water
  wave1: "#f5bd63", // bright gold crest
  wave2: "#e09a34", // sunset gold
  wave3: "#b5761f", // deep sunset amber
  eyebrow: "#e6c25a",
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
  const season =
    warmth < 0.34 ? "gregg-amber" : warmth < 0.67 ? "gregg-gold" : "gregg-sunset";

  const css = `/* ============================================================
   AUTO-GENERATED — do not edit by hand.
   Written by scripts/seasonal-hero/update.mjs (weekday 07:00 ET cron).
   Imported after index.css so these override the default GREGG hero.
   Palette always stays inside the GREGG black + gold/sunset family.

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
