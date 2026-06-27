/**
 * Living-ocean animation overlay for coastal headers.
 * Renders behind header content:
 *   - two parallax fish-school layers drifting sideways (seamless loop)
 *   - a lone game fish gliding across now and then
 *   - a few rising bubbles
 * All motion is transform/opacity only (GPU-composited), loops seamlessly,
 * and freezes under prefers-reduced-motion (handled in index.css).
 *
 * Pointer-events are disabled so it never blocks header interactions.
 */
export function CoastalHeaderFX({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const fish = "/img-fish-mark.png";
  // tuned so schools stay subtle over dark sidebar vs. light dashboard header
  const schoolOpacity = variant === "dark" ? "opacity-30" : "opacity-[0.14]";
  const loneOpacity = variant === "dark" ? "opacity-40" : "opacity-20";
  const bubbleOpacity = variant === "dark" ? "opacity-60" : "opacity-40";

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* School layer 1 — duplicated row, animated to -50% for a seamless loop */}
      <div className={`absolute inset-y-0 left-0 flex items-center ${schoolOpacity}`}>
        <div className="school-drift flex w-[200%] items-center justify-around gap-16">
          {Array.from({ length: 10 }).map((_, i) => (
            <img
              key={`s1-${i}`}
              src={fish}
              alt=""
              className="h-5 w-auto -scale-x-100 shrink-0"
              style={{ transform: `translateY(${(i % 3) * 6 - 6}px)` }}
            />
          ))}
        </div>
      </div>

      {/* School layer 2 — slower + smaller for parallax depth */}
      <div className={`absolute inset-y-0 left-0 flex items-center ${schoolOpacity}`}>
        <div className="school-drift-slow flex w-[200%] items-center justify-around gap-24">
          {Array.from({ length: 8 }).map((_, i) => (
            <img
              key={`s2-${i}`}
              src={fish}
              alt=""
              className="h-3 w-auto -scale-x-100 shrink-0"
              style={{ transform: `translateY(${(i % 2) * 10 - 4}px)` }}
            />
          ))}
        </div>
      </div>

      {/* Lone accent fish gliding across */}
      <img
        src={fish}
        alt=""
        className={`lone-fish absolute top-1/2 h-7 w-auto ${loneOpacity}`}
      />

      {/* Rising bubbles */}
      <span className={`bubble ${bubbleOpacity}`} style={{ left: "18%", width: 6, height: 6, ["--bub-dur" as string]: "6.5s", ["--bub-delay" as string]: "0s" }} />
      <span className={`bubble ${bubbleOpacity}`} style={{ left: "34%", width: 4, height: 4, ["--bub-dur" as string]: "8s", ["--bub-delay" as string]: "1.5s" }} />
      <span className={`bubble ${bubbleOpacity}`} style={{ left: "57%", width: 5, height: 5, ["--bub-dur" as string]: "7s", ["--bub-delay" as string]: "3s" }} />
      <span className={`bubble ${bubbleOpacity}`} style={{ left: "73%", width: 3, height: 3, ["--bub-dur" as string]: "9s", ["--bub-delay" as string]: "0.8s" }} />
      <span className={`bubble ${bubbleOpacity}`} style={{ left: "88%", width: 5, height: 5, ["--bub-dur" as string]: "7.5s", ["--bub-delay" as string]: "2.2s" }} />
    </div>
  );
}

export default CoastalHeaderFX;
