import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Briefcase, Calendar, Settings, Users, LayoutDashboard, BarChart3, ShieldAlert, LogOut, TrendingUp, HeartHandshake, PieChart, MessageSquareText, Plane, Receipt, GraduationCap, Sparkles, Compass, MessageSquarePlus, PlayCircle, Menu, Network, IdCard, UserCog, Gift, Award, DollarSign, ListChecks } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ccaCrest from "@assets/cca-crest-inset_1781474011676.png";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };
type NavSection = { label: string; items: NavItem[] };

function useNavigation(): NavSection[] {
  const { data: me } = useGetCurrentUser();
  const isAdmin = me?.role === "admin";

  return [
    {
      label: "Command Center",
      items: [{ name: "Gregg Today", href: "/", icon: LayoutDashboard }],
    },
    {
      label: "Clients & Accounts",
      items: [
        { name: "Current Clients", href: "/clients", icon: Users },
        { name: "Account Oversight", href: "/oversight", icon: BarChart3 },
        { name: "Audit Risk", href: "/audit-risk", icon: ShieldAlert },
      ],
    },
    {
      label: "Growth & Placement",
      items: [
        { name: "Expansion Pipeline", href: "/expansion", icon: TrendingUp },
        { name: "Relationships", href: "/relationships", icon: HeartHandshake },
        { name: "Placement / Qualifier Network", href: "/placement", icon: Network },
        { name: "Reporting & CRM", href: "/reporting", icon: PieChart },
      ],
    },
    {
      label: "Daily Work",
      items: [
        { name: "Call Note Processor", href: "/processor", icon: Briefcase },
        { name: "Communication Drafts", href: "/communications", icon: MessageSquareText },
        { name: "Weekly Review", href: "/weekly-review", icon: Calendar },
      ],
    },
    {
      label: "My Executive Office",
      items: [
        { name: "Executive Profile", href: "/executive-profile", icon: IdCard },
        { name: "My Account", href: "/my-account", icon: UserCog },
        { name: "My Benefits", href: "/my-benefits", icon: Gift },
        { name: "Bonus Tracker", href: "/bonus-tracker", icon: Award },
        { name: "Profit Sharing", href: "/profit-sharing", icon: DollarSign },
        { name: "90 / 180-Day Success Plan", href: "/success-plan", icon: ListChecks },
      ],
    },
    {
      label: "Tools & Resources",
      items: [
        { name: "Travel Planner", href: "/travel", icon: Plane },
        { name: "Expense Tracker", href: "/expenses", icon: Receipt },
        { name: "Training & Leveling", href: "/training", icon: GraduationCap },
        { name: "AI Prompt Library", href: "/prompt-library", icon: Sparkles },
        { name: "Feedback Center", href: "/feedback", icon: MessageSquarePlus },
        { name: "Walkthrough & Motivation", href: "/motivation", icon: Compass },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Administration",
            items: [{ name: "Admin / Setup", href: "/admin", icon: Settings }],
          },
        ]
      : []),
  ];
}

function currentTitle(location: string, navigation: NavSection[]): string {
  if (location.startsWith("/clients/")) return "Client Detail";
  const items = navigation.flatMap((s) => s.items);
  const match = items.find(
    (item) => location === item.href || (item.href !== "/" && location.startsWith(item.href)),
  );
  return match?.name ?? "Current Client Cockpit";
}

function UserFooter() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Sign-in wall removed: only show the account/log-out footer when someone
  // has optionally signed in, so a signed-out session isn't mislabeled.
  if (!isSignedIn) return null;

  const label =
    user?.primaryEmailAddress?.emailAddress ??
    user?.fullName ??
    user?.username ??
    "Signed in";

  return (
    <div className="px-4 py-3 border-t border-sidebar-border/50 flex items-center justify-between gap-2">
      <span className="text-[11px] text-sidebar-foreground/70 truncate" title={label}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => signOut({ redirectUrl: basePath || "/" })}
        className="flex items-center gap-1 text-[11px] text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors shrink-0"
        data-testid="button-logout"
      >
        <LogOut className="w-3.5 h-3.5" />
        Log out
      </button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const navigation = useNavigation();

  return (
    <div className="bg-sidebar text-sidebar-foreground flex flex-col justify-between h-full">
      <div className="min-h-0 flex flex-col">
        <div className="px-4 pt-4 pb-3 shrink-0 flex items-center gap-2.5">
          <img
            src={ccaCrest}
            alt="Contractor Compliance Authority"
            className="h-10 w-auto shrink-0"
          />
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold tracking-tight text-sidebar-foreground">
              GreggOS <span className="text-[#0BA3FF]">Command Center</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/60">
              Current Client Cockpit
            </p>
          </div>
        </div>
        <nav className="space-y-1 px-4 overflow-y-auto pb-4">
          <a
            href="/cockpit-walkthrough/"
            className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md text-sm font-semibold cursor-pointer transition-colors bg-[#0BA3FF] text-white hover:opacity-90 ring-1 ring-[#0BA3FF] shadow-sm"
            data-testid="link-start-here"
          >
            <PlayCircle className="w-4 h-4" />
            Start Here
          </a>
          {navigation.map((section) => (
            <div key={section.label} className="mb-3">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {section.label}
              </p>
              {section.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} onClick={onNavigate}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
      <div className="shrink-0">
        <UserFooter />
        <div className="p-4 border-t border-sidebar-border/50 text-[10px] text-slate-500 leading-tight">
          <p className="mb-2"><strong>Notice:</strong> This cockpit organizes relationship follow-through.</p>
          <p>It does not approve pricing, refunds, legal advice, compliance opinions, qualifier placements, or final client commitments.</p>
        </div>
      </div>
    </div>
  );
}

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const navigation = useNavigation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = currentTitle(location, navigation);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <div className="w-64 border-r border-sidebar-border hidden md:flex md:flex-col shrink-0">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 h-14 px-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border shrink-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                aria-label="Open navigation menu"
                data-testid="button-open-nav"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-semibold truncate" data-testid="text-mobile-title">
            {title}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
