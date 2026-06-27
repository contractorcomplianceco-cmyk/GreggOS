import { useEffect, useMemo, useRef, useState } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  Pin,
  PinOff,
  Anchor,
  Music2,
  Sparkles,
} from "lucide-react";
import { Boat, Waves, Mahi } from "@/components/icons/CoastalIcons";

/* ------------------------------------------------------------------ *
 * The Dock — a relaxed, off-the-clock corner of GreggOS.
 * Dream Boat Finder + Fishing Dream Board + Dockside Player.
 * Pure front-end fun; nothing here touches CRM/company data.
 * ------------------------------------------------------------------ */

// ---- Dream Boat Finder data ----------------------------------------------
type BoatStyle = {
  id: string;
  name: string;
  tagline: string;
  img: string;
  water: string;
  length: string;
  best: string;
};
const BOATS: BoatStyle[] = [
  {
    id: "center-console",
    name: "Bluewater Center Console",
    tagline: "The do-everything offshore weapon.",
    img: "/boat-center-console.jpg",
    water: "Nearshore & offshore",
    length: "32–39 ft",
    best: "Reef, wreck & pelagic runs",
  },
  {
    id: "sportfisher",
    name: "Convertible Sportfisher",
    tagline: "The big-game battlewagon with a tuna tower.",
    img: "/boat-sportfisher.jpg",
    water: "Deep offshore / canyons",
    length: "55–70 ft",
    best: "Marlin, tuna, overnight trips",
  },
  {
    id: "flats-skiff",
    name: "Skinny-Water Flats Skiff",
    tagline: "Silent, shallow, and deadly on the flats.",
    img: "/boat-flats-skiff.jpg",
    water: "Inshore flats & mangroves",
    length: "16–18 ft",
    best: "Redfish, snook, tarpon, bonefish",
  },
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

// ---- Dream Board (localStorage) ------------------------------------------
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
const LS_KEY = "greggos.dreamboard.v1";

function loadPins(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

// ---- Dockside Player ------------------------------------------------------
type Track = { id: string; title: string; mood: string; src: string };
const TRACKS: Track[] = [
  { id: "calm", title: "Calm Seas", mood: "Slow & dreamy", src: "/tune-calm-seas.mp3" },
  { id: "reel", title: "Reel It In", mood: "Upbeat dockside", src: "/tune-reel-it-in.mp3" },
  { id: "sunset", title: "Sunset Dock", mood: "Warm & easy", src: "/tune-sunset-dock.mp3" },
];

export default function TheDock() {
  // finder state
  const [water, setWater] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);
  const dreamBoat = useMemo(
    () => (water && vibe ? matchBoat(water, vibe) : null),
    [water, vibe],
  );

  // dream board state
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => setPins(loadPins()), []);
  const togglePin = (id: string) => {
    setPins((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = (t: Track) => {
    if (!audioRef.current) return;
    if (current === t.id && playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    if (current !== t.id) {
      audioRef.current.src = t.src;
      setCurrent(t.id);
    }
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => setPlaying(false);
    a.addEventListener("ended", onEnd);
    return () => a.removeEventListener("ended", onEnd);
  }, []);

  return (
    <SidebarLayout>
      <div className="min-h-full bg-[#eef6f7] text-slate-900 font-sans text-[15px] leading-relaxed">
        <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-8">
          <DashboardHero
            eyebrow="The Dock"
            greeting="Lines in, worries out."
            subtitle="Your off-the-clock corner of GreggOS. Dream up your next boat, pin the trips and catches you're chasing, and put on something easy while you do it."
          />

          {/* hidden audio element shared by the player */}
          <audio ref={audioRef} preload="none" />

          {/* DREAM BOAT FINDER */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dbf0f2] text-[#0d6473]">
                <Boat className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl font-bold text-slate-800">
                Dream Boat Finder
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardContent className="p-5 space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Where do you want to fish?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FINDER_Q.water.map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setWater(o.v)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            water === o.v
                              ? "bg-[#15a3b0] text-white shadow-sm"
                              : "border border-[#cfe6e9] bg-white text-slate-700 hover:border-[#5fc6d0]"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      What's your style?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FINDER_Q.vibe.map((o) => (
                        <button
                          key={o.v}
                          onClick={() => setVibe(o.v)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            vibe === o.v
                              ? "bg-[#15a3b0] text-white shadow-sm"
                              : "border border-[#cfe6e9] bg-white text-slate-700 hover:border-[#5fc6d0]"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!dreamBoat && (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <Sparkles className="h-4 w-4 text-[#15a3b0]" />
                      Pick both to reveal your dream boat.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* result */}
              <Card className="overflow-hidden shadow-sm">
                {dreamBoat ? (
                  <div>
                    <div className="relative h-44 w-full overflow-hidden">
                      <img
                        src={dreamBoat.img}
                        alt={dreamBoat.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#062029]/70 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="font-display text-lg font-bold text-white drop-shadow">
                          {dreamBoat.name}
                        </p>
                        <p className="text-xs text-cyan-50/90">{dreamBoat.tagline}</p>
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
                    <Boat className="h-10 w-10 text-[#9cc7cd]" />
                    <p className="text-sm">Your dream boat will surface here.</p>
                  </CardContent>
                )}
              </Card>
            </div>
          </section>

          {/* FISHING DREAM BOARD */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dbf0f2] text-[#0d6473]">
                <Mahi className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl font-bold text-slate-800">
                Fishing Dream Board
              </h2>
              <span className="text-sm text-slate-400">
                pin the trips, boats & catches you're chasing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {DREAM_IDEAS.map((d) => {
                const pinned = pins.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => togglePin(d.id)}
                    className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                      pinned
                        ? "border-[#15a3b0] bg-gradient-to-br from-[#dff3f5] to-white shadow-md"
                        : "border-[#cfe6e9] bg-white hover:border-[#5fc6d0] hover:shadow-sm"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded bg-[#dbf0f2] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0d6473]">
                        {d.kind}
                      </span>
                      {pinned ? (
                        <Pin className="h-4 w-4 fill-[#15a3b0] text-[#15a3b0]" />
                      ) : (
                        <PinOff className="h-4 w-4 text-slate-300 group-hover:text-[#5fc6d0]" />
                      )}
                    </div>
                    <p className="font-display text-sm font-bold leading-snug text-slate-800">
                      {d.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{d.sub}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {pins.length > 0
                ? `${pins.length} pinned to your board — saved on this device.`
                : "Tap a card to pin it to your board. Your picks are saved on this device."}
            </p>
          </section>

          {/* DOCKSIDE PLAYER */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dbf0f2] text-[#0d6473]">
                <Music2 className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl font-bold text-slate-800">
                Dockside Tunes
              </h2>
              <span className="text-sm text-slate-400">easy originals, royalty-free</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {TRACKS.map((t) => {
                const active = current === t.id && playing;
                return (
                  <button
                    key={t.id}
                    onClick={() => play(t)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#15a3b0] bg-gradient-to-br from-[#dff3f5] to-white shadow-md"
                        : "border-[#cfe6e9] bg-white hover:border-[#5fc6d0] hover:shadow-sm"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                        active ? "bg-[#15a3b0] text-white" : "bg-[#dbf0f2] text-[#0d6473]"
                      }`}
                    >
                      {active ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 translate-x-0.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-slate-800">
                        {t.title}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Waves className="h-3 w-3 text-[#15a3b0]" />
                        {t.mood}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <Anchor className="h-3.5 w-3.5" />
            Tight lines, Captain. Now get back out there.
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f1f8f9] px-2 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-700">{value}</p>
    </div>
  );
}
