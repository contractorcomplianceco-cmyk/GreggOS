import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Compass, Target, ArrowRight, Anchor } from "lucide-react";
import { Link } from "wouter";
import { CoastalHeaderFX } from "@/components/layout/CoastalHeaderFX";

const WALKTHROUGH_STEPS: { title: string; body: string }[] = [
  {
    title: "Check the tides at Today's Catch",
    body: "Your bridge. Scan the day's priorities, escalations, and the relationship lane — touches due, visits this week, accounts drifting cold, and the biggest fish in the pipeline.",
  },
  {
    title: "Reel in the call notes",
    body: "Haul raw RingCentral notes aboard and turn them into clean, CRM-ready summaries with clear next actions, bites worth chasing, and escalation flags.",
  },
  {
    title: "Tend your lines",
    body: "Watch warmth and cadence on every account. Log touches and plan the next visit or call before a fish slips off the hook.",
  },
  {
    title: "Cast the net wider",
    body: "Work the auto-prioritized pipeline. Move milestones forward, pin the keepers, and approve deals for CRM export.",
  },
  {
    title: "Tally the weekly haul",
    body: "Bring it all to the dock: review the week's catch, draft communications, and prep leadership reporting.",
  },
];

export default function WelcomeCenter() {
  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* HERO — real golden-hour ocean photo */}
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-white shadow-xl ring-1 ring-[#15a3b0]/30 mb-8 min-h-[260px] flex items-end">
          <img
            src="/img-hero-ocean.jpg"
            alt="Sunset over the water from a sportfishing boat"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <CoastalHeaderFX variant="dark" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062029]/90 via-[#062029]/55 to-transparent" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5fe7e7] flex items-center gap-2">
              <Anchor className="h-3.5 w-3.5" /> Welcome Aboard
            </p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold tracking-tight drop-shadow">
              Welcome aboard the GreggOS deck
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-cyan-50/95 drop-shadow">
              Grab your gear. Watch the walkthrough, learn the waters, and take the
              helm of the system built to keep every client on the line and every
              dollar in the boat.
            </p>
            <Link href="/">
              <span className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25">
                Head to Today's Catch
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>

        {/* EMBEDDED WALKTHROUGH VIDEO */}
        <Card className="mb-8 overflow-hidden shadow-md ring-1 ring-slate-200">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#072a33] to-[#0d4a57] px-6 py-4 text-white">
              <PlayCircle className="h-5 w-5 text-[#5fe7e7]" />
              <h2 className="font-semibold">Captain's walkthrough</h2>
            </div>
            <div className="aspect-video w-full bg-slate-950">
              <iframe
                src="/cockpit-walkthrough/"
                title="Cockpit Walkthrough"
                className="h-full w-full border-0"
                allow="autoplay; fullscreen"
                data-testid="iframe-walkthrough"
              />
            </div>
          </CardContent>
        </Card>

        {/* STEP-BY-STEP */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#15a3b0]" />
            <h2 className="font-semibold text-foreground">
              Chart your course, step by step
            </h2>
          </div>
          <div className="space-y-3">
            {WALKTHROUGH_STEPS.map((step, i) => (
              <Card key={step.title} className="shadow-sm ring-1 ring-slate-200/70">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0d4a57] to-[#15a3b0] font-semibold tabular-nums text-white shadow-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* WHY IT MATTERS */}
        <Card className="shadow-sm ring-1 ring-slate-200/70">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#15a3b0]" />
              <h2 className="font-semibold text-foreground">Why we fish these waters</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Current clients are the home waters of the business. Every
              relationship you protect compounds — in renewals, expansion, and
              referrals. This deck exists to make sure nothing slips the net: no
              concern unheard, no commitment forgotten, no account left to drift
              cold. You bring the judgment; the system keeps the lines tight. This
              app organizes and drafts — it never approves pricing, refunds, legal
              advice, compliance opinions, or final client commitments.
            </p>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
