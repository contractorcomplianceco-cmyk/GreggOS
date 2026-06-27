import { Trophy } from "lucide-react";
import { CoastalHeaderFX } from "@/components/layout/CoastalHeaderFX";
import { Mahi } from "@/components/icons/CoastalIcons";

export type HeroStat = {
  label: string;
  value: number | string;
  /** numeric value used for threshold checks (defaults to Number(value)) */
  numeric?: number;
  /** when numeric >= warnAt the chip turns coral and its fish swims "agitated" */
  warnAt?: number;
  /** force the alert (coral) tone regardless of threshold */
  tone?: "default" | "alert";
};

// wave shape as a CSS mask so the fill color can come from a CSS variable
const WAVE_MASK =
  "url(\"data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'><path d='M0 40 C 40 10, 80 10, 120 40 S 200 70, 240 40 V80 H0 Z' fill='black'/></svg>",
  ) +
  "\")";

function waveStyle(
  cssVar: string,
  opacity: number,
  height: string,
  size: string,
): React.CSSProperties {
  return {
    bottom: 0,
    height,
    backgroundColor: `var(${cssVar})`,
    opacity,
    WebkitMaskImage: WAVE_MASK,
    maskImage: WAVE_MASK,
    WebkitMaskRepeat: "repeat-x",
    maskRepeat: "repeat-x",
    WebkitMaskSize: size,
    maskSize: size,
    WebkitMaskPosition: "bottom",
    maskPosition: "bottom",
  };
}

/**
 * Shared animated coastal hero used across high-frequency command views
 * (Today's Catch, The Logbook, The Net).
 *
 * Visual layers (back to front):
 *   - seasonal deep-sea gradient base  (CSS vars --hero-base-1..3)
 *   - sunlit waterline glow            (--hero-glow)
 *   - 3 parallax wave bands            (--hero-wave-1..3)  ← masked, color from CSS var
 *   - caustic light shimmer
 *   - swimming hero fish + schools + bubbles
 *   - readability scrim + eyebrow + heading + gamified KPI chips
 *
 * The wave/base colors come entirely from CSS variables that are refreshed
 * weekday mornings from live sea-surface temperature, so the hero shifts from
 * cool teal (cold season) to warm coral (warm season) automatically.
 *
 * All motion is transform/opacity only (GPU-composited) and freezes under
 * prefers-reduced-motion.
 */
