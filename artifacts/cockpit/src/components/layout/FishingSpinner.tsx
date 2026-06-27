import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, number> = { sm: 28, md: 48, lg: 72 };

/**
 * Animated hooked-fish loading spinner for GreggOS.
 * Pure SVG + CSS keyframes (transform/opacity only) — GPU-composited,
 * scroll-safe, and frozen automatically under prefers-reduced-motion.
 */
export function FishingSpinner({
  size = "md",
  className,
  label = "Reeling it in…",
  showLabel = false,
}: {
  size?: Size;
  className?: string;
  label?: string;
  showLabel?: boolean;
}) {
  const px = SIZES[size];
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        className="fishing-spinner"
        width={px}
        height={px * 1.25}
        viewBox="0 0 80 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* fishing line + hook — gently casts */}
        <g className="fs-line">
          <line
            x1="40"
            y1="0"
            x2="40"
            y2="46"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-[#9bb4bb]"
          />
          {/* hook curve */}
          <path
            d="M40 46c0 8-9 9-9 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            className="text-[#0d4a57]"
          />

          {/* hooked game fish — wiggles as it fights */}
          <g className="fs-fish" transform="translate(30 50)">
            {/* body */}
            <path
              d="M2 8 C10 -4 34 -4 44 8 C34 20 10 20 2 8 Z"
              fill="#15a3b0"
            />
            {/* belly highlight */}
            <path
              d="M8 9 C16 2 32 2 40 9 C32 14 16 14 8 9 Z"
              fill="#5fe7e7"
              opacity="0.7"
            />
            {/* coral lateral stripe */}
            <path
              d="M12 9 C20 6 32 6 40 9"
              stroke="#f4623a"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            {/* tail */}
            <path d="M2 8 L-7 1 L-5 8 L-7 15 Z" fill="#0d6473" />
            {/* dorsal fin */}
            <path d="M16 0 C22 -6 30 -6 34 0 Z" fill="#0d6473" />
            {/* eye */}
            <circle cx="40" cy="7" r="1.6" fill="#06212a" />
          </g>
        </g>

        {/* bubbles escaping near the fish's mouth */}
        <g className="text-[#bdeef5]">
          <circle className="fs-bubble" cx="72" cy="56" r="2.4" fill="currentColor" />
          <circle className="fs-bubble fs-bubble-2" cx="68" cy="58" r="1.6" fill="currentColor" />
          <circle className="fs-bubble fs-bubble-3" cx="74" cy="60" r="1.2" fill="currentColor" />
        </g>
      </svg>

      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

/**
 * Drop-in themed loading block: centered hooked-fish spinner + message.
 * Replaces the plain "Loading …" paragraphs across the app.
 */
export function LoadingState({
  message = "Reeling it in…",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className,
      )}
    >
      <FishingSpinner size="lg" label={message} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default FishingSpinner;
