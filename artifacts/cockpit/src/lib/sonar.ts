/* ================================================================== *
 * Sonar ping — a subtle, thematic sound effect for incoming alert cards.
 *
 * Implemented with the Web Audio API (no audio files) so it's low-latency
 * and fires in sync with the card's slide-in animation. A single shared
 * AudioContext is reused and resumed lazily on first user gesture, per
 * browser autoplay policy.
 * ================================================================== */

const LS_KEY = "greggos.sonar.enabled.v1";

let ctx: AudioContext | null = null;
let unlockBound = false;

/** Whether the sonar ping is enabled (default: on). */
export function isSonarEnabled(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setSonarEnabled(on: boolean): void {
  try {
    localStorage.setItem(LS_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (on) primeAudio();
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
 * Resume the AudioContext on the next user gesture so the first ping isn't
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

/**
 * Play a short sonar ping. `tone` shifts the pitch slightly so alert pings
 * read a touch more urgent than info pings.
 */
export function playSonarPing(tone: "info" | "alert" = "info"): void {
  if (!isSonarEnabled()) return;
  // Respect reduced-motion users who likely also prefer reduced audio.
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  } catch {
    /* ignore */
  }

  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }

  const now = c.currentTime;
  // Two-tone sonar "pulse": a clean sine that pings then a soft echo.
  const baseFreq = tone === "alert" ? 920 : 680;

  const master = c.createGain();
  master.gain.value = 0.0001;
  master.connect(c.destination);

  // gentle band-ish shaping via a lowpass so it sounds underwater/sonar-like
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2200;
  filter.Q.value = 6;
  filter.connect(master);

  const ping = (freq: number, start: number, peak: number, dur: number) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    // slight downward glide gives the classic sonar "pew"
    osc.frequency.exponentialRampToValueAtTime(freq * 0.78, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(filter);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };

  // main ping
  ping(baseFreq, now, 0.16, 0.22);
  // soft echo (quieter, slightly later & higher) for depth
  ping(baseFreq * 1.5, now + 0.14, 0.05, 0.3);

  // master envelope to avoid clicks
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(1, now + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
}
