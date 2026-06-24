import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Sparkles, X, ArrowRight } from "lucide-react";
import {
  currentMotivationSlot,
  motivationMessageForSlot,
  type MotivationSlot,
} from "@/lib/motivation";

const DISMISS_KEY = "gregg-motivation-dismissed-slot";

export function MotivationPopup() {
  const [slot, setSlot] = useState<MotivationSlot>(() => currentMotivationSlot());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      const next = currentMotivationSlot();
      setSlot(next);
      let dismissed: string | null = null;
      try {
        dismissed = sessionStorage.getItem(DISMISS_KEY);
      } catch {
        dismissed = null;
      }
      setVisible(dismissed !== next.key);
    };
    // Surface shortly after load so it reads as a deliberate nudge, not chrome.
    const intro = setTimeout(evaluate, 600);
    const tick = setInterval(evaluate, 60000);
    return () => {
      clearTimeout(intro);
      clearInterval(tick);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, slot.key);
    } catch {
      /* ignore storage failures */
    }
    setVisible(false);
  }, [slot.key]);

  if (!visible) return null;

  const message = motivationMessageForSlot(slot);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 w-[min(22rem,calc(100vw-2.5rem))] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pointer-events-auto relative overflow-hidden rounded-xl bg-gradient-to-br from-[#072a33] via-[#0d4a57] to-[#15a3b0] p-5 text-white shadow-2xl ring-1 ring-[#15a3b0]/40">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#15a3b0]/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss motivation"
          data-testid="button-dismiss-motivation"
          className="absolute right-2.5 top-2.5 rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#5fe7e7]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9fd8ff]">
              {slot.greeting} &middot; Daily Drive
            </p>
          </div>
          <p className="mt-2 text-sm font-medium leading-snug text-blue-50">
            {message}
          </p>
          <Link href="/motivation">
            <span className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9fd8ff] transition-colors hover:text-white">
              More motivation
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