export function DashboardHero({
  eyebrow = "Today's Catch",
  greeting,
  subtitle,
  stats = [],
  /** daily performance target: e.g. lines tended >= goal -> trophy shows */
  goalLabel,
  goalMet = false,
}: {
  eyebrow?: string;
  greeting: string;
  subtitle?: string;
  stats?: HeroStat[];
  goalLabel?: string;
  goalMet?: boolean;
}) {
  const isAlert = (s: HeroStat) => {
    if (s.tone === "alert") return true;
    const n = s.numeric ?? Number(s.value);
    return s.warnAt != null && Number.isFinite(n) && n >= s.warnAt;
  };

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-[#15a3b0]/30">
      {/* seasonal deep-sea base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--hero-base-1), var(--hero-base-2), var(--hero-base-3))",
        }}
      />
      {/* sunlit-water glow along the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--hero-glow) 45%, transparent), color-mix(in srgb, var(--hero-glow) 18%, transparent), transparent)",
        }}
      />

      {/* parallax animated wave bands (color from seasonal CSS vars) */}
      <div className="hero-wave hero-wave-3" style={waveStyle("--hero-wave-3", 0.55, "85%", "260px 120px")} />
      <div className="hero-wave hero-wave-2" style={waveStyle("--hero-wave-2", 0.5, "68%", "340px 110px")} />
      <div className="hero-wave hero-wave-1" style={waveStyle("--hero-wave-1", 0.6, "50%", "200px 90px")} />

      {/* caustic light shimmer */}
      <div
        className="hero-caustics pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 70% -10%, rgba(190,238,245,0.5), transparent 55%)",
        }}
      />

      {/* big swimming hero fish — larger + more visible so the theme reads clearly */}
      <img
        src="/img-fish-mark.png"
        alt=""
        aria-hidden="true"
        className="hero-fish pointer-events-none absolute top-[28%] h-24 w-auto opacity-70 drop-shadow-lg"
      />
      <img
        src="/img-fish-mark.png"
        alt=""
        aria-hidden="true"
        className="hero-fish-2 pointer-events-none absolute top-[60%] h-16 w-auto opacity-55"
      />

      {/* a sportfishing boat drifting + bobbing along the waterline */}
      <div className="hero-boat pointer-events-none absolute bottom-[26%] z-[1]" aria-hidden="true">
        <HeroBoat className="h-12 w-auto drop-shadow-lg" />
      </div>

      {/* schools + rising bubbles */}
      <CoastalHeaderFX variant="dark" />

      {/* readability scrim behind the text column; thin bottom shade for chips */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#062029]/85 via-[#062029]/35 to-transparent md:to-[#062029]/0" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#062029]/55 to-transparent" />

      {/* content — sizes bumped up for easier reading */}
      <div className="relative px-6 py-8 md:px-9 md:py-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <p
            className="text-sm font-bold uppercase tracking-[0.22em]"
            style={{ color: "var(--hero-eyebrow)" }}
          >
            {eyebrow}
          </p>
          {goalLabel && goalMet && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/25 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-amber-200 ring-1 ring-amber-300/40 trophy-pop">
              <Trophy className="h-4 w-4" />
              {goalLabel}
            </span>
          )}
        </div>
        <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
          {greeting}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-base md:text-lg text-cyan-50/95 leading-relaxed drop-shadow">
            {subtitle}
          </p>
        )}

        {stats.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {stats.map((s) => {
              const alert = isAlert(s);
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 backdrop-blur-sm ring-1 transition-colors ${
                    alert
                      ? "bg-[#f4623a]/25 ring-[#f4623a]/50"
                      : "bg-white/10 ring-white/25"
                  }`}
                >
                  {/* gamified fish motif: calm teal -> agitated coral, faster wiggle when alert */}
                  <Mahi
                    className={`h-6 w-6 shrink-0 ${
                      alert ? "text-[#ff7a4d] hero-chip-fish-alert" : "text-[#5fe7e7] hero-chip-fish"
                    }`}
                  />
                  <span
                    className={`font-display text-2xl font-bold tabular-nums ${
                      alert ? "text-[#ffd9cb]" : "text-white"
                    }`}
                  >
                    {s.value}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-50/90 leading-tight">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/** Sportfishing boat silhouette riding the hero waterline. */
function HeroBoat({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* hull */}
      <path
        d="M8 44 H104 L94 60 a6 6 0 0 1 -5 3 H22 a6 6 0 0 1 -5 -3 Z"
        fill="#0b3a47"
        stroke="#2a6b78"
        strokeWidth="1.5"
      />
      {/* white sheer stripe */}
      <path d="M10 45 H102" stroke="#e8f6f8" strokeWidth="2.5" strokeLinecap="round" />
      {/* cabin / console */}
      <path d="M40 44 V30 a4 4 0 0 1 4 -4 H62 a4 4 0 0 1 4 4 V44 Z" fill="#15a3b0" />
      <rect x="45" y="31" width="16" height="8" rx="1.5" fill="#bdeef5" />
      {/* T-top */}
      <path d="M38 26 H70" stroke="#0b3a47" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 26 V22 M64 26 V22" stroke="#0b3a47" strokeWidth="2" strokeLinecap="round" />
      {/* outrigger rod with a line */}
      <path d="M66 30 L96 8" stroke="#f4623a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="96" cy="8" r="2" fill="#ffd2a8" />
      {/* bow rail */}
      <path d="M12 44 C 16 38, 24 36, 30 36" stroke="#2a6b78" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default DashboardHero;
