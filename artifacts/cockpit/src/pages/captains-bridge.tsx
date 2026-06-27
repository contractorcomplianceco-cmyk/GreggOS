import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Phone,
  Clock,
  DollarSign,
  ExternalLink,
  Inbox,
  PhoneCall,
  MessageSquare,
  CalendarPlus,
} from "lucide-react";

/* ================================================================== *
 * Captain's Bridge — a single launchpad for Gregg's daily tools.
 *
 * Note: Zoho Mail, RingCentral, Zoho People & ADP all block being shown
 * inside an <iframe> (X-Frame-Options), so each tool opens in a new tab.
 * ================================================================== */

type Tool = {
  id: string;
  name: string;
  desc: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind-ish gradient classes
  note?: string;
};

const TOOLS: Tool[] = [
  {
    id: "zoho-mail",
    name: "Zoho Mail",
    desc: "Inbox, compose & client email",
    url: "https://mail.zoho.com",
    icon: Mail,
    accent: "from-[#0d4a57] to-[#15a3b0]",
  },
  {
    id: "ringcentral",
    name: "RingCentral",
    desc: "Calls, voicemail & messaging",
    url: "https://app.ringcentral.com",
    icon: Phone,
    accent: "from-[#0a3a45] to-[#1f7a8c]",
  },
  {
    id: "zoho-people",
    name: "Zoho People — Clock In",
    desc: "Attendance ▸ My Data ▸ Check-in / out",
    url: "https://people.zoho.com",
    icon: Clock,
    accent: "from-[#0d6473] to-[#3FE0E0]",
    note: "Opens Zoho People — go to Attendance to clock in/out.",
  },
  {
    id: "adp",
    name: "ADP Payroll",
    desc: "Workforce Now — pay & HR",
    url: "https://workforcenow.adp.com",
    icon: DollarSign,
    accent: "from-[#13414f] to-[#f4623a]",
    note: "Workforce Now. (RUN users: my.adp.com)",
  },
];

// Quick shortcuts that deep-link into common actions in each tool.
const SHORTCUTS = [
  { label: "Compose email", icon: Mail, url: "https://mail.zoho.com" },
  { label: "Check inbox", icon: Inbox, url: "https://mail.zoho.com" },
  { label: "Make a call", icon: PhoneCall, url: "https://app.ringcentral.com" },
  { label: "Send a text", icon: MessageSquare, url: "https://app.ringcentral.com/messages" },
  { label: "Clock in / out", icon: Clock, url: "https://people.zoho.com" },
  { label: "Request time off", icon: CalendarPlus, url: "https://people.zoho.com" },
  { label: "View pay stub", icon: DollarSign, url: "https://workforcenow.adp.com" },
];

export default function CaptainsBridge() {
  return (
    <SidebarLayout>
      <div className="min-h-full bg-[#eef6f7] text-[15px] leading-relaxed">
        <div className="p-5 md:p-8 max-w-6xl mx-auto">
          <PageHeader
            tag="The Bridge"
            title="Captain's Bridge"
            subtitle="One launchpad for your daily tools — mail, phones, time clock, and payroll. Tap a tile to open it in a new tab."
          />

          {/* LAUNCH TILES */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <a
                  key={t.id}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-[#cfe6e9] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${t.accent}`}>
                    <Icon className="h-10 w-10 text-white/90" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-base font-bold text-slate-800">{t.name}</p>
                      <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-[#15a3b0]" />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{t.desc}</p>
                    {t.note && <p className="mt-2 text-xs text-slate-400">{t.note}</p>}
                  </div>
                </a>
              );
            })}
          </div>

          {/* QUICK ACTIONS */}
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-slate-800">Quick actions</h2>
            <span className="text-sm text-slate-400">jump straight to a common task</span>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SHORTCUTS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-[#cfe6e9] bg-[#f7fbfc] px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-[#15a3b0] hover:bg-white hover:shadow-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0d4a57] to-[#15a3b0] text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-slate-700 group-hover:text-[#0d6473]">{s.label}</span>
                      <ExternalLink className="ml-auto h-4 w-4 text-slate-300 group-hover:text-[#15a3b0]" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-xs text-slate-400">
            Heads-up: these tools don't allow embedding for security reasons, so each tile and shortcut opens the real app in a new tab.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}
