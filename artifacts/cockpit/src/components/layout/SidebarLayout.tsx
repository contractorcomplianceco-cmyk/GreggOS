import { Link, useLocation } from "wouter";
import { Briefcase, Calendar, CheckSquare, Settings, Users, LayoutDashboard, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Gregg Today", href: "/", icon: LayoutDashboard },
    { name: "Account Oversight", href: "/oversight", icon: BarChart3 },
    { name: "Landon Work Queue", href: "/work-queue", icon: CheckSquare },
    { name: "Current Clients", href: "/clients", icon: Users },
    { name: "Call Note Processor", href: "/processor", icon: Briefcase },
    { name: "Weekly Review", href: "/weekly-review", icon: Calendar },
    { name: "Admin / Setup", href: "/admin", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <div className="w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6">
            <h1 className="text-xl font-bold tracking-tight text-sidebar-primary">Cockpit</h1>
            <p className="text-xs text-sidebar-foreground/70 mt-1">Contractor Compliance Authority</p>
          </div>
          <nav className="space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href}>
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
        <div className="p-4 border-t border-sidebar-border/50 text-[10px] text-sidebar-foreground/60 leading-tight">
          <p className="mb-2"><strong>Notice:</strong> This cockpit organizes relationship follow-through.</p>
          <p>It does not approve pricing, refunds, legal advice, compliance opinions, qualifier placements, or final client commitments.</p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}