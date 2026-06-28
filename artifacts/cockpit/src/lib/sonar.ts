/* ================================================================== *
 * Sonar audio system — thematic, context-aware sound for alert cards.
 *
 * Implemented with the Web Audio API (no audio files) so it's low-latency
 * and fires in sync with the card's slide-in animation. A single shared
 * AudioContext is reused and resumed lazily on first user gesture, per
 * browser autoplay policy.
 *
 * Two distinct cues:
 *   • Sonar ping  — standard info/alert signals (a single "pew" + echo)
 *   • Harmonic chime — celebratory signals like a Clean Board (an ascending
 *     major-triad arpeggio that resolves up, so good news sounds good)
 *
 * A master volume (0–1) scales every cue and is exposed in settings.
 * ================================================================== */

const LS_ENABLED = "greggos.sonar.enabled.v1";
const LS_VOLUME = "greggos.sonar.volume.v1";

export type SonarTone = "info" | "alert" | "celebrate";

let ctx: AudioContext | null = null;
let unlockBound = false;

/** Whether sonar audio is enabled (default: on). */
export function isSonarEnabled(): boolean {
  try {
    const raw = localStorage.getItem(LS_ENABLED);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setSonarEnabled(on: boolean): void {
  try {
    localStorage.setItem(LS_ENABLED, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (on) primeAudio();
}

/** Master volume 0–1 (default 0.7). */
export function getSonarVolume(): number {
  try {
    const raw = localStorage.getItem(LS_VOLUME);
    if (raw === null) return 0.7;
    const v = parseFloat(raw);
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.7;
  } catch {
    return 0.7;
  }
}

export function setSonarVolume(v: number): void {
  const clamped = Math.min(1, Math.max(0, v));
  try {
    localStorage.setItem(LS_VOLUME, String(clamped));
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

/**
 * Resume the AudioContext on the next user gesture so the first cue isn't
 * blocked by the browser's autoplay policy. Safe to call repeatedly.
 */
export function primeAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    const cc = getCtx();
    if (cc && cc.state === "suspended") cc.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}

/** Shared guards: enabled, not reduced-motion, context available. */
function audioGate(): { c: AudioContext; vol: number } | null {
  if (!isSonarEnabled()) return null;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return null;
  } catch {
    /* ignore */
  }
  const vol = getSonarVolume();
  if (vol <= 0) return null;
  const c = getCtx();
  if (!c) return null;
  if (c.state === "suspended") c.resume().catch(() => {});
  return { c, vol };
}

/** A single decaying sine "blip" with a pitch glide, routed to a node. */
function blip(
  c: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  glideTo: number,
  start: number,
  peak: number,
  dur: number,
): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo !== freq) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.04);
}

/**
 * Play an audio cue for an alert card.
 *  - "info" / "alert": the classic sonar ping (alert is pitched higher/urgent)
 *  - "celebrate": a harmonic ascending chime for good news (e.g. Clean Board)
 */
export function playSonarPing(tone: SonarTone = "info"): void {
  if (tone === "celebrate") {
    playCelebrationChime();
    return;
  }

  const gate = audioGate();
  if (!gate) return;
  const { c, vol } = gate;
  const now = c.currentTime;
  const baseFreq = tone === "alert" ? 920 : 680;

  const master = c.createGain();
  master.gain.value = 0.0001;
  master.connect(c.destination);

  // underwater/sonar shaping
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2200;
  filter.Q.value = 6;
  filter.connect(master);

  blip(c, filter, "sine", baseFreq, baseFreq * 0.78, now, 0.16, 0.22);
  blip(c, filter, "sine", baseFreq * 1.5, baseFreq * 1.5 * 0.78, now + 0.14, 0.05, 0.3);

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(vol, now + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
}

/**
 * Celebratory harmonic chime — a bright ascending major arpeggio
 * (C–E–G–C) with a sparkle on top, so wins like a Clean Board feel rewarding
 * and clearly distinct from the standard alert ping.
 */
export function playCelebrationChime(): void {
  const gate = audioGate();
  if (!gate) return;
  const { c, vol } = gate;
  const now = c.currentTime;

  const master = c.createGain();
  master.gain.value = 0.0001;
  master.connect(c.destination);

  // gentle warmth + a touch of shimmer (higher cutoff than the sonar ping)
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 5200;
  filter.Q.value = 0.7;
  filter.connect(master);

  // C5, E5, G5, C6 — a major triad resolving up an octave
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const step = 0.11;
  notes.forEach((f, i) => {
    const t = now + i * step;
    // soft triangle for a chime-like body
    blip(c, filter, "triangle", f, f, t, 0.16, 0.55);
    // a quiet sine harmonic an octave up adds "sparkle"
    blip(c, filter, "sine", f * 2, f * 2, t, 0.04, 0.4);
  });

  const tail = now + notes.length * step + 0.6;
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(vol, now + 0.02);
  master.gain.setValueAtTime(vol, now + notes.length * step);
  master.gain.exponentialRampToValueAtTime(0.0001, tail);
}
