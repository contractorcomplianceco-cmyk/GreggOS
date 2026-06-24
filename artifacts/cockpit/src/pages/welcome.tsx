import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Compass, Target, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const WALKTHROUGH_STEPS: { title: string; body: string }[] = [
  {
    title: "Start at Gregg Today",
    body: "Your command center. Review priorities, escalations, and the relationship lane — touches due, visits this week, accounts going cold, and top expansion.",
  },
  {
    title: "Process the call notes",
    body: "Turn raw RingCentral notes into clean, CRM-ready summaries with clear next actions, opportunity signals, and escalation flags.",
  },
  {
    title: "Tend relationships",
    body: "Watch warmth and cadence. Log touches and plan the next visit or call before an account cools off.",
  },
  {
    title: "Drive expansion",
    body: "Work the auto-prioritized pipeline. Move milestones forward, pin what matters, and approve deals for CRM export.",
  },
  {
    title: "Run the weekly review",
    body: "Close the loop: review the week, draft communications, and prepare leadership reporting.",
  },
];

export default function WelcomeCenter() {
  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* HERO — deeper navy → azure for dimension */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#072a33] via-[#0d4a57] to-[#15a3b0] p-8 text-white shadow-xl ring-1 ring-[#15a3b0]/30 mb-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#15a3b0]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9fd8ff]">
              Welcome Center
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
              Welcome to your GreggOS cockpit
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-blue-100/90">
              Start here. Watch the walkthrough, learn the flow, and step into the
              system built to protect your relationships and revenue.
            </p>
            <Link href="/">
              <span className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/20">
                Go to Gregg Today
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>

        {/* EMBEDDED WALKTHROUGH VIDEO */}
        <Card className="mb-8 overflow-hidden shadow-md ring-1 ring-slate-200">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#072a33] to-[#0d4a57] px-6 py-4 text-white">
              <PlayCircle className="h-5 w-5 text-[#15a3b0]" />
              <h2 className="font-semibold">Executive walkthrough</h2>
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
              Step-by-step system explanation
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
              <h2 className="font-semibold text-foreground">Why this matters</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Current clients are the foundation of the business. Every
              relationship you protect compounds — in renewals, expansion, and
              referrals. The cockpit exists to make sure nothing falls through the
              cracks: no concern unheard, no commitment forgotten, no account left
              to go cold. You bring the judgment; the system keeps the
              follow-through tight. This app organizes and drafts — it never
              approves pricing, refunds, legal advice, compliance opinions, or
              final client commitments.
            </p>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
