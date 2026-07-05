import type { ReactNode } from "react";
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
  /** "full" = main dashboard; "compact" = section page headers */
  size = "full",
  /** optional right-aligned action (button/dialog) for section headers */
  action,
  /** optional real photo backdrop shown behind the animated water/fish/boat */
  photo,
}: {
  eyebrow?: string;
  greeting: string;
  subtitle?: string;
  stats?: HeroStat[];
  goalLabel?: string;
  goalMet?: boolean;
  size?: "full" | "compact";
  action?: ReactNode;
  photo?: string;
}) {
  const compact = size === "compact";
  const isAlert = (s: HeroStat) => {
    if (s.tone === "alert") return true;
    const n = s.numeric ?? Number(s.value);
    return s.warnAt != null && Number.isFinite(n) && n >= s.warnAt;
  };

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-[#c79a3b]/30">
      {/* optional real-photo backdrop (bottom-most layer) */}
      {photo && (
        <img
          src={photo}
          alt=""
          aria-hidden="true"
          className="hero-photo absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* seasonal deep-sea base — semi-transparent over a photo so it tints,
          fully opaque otherwise */}
      <div
        className={`absolute inset-0 ${photo ? "opacity-60 mix-blend-multiply" : ""}`}
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
        className={`hero-fish pointer-events-none absolute top-[28%] w-auto opacity-70 drop-shadow-lg [filter:sepia(1)_saturate(3)_hue-rotate(2deg)_brightness(1.05)] ${compact ? "h-12" : "h-24"}`}
      />
      <img
        src="/img-fish-mark.png"
        alt=""
        aria-hidden="true"
        className={`hero-fish-2 pointer-events-none absolute top-[60%] w-auto opacity-55 [filter:sepia(1)_saturate(3)_hue-rotate(2deg)_brightness(1.05)] ${compact ? "h-9" : "h-16"}`}
      />

      {/* a sportfishing boat drifting + bobbing along the waterline */}
      <div className="hero-boat pointer-events-none absolute bottom-[26%] z-[1]" aria-hidden="true">
        <HeroBoat className={`${compact ? "h-8" : "h-12"} w-auto drop-shadow-lg`} />
      </div>

      {/* schools + rising bubbles */}
      <CoastalHeaderFX variant="dark" />

      {/* readability scrim behind the text column; thin bottom shade for chips.
          Stronger when a photo is present so the white text always stays legible. */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${
          photo
            ? "from-[#0c1116]/90 via-[#0c1116]/55 to-[#0c1116]/20"
            : "from-[#0c1116]/85 via-[#0c1116]/35 to-transparent md:to-[#0c1116]/0"
        }`}
      />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0c1116]/55 to-transparent" />

      {/* content — sizes bumped up for easier reading */}
      <div
        className={`relative flex flex-wrap items-end justify-between gap-4 ${
          compact ? "px-5 py-5 md:px-6 md:py-6" : "px-6 py-8 md:px-9 md:py-10"
        }`}
      >
        <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <p
            className={`font-bold uppercase tracking-[0.22em] ${compact ? "text-xs" : "text-sm"}`}
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
        <h1
          className={`mt-2 font-display font-bold tracking-tight text-white drop-shadow-lg ${
            compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          }`}
        >
          {greeting}
        </h1>
        {subtitle && (
          <p
            className={`mt-3 max-w-2xl text-amber-50/95 leading-relaxed drop-shadow ${
              compact ? "text-sm md:text-base" : "text-base md:text-lg"
            }`}
          >
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
                      ? "bg-[#ef6a1f]/25 ring-[#ef6a1f]/50"
                      : "bg-white/10 ring-white/25"
                  }`}
                >
                  {/* gamified fish motif: calm teal -> agitated coral, faster wiggle when alert */}
                  <Mahi
                    className={`h-6 w-6 shrink-0 ${
                      alert ? "text-[#ff8a45] hero-chip-fish-alert" : "text-[#e6c25a] hero-chip-fish"
                    }`}
                  />
                  <span
                    className={`font-display text-2xl font-bold tabular-nums ${
                      alert ? "text-[#ffd9cb]" : "text-white"
                    }`}
                  >
                    {s.value}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-50/90 leading-tight">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        </div>
        {action && <div className="relative shrink-0">{action}</div>}
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
        fill="#1c2129"
        stroke="#5a4a22"
        strokeWidth="1.5"
      />
      {/* white sheer stripe */}
      <path d="M10 45 H102" stroke="#f7efd8" strokeWidth="2.5" strokeLinecap="round" />
      {/* cabin / console */}
      <path d="M40 44 V30 a4 4 0 0 1 4 -4 H62 a4 4 0 0 1 4 4 V44 Z" fill="#c79a3b" />
      <rect x="45" y="31" width="16" height="8" rx="1.5" fill="#f2e2b0" />
      {/* T-top */}
      <path d="M38 26 H70" stroke="#1c2129" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 26 V22 M64 26 V22" stroke="#1c2129" strokeWidth="2" strokeLinecap="round" />
      {/* outrigger rod with a line */}
      <path d="M66 30 L96 8" stroke="#ef6a1f" strokeWidth="2" strokeLinecap="round" />
      <circle cx="96" cy="8" r="2" fill="#ffd2a8" />
      {/* bow rail */}
      <path d="M12 44 C 16 38, 24 36, 30 36" stroke="#5a4a22" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default DashboardHero;
