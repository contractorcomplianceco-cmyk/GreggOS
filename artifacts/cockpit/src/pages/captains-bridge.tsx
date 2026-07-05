import { useEffect, useMemo, useState } from "react";
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
  StickyNote,
  Trash2,
  Plus,
  Check,
  AlarmClock,
} from "lucide-react";

/* ================================================================== *
 * Captain's Bridge — a single launchpad for Gregg's daily tools,
 * plus a few local helpers: a notes pad, a "who to call today" list,
 * and a clock-in reminder.
 *
 * Note: Zoho Mail, RingCentral, Zoho People & ADP all block being shown
 * inside an <iframe> (X-Frame-Options), so each tool opens in a new tab.
 * Everything in the helper panels is front-end only (localStorage) and
 * stays on this device.
 * ================================================================== */

/* ---------------- localStorage helpers ---------------- */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

const LS_NOTES = "bridge.notes.v1";
const LS_CALLS = "bridge.calls.v1";
const LS_CALLS_SEEDED = "bridge.calls.seeded.v1";

/* ---------------- launch tiles ---------------- */
type Tool = {
  id: string;
  name: string;
  desc: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  note?: string;
};

const TOOLS: Tool[] = [
  {
    id: "zoho-mail",
    name: "Zoho Mail",
    desc: "Inbox, compose & client email",
    url: "https://mail.zoho.com",
    icon: Mail,
    accent: "from-[#3a2f14] to-[#c79a3b]",
  },
  {
    id: "ringcentral",
    name: "RingCentral",
    desc: "Calls, voicemail & messaging",
    url: "https://app.ringcentral.com",
    icon: Phone,
    accent: "from-[#1a1206] to-[#a5701f]",
  },
  {
    id: "zoho-people",
    name: "Zoho People — Clock In",
    desc: "Attendance ▸ My Data ▸ Check-in / out",
    url: "https://people.zoho.com",
    icon: Clock,
    accent: "from-[#8a6a1a] to-[#e6c25a]",
    note: "Opens Zoho People — go to Attendance to clock in/out.",
  },
  {
    id: "adp",
    name: "ADP Payroll",
    desc: "Workforce Now — pay & HR",
    url: "https://workforcenow.adp.com",
    icon: DollarSign,
    accent: "from-[#2a2110] to-[#ef6a1f]",
    note: "Workforce Now. (RUN users: my.adp.com)",
  },
];

const SHORTCUTS = [
  { label: "Compose email", icon: Mail, url: "https://mail.zoho.com" },
  { label: "Check inbox", icon: Inbox, url: "https://mail.zoho.com" },
  { label: "Make a call", icon: PhoneCall, url: "https://app.ringcentral.com" },
  { label: "Send a text", icon: MessageSquare, url: "https://app.ringcentral.com/messages" },
  { label: "Clock in / out", icon: Clock, url: "https://people.zoho.com" },
  { label: "Request time off", icon: CalendarPlus, url: "https://people.zoho.com" },
  { label: "View pay stub", icon: DollarSign, url: "https://workforcenow.adp.com" },
];

/* Seed list — a snapshot of recent CRM follow-ups so the call list isn't
 * empty on first load. Gregg can clear/edit freely; it never auto-syncs. */
type CallItem = { id: string; name: string; phone: string; note?: string; done: boolean };
const SEED_CALLS: CallItem[] = [
  { id: "s1", name: "Carmen Roda", phone: "813-761-0212", note: "Recent lead — follow up", done: false },
  { id: "s2", name: "Jestina Nicole", phone: "123-345-6780", note: "Landing-page inquiry", done: false },
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

          <ClockInReminder />

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
                  className="group relative overflow-hidden rounded-2xl border border-[#efe0b8] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${t.accent}`}>
                    <Icon className="h-10 w-10 text-white/90" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-base font-bold text-slate-800">{t.name}</p>
                      <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-[#c79a3b]" />
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

          <Card className="shadow-sm mb-10">
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
                      className="group flex items-center gap-3 rounded-xl border border-[#efe0b8] bg-[#f7fbfc] px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-[#c79a3b] hover:bg-white hover:shadow-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#3a2f14] to-[#c79a3b] text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-slate-700 group-hover:text-[#8a6a1a]">{s.label}</span>
                      <ExternalLink className="ml-auto h-4 w-4 text-slate-300 group-hover:text-[#c79a3b]" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* HELPER PANELS */}
          <div className="grid gap-6 lg:grid-cols-2">
            <CallList />
            <NotesPad />
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Heads-up: these tools don't allow embedding for security reasons, so each tile and shortcut opens the real app in a new tab. Your notes and call list are saved only on this device.
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}

/* ================================================================== *
 * Clock-in reminder — gentle, time-based nudge during work hours.
 * Dismissible for the day; reappears next day.
 * ================================================================== */
