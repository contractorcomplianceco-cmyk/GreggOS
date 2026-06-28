import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Compass, Target, ArrowRight } from "lucide-react";
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
      <div className="min-h-full bg-[#eef6f7] text-[15px] leading-relaxed">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          {/* shared animated coastal hero */}
          <div className="mb-8">
            <DashboardHero
              eyebrow="Welcome Aboard"
              greeting="Welcome aboard the GreggOS deck"
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

          {/* CINEMATIC WALKTHROUGH VIDEO */}
          <Card className="mb-8 overflow-hidden shadow-lg ring-1 ring-[#15a3b0]/30">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#072a33] to-[#0d4a57] px-6 py-4 text-white">
                <PlayCircle className="h-5 w-5 text-[#5fe7e7]" />
                <h2 className="font-display text-lg font-bold">Captain's walkthrough</h2>
                <span className="ml-auto text-xs font-semibold uppercase tracking-wide text-[#9fdfe2]">
                  Sound on · 33s
                </span>
              </div>
              <div className="aspect-video w-full bg-slate-950">
                <video
                  className="h-full w-full"
                  src="/cockpit-walkthrough.mp4"
                  poster="/walkthrough-poster.jpg"
                  controls
                  playsInline
                  preload="metadata"
                  data-testid="video-walkthrough"
                />
              </div>
            </CardContent>
          </Card>

          {/* STEP-BY-STEP — now matches the live navigation */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Compass className="h-6 w-6 text-[#15a3b0]" />
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0d4a57] to-[#15a3b0] text-white shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tabular-nums text-[#15a3b0]">
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
                          <span className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#0d6473] hover:text-[#15a3b0]">
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
                <Target className="h-6 w-6 text-[#15a3b0]" />
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
