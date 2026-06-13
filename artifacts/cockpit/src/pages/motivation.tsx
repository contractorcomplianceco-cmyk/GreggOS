import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Compass, Target, Quote } from "lucide-react";

const DAILY_MESSAGES = [
  "You are not managing tasks. You are protecting relationships and revenue stability.",
  "Every call you process is a client who feels heard. That is the work.",
  "Speed protects trust. The faster the follow-through, the stronger the relationship.",
  "You don't chase clients. You steward the ones who already chose us.",
  "Risk caught early is revenue saved. Stay one step ahead.",
  "Expansion is just retention with ambition. Deepen before you widen.",
  "The cockpit organizes the noise so you can lead with judgment.",
];

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

export default function Motivation() {
  const message = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000,
    );
    return DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length]!;
  }, []);

  return (
    <SidebarLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <header className="border-b border-border pb-6 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Onboarding &amp; Mindset
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mt-2">
            Walkthrough &amp; Motivation
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            A guided tour of the cockpit and the mindset behind it. This is your
            executive operating system for protecting relationships and revenue.
          </p>
        </header>

        <Card className="shadow-sm mb-8 bg-primary text-primary-foreground overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <Quote className="h-8 w-8 shrink-0 opacity-80" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                  Today's message
                </p>
                <p className="mt-2 text-xl font-medium leading-snug">
                  {message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-foreground">
                Executive walkthrough
              </h2>
            </div>
            <div className="aspect-video w-full rounded-lg bg-muted flex flex-col items-center justify-center text-center px-6">
              <PlayCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Walkthrough video placeholder
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-md">
                A script-driven onboarding tour will live here. For now, follow
                the step-by-step system explanation below.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="h-5 w-5 text-accent" />
            <h2 className="font-semibold text-foreground">
              Step-by-step system explanation
            </h2>
          </div>
          <div className="space-y-3">
            {WALKTHROUGH_STEPS.map((step, i) => (
              <Card key={step.title} className="shadow-sm">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold tabular-nums">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-foreground">Why this matters</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Current clients are the foundation of the business. Every
              relationship you protect compounds — in renewals, expansion, and
              referrals. The cockpit exists to make sure nothing falls through
              the cracks: no concern unheard, no commitment forgotten, no account
              left to go cold. You bring the judgment; the system keeps the
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
