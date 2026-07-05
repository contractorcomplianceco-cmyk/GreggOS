import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Compass, Target, ArrowRight, Pin } from "lucide-react";
import { Link } from "wouter";
import { Mahi, Hook, TideGauge, Net, Boat } from "@/components/icons/CoastalIcons";

type Step = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
  cta: string;
};

// Steps mirror the live navigation so the instructions are always correct.
const WALKTHROUGH_STEPS: Step[] = [
  {
    icon: Mahi,
    title: "Start at Today's Catch",
    body: "Your bridge. The animated hero shows the day at a glance — Tangled Lines, Storm Warnings, your catch list, and lines to tend. Chips turn coral when something needs you, and a trophy pops when the board is clean. Below it: critical signals, the live Tide Chart, and your action panels.",
    href: "/",
    cta: "Open Today's Catch",
  },
  {
    icon: Hook,
    title: "Reel in your call notes",
    body: "Head to On the Water → Reel In Call Notes. Paste raw RingCentral notes and turn them into clean, CRM-ready summaries with clear next actions, opportunities worth chasing, and escalation flags. Nothing is sent automatically — you review first.",
    href: "/processor",
    cta: "Go to Call Notes",
  },
  {
    icon: TideGauge,
    title: "Watch the tide & conditions",
    body: "The Tide Chart panel pulls live water levels from the nearest NOAA station — current level, rising or falling, and the next high and low. The whole hero even shifts from cool teal to warm coral as the real sea-surface temperature changes through the seasons.",
    href: "/",
    cta: "See the Tide Chart",
  },
  {
    icon: Net,
    title: "Cast the net wider",
    body: "Casting & Nets → The Net is your auto-prioritized expansion pipeline, ranked by value, stage, target date, warmth, and risk. Pin the keepers, boost what matters, and approve deals for CRM export when they're ready.",
    href: "/expansion",
    cta: "Work The Net",
  },
  {
    icon: Compass,
    title: "Tend the lines & tally the haul",
    body: "Deckhands & Allies keeps every relationship warm — log touches before an account drifts cold. Then Weekly Haul brings it all to the dock: review the week, draft communications, and prep leadership reporting.",
    href: "/relationships",
    cta: "Tend the Lines",
  },
  {
    icon: Boat,
    title: "Knock off at The Dock",
    body: "When the work's done, Tackle Box → The Dock is your off-the-clock corner: a Dream Boat Finder, a pinnable Fishing Dream Board, and a few easy dockside tunes. Tight lines, Captain.",
    href: "/the-dock",
    cta: "Visit The Dock",
  },
];

export default function WelcomeCenter() {
  return (
    <SidebarLayout>
      <div className="min-h-full bg-[#f6f1e6] text-[15px] leading-relaxed">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          {/* GREGG brand badge — centerpiece */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(239,106,31,0.28),transparent_70%)] blur-xl" />
              <img
                src="/gregg-badge.png"
                alt="GREGG — Fishing, Boats & Hoes"
                className="relative h-44 w-44 rounded-full object-cover ring-4 ring-[#e6c25a]/70 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.55)] md:h-56 md:w-56"
              />
            </div>
            <p className="mt-4 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              <span className="bg-gradient-to-b from-[#d9ad3f] via-[#c79a3b] to-[#9a7318] bg-clip-text text-transparent">GREGG OS</span>
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a5701f]">
              Boats · Business · Tight Lines
            </p>
          </div>

          {/* shared animated coastal hero */}
          <div className="mb-8">
            <DashboardHero
              eyebrow="Welcome Aboard"
              greeting="Welcome aboard the GREGG OS deck"
              photo="/dock-sunset-canoe.jpg"
              subtitle="Grab your gear. Watch the walkthrough, learn the waters, and take the helm of the cockpit built to keep every client on the line and every dollar in the boat."
              action={
                <Link href="/">
                  <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25">
                    Head to Today's Catch
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              }
            />
          </div>

          {/* START HERE — pinned section-by-section walkthrough */}
          <Card className="mb-8 overflow-hidden shadow-lg ring-2 ring-[#ef6a1f]/40">
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center gap-2 bg-gradient-to-r from-[#3a2f14] to-[#c79a3b] px-6 py-4 text-white">
                <span className="flex items-center gap-1.5 rounded-full bg-[#ef6a1f] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  <Pin className="h-3.5 w-3.5" /> Start Here
                </span>
                <Compass className="h-5 w-5 text-[#f0e2b0]" />
                <h2 className="font-display text-lg font-bold">Your guided tour of the cockpit</h2>
                <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-[#f8f0d8]">
                  Sound on · 1:40
                </span>
              </div>
              <div className="aspect-video w-full bg-slate-950">
                <video
                  className="h-full w-full"
                  src="/walkthrough-video.mp4"
                  poster="/walkthrough-poster.jpg"
                  controls
                  playsInline
                  preload="metadata"
                  data-testid="video-walkthrough-tour"
                />
              </div>
              <div className="flex items-center gap-2 px-6 py-3 text-sm text-slate-500">
                <Compass className="h-4 w-4 text-[#c79a3b]" />
                New to GreggOS? Watch this first — it walks you through all six sections and how to use each one.
              </div>
            </CardContent>
          </Card>

          {/* CINEMATIC WELCOME VIDEO */}
          <Card className="mb-8 overflow-hidden shadow-lg ring-1 ring-[#c79a3b]/30">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#160f05] to-[#3a2f14] px-6 py-4 text-white">
                <PlayCircle className="h-5 w-5 text-[#e6c25a]" />
                <h2 className="font-display text-lg font-bold">Welcome to GREGG OS — with your first mate</h2>
                <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-[#e6c25a]">
                  Sound on · 34s
                </span>
              </div>
              <div className="aspect-video w-full bg-slate-950">
                <video
                  className="h-full w-full"
                  src="/welcome-video.mp4"
                  poster="/welcome-poster.jpg"
                  controls
                  playsInline
                  preload="metadata"
                  data-testid="video-welcome"
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP-BY-STEP — now matches the live navigation */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Compass className="h-6 w-6 text-[#c79a3b]" />
              <h2 className="font-display text-xl font-bold text-foreground">
                Chart your course, step by step
              </h2>
            </div>
            <div className="space-y-3">
              {WALKTHROUGH_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="shadow-sm ring-1 ring-slate-200/70 transition-shadow hover:shadow-md">
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3a2f14] to-[#c79a3b] text-white shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tabular-nums text-[#c79a3b]">
                            Step {i + 1}
                          </span>
                        </div>
                        <p className="font-display text-base font-bold text-foreground">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {step.body}
                        </p>
                        <Link href={step.href}>
                          <span className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#8a6a1a] hover:text-[#c79a3b]">
                            {step.cta}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* WHY IT MATTERS */}
          <Card className="shadow-sm ring-1 ring-slate-200/70">
            <CardContent className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-6 w-6 text-[#c79a3b]" />
                <h2 className="font-display text-xl font-bold text-foreground">
                  Why we fish these waters
                </h2>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                Current clients are the home waters of the business. Every
                relationship you protect compounds — in renewals, expansion, and
                referrals. This deck exists to make sure nothing slips the net: no
                concern unheard, no commitment forgotten, no account left to drift
                cold. You bring the judgment; the cockpit keeps the lines tight. It
                organizes and drafts — it never approves pricing, refunds, legal
                advice, compliance opinions, or final client commitments.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
