import { useEffect, useMemo, useRef, useState } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pin,
  PinOff,
  Anchor,
  Music2,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Trophy,
  Plus,
  Trash2,
  Share2,
  Heart,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Beer,
  Shuffle,
  RotateCcw,
} from "lucide-react";
import { Boat, Waves, Mahi, Hook, Net, TideGauge } from "@/components/icons/CoastalIcons";

/* ================================================================== *
 * The Dock — the relaxed, off-the-clock corner of GreggOS.
 * Everything here is purely front-end & local (localStorage); it never
 * touches CRM/company data.
 * ================================================================== */

// ---- Photo deck ----------------------------------------------------------
const PHOTOS = [
  { src: "/dock-sunset-canoe.jpg", caption: "Glass-calm sunset. Just you and the line." },
  { src: "/dock-sportfisher-run.jpg", caption: "Running out to the grounds at first light." },
  { src: "/dock-angler-fight.jpg", caption: "Tight lines — fish on." },
  { src: "/dock-reef-school.jpg", caption: "Where the bait balls, the big ones follow." },
];

// ---- Dream Boat Finder ----------------------------------------------------
type BoatStyle = {
  id: string; name: string; tagline: string; img: string;
  water: string; length: string; best: string;
};
const BOATS: BoatStyle[] = [
  { id: "center-console", name: "Bluewater Center Console", tagline: "The do-everything offshore weapon.", img: "/boat-center-console.jpg", water: "Nearshore & offshore", length: "32–39 ft", best: "Reef, wreck & pelagic runs" },
  { id: "sportfisher", name: "Convertible Sportfisher", tagline: "The big-game battlewagon with a tuna tower.", img: "/boat-sportfisher.jpg", water: "Deep offshore / canyons", length: "55–70 ft", best: "Marlin, tuna, overnight trips" },
  { id: "flats-skiff", name: "Skinny-Water Flats Skiff", tagline: "Silent, shallow, and deadly on the flats.", img: "/boat-flats-skiff.jpg", water: "Inshore flats & mangroves", length: "16–18 ft", best: "Redfish, snook, tarpon, bonefish" },
];
const FINDER_Q = {
  water: [
    { v: "flats", label: "Skinny inshore flats" },
    { v: "near", label: "Nearshore reefs & wrecks" },
    { v: "deep", label: "Way offshore, big blue" },
  ],
  vibe: [
    { v: "stealth", label: "Stealthy & simple" },
    { v: "versatile", label: "Versatile all-rounder" },
    { v: "luxury", label: "Go big, stay out overnight" },
  ],
};
function matchBoat(water: string, vibe: string): BoatStyle {
  if (water === "flats" || vibe === "stealth") return BOATS[2];
  if (water === "deep" || vibe === "luxury") return BOATS[1];
  return BOATS[0];
}

// ---- Dream Board ----------------------------------------------------------
type DreamPin = { id: string; kind: string; title: string; sub: string };
const DREAM_IDEAS: DreamPin[] = [
  { id: "marlin", kind: "Catch", title: "1,000 lb Blue Marlin", sub: "The grander. The dream fish." },
  { id: "tarpon", kind: "Catch", title: "Silver King Tarpon", sub: "Boca Grande on a fly" },
  { id: "keys", kind: "Trip", title: "Florida Keys Run", sub: "Islamorada to Key West" },
  { id: "costarica", kind: "Trip", title: "Costa Rica Sailfish", sub: "Los Sueños release day" },
  { id: "console", kind: "Boat", title: "39' Center Console", sub: "Triple outboards, loaded" },
  { id: "tower", kind: "Boat", title: "Sportfisher w/ Tower", sub: "Tuna tower & teaser reels" },
  { id: "bahamas", kind: "Trip", title: "Bahamas Bonefish", sub: "Andros flats at sunrise" },
  { id: "wahoo", kind: "Catch", title: "Personal-best Wahoo", sub: "High-speed trolling" },
];
const LS_PINS = "greggos.dreamboard.v1";

