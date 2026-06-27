import { CoastalHeaderFX } from "@/components/layout/CoastalHeaderFX";

type Stat = { label: string; value: number | string; tone?: "default" | "alert" };

/**
 * Animated underwater hero for the Today's Catch dashboard.
 * Layers (back to front):
 *   - deep-sea gradient base
 *   - 3 parallax wave bands sliding horizontally (CSS, transform-only)
 *   - caustic light shimmer
 *   - 2 big hero fish swimming across + CoastalHeaderFX schools/bubbles
 *   - readability scrim + greeting + at-a-glance KPI chips
 * All motion is GPU-composited and freezes under prefers-reduced-motion.
 */
export function DashboardHero({
  greeting,
  subtitle,
  stats = [],
}: {
  greeting: string;
  subtitle?: string;
  stats?: Stat[];
}) {
  // a single wave band as an inline SVG data-URI, tiled horizontally
  const wave = (color: string, opacity: number) =>
    `url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'><path d='M0 40 C 40 10, 80 10, 120 40 S 200 70, 240 40 V80 H0 Z' fill='${color}' fill-opacity='${opacity}'/></svg>`,
    )}")`;

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-[#15a3b0]/30">
      {/* deep-sea base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e5566] via-[#0b4350] to-[#062029]" />
      {/* brighter sunlit-water band along the bottom so it always reads as water */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#1fb6c4]/45 via-[#15a3b0]/20 to-transparent" />

      {/* parallax animated wave bands — brighter + taller so the water clearly moves */}
      <div
        className="hero-wave hero-wave-3"
        style={{ bottom: "0", height: "85%", backgroundImage: wave("#1fb6c4", 0.55), backgroundSize: "260px 120px" }}
      />
      <div
        className="hero-wave hero-wave-2"
        style={{ bottom: "0", height: "68%", backgroundImage: wave("#3FE0E0", 0.5), backgroundSize: "340px 110px" }}
      />
      <div
        className="hero-wave hero-wave-1"
        style={{ bottom: "0", height: "50%", backgroundImage: wave("#7df0f0", 0.6), backgroundSize: "200px 90px" }}
      />

      {/* caustic light shimmer */}
      <div
        className="hero-caustics pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 70% -10%, rgba(190,238,245,0.5), transparent 55%)",
        }}
      />

      {/* big swimming hero fish */}
      <img
        src="/img-fish-mark.png"
        alt=""
        aria-hidden="true"
        className="hero-fish pointer-events-none absolute top-[30%] h-16 w-auto opacity-50 drop-shadow"
      />
      <img
        src="/img-fish-mark.png"
        alt=""
        aria-hidden="true"
        className="hero-fish-2 pointer-events-none absolute top-[58%] h-10 w-auto opacity-35"
      />

      {/* schools + rising bubbles */}
      <CoastalHeaderFX variant="dark" />

      {/* readability scrim — only behind the text column (left), so the
          moving water on the right stays clearly visible */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#062029]/85 via-[#062029]/35 to-transparent md:to-[#062029]/0" />
      {/* thin bottom shade just under the KPI chips for legibility */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#062029]/55 to-transparent" />

      {/* content */}
      <div className="relative px-6 py-7 md:px-8 md:py-9">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5fe7e7]">
          Today's Catch
        </p>
        <h1 className="mt-1.5 font-display text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow">
          {greeting}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm text-cyan-50/90 drop-shadow">
            {subtitle}
          </p>
        )}

        {stats.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 backdrop-blur-sm ring-1 ${
                  s.tone === "alert"
                    ? "bg-[#f4623a]/20 ring-[#f4623a]/40"
                    : "bg-white/10 ring-white/20"
                }`}
              >
                <span
                  className={`font-display text-xl font-bold tabular-nums ${
                    s.tone === "alert" ? "text-[#ffd0c2]" : "text-white"
                  }`}
                >
                  {s.value}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-cyan-50/80 leading-tight">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardHero;