function ClockInReminder() {
  const todayKey = useMemo(() => `bridge.clockin.dismissed.${new Date().toDateString()}`, []);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    const workHours = hour >= 6 && hour < 11; // morning clock-in window
    const dismissed = read<boolean>(todayKey, false);
    setShow(workHours && !dismissed);
  }, [todayKey]);

  if (!show) return null;

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-[#ef6a1f]/30 bg-gradient-to-r from-[#fff3ee] to-[#fdece4] px-5 py-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ef6a1f] text-white">
        <AlarmClock className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold text-slate-800">Morning, Captain — did you clock in yet?</p>
        <p className="text-sm text-slate-600">Tap to open Zoho People ▸ Attendance and start your shift.</p>
      </div>
      <a
        href="https://people.zoho.com"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-[#8a6a1a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c79a3b]"
      >
        Clock in
      </a>
      <button
        onClick={() => {
          write(todayKey, true);
          setShow(false);
        }}
        className="rounded-lg border border-[#e3c4b8] px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-white"
      >
        Already did
      </button>
    </div>
  );
}

/* ================================================================== *
 * Who to call today — a manual, local call list seeded with recent
 * CRM follow-ups. Add names, tap to mark called, clear when done.
 * ================================================================== */
function CallList() {
  const [items, setItems] = useState<CallItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const seeded = read<boolean>(LS_CALLS_SEEDED, false);
    if (!seeded) {
      setItems(SEED_CALLS);
      write(LS_CALLS, SEED_CALLS);
      write(LS_CALLS_SEEDED, true);
    } else {
      setItems(read<CallItem[]>(LS_CALLS, []));
    }
  }, []);

  const save = (next: CallItem[]) => {
    setItems(next);
    write(LS_CALLS, next);
  };

  const add = () => {
    if (!name.trim()) return;
    save([{ id: String(Date.now()), name: name.trim(), phone: phone.trim(), done: false }, ...items]);
    setName("");
    setPhone("");
  };

  const toggle = (id: string) => save(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remove = (id: string) => save(items.filter((i) => i.id !== id));

  const remaining = items.filter((i) => !i.done).length;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-[#e0eff1] px-5 py-3.5">
          <PhoneCall className="h-4 w-4 text-[#c79a3b]" />
          <h3 className="font-display text-base font-bold text-slate-800">Who to call today</h3>
          <span className="rounded-full bg-[#f4e9c8] px-2 py-0.5 text-xs font-bold text-[#8a6a1a]">{remaining} left</span>
          <a
            href="https://crm.zoho.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs font-semibold text-[#8a6a1a] hover:text-[#c79a3b]"
          >
            Open CRM ▸
          </a>
        </div>

        {/* add row */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#eef6f7] px-4 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Name"
            className="min-w-0 flex-1 rounded-lg border border-[#efe0b8] px-3 py-2 text-sm outline-none focus:border-[#c79a3b]"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Phone (optional)"
            className="min-w-0 flex-1 rounded-lg border border-[#efe0b8] px-3 py-2 text-sm outline-none focus:border-[#c79a3b]"
          />
          <button
            onClick={add}
            className="flex items-center gap-1 rounded-lg bg-[#8a6a1a] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c79a3b]"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        <div className="p-2">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              No calls on the list. Add someone above, or open the CRM to see your leads.
            </div>
          ) : (
            <ul className="divide-y divide-[#eef6f7]">
              {items.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    onClick={() => toggle(c.id)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      c.done ? "border-[#c79a3b] bg-[#c79a3b] text-white" : "border-[#e6d3a6] text-transparent hover:border-[#c79a3b]"
                    }`}
                    aria-label="Mark called"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${c.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{c.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {c.phone || "—"}
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                      className="rounded-md p-1.5 text-[#8a6a1a] hover:bg-[#f4e9c8]"
                      aria-label="Call"
                    >
                      <PhoneCall className="h-4 w-4" />
                    </a>
                  )}
                  <button onClick={() => remove(c.id)} className="rounded-md p-1.5 text-slate-300 hover:bg-[#fde2d7] hover:text-[#c0431f]" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== *
 * Notes pad — a simple persistent scratchpad.
 * ================================================================== */
function NotesPad() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => setText(read<string>(LS_NOTES, "")), []);

  useEffect(() => {
    const t = setTimeout(() => {
      write(LS_NOTES, text);
      setSaved(true);
      const hide = setTimeout(() => setSaved(false), 1200);
      return () => clearTimeout(hide);
    }, 500);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-[#e0eff1] px-5 py-3.5">
          <StickyNote className="h-4 w-4 text-[#c79a3b]" />
          <h3 className="font-display text-base font-bold text-slate-800">Captain's notes</h3>
          <span className={`ml-auto text-xs font-semibold text-[#c79a3b] transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}>Saved ✓</span>
        </div>
        <div className="p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Jot anything — reminders, follow-ups, ideas. Saves automatically on this device."
            className="h-56 w-full resize-none rounded-xl border border-[#efe0b8] bg-[#f7fbfc] p-3 text-sm leading-relaxed text-slate-700 outline-none focus:border-[#c79a3b] focus:bg-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}
