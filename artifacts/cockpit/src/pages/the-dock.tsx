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
  Volume2,
  VolumeX,
  DoorOpen,
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

// ---- Beer O'Clock prints --------------------------------------------------
// The nine original GREGG bar prints. Both the shuffleable photo stack and the
// bar-wall gallery rotate through this same set of 9 prints.
type GalleryPic = { src: string; caption: string };
const PRINTS: GalleryPic[] = [
  { src: "/gregg-poster-d.jpg", caption: "The Hunt — marlin on, hold fast." },
  { src: "/gregg-poster-a.jpg", caption: "Gone Fishin' — the Florida Keys." },
  { src: "/gregg-pinup-1.jpg", caption: "Sportfishing & Beer — sunset sessions." },
  { src: "/gregg-poster-e.jpg", caption: "Shipshape — keep her bright and proud." },
  { src: "/gregg-poster-b.jpg", caption: "Cold beer, tight lines — the Tiki Dock." },
  { src: "/gregg-pinup-3.jpg", caption: "Cheers to good times at Sunset Cove." },
  { src: "/gregg-poster-f.jpg", caption: "First Light — lines out at dawn." },
  { src: "/gregg-poster-c.jpg", caption: "Sunset cruise — adventure awaits." },
  { src: "/gregg-pinup-2.jpg", caption: "Sunset, suds & sailfish. Cheers, Captain." },
];
const POSTER_TILT = [-2.5, 1.5, -1, 2, -1.5, 1, -2, 1.5, -1];

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
  const [gallery, setGallery] = useState<GalleryPic[]>(PRINTS);
  const nextPic = () => setGallery((g) => [...g.slice(1), g[0]]);
  const shufflePics = () =>
    setGallery((g) => [...g].sort(() => Math.random() - 0.5));

  // when beer mode turns on, auto-swap the radio to a party station,
  // play the cinematic "enter the bar" reveal, and arm the bar ambience.
  const [station, setStation] = useState<Station>(STATIONS[0]);
  const [revealPlaying, setRevealPlaying] = useState(false);
  const [barMuted, setBarMuted] = useState(true);
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const prevBeerRef = useRef(false);

  // ---------- interactive neon marlin sign ----------
  const [marlinOn, setMarlinOn] = useState(true);
  const [marlinIgniteKey, setMarlinIgniteKey] = useState(0);
  const buzzRef = useRef<HTMLAudioElement | null>(null);

  // Fire the neon buzz SFX (only makes noise if the buzz element is ready).
  // Volume is respected even when bar ambience is muted, because the buzz is
  // a distinct one-shot; but if the user has explicitly muted, keep it quiet.
  const playBuzz = (volume = 0.45) => {
    const b = buzzRef.current;
    if (!b) return;
    try { b.currentTime = 0; b.volume = volume; b.muted = false; void b.play().catch(() => {}); } catch { /* ignore */ }
  };

  // Ignite the marlin sign: switch it on + retrigger the flicker + buzz.
  const igniteMarlin = (withSound: boolean) => {
    setMarlinOn(true);
    setMarlinIgniteKey((k) => k + 1);
    if (withSound) playBuzz();
  };

  const toggleMarlin = () => {
    setMarlinOn((on) => {
      const next = !on;
      if (next) {
        setMarlinIgniteKey((k) => k + 1); // retrigger ignite flicker
        if (!barMuted) playBuzz();
      }
      return next;
    });
  };

  // Trigger the cinematic reveal and time the neon marlin buzz-on to match
  // the moment the room lights power up (~1.0s into the 3.2s room-lights
  // animation), so it feels like the bar sign igniting as the lights dim.
  const runReveal = () => {
    setRevealPlaying(true);
    setMarlinOn(false); // start dark so it visibly powers up
    // neon buzz-to-life + sound, synced to the lights-on beat
    const ignite = window.setTimeout(() => igniteMarlin(true), 1000);
    const done = window.setTimeout(() => setRevealPlaying(false), 3600);
    return () => { window.clearTimeout(ignite); window.clearTimeout(done); };
  };

  useEffect(() => {
    if (beerMode && !prevBeerRef.current) {
      const party = STATIONS.find((s) => s.party);
      if (party) setStation(party);
      prevBeerRef.current = beerMode;
      return runReveal();
    }
    prevBeerRef.current = beerMode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beerMode]);

  // toggle bar ambience (muted by default; only plays in beer mode)
  const toggleBarAudio = () => {
    const a = ambienceRef.current;
    if (!a) return;
    if (barMuted) {
      a.muted = false;
      a.volume = 0.5;
      a.play().catch(() => { /* autoplay blocked until gesture; this IS a gesture */ });
      setBarMuted(false);
    } else {
      a.pause();
      setBarMuted(true);
    }
  };
  // stop ambience if leaving beer mode
  useEffect(() => {
    if (!beerMode && ambienceRef.current) {
      ambienceRef.current.pause();
      setBarMuted(true);
    }
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
      {/* bar ambience audio (muted until user unmutes) */}
      <audio ref={ambienceRef} src="/bar-ambience.mp3" loop preload="none" />
      <audio ref={buzzRef} src="/neon-buzz.mp3" preload="none" />

      {/* ===== CINEMATIC "ENTER THE PRIVATE BAR" REVEAL ===== */}
      {revealPlaying && (
        <div
          className="bar-reveal fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
          onClick={() => setRevealPlaying(false)}
          role="dialog"
          aria-label="Entering the private bar"
        >
          {/* the bar scene the neon lights up */}
          <img
            src="/gregg-bar-interior.jpg"
            alt=""
            aria-hidden="true"
            className="bar-scene-img absolute inset-0 h-full w-full object-cover"
          />
          {/* warm vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_40%,rgba(0,0,0,0.75))]" />
          {/* big neon sign that buzzes to life */}
          <div className="bar-neon-sign relative z-10 text-center">
            <p className="beer-neon font-display text-5xl font-extrabold uppercase tracking-tight text-[#ffd15a] md:text-7xl">
              Beer O'Clock
            </p>
            <p className="beer-neon mt-2 font-display text-lg font-bold uppercase tracking-[0.3em] text-[#ff9e2c] md:text-2xl">
              Gregg's Private Bar
            </p>
          </div>
          {/* neon marlin buzzing to life in sync with the room lights */}
          <div className="absolute inset-x-0 bottom-[24vh] z-10 flex justify-center">
            <span key={marlinIgniteKey} className={marlinOn ? "marlin-neon-ignite" : ""}>
              <NeonMarlin on={marlinOn} className="h-16 w-32 md:h-20 md:w-40" />
            </span>
          </div>
          {/* cinematic letterbox bars */}
          <div className="bar-letterbox-top pointer-events-none absolute inset-x-0 top-0 h-[16vh] bg-black" />
          <div className="bar-letterbox-bottom pointer-events-none absolute inset-x-0 bottom-0 h-[16vh] bg-black" />
          <p className="bar-enter-pulse absolute bottom-[6vh] left-1/2 z-10 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd15a]/80">
            Tap to enter →
          </p>
        </div>
      )}

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
            <section className="relative overflow-hidden rounded-2xl border border-[#ff7a1a]/40 bg-gradient-to-b from-[#1a0a04] to-[#0a0402] shadow-[0_0_40px_-10px_rgba(255,122,26,0.5)]">
              {/* ---- cinematic bar backdrop banner ---- */}
              <div className="relative h-56 w-full overflow-hidden md:h-72">
                <img
                  src="/gregg-bar-interior.jpg"
                  alt="Gregg's private sportfishing bar"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0402] via-[#0a0402]/40 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_45%,rgba(10,4,2,0.7))]" />
                {/* neon sign + welcome */}
                <div className="absolute inset-x-0 top-5 text-center">
                  <p className="beer-neon font-display text-3xl font-extrabold uppercase tracking-tight text-[#ffd15a] md:text-5xl">
                    Beer O'Clock
                  </p>
                  <p className="beer-neon mt-1 text-[11px] font-bold uppercase tracking-[0.3em] text-[#ff9e2c] md:text-sm">
                    Gregg's Private Bar
                  </p>
                </div>
                {/* ambience toggle */}
                <button
                  onClick={toggleBarAudio}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#ffd15a]/40 bg-black/50 px-3 py-1.5 text-xs font-semibold text-[#ffd15a] backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  {barMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  {barMuted ? "Bar ambience off" : "Bar ambience on"}
                </button>
                {/* re-play the cinematic entrance */}
                <button
                  onClick={() => runReveal()}
                  className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-[#ffd15a]/40 bg-black/50 px-3 py-1.5 text-xs font-semibold text-[#ffd15a] backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <DoorOpen className="h-3.5 w-3.5" /> Re-enter the bar
                </button>
                {/* interactive neon marlin sign — click to flip it on/off */}
                <button
                  onClick={toggleMarlin}
                  title={marlinOn ? "Neon sign: ON — click to switch off" : "Neon sign: OFF — click to buzz it on"}
                  aria-pressed={marlinOn}
                  className="group absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 backdrop-blur-sm transition-colors hover:bg-black/60"
                >
                  <span key={marlinIgniteKey} className={marlinOn ? "marlin-neon-ignite" : ""}>
                    <NeonMarlin on={marlinOn} className="h-8 w-16" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60 group-hover:text-white/90">
                    {marlinOn ? "Sign On" : "Sign Off"}
                  </span>
                </button>

                {/* rotating toast on the counter */}
                <p key={toastIdx} className="beer-cheers pointer-events-none absolute inset-x-0 bottom-4 px-32 text-center text-sm font-semibold text-[#ffd15a] md:text-base">
                  {BEER_TOASTS[toastIdx]}
                </p>
              </div>

              <div className="relative p-5 md:p-7">
              {/* neon glow blobs */}
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#ff7a1a]/25 blur-3xl" />
              <div className="pointer-events-none absolute -right-10 bottom-0 h-52 w-52 rounded-full bg-[#e0531a]/20 blur-3xl" />

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

              {/* ---- pin-up poster wall ---- */}
              <div className="relative mt-8">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ffb15a]">
                  <Beer className="h-4 w-4" /> On the bar walls
                  <span className="ml-1 rounded-full bg-[#ff7a1a]/20 px-2 py-0.5 text-[10px] font-bold text-[#ffd15a]">9 prints</span>
                </p>
                <div className="grid grid-cols-3 gap-3 md:gap-5 lg:grid-cols-9">
                  {PRINTS.map((p, i) => (
                    <div
                      key={p.src}
                      title={p.caption}
                      className="group relative aspect-[3/4] overflow-hidden rounded-md border-[3px] border-[#2a1a0c] bg-black shadow-[0_10px_26px_-8px_rgba(0,0,0,0.85)] ring-1 ring-[#e6c25a]/20 transition-transform duration-300 hover:z-10 hover:!rotate-0 hover:scale-[1.08]"
                      style={{ transform: `rotate(${POSTER_TILT[i] ?? 0}deg)` }}
                    >
                      <img src={p.src} alt={p.caption} className="h-full w-full object-cover" />
                      {/* framed glass sheen */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/10" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-[#ffb15a]/60">Nine original GREGG bar prints. Hover a print for a closer look.</p>
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

/* ---- interactive neon marlin sign ---- */
function NeonMarlin({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg
      className={`${className ?? ""} ${on ? "marlin-neon-on marlin-neon-buzz" : "marlin-neon-off"}`}
      viewBox="0 0 120 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* neon tubing marlin: bill, body, sail fin, forked tail */}
      <g
        stroke={on ? "#5fe7e7" : "#2a4a4d"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {/* long bill */}
        <path d="M4 34 L34 30" />
        {/* body */}
        <path d="M34 30 C 48 20, 78 20, 96 30 C 84 36, 60 40, 40 36 Z" />
        {/* tall sail dorsal fin */}
        <path d="M44 24 C 50 8, 66 8, 74 22" />
        {/* forked tail */}
        <path d="M96 30 L112 20 M96 30 L112 40" />
        {/* eye */}
        <circle cx="40" cy="30" r="1.6" fill={on ? "#eafcff" : "#2a4a4d"} stroke="none" />
      </g>
    </svg>
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
