import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Target } from "lucide-react";
import {
  MOTIVATION_MESSAGES,
  currentMotivationSlot,
  motivationMessageForSlot,
} from "@/lib/motivation";

export default function Motivation() {
  const slot = useMemo(() => currentMotivationSlot(), []);
  const message = motivationMessageForSlot(slot);

  return (
    <SidebarLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <PageHeader
          tag="Daily Tide Wisdom"
          title="Daily Motivation"
          subtitle="The mindset behind the cockpit. A focus line surfaces across your pages throughout the day — here is the full set."
        />

        {/* TODAY'S MESSAGE — deeper navy → azure for dimension */}
        <Card className="mb-8 overflow-hidden shadow-md ring-1 ring-[#15a3b0]/30">
          <CardContent className="relative bg-gradient-to-br from-[#072a33] via-[#0d4a57] to-[#15a3b0] p-8 text-white">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#15a3b0]/30 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <Quote className="h-8 w-8 shrink-0 text-[#9fd8ff]" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#9fd8ff]">
                  {slot.greeting} &middot; Today's focus
                </p>
                <p className="mt-2 text-xl font-medium leading-snug text-blue-50">
                  {message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FULL SET */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {MOTIVATION_MESSAGES.map((m, i) => (
            <Card
              key={m}
              className={`shadow-sm ring-1 ring-slate-200/70 ${
                i === slot.index ? "border-[#15a3b0]/40 bg-[#15a3b0]/5" : ""
              }`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0d4a57] to-[#15a3b0] text-[11px] font-semibold tabular-nums text-white">
                  {i + 1}
                </div>
                <p className="text-sm leading-snug text-foreground">{m}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm ring-1 ring-slate-200/70">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-[#15a3b0]" />
              <h2 className="font-semibold text-foreground">Why this matters</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Current clients are the foundation of the business. Every
              relationship you protect compounds — in renewals, expansion, and
              referrals. You bring the judgment; the system keeps the
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
