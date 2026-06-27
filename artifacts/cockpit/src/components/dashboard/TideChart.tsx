import { useEffect, useMemo, useState } from "react";
import { ArrowUp, ArrowDown, MapPin, RefreshCw, WifiOff } from "lucide-react";
import { FishingSpinner } from "@/components/layout/FishingSpinner";
import { Waves } from "@/components/icons/CoastalIcons";

/**
 * Live Tide Chart — pulls real tide predictions from the NOAA CO-OPS public API
 * (no key required, CORS-enabled). Styled with the GreggOS coastal palette.
 *
 * Default station: 8726520 — St. Petersburg, FL (Tampa Bay), the nearest
 * coastal tide gauge to the CCA home base in Zephyrhills.
 */

const NOAA_BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

// teal / coral coastal tokens
const TEAL = "#15a3b0";
const TEAL_DEEP = "#0d6473";
const CORAL = "#f4623a";

const DEFAULT_STATION = { id: "8726520", name: "St. Petersburg, FL" };

type Pred = { t: string; v: string; type?: "H" | "L" };

function noaaDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function fmtTime(t: string) {
  // NOAA returns "YYYY-MM-DD HH:mm" in local station time
  const d = new Date(t.replace(" ", "T"));
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function TideChart({
  stationId = DEFAULT_STATION.id,
  stationName = DEFAULT_STATION.name,
}: {
  stationId?: string;
  stationName?: string;
}) {
  const [series, setSeries] = useState<Pred[] | null>(null);
  const [hilo, setHilo] = useState<Pred[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const common =
      `&application=GreggOS&datum=MLLW&time_zone=lst_ldt&units=english&format=json` +
      `&station=${stationId}&begin_date=${noaaDate(today)}&end_date=${noaaDate(tomorrow)}`;

    Promise.all([
      fetch(`${NOAA_BASE}?product=predictions${common}`).then((r) => r.json()),
      fetch(`${NOAA_BASE}?product=predictions&interval=hilo${common}`).then((r) =>
        r.json(),
      ),
    ])
      .then(([curve, events]) => {
        if (cancelled) return;
        const preds: Pred[] = curve?.predictions ?? [];
        const events2: Pred[] = events?.predictions ?? [];
        if (!preds.length) {
          setStatus("error");
          return;
        }
        setSeries(preds);
        setHilo(events2);
        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [stationId, reloadKey]);

  const view = useMemo(() => {
    if (!series || series.length === 0) return null;
    const now = Date.now();
    const pts = series.map((p) => ({
      t: new Date(p.t.replace(" ", "T")).getTime(),
      v: parseFloat(p.v),
    }));
    const vals = pts.map((p) => p.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const t0 = pts[0].t;
    const t1 = pts[pts.length - 1].t;
    const span = t1 - t0 || 1;
    const range = max - min || 1;

    const W = 100;
    const H = 38;
    const x = (t: number) => ((t - t0) / span) * W;
    const y = (v: number) => H - ((v - min) / range) * (H - 6) - 3;

    const line = pts.map((p) => `${x(p.t).toFixed(2)},${y(p.v).toFixed(2)}`).join(" ");
    const area = `0,${H} ${line} ${W},${H}`;

    // current level via interpolation
    const nowClamped = Math.min(Math.max(now, t0), t1);
    let cur = pts[0].v;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].t >= nowClamped) {
        const a = pts[i - 1];
        const b = pts[i];
        const f = (nowClamped - a.t) / (b.t - a.t || 1);
        cur = a.v + (b.v - a.v) * f;
        break;
      }
    }
    const nowX = x(nowClamped);
    const nowY = y(cur);

    // next tide event after now
    const upcoming = (hilo ?? [])
      .map((e) => ({ ...e, ts: new Date(e.t.replace(" ", "T")).getTime() }))
      .filter((e) => e.ts >= now)
      .sort((a, b) => a.ts - b.ts);
    const next = upcoming[0];
    // rising if the next event is a High
    const rising = next ? next.type === "H" : cur < (pts[pts.length - 1]?.v ?? cur);

    return { line, area, nowX, nowY, cur, min, max, next, rising, W, H };
  }, [series, hilo]);

  return (
    <div className="relative">
      {/* live badge */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <MapPin className="h-3 w-3 text-[#15a3b0]" />
          <span className="truncate">{stationName}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "ok" && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#0d6473]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="text-slate-400 hover:text-[#15a3b0] transition-colors"
            aria-label="Refresh tide data"
          >
            <RefreshCw
              className={`h-3 w-3 ${status === "loading" ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div className="py-4">
          <FishingSpinner size="md" />
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-md border border-[#cfe6e9] bg-[#f1f8f9] px-2.5 py-3 text-[11px] text-slate-500">
          <WifiOff className="h-4 w-4 shrink-0 text-[#15a3b0]" />
          <span>
            Tide station unreachable right now. Tap refresh to recast the line.
          </span>
        </div>
      )}

      {status === "ok" && view && (
        <>
          {/* current level + next tide */}
          <div className="mb-2 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold tabular-nums text-slate-800">
                  {view.cur.toFixed(1)}
                </span>
                <span className="text-[11px] font-medium text-slate-500">ft</span>
              </div>
              <div
                className={`flex items-center gap-1 text-[10px] font-semibold ${
                  view.rising ? "text-[#0d6473]" : "text-[#f4623a]"
                }`}
              >
                {view.rising ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {view.rising ? "Rising" : "Falling"}
              </div>
            </div>
            {view.next && (
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400">
                  Next {view.next.type === "H" ? "High" : "Low"}
                </div>
                <div className="text-[11px] font-semibold tabular-nums text-slate-700">
                  {fmtTime(view.next.t)}
                </div>
                <div className="text-[10px] tabular-nums text-slate-500">
                  {parseFloat(view.next.v).toFixed(1)} ft
                </div>
              </div>
            )}
          </div>

          {/* tide curve */}
          <svg
            viewBox={`0 0 ${view.W} ${view.H}`}
            className="w-full"
            preserveAspectRatio="none"
            style={{ height: 70 }}
          >
            <defs>
              <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={TEAL} stopOpacity="0.35" />
                <stop offset="1" stopColor={TEAL} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polygon points={view.area} fill="url(#tideFill)" />
            <polyline
              points={view.line}
              fill="none"
              stroke={TEAL_DEEP}
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            {/* now marker */}
            <line
              x1={view.nowX}
              y1="0"
              x2={view.nowX}
              y2={view.H}
              stroke={CORAL}
              strokeWidth="0.8"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={view.nowX} cy={view.nowY} r="2" fill={CORAL} />
          </svg>

          {/* hi/lo strip */}
          {hilo && hilo.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {hilo.slice(0, 4).map((e, i) => (
                <div
                  key={`${e.t}-${i}`}
                  className="flex shrink-0 items-center gap-1 rounded border border-[#e0eff1] bg-white px-1.5 py-0.5"
                >
                  <Waves
                    className={`h-3 w-3 ${e.type === "H" ? "text-[#15a3b0]" : "text-[#f4623a]"}`}
                  />
                  <span className="text-[9px] font-bold uppercase text-slate-500">
                    {e.type === "H" ? "Hi" : "Lo"}
                  </span>
                  <span className="text-[9px] tabular-nums text-slate-600">
                    {fmtTime(e.t)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TideChart;
