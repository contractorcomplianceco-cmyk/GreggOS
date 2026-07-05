import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { DashboardHero } from "@/components/dashboard/DashboardHero";

/**
 * Section page header. Renders the shared compact animated coastal hero
 * (parallax waves, caustic shimmer, swimming fish, drifting boat) over a real
 * saltwater photo backdrop, so every section view feels like one unified
 * coastal cockpit. The photo is chosen by route so different sections feel
 * distinct; the animated water/fish/boat still ride on top.
 */

// Gregg's real photos, rotated across sections so all five get used.
const PHOTOS = [
  "/dock-sportfisher-run.jpg",
  "/dock-angler-fight.jpg",
  "/dock-reef-school.jpg",
  "/dock-sunset-canoe.jpg",
  "/dock-tackle-flatlay.jpg",
];

// Explicit photo per route where a specific vibe fits best; everything else
// falls back to a stable hash so each page keeps a consistent image.
const ROUTE_PHOTO: Record<string, string> = {
  "/captains-bridge": "/dock-sportfisher-run.jpg",
  "/reporting": "/dock-angler-fight.jpg", // The Logbook
  "/expansion": "/dock-reef-school.jpg", // The Net
  "/relationships": "/dock-reef-school.jpg",
  "/communications": "/dock-tackle-flatlay.jpg",
  "/training": "/dock-tackle-flatlay.jpg",
  "/motivation": "/dock-sunset-canoe.jpg",
  "/prompt-library": "/dock-tackle-flatlay.jpg",
};

function photoForPath(path: string): string {
  if (ROUTE_PHOTO[path]) return ROUTE_PHOTO[path];
  // stable hash → consistent image per route
  let h = 0;
  for (let i = 0; i < path.length; i++) h = (h * 31 + path.charCodeAt(i)) >>> 0;
  return PHOTOS[h % PHOTOS.length];
}

export function PageHeader({
  tag,
  title,
  subtitle,
  action,
  photo,
}: {
  tag?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** override the auto-selected backdrop, or pass "" to disable the photo */
  photo?: string;
}) {
  const [location] = useLocation();
  const bg = photo === "" ? undefined : (photo ?? photoForPath(location));

  return (
    <div className="mb-8">
      <DashboardHero
        size="compact"
        eyebrow={tag ?? "GREGG OS"}
        greeting={title}
        subtitle={typeof subtitle === "string" ? subtitle : undefined}
        action={action}
        photo={bg}
      />
      {/* render non-string subtitles (rare) below the hero */}
      {subtitle && typeof subtitle !== "string" ? (
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
      ) : null}
    </div>
  );
}
