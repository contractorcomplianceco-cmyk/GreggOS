import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Briefcase, Calendar, Settings, Users, LayoutDashboard, BarChart3, ShieldAlert, LogOut, TrendingUp, HeartHandshake, PieChart, MessageSquareText, Plane, Receipt, GraduationCap, Sparkles, Compass, MessageSquarePlus, PlayCircle, Menu } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ccaLogo from "@assets/CCA_horizontal_logo_with_transparent_background_1780935000951.png";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };

function useNavigation(): NavItem[] {
  const { data: me } = useGetCurrentUser();
  const isAdmin = me?.role === "admin";

  return [
    { name: "Gregg Today", href: "/", icon: LayoutDashboard },
    { name: "Account Oversight", href: "/oversight", icon: BarChart3 },
    { name: "Expansion Pipeline", href: "/expansion", icon: TrendingUp },
    { name: "Relationships", href: "/relationships", icon: HeartHandshake },
    { name: "Reporting & CRM", href: "/reporting", icon: PieChart },
    { name: "Current Clients", href: "/clients", icon: Users },
    { name: "Audit Risk", href: "/audit-risk", icon: ShieldAlert },
    { name: "Communication Drafts", href: "/communications", icon: MessageSquareText },
    { name: "Travel Planner", href: "/travel", icon: Plane },
    { name: "Expense Tracker", href: "/expenses", icon: Receipt },
    { name: "Training & Leveling", href: "/training", icon: GraduationCap },
    { name: "AI Prompt Library", href: "/prompt-library", icon: Sparkles },
    { name: "Feedback Center", href: "/feedback", icon: MessageSquarePlus },
    { name: "Walkthrough & Motivation", href: "/motivation", icon: Compass },
    { name: "Call Note Processor", href: "/processor", icon: Briefcase },
    { name: "Weekly Review", href: "/weekly-review", icon: Calendar },
    ...(isAdmin
      ? [{ name: "Admin / Setup", href: "/admin", icon: Settings }]
      : []),
  ];
}

function currentTitle(location: string, navigation: NavItem[]): string {
  if (location.startsWith("/clients/")) return "Client Detail";
  const match = navigation.find(
    (item) => location === item.href || (item.href !== "/" && location.startsWith(item.href)),
  );
  return match?.name ?? "Current Client Cockpit";
}

function UserFooter() {
  const { user } = useUser();
  const { signOut } = useClerk();
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
        <div className="px-5 pt-6 pb-5 shrink-0">
          <img
            src={ccaLogo}
            alt="Contractor Compliance Authority"
            className="w-full h-auto"
          />
          <p className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60 mt-3">
            Current Client Cockpit
          </p>
        </div>
        <nav className="space-y-1 px-4 overflow-y-auto pb-4">
          <a
            href="/cockpit-walkthrough/"
            className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md text-sm font-semibold cursor-pointer transition-colors bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 ring-1 ring-sidebar-border"
            data-testid="link-start-here"
          >
            <PlayCircle className="w-4 h-4" />
            Start Here
          </a>
          {navigation.map((item) => {
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
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="shrink-0">
        <UserFooter />
        <div className="p-4 border-t border-sidebar-border/50 text-[10px] text-sidebar-foreground/60 leading-tight">
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
