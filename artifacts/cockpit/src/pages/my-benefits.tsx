import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface BenefitGroup {
  title: string;
  blurb: string;
  items: { name: string; detail: string }[];
}

const GROUPS: BenefitGroup[] = [
  {
    title: "Compensation structure",
    blurb:
      "How the executive client-relations and placement role is rewarded across base, performance, and participation.",
    items: [
      {
        name: "Base role",
        detail:
          "Executive client-relations and placement leadership for the current-client portfolio.",
      },
      {
        name: "Performance bonuses",
        detail:
          "Event-based awards tracked in the Bonus Tracker — placement coordination, expansion add-ons, monitoring conversions, client saves, and account stability. Subject to documentation and company approval.",
      },
      {
        name: "Profit participation (projection)",
        detail:
          "Illustrative awareness view only. Not an entitlement and not guaranteed. Any participation must be documented separately through ownership and governance.",
      },
    ],
  },
  {
    title: "Tools & support",
    blurb: "Operational resources provided to do the role well.",
    items: [
      {
        name: "Travel & expense support",
        detail:
          "ROI-justified travel planning and relationship/event expense tracking are available in the cockpit.",
      },
      {
        name: "Training & development",
        detail:
          "Gamified executive training modules to build leverage in client relations and placement.",
      },
      {
        name: "Operating cockpit",
        detail:
          "Full command-center tooling: priorities, expansion pipeline, relationships, reporting, and the placement network.",
      },
    ],
  },
  {
    title: "Recognition",
    blurb: "Non-cash recognition tied to performance.",
    items: [
      {
        name: "Leveling & XP",
        detail:
          "Progress and tiers earned through the training and leveling system.",
      },
      {
        name: "Reporting visibility",
        detail:
          "Contribution surfaced to leadership through the reporting and KPI dashboards.",
      },
    ],
  },
];

export default function MyBenefits() {
  return (
    <SidebarLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <PageHeader
          tag="My Executive Office"
          title="My Benefits"
          subtitle="An overview of the compensation, tools, and recognition associated with the executive client-relations and placement role."
        />

        <div className="mb-8 rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold">For awareness only.</p>
            <p className="mt-1 text-muted-foreground">
              This page summarizes the intended structure of the role. It is not
              an offer, contract, or guarantee. Bonuses require documentation and
              approval; profit participation is a projection, not an entitlement.
              Final terms are governed by company ownership.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {GROUPS.map((group) => (
            <Card key={group.title} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{group.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{group.blurb}</p>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {group.items.map((item) => (
                  <div key={item.name} className="flex gap-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">
                      {item.name}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
