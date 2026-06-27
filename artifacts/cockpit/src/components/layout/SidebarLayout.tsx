import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Briefcase, Calendar, Settings, Users, LayoutDashboard, BarChart3, ShieldAlert, LogOut, TrendingUp, HeartHandshake, PieChart, MessageSquareText, Plane, Receipt, GraduationCap, Sparkles, Compass, MessageSquarePlus, PlayCircle, Menu, Network, IdCard, UserCog, Gift, Award, DollarSign, ListChecks, Bot, Mail, Inbox, UsersRound, Fish, Anchor } from "lucide-react";
import { useUser, useClerk } from "@clerk/react";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ccaCrest from "@assets/cca-crest-inset_1781474011676.png";
import { MotivationPopup } from "@/components/MotivationPopup";
import { CoastalHeaderFX } from "@/components/layout/CoastalHeaderFX";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };
type NavSection = { label: string; items: NavItem[] };

function useNavigation(): NavSection[] {
  const { data: me } = useGetCurrentUser();
  const isAdmin = me?.role === "admin";

  return [
    {
      label: "The Bridge",
      items: [
        { name: "Today's Catch", href: "/", icon: Fish },
        { name: "Crew Overview", href: "/staff", icon: UsersRound },
      ],
    },
    {
      label: "The Fleet",
      items: [
        { name: "Current Catch", href: "/clients", icon: Users },
        { name: "Depth Sounder", href: "/oversight", icon: BarChart3 },
        { name: "Storm Watch", href: "/audit-risk", icon: ShieldAlert },
      ],
    },
    {
      label: "Casting & Nets",
      items: [
        { name: "The Net (Pipeline)", href: "/expansion", icon: TrendingUp },
        { name: "Deckhands & Allies", href: "/relationships", icon: HeartHandshake },
        { name: "Fishing Grounds (Qualifiers)", href: "/placement", icon: Network },
        { name: "The Logbook (CRM)", href: "/reporting", icon: PieChart },
      ],
    },
    {
      label: "On the Water",
      items: [
        { name: "Reel In Call Notes", href: "/processor", icon: Anchor },
        { name: "Message in a Bottle", href: "/communications", icon: MessageSquareText },
        { name: "Weekly Haul", href: "/weekly-review", icon: Calendar },
      ],
    },
    {
      label: "Captain's Quarters",
      items: [
        { name: "Captain's Card", href: "/executive-profile", icon: IdCard },
        { name: "My Account", href: "/my-account", icon: UserCog },
        { name: "Ship's Perks", href: "/my-benefits", icon: Gift },
        { name: "Trophy Wall", href: "/bonus-tracker", icon: Award },
        { name: "Splitting the Haul", href: "/profit-sharing", icon: DollarSign },
        { name: "90 / 180-Day Voyage Plan", href: "/success-plan", icon: ListChecks },
        { name: "My Requests", href: "/my-requests", icon: Inbox },
      ],
    },
    {
      label: "Tackle Box",
      items: [
        { name: "RoseOS First Mate", href: "/roseos", icon: Bot },
        { name: "Email Builder", href: "/email-builder", icon: Mail },
        { name: "Requests Hub", href: "/requests", icon: Inbox },
        { name: "Charting a Course", href: "/travel", icon: Plane },
        { name: "Expense Tracker", href: "/expenses", icon: Receipt },
        { name: "Leveling the Lines", href: "/training", icon: GraduationCap },
        { name: "AI Tackle Library", href: "/prompt-library", icon: Sparkles },
        { name: "Feedback Center", href: "/feedback", icon: MessageSquarePlus },
        { name: "Daily Tide Wisdom", href: "/motivation", icon: Compass },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Engine Room",
            items: [{ name: "Admin / Setup", href: "/admin", icon: Settings }],
          },
        ]
      : []),
  ];
}

function currentTitle(location: string, navigation: NavSection[]): string {
  if (location.startsWith("/welcome")) return "Welcome Center";
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
        <div className="relative px-4 pt-5 pb-7 shrink-0 flex items-center gap-2.5 text-white overflow-hidden">
          {/* live underwater scene behind the brand */}
          <img
            src="/img-sidebar-ocean.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* animated schools + bubbles */}
          <CoastalHeaderFX variant="dark" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062029]/90 via-[#06212a]/65 to-[#0d4a57]/25" />
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-[#3FE0E0]/50 backdrop-blur-sm">
            <img
              src={ccaCrest}
              alt="Contractor Compliance Authority"
              className="h-8 w-auto"
            />
          </div>
          <div className="relative leading-tight min-w-0">
            <p className="font-display text-base font-bold tracking-tight text-white flex items-center gap-1.5 drop-shadow">
              GreggOS <span className="text-[#5fe7e7]">Coastal Command</span>
              <Fish className="w-4 h-4 text-[#5fe7e7]" />
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/90 drop-shadow">
              Reeling In Your Client Relationships
            </p>
          </div>
        </div>
        <nav className="space-y-1 px-4 pt-3 overflow-y-auto pb-4">
          <Link href="/welcome" onClick={onNavigate}>
            <div
              className="flex items-center gap-3 px-3 py-2 mb-2 rounded-md text-sm font-semibold cursor-pointer transition-colors bg-gradient-to-r from-[#0d4a57] to-[#15a3b0] text-white hover:opacity-90 ring-1 ring-[#3FE0E0]/40 shadow-sm"
              data-testid="link-welcome-center"
            >
              <Anchor className="w-4 h-4" />
              Welcome Aboard
            </div>
          </Link>
          {navigation.map((section) => (
            <div key={section.label} className="mb-3">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
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
        <div className="p-4 border-t border-sidebar-border/50 text-[10px] text-sidebar-foreground/55 leading-tight">
          <p className="mb-2"><strong>Notice:</strong> This deck keeps your client lines tight and your follow-through afloat.</p>
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

      {!location.startsWith("/welcome") && !location.startsWith("/motivation") && (
        <MotivationPopup />
      )}
    </div>
  );
}
