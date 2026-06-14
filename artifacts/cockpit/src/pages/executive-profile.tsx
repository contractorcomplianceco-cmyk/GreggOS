import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ENTITIES: { name: string; role: string }[] = [
  {
    name: "Contractor Advisory Group (CAG)",
    role: "Advisory and client-relations umbrella for current accounts.",
  },
  {
    name: "Contractor Compliance Authority (CCA)",
    role: "Compliance and audit-readiness services for contractor clients.",
  },
  {
    name: "Licensed Qualifier Network",
    role: "Coordinated network of licensed qualifiers for placement matching.",
  },
];

const LANES: { name: string; detail: string }[] = [
  {
    name: "Client relations & retention",
    detail:
      "Own current-client relationships, warmth, cadence, and escalation follow-through to keep accounts stable.",
  },
  {
    name: "Expansion & revenue growth",
    detail:
      "Identify and advance add-on and monitoring opportunities through the expansion pipeline to retained revenue.",
  },
  {
    name: "Placement & qualifier coordination",
    detail:
      "Match clients with licensed qualifiers and prepare placements for leadership and compliance sign-off.",
  },
  {
    name: "Executive operations & reporting",
    detail:
      "Run the operating rhythm: weekly review, KPI reporting, travel/expense discipline, and team standards.",
  },
];

export default function ExecutiveProfile() {
  return (
    <SidebarLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <PageHeader
          tag="My Executive Office"
          title="Executive Profile"
          subtitle="The mandate, role, and operating lanes for the executive client-relations and placement leadership position."
        />

        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base">Role</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Title
              </p>
              <p className="font-medium">
                President / Chief Contractor Relations & Placement Officer
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Mandate
              </p>
              <p className="text-sm text-muted-foreground">
                Lead current-client relationships across the portfolio: protect
                retention, grow retained revenue through expansion, and
                coordinate licensed-qualifier placements — while keeping all
                pricing, compliance, legal, and final-commitment decisions with
                the appropriate decision-makers.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-base">Entities</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {ENTITIES.map((e) => (
              <div key={e.name} className="flex gap-3">
                <Badge variant="secondary" className="shrink-0 mt-0.5">
                  {e.name}
                </Badge>
                <p className="text-sm text-muted-foreground">{e.role}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Operating lanes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            {LANES.map((lane) => (
              <div
                key={lane.name}
                className="rounded-lg border border-border p-4"
              >
                <p className="font-medium">{lane.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lane.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