// ---- Bucket-list trips ----------------------------------------------------
type Trip = { id: string; place: string; target: string; note: string };
const TRIPS: Trip[] = [
  { id: "keys", place: "Florida Keys", target: "Sailfish & mahi", note: "Islamorada charter, winter run" },
  { id: "bahamas", place: "The Bahamas", target: "Bonefish on the flats", note: "Andros, skiff & guide" },
  { id: "costarica", place: "Costa Rica", target: "Pacific sailfish", note: "Los Sueños, peak Jan–Mar" },
  { id: "louisiana", place: "Louisiana Marsh", target: "Bull redfish", note: "Venice, fall blowup" },
  { id: "panama", place: "Panama", target: "Cubera & roosterfish", note: "Tropic Star, jungle coast" },
  { id: "alaska", place: "Alaska", target: "Halibut & salmon", note: "Summer, sleeper bucket trip" },
];
const LS_TRIPS = "greggos.bucketlist.v1";

// ---- Catch Log ------------------------------------------------------------
type Catch = { id: string; species: string; weight: number; spot: string; date: string };
const LS_CATCH = "greggos.catchlog.v1";

// ---- Knots ----------------------------------------------------------------
const KNOTS = [
  { name: "Improved Clinch", use: "Tie line to hook/lure", steps: "5–7 wraps, back through the loop, cinch wet." },
  { name: "Palomar", use: "Strongest hook knot", steps: "Double the line, overhand loop, pass hook through, tighten." },
  { name: "Uni-to-Uni", use: "Join two lines / leader", steps: "Two uni knots facing each other, slide together." },
  { name: "Loop Knot", use: "Free-swinging lure action", steps: "Overhand loop, wrap tag, back through, snug to size." },
  { name: "Bimini Twist", use: "Offshore double-line", steps: "20 twists, knee-spread, rolling hitches down the column." },
];

