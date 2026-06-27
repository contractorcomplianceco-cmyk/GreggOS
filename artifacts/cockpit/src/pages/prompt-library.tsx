import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Search } from "lucide-react";

interface Prompt {
  id: string;
  category: string;
  title: string;
  purpose: string;
  example: string;
  prompt: string;
}

const PROMPTS: Prompt[] = [
  {
    id: "ret-1",
    category: "Client retention",
    title: "Retention risk read",
    purpose: "Surface early churn signals from an account's recent activity.",
    example: "Paste a client's last 3 call summaries and recent task history.",
    prompt:
      "You are an advisory client-retention analyst. Review the following account activity and identify early signals of churn risk, relationship cooling, or unmet needs. List the top 3 risks, the evidence for each, and a recommended internal next step. Do NOT make pricing, refund, legal, or compliance commitments — recommendations are advisory only.\n\nACCOUNT ACTIVITY:\n[paste here]",
  },
  {
    id: "ret-2",
    category: "Client retention",
    title: "Save-play outline",
    purpose: "Draft an internal save plan for an at-risk account.",
    example: "Use when a client has gone cold or raised a concern.",
    prompt:
      "Draft an internal client-save plan for the account below. Include: the likely root concern, a relationship-repair sequence (who reaches out, when, and how), and the proof points to reinforce value. Keep it advisory; do not commit to pricing, refunds, or guarantees.\n\nACCOUNT CONTEXT:\n[paste here]",
  },
  {
    id: "risk-1",
    category: "Risk detection",
    title: "Risk-pattern scan",
    purpose: "Detect compliance or relationship risk patterns across notes.",
    example: "Paste several recent call notes for one client.",
    prompt:
      "Act as an advisory risk reviewer. Scan the notes below for risk patterns: repeated complaints, possible promise/commitment risk, qualifier concerns, or compliance-sensitive topics. Flag each with severity (Low/Medium/High) and why. Recommend internal escalation only — make no compliance or legal determinations.\n\nNOTES:\n[paste here]",
  },
  {
    id: "risk-2",
    category: "Risk detection",
    title: "Escalation triage",
    purpose: "Decide whether an issue needs leadership escalation.",
    example: "Use on a single concerning interaction.",
    prompt:
      "Given the interaction below, advise whether it warrants leadership escalation and to whom (Gregg / Rose / legal review). Explain the trigger. Remember: this app organizes follow-through and does not approve refunds, pricing, legal, or compliance outcomes.\n\nINTERACTION:\n[paste here]",
  },
  {
    id: "comm-1",
    category: "Executive communication",
    title: "Executive summary rewrite",
    purpose: "Turn raw notes into a crisp executive-ready summary.",
    example: "Paste messy call notes.",
    prompt:
      "Rewrite the notes below into a tight executive summary: situation, what matters, decision needed (if any), and recommended next step. Neutral, confident tone. No commitments on pricing, refunds, legal, or compliance.\n\nNOTES:\n[paste here]",
  },
  {
    id: "comm-2",
    category: "Executive communication",
    title: "Client-facing follow-up",
    purpose: "Draft a warm, professional client follow-up message.",
    example: "Use after a check-in call.",
    prompt:
      "Draft a warm, professional client-facing follow-up based on the context below. Acknowledge their situation, confirm internal next steps we control, and keep it relationship-first. Do not promise pricing, refunds, legal advice, or compliance outcomes.\n\nCONTEXT:\n[paste here]",
  },
  {
    id: "sales-1",
    category: "Sales expansion",
    title: "Expansion opportunity finder",
    purpose: "Identify expansion or upsell openings in an account.",
    example: "Paste account profile and recent activity.",
    prompt:
      "Review the account below and identify realistic expansion opportunities (additional services, multi-entity coverage, renewals). For each, give the signal, the value to the client, and a low-pressure internal next step. Advisory only — no pricing commitments.\n\nACCOUNT:\n[paste here]",
  },
  {
    id: "comp-1",
    category: "Compliance analysis",
    title: "Compliance topic spotter",
    purpose: "Flag compliance-sensitive topics for proper routing.",
    example: "Paste a call note or client message.",
    prompt:
      "Identify any compliance-sensitive topics in the text below (qualifier placement, licensing, legal exposure) and recommend internal routing. Do NOT give a compliance determination or legal opinion — flag for the right human reviewer only.\n\nTEXT:\n[paste here]",
  },
  {
    id: "rc-1",
    category: "RingCentral call analysis",
    title: "Call-to-CRM structuring",
    purpose: "Convert a raw call transcript into CRM-ready structure.",
    example: "Paste a raw RingCentral call note.",
    prompt:
      "Structure the raw call note below into: clean summary, client concern, commitments made, missing information, next actions, opportunity signals, and escalation flags. Keep it factual. Do not invent commitments or approve anything.\n\nRAW CALL NOTE:\n[paste here]",
  },
];

export default function PromptLibrary() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(PROMPTS.map((p) => p.category)))],
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PROMPTS.filter((p) => {
      const matchCat =
        activeCategory === "All" || p.category === activeCategory;
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.purpose.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  async function copy(p: Prompt) {
    try {
      await navigator.clipboard.writeText(p.prompt);
      toast({ title: "Prompt copied to clipboard" });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="AI Tackle Library"
          title="AI Prompt Library"
          subtitle="Copy-ready, high-value prompts for retention, risk, communication, expansion, and call analysis. AI output is advisory — it never approves pricing, refunds, legal, or compliance decisions."
        />

        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts"
              className="pl-9"
              data-testid="input-search-prompts"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
              data-testid={`filter-category-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((p) => (
            <Card key={p.id} className="shadow-sm" data-testid={`card-prompt-${p.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {p.category}
                    </Badge>
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(p)}
                    data-testid={`button-copy-${p.id}`}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
                <p className="mt-3 text-sm text-foreground">{p.purpose}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Example: </span>
                  {p.example}
                </p>
                <pre className="mt-3 max-h-44 overflow-y-auto rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                  {p.prompt}
                </pre>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prompts match.</p>
          ) : null}
        </div>
      </div>
    </SidebarLayout>
  );
}
