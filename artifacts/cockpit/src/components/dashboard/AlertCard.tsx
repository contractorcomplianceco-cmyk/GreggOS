import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { playSonarPing } from "@/lib/sonar";
import {
  Mahi,
  Hook,
  AnchorMark,
  Boat,
  Waves,
  TideGauge,
  CompassRose,
  Net,
  Lighthouse,
} from "@/components/icons/CoastalIcons";

/* ================================================================== *
 * Branded slide-in alert cards — the same visual language as the
 * welcome video's lower-third cards: glassy deep-teal panel, a teal→aqua
 * left accent bar, an eyebrow category label, and one of Gregg's nine
 * custom fishing icons. Cards slide in from the left (transform/opacity
 * only, GPU-friendly) and auto-dismiss, so the dashboards feel like a
 * live high-end coastal command brief.
 * ================================================================== */

type IconCmp = React.ComponentType<{ className?: string }>;

/** Category labels mapped to Gregg's nine custom CoastalIcons. */
export const ALERT_CATEGORY = {
  THE_WATERS: { label: "THE WATERS", icon: Waves as IconCmp },
  THE_CREW: { label: "THE CREW", icon: Boat as IconCmp },
  WATCH: { label: "WATCH", icon: TideGauge as IconCmp },
  PROTECT: { label: "PROTECT", icon: Net as IconCmp },
  ON_THE_LINE: { label: "ON THE LINE", icon: Hook as IconCmp },
  THE_CATCH: { label: "THE CATCH", icon: Mahi as IconCmp },
  HOLD_FAST: { label: "HOLD FAST", icon: AnchorMark as IconCmp },
  CHART_A_COURSE: { label: "CHART A COURSE", icon: CompassRose as IconCmp },
  STORM_WATCH: { label: "STORM WATCH", icon: Lighthouse as IconCmp },
} as const;

export type AlertCategory = keyof typeof ALERT_CATEGORY;
export type AlertTone = "info" | "alert" | "celebrate";

export interface AlertItem {
  id: string;
  category: AlertCategory;
  message: string;
  tone?: AlertTone;
  /** ms before auto-dismiss; default 6500. Pass 0 to keep until dismissed. */
  duration?: number;
}

const TONE_BAR: Record<AlertTone, string> = {
  info: "bg-gradient-to-b from-[#5fe7e7] to-[#15a3b0]",
  alert: "bg-gradient-to-b from-[#ff7a4d] to-[#f4623a]",
  celebrate: "bg-gradient-to-b from-[#ffd56b] to-[#f4a23a]",
};
const TONE_ICON: Record<AlertTone, string> = {
  info: "text-[#5fe7e7]",
  alert: "text-[#ff8a63]",
  celebrate: "text-[#ffd56b]",
};

function SingleCard({
  item,
  onDone,
}: {
  item: AlertItem;
  onDone: (id: string) => void;
}) {
  const tone: AlertTone = item.tone ?? "info";
  const { label, icon: Icon } = ALERT_CATEGORY[item.category];
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback(() => {
    setLeaving(true);
    const t = window.setTimeout(() => onDone(item.id), 420);
    timers.current.push(t);
  }, [item.id, onDone]);

  useEffect(() => {
    // Sonar ping fires with the slide-in for synced audio+visual feedback.
    playSonarPing(tone);
    const dur = item.duration ?? 6500;
    if (dur > 0) {
      const t = window.setTimeout(dismiss, dur);
      timers.current.push(t);
    }
    return () => {
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="alert-card pointer-events-auto flex w-full max-w-md items-stretch overflow-hidden rounded-2xl border border-[#5fe7e7]/20 bg-[#061c23]/95 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md"
      data-leaving={leaving ? "true" : undefined}
      data-testid={`alert-card-${item.id}`}
      role="status"
    >
      {/* left accent bar */}
      <div className={`alert-card-bar w-[7px] shrink-0 rounded-l-2xl ${TONE_BAR[tone]}`} />
      <div className="flex flex-1 items-start gap-3 py-3.5 pl-4 pr-3">
        <span
          className={`alert-card-icon mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 ${TONE_ICON[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9fdfe2]">{label}</p>
          <p className="mt-0.5 text-[15px] font-semibold leading-snug text-white">{item.message}</p>
        </div>
        <button
          onClick={dismiss}
          className="-mr-1 mt-0.5 shrink-0 rounded-md p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Fixed-position stack that renders queued alert cards in the lower-left,
 * matching the welcome video's lower-third placement.
 */
export function AlertCardStack({
  items,
  onDismiss,
}: {
  items: AlertItem[];
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-50 flex w-[min(92vw,28rem)] flex-col gap-3">
      {items.map((it) => (
        <SingleCard key={it.id} item={it} onDone={onDismiss} />
      ))}
    </div>
  );
}

/**
 * Hook to manage a small queue of alert cards. `push` is deduped by id so the
 * same live signal won't stack up on re-render.
 */
export function useAlertCards(max = 3) {
  const [items, setItems] = useState<AlertItem[]>([]);
  const seen = useRef<Set<string>>(new Set());

  const push = useCallback(
    (item: AlertItem) => {
      if (seen.current.has(item.id)) return;
      seen.current.add(item.id);
      setItems((prev) => [...prev.slice(-(max - 1)), item]);
    },
    [max],
  );

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, push, dismiss };
}