// ---- Mock social feed -----------------------------------------------------
const FEED_AUTHORS = ["ReelDeal_Rick", "SaltyKate", "OffshoreOmar", "FlatsFox", "CaptainMarisa", "TightLinesTom", "BlueWaterBen", "DocksideDana"];
const FEED_FISH = [
  { txt: "landed a 38\" snook off the bridge 🎣", kind: "Catch" },
  { txt: "first sailfish release of the season!", kind: "Catch" },
  { txt: "slick calm out on the flats this morning", kind: "Trip" },
  { txt: "new PB redfish — 12 lbs of bull", kind: "Catch" },
  { txt: "wahoo on the troll, smoked the reel", kind: "Catch" },
  { txt: "bluewater run paid off, mahi everywhere", kind: "Trip" },
  { txt: "tarpon rolling at the pass, hooked 3", kind: "Catch" },
  { txt: "sunset bite was on fire tonight 🌅", kind: "Trip" },
];
type FeedItem = { id: string; author: string; text: string; kind: string; likes: number; mine?: boolean; t: number };
const LS_FEED = "greggos.dockfeed.v1";

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}
function write(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

// ---- Spotify stations -----------------------------------------------------
type Station = { id: string; title: string; mood: string; playlist: string; party?: boolean };
const STATIONS: Station[] = [
  { id: "guitar", title: "Dockside Acoustic", mood: "Easy coastal guitar", playlist: "37i9dQZF1DX0jgyAiPl8Af" },
  { id: "chill", title: "Chill Hits", mood: "Sunny & easy", playlist: "37i9dQZF1DX4WYpdgoIcn6" },
  { id: "lofi", title: "Calm Waters", mood: "Wind-down lo-fi", playlist: "37i9dQZF1DWWQRwui0ExPn" },
  { id: "party", title: "Beer O'Clock Party", mood: "Cold ones & good times", playlist: "37i9dQZF1DXaXB8fQg7xif", party: true },
  { id: "country", title: "Dock Country", mood: "Boots, boats & beer", playlist: "37i9dQZF1DX1lVhptIYRda", party: true },
];

// ---- Beer O'Clock gallery -------------------------------------------------
type GalleryPic = { src: string; caption: string };
const BEER_GALLERY: GalleryPic[] = [
  { src: "/dock-gregg-couple.jpg", caption: "Cold ones on the water. This is the life." },
  { src: "/dock-gregg-poster.jpg", caption: "Boats, Hoes & Gregg — sun up, lines in." },
  { src: "/dock-gregg-tightlines.jpg", caption: "Tight lines. Stress gone. Life on." },
  { src: "/gregg-pinup-1.jpg", caption: "Sportfishing & Beer — sunset sessions." },
  { src: "/gregg-pinup-2.jpg", caption: "Sunset, suds & sailfish. Cheers, Captain." },
];

// ---- Beer O'Clock toasts --------------------------------------------------
const BEER_TOASTS = [
  "It's Beer O'Clock, Captain 🍻",
  "Sun's over the yardarm somewhere.",
  "Lines in, cold one out.",
  "Here's to tight lines and colder beer.",
  "Work hard, fish harder, cheers hardest.",
  "No wake zone — just chill and sip.",
  "The only tab that matters is a bottle tab.",
];
const LS_BEERS = "greggos.beercount.v1";

// time -> ambient phase
function phaseForHour(h: number): "day" | "evening" | "night" {
  if (h >= 6 && h < 17) return "day";
  if (h >= 17 && h < 20) return "evening";
  return "night";
}

export default function TheDock() {
  // ---------- ambient mode ----------
  type Phase = "day" | "evening" | "night" | "beer";
  const [autoAmbient, setAutoAmbient] = useState(true);
  const [phase, setPhase] = useState<Phase>(() => phaseForHour(new Date().getHours()));
  useEffect(() => {
    if (!autoAmbient) return;
    const tick = () => setPhase(phaseForHour(new Date().getHours()));
    tick();
    const iv = setInterval(tick, 60_000);
    return () => clearInterval(iv);
  }, [autoAmbient]);
  const beerMode = phase === "beer";
  const ambientAttr = phase === "day" ? undefined : phase;

  // ---------- beer o'clock ----------
  const [beers, setBeers] = useState(0);
  useEffect(() => setBeers(read<number>(LS_BEERS, 0)), []);
  const [cheersKey, setCheersKey] = useState(0);
  const addBeer = () => {
    setBeers((n) => { const next = n + 1; write(LS_BEERS, next); return next; });
    setCheersKey((k) => k + 1);
  };
  const resetBeers = () => { setBeers(0); write(LS_BEERS, 0); };
  // rotating toast
  const [toastIdx, setToastIdx] = useState(0);
  useEffect(() => {
    if (!beerMode) return;
    const iv = setInterval(() => setToastIdx((i) => (i + 1) % BEER_TOASTS.length), 5000);
    return () => clearInterval(iv);
  }, [beerMode]);
  // shuffleable photo stack (top card index order)
  const [gallery, setGallery] = useState<GalleryPic[]>(BEER_GALLERY);
  const nextPic = () => setGallery((g) => [...g.slice(1), g[0]]);
  const shufflePics = () =>
    setGallery((g) => [...g].sort(() => Math.random() - 0.5));

  // when beer mode turns on, auto-swap the radio to a party station
  const [station, setStation] = useState<Station>(STATIONS[0]);
  const prevBeerRef = useRef(false);
  useEffect(() => {
    if (beerMode && !prevBeerRef.current) {
      const party = STATIONS.find((s) => s.party);
      if (party) setStation(party);
    }
    prevBeerRef.current = beerMode;
  }, [beerMode]);

  // ---------- photo deck ----------
  const [photo, setPhoto] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPhoto((p) => (p + 1) % PHOTOS.length), 6000);
    return () => clearInterval(iv);
  }, []);

  // ---------- dream boat finder ----------
  const [water, setWater] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const dreamBoat = useMemo(() => (water && vibe ? matchBoat(water, vibe) : null), [water, vibe]);

  // ---------- dream board ----------
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => setPins(read<string[]>(LS_PINS, [])), []);
  const togglePin = (id: string) => {
    setPins((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      write(LS_PINS, next);
      return next;
    });
  };

  // ---------- bucket list ----------
  const [doneTrips, setDoneTrips] = useState<string[]>([]);
  useEffect(() => setDoneTrips(read<string[]>(LS_TRIPS, [])), []);
  const toggleTrip = (id: string) => {
    setDoneTrips((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      write(LS_TRIPS, next);
      return next;
    });
  };

  // ---------- catch log ----------
  const [catches, setCatches] = useState<Catch[]>([]);
  useEffect(() => setCatches(read<Catch[]>(LS_CATCH, [])), []);
  const [cf, setCf] = useState({ species: "", weight: "", spot: "" });
  const addCatch = () => {
    if (!cf.species.trim()) return;
    const c: Catch = {
      id: `c${Date.now()}`,
      species: cf.species.trim(),
      weight: parseFloat(cf.weight) || 0,
      spot: cf.spot.trim() || "—",
      date: new Date().toLocaleDateString(),
    };
    const next = [c, ...catches];
    setCatches(next);
    write(LS_CATCH, next);
    setCf({ species: "", weight: "", spot: "" });
  };
  const removeCatch = (id: string) => {
    const next = catches.filter((c) => c.id !== id);
    setCatches(next);
    write(LS_CATCH, next);
  };
  const personalBest = useMemo(
    () => catches.reduce<Catch | null>((b, c) => (!b || c.weight > b.weight ? c : b), null),
    [catches],
  );

  // ---------- mock social feed ----------
  const [feed, setFeed] = useState<FeedItem[]>([]);
  useEffect(() => {
    const seed = read<FeedItem[]>(LS_FEED, []);
    if (seed.length) { setFeed(seed); return; }
    const init: FeedItem[] = Array.from({ length: 5 }).map((_, i) => {
      const f = FEED_FISH[i % FEED_FISH.length];
      return { id: `f${Date.now()}-${i}`, author: FEED_AUTHORS[i % FEED_AUTHORS.length], text: f.txt, kind: f.kind, likes: Math.floor(Math.random() * 40) + 2, t: Date.now() - i * 90_000 };
    });
    setFeed(init);
    write(LS_FEED, init);
  }, []);
  // simulate real-time activity locally: a new catch appears every ~12s
  useEffect(() => {
    const iv = setInterval(() => {
      setFeed((prev) => {
        const f = FEED_FISH[Math.floor(Math.random() * FEED_FISH.length)];
        const item: FeedItem = { id: `f${Date.now()}`, author: FEED_AUTHORS[Math.floor(Math.random() * FEED_AUTHORS.length)], text: f.txt, kind: f.kind, likes: Math.floor(Math.random() * 25) + 1, t: Date.now() };
        const next = [item, ...prev].slice(0, 18);
        write(LS_FEED, next);
        return next;
      });
    }, 12_000);
    return () => clearInterval(iv);
  }, []);
  const likeItem = (id: string) =>
    setFeed((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, likes: it.likes + 1 } : it));
      write(LS_FEED, next);
      return next;
    });
  // drag-and-drop: drop a pinned dream onto the feed to "share" it
  const [dragOver, setDragOver] = useState(false);
  const shareToFeed = (pin: DreamPin) => {
    setFeed((prev) => {
      const item: FeedItem = { id: `me${Date.now()}`, author: "You (Captain)", text: `added "${pin.title}" to the dream board`, kind: pin.kind, likes: 0, mine: true, t: Date.now() };
      const next = [item, ...prev].slice(0, 18);
      write(LS_FEED, next);
      return next;
    });
  };

  // ---------- spotify ---------- (station state declared above w/ beer logic)

  const dragId = useRef<string | null>(null);

  return (
    <SidebarLayout>
      <div
        data-ambient={ambientAttr}
        className={`min-h-full font-sans text-[15px] leading-relaxed transition-colors duration-700 ${
          beerMode ? "bg-[#0a0402] text-[#ffe6c4]" : "bg-[#f6f1e6] text-slate-900"
        }`}
      >
        <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-8">
          {/* ===== HERO with rotating photo backdrop ===== */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-[#c79a3b]/30">
            {PHOTOS.map((p, i) => (
              <img
                key={p.src}
                src={p.src}
                alt=""
                aria-hidden="true"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === photo ? "opacity-35" : "opacity-0"}`}
              />
            ))}
            <div className="relative">
              <DashboardHero
                eyebrow="The Dock"
                greeting="Lines in, worries out."
                subtitle="Your off-the-clock corner of GreggOS. Log the catch, chase the dream boat, plan the trip, and put on something easy while you do it."
              />
            </div>
          </div>

          {/* ambient mode controls */}
          <div className="flex flex-wrap items-center gap-2 -mt-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Ambient</span>
            {([
              { k: "auto", label: "Auto (by time)", icon: Clock },
              { k: "day", label: "Day", icon: Sun },
              { k: "evening", label: "Evening", icon: Sunset },
              { k: "night", label: "Night", icon: Moon },
              { k: "beer", label: "Beer O'Clock", icon: Beer },
            ] as const).map((opt) => {
              const active = opt.k === "auto" ? autoAmbient : (!autoAmbient && phase === opt.k);
              const Icon = opt.icon;
              const isBeer = opt.k === "beer";
              return (
                <button
                  key={opt.k}
                  onClick={() => {
                    if (opt.k === "auto") { setAutoAmbient(true); setPhase(phaseForHour(new Date().getHours())); }
                    else { setAutoAmbient(false); setPhase(opt.k); }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? isBeer
                        ? "border-[#ff7a1a] bg-gradient-to-r from-[#ff7a1a] to-[#e0531a] text-white shadow-[0_0_14px_-2px_rgba(255,122,26,0.8)]"
                        : "border-[#c79a3b] bg-[#c79a3b] text-white shadow-sm"
                      : isBeer
                        ? "border-[#ffb15a] bg-white text-[#c2510f] hover:border-[#ff7a1a] hover:bg-[#fff4e6]"
                        : "border-[#efe0b8] bg-white text-slate-600 hover:border-[#e0b24a]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
            <span className="text-xs text-slate-400">
              {phase === "day" ? "Bright & breezy" : phase === "evening" ? "Golden hour — winding down" : phase === "night" ? "Moonlit & quiet" : "🍻 Neon lights, cold ones, good times"}
            </span>
          </div>

          {/* ===== BEER O'CLOCK MODE (only when active) ===== */}
          {beerMode && (
            <section className="relative overflow-hidden rounded-2xl border border-[#ff7a1a]/40 bg-gradient-to-b from-[#1a0a04] to-[#0a0402] p-5 shadow-[0_0_40px_-10px_rgba(255,122,26,0.5)] md:p-7">
              {/* neon glow blobs */}
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#ff7a1a]/25 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-[#e0531a]/20 blur-3xl" />

              {/* neon banner + rotating toast */}
              <div className="relative mb-6 text-center">
                <p className="beer-neon font-display text-3xl font-extrabold uppercase tracking-tight text-[#ffd15a] md:text-4xl">
                  Beer O'Clock
                </p>
                <p key={toastIdx} className="beer-cheers mt-2 text-sm font-semibold text-[#ffb15a] md:text-base">
                  {BEER_TOASTS[toastIdx]}
                </p>
              </div>

              <div className="relative grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* shuffleable photo stack */}
                <div className="flex flex-col items-center">
                  <div className="beer-card-stack relative mx-auto h-[420px] w-full max-w-[340px]">
                    {gallery.slice(0, 4).map((pic, i) => {
                      const offsets = [
                        { r: "0deg", x: "0px", y: "0px", z: 40 },
                        { r: "-5deg", x: "-14px", y: "10px", z: 30 },
                        { r: "4deg", x: "14px", y: "20px", z: 20 },
                        { r: "-2deg", x: "-6px", y: "30px", z: 10 },
                      ];
                      const o = offsets[i];
                      const top = i === 0;
                      return (
                        <div
                          key={pic.src}
                          onClick={top ? nextPic : undefined}
                          style={{
                            transform: `translate(${o.x}, ${o.y}) rotate(${o.r})`,
                            zIndex: o.z,
                          }}
                          className={`absolute inset-0 overflow-hidden rounded-2xl border-4 border-white/90 bg-black shadow-2xl ${top ? "cursor-pointer hover:!-translate-y-1" : ""}`}
                          title={top ? "Click for the next print" : undefined}
                        >
                          <img src={pic.src} alt={pic.caption} className="h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                            <p className="text-xs font-semibold text-[#ffd15a]">{pic.caption}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={nextPic} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff7a1a]/50 bg-white/5 px-3 py-2 text-xs font-semibold text-[#ffd15a] transition-colors hover:bg-[#ff7a1a]/20">
                      <RotateCcw className="h-3.5 w-3.5" /> Next print
                    </button>
                    <button onClick={shufflePics} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff7a1a]/50 bg-white/5 px-3 py-2 text-xs font-semibold text-[#ffd15a] transition-colors hover:bg-[#ff7a1a]/20">
                      <Shuffle className="h-3.5 w-3.5" /> Shuffle the deck
                    </button>
                  </div>
                </div>

                {/* cold-one counter */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#ff7a1a]/30 bg-white/5 p-6 text-center backdrop-blur-sm">
                  <div className="relative mb-2">
                    <span key={cheersKey} className="beer-cheers block text-7xl" role="img" aria-label="beers">🍻</span>
                    {/* rising bubbles */}
                    <span className="beer-bubble-rise absolute left-1/2 top-2 h-1.5 w-1.5 rounded-full bg-[#ffd15a]" />
                    <span className="beer-bubble-rise absolute left-1/3 top-4 h-1 w-1 rounded-full bg-[#ffe08a]" style={{ animationDelay: "0.7s" }} />
                    <span className="beer-bubble-rise absolute right-1/3 top-3 h-1 w-1 rounded-full bg-[#ffe08a]" style={{ animationDelay: "1.3s" }} />
                  </div>
                  <p className="font-display text-5xl font-extrabold tabular-nums text-[#ffd15a]">{beers}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#ffb15a]">
                    {beers === 1 ? "Cold one cracked" : "Cold ones cracked"}
                  </p>
                  <button
                    onClick={addBeer}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a1a] to-[#e0531a] px-5 py-3 text-sm font-bold text-white shadow-[0_0_18px_-4px_rgba(255,122,26,0.9)] transition-transform active:scale-95"
                  >
                    <Beer className="h-5 w-5" /> Crack a cold one
                  </button>
                  <button onClick={resetBeers} className="mt-2 text-[11px] font-semibold text-[#ffb15a]/70 hover:text-[#ffd15a]">
                    Reset the tab
                  </button>
                  <p className="mt-3 text-[10px] text-[#ffb15a]/60">Saved on this device. Pace yourself, Captain.</p>
                </div>
              </div>
            </section>
          )}

          {/* ===== CATCH LOG / BRAG BOARD ===== */}
          <section>
            <SectionTitle icon={Trophy} title="Catch Log & Brag Board" hint="your real catches, saved on this device" />
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <Card className="shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <input value={cf.species} onChange={(e) => setCf({ ...cf, species: e.target.value })} placeholder="Species (e.g. Snook)" className="w-full rounded-lg border border-[#efe0b8] px-3 py-2 text-sm focus:border-[#e0b24a] focus:outline-none" />
                  <div className="flex gap-2">
                    <input value={cf.weight} onChange={(e) => setCf({ ...cf, weight: e.target.value })} placeholder="Weight (lbs)" inputMode="decimal" className="w-1/2 rounded-lg border border-[#efe0b8] px-3 py-2 text-sm focus:border-[#e0b24a] focus:outline-none" />
                    <input value={cf.spot} onChange={(e) => setCf({ ...cf, spot: e.target.value })} placeholder="Spot" className="w-1/2 rounded-lg border border-[#efe0b8] px-3 py-2 text-sm focus:border-[#e0b24a] focus:outline-none" />
                  </div>
                  <button onClick={addCatch} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c79a3b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#8a6a1a]">
                    <Plus className="h-4 w-4" /> Log the catch
                  </button>
                  {personalBest && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-800">
                        Personal best: {personalBest.species} · {personalBest.weight} lbs
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  {catches.length === 0 ? (
                    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-center text-slate-400">
                      <Mahi className="h-9 w-9 text-[#d8bf82]" />
                      <p className="text-sm">No catches logged yet. Land one and brag about it.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#eef6f7]">
                      {catches.map((c) => {
                        const isBest = personalBest?.id === c.id;
                        return (
                          <div key={c.id} className="flex items-center gap-3 py-2.5">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isBest ? "bg-amber-100 text-amber-600" : "bg-[#f4e9c8] text-[#8a6a1a]"}`}>
                              {isBest ? <Trophy className="h-4 w-4" /> : <Mahi className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-sm font-bold text-slate-800">
                                {c.species} {c.weight > 0 && <span className="text-slate-500">· {c.weight} lbs</span>}
                              </p>
                              <p className="text-xs text-slate-500">{c.spot} · {c.date}</p>
                            </div>
                            <button onClick={() => removeCatch(c.id)} className="text-slate-300 hover:text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== DREAM BOAT FINDER ===== */}
          <section>
            <SectionTitle icon={Boat} title="Dream Boat Finder" />
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardContent className="p-5 space-y-5">
                  <FinderGroup label="Where do you want to fish?" opts={FINDER_Q.water} value={water} onPick={setWater} />
                  <FinderGroup label="What's your style?" opts={FINDER_Q.vibe} value={vibe} onPick={setVibe} />
                  {!dreamBoat && (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <Sparkles className="h-4 w-4 text-[#c79a3b]" /> Pick both to reveal your dream boat.
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="overflow-hidden shadow-sm">
                {dreamBoat ? (
                  <div>
                    <div className="relative h-44 w-full overflow-hidden">
                      <img src={dreamBoat.img} alt={dreamBoat.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1116]/70 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="font-display text-lg font-bold text-white drop-shadow">{dreamBoat.name}</p>
                        <p className="text-xs text-amber-50/90">{dreamBoat.tagline}</p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <Spec label="Length" value={dreamBoat.length} />
                        <Spec label="Water" value={dreamBoat.water} />
                        <Spec label="Best for" value={dreamBoat.best} />
                      </div>
                    </CardContent>
                  </div>
                ) : (
                  <CardContent className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
                    <Boat className="h-10 w-10 text-[#d8bf82]" />
                    <p className="text-sm">Your dream boat will surface here.</p>
                  </CardContent>
                )}
              </Card>
            </div>
          </section>

          {/* ===== DREAM BOARD + DRAG-TO-FEED ===== */}
          <section>
            <SectionTitle icon={Mahi} title="Fishing Dream Board" hint="drag a pinned card into the feed to share it" />
            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              {/* board */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {DREAM_IDEAS.map((d) => {
                  const pinned = pins.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      draggable={pinned}
                      onDragStart={() => { dragId.current = d.id; }}
                      onClick={() => togglePin(d.id)}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4 text-left transition-all ${
                        pinned ? "border-[#c79a3b] bg-gradient-to-br from-[#f6edd2] to-white shadow-md active:cursor-grabbing" : "border-[#efe0b8] bg-white hover:border-[#e0b24a] hover:shadow-sm"
                      }`}
                      title={pinned ? "Drag me into the feed →" : "Tap to pin"}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded bg-[#f4e9c8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8a6a1a]">{d.kind}</span>
                        {pinned ? <Pin className="h-4 w-4 fill-[#c79a3b] text-[#c79a3b]" /> : <PinOff className="h-4 w-4 text-slate-300 group-hover:text-[#e0b24a]" />}
                      </div>
                      <p className="font-display text-sm font-bold leading-snug text-slate-800">{d.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{d.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* live mock feed (drop target) */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  const d = DREAM_IDEAS.find((x) => x.id === dragId.current);
                  if (d) shareToFeed(d);
                  dragId.current = null;
                }}
                className={`flex flex-col rounded-xl border-2 border-dashed p-3 transition-colors ${dragOver ? "border-[#c79a3b] bg-[#f6edd2]" : "border-[#efe0b8] bg-white/60"}`}
              >
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f4e9c8] text-[#8a6a1a]"><Share2 className="h-4 w-4" /></span>
                  <p className="font-display text-sm font-bold text-slate-800">Dock Feed</p>
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                  </span>
                </div>
                <p className="mb-2 px-1 text-[11px] text-slate-400">Simulated activity from around the docks. Drop a pinned dream here to post it.</p>
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {feed.map((it) => (
                    <div key={it.id} className={`rounded-lg border p-2.5 ${it.mine ? "border-[#c79a3b] bg-[#eafafa]" : "border-[#e0eff1] bg-white"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${it.mine ? "bg-[#c79a3b]" : "bg-[#c2a566]"}`}>
                          {it.author.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{it.author}</span>
                        <span className="ml-auto rounded bg-[#f4e9c8] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#8a6a1a]">{it.kind}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{it.text}</p>
                      <button onClick={() => likeItem(it.id)} className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#ef6a1f]">
                        <Heart className="h-3 w-3" /> {it.likes}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ===== BUCKET LIST TRIPS ===== */}
          <section>
            <SectionTitle icon={MapPin} title="Bucket-List Trips" hint="someday waters" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TRIPS.map((t) => {
                const done = doneTrips.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTrip(t.id)}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${done ? "border-[#c79a3b] bg-gradient-to-br from-[#f6edd2] to-white" : "border-[#efe0b8] bg-white hover:border-[#e0b24a] hover:shadow-sm"}`}
                  >
                    {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#c79a3b]" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
                    <div className="min-w-0">
                      <p className={`font-display text-sm font-bold ${done ? "text-[#8a6a1a] line-through" : "text-slate-800"}`}>{t.place}</p>
                      <p className="text-xs font-medium text-[#c79a3b]">{t.target}</p>
                      <p className="text-xs text-slate-500">{t.note}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {doneTrips.length > 0 ? `${doneTrips.length} of ${TRIPS.length} checked off — saved on this device.` : "Tap a trip when you've made it happen."}
            </p>
          </section>

          {/* ===== KNOTS + BEST BITE ===== */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div>
              <SectionTitle icon={Hook} title="Knot Locker" />
              <Card className="shadow-sm">
                <CardContent className="divide-y divide-[#eef6f7] p-2">
                  {KNOTS.map((k) => (
                    <div key={k.name} className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-sm font-bold text-slate-800">{k.name}</p>
                        <span className="rounded bg-[#f4e9c8] px-1.5 py-0.5 text-[10px] font-semibold text-[#8a6a1a]">{k.use}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{k.steps}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div>
              <SectionTitle icon={TideGauge} title="Best Bite Windows" hint="general solunar rule of thumb" />
              <Card className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <BiteRow label="Dawn" sub="First light ± 1 hr" rating={5} />
                  <BiteRow label="Dusk" sub="Last light ± 1 hr" rating={5} />
                  <BiteRow label="Tide changes" sub="Around the turn, moving water" rating={4} />
                  <BiteRow label="Midday" sub="Sun high, slow water" rating={2} />
                  <p className="text-[11px] text-slate-400">
                    Rule of thumb: fish the moving water and the low-light edges. Pair with the live Tide Chart on Today's Catch for the day's actual highs and lows.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ===== DOCKSIDE RADIO (Spotify) ===== */}
          <section>
            <SectionTitle icon={Music2} title="Dockside Radio" hint="powered by Spotify" />
            <div className="mb-3 flex flex-wrap gap-2">
              {STATIONS.map((s) => {
                const active = station.id === s.id;
                return (
                  <button key={s.id} onClick={() => setStation(s)} className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-all ${active ? "border-[#c79a3b] bg-gradient-to-br from-[#f6edd2] to-white shadow-md" : "border-[#efe0b8] bg-white hover:border-[#e0b24a] hover:shadow-sm"}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${active ? (s.party ? "bg-[#ff7a1a] text-white" : "bg-[#c79a3b] text-white") : "bg-[#f4e9c8] text-[#8a6a1a]"}`}>
                      {active ? <Play className="h-4 w-4 translate-x-0.5" /> : s.party ? <Beer className="h-4 w-4" /> : <Music2 className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-slate-800">{s.title}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500"><Waves className="h-3 w-3 text-[#c79a3b]" />{s.mood}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="overflow-hidden rounded-xl border border-[#efe0b8] shadow-sm">
              <iframe
                key={station.id}
                title={`Spotify — ${station.title}`}
                src={`https://open.spotify.com/embed/playlist/${station.playlist}?utm_source=greggos`}
                width="100%" height="352" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy" className="block w-full"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">Sign in to Spotify in your browser for full-length tracks; otherwise you'll hear 30-second previews.</p>
          </section>

          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <Anchor className="h-3.5 w-3.5" /> Tight lines, Captain. Now get back out there.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

/* ---- small presentational helpers ---- */
function SectionTitle({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4e9c8] text-[#8a6a1a]"><Icon className="h-5 w-5" /></span>
      <h2 className="font-display text-xl font-bold text-slate-800">{title}</h2>
      {hint && <span className="text-sm text-slate-400">{hint}</span>}
    </div>
  );
}
function FinderGroup({ label, opts, value, onPick }: { label: string; opts: { v: string; label: string }[]; value: string | null; onPick: (v: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button key={o.v} onClick={() => onPick(o.v)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${value === o.v ? "bg-[#c79a3b] text-white shadow-sm" : "border border-[#efe0b8] bg-white text-slate-700 hover:border-[#e0b24a]"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f1f8f9] px-2 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-700">{value}</p>
    </div>
  );
}
function BiteRow({ label, sub, rating }: { label: string; sub: string; rating: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Mahi key={i} className={`h-3.5 w-3.5 ${i < rating ? "text-[#c79a3b]" : "text-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}
