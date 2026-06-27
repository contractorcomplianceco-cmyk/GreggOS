import type { SVGProps } from "react";

/**
 * Custom fishing-themed icon set for GreggOS.
 * Drop-in replacements for lucide icons: 24x24 viewBox, stroke = currentColor,
 * so they inherit text color and size utilities (h-4 w-4, text-[#15a3b0], …).
 *
 * Usage matches lucide: <Mahi className="h-4 w-4 text-[#15a3b0]" />
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true,
};

/** Mahi-mahi game fish — primary brand mark */
export function Mahi(props: IconProps) {
  return (
    <svg {...base} {...props}>
      {/* body: blunt forehead at right, tapering to tail at left */}
      <path d="M4 12c3-3.5 8-4.5 12-3.2 2 .6 3.4 1.8 4 3.2-.6 1.4-2 2.6-4 3.2-4 1.3-9 .3-12-3.2Z" />
      {/* forked tail */}
      <path d="M4 12 1 9.5M4 12 1 14.5" />
      {/* dorsal fin running along the back */}
      <path d="M8 9.4c1-1.4 3-2.2 5-2.2" />
      {/* lateral stripe */}
      <path d="M8 12.4c3-1 6-1 9 .2" />
      <circle cx="17.5" cy="11" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Fish hook */
export function Hook(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v9a4 4 0 1 1-4-4" />
      <path d="M9.2 9.2 8 8" />
      <circle cx="12" cy="3.4" r="1.2" />
    </svg>
  );
}

/** Anchor (lighter custom version) */
export function AnchorMark(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5V21" />
      <path d="M8.5 10h7" />
      <path d="M5 14a7 7 0 0 0 14 0" />
      <path d="M5 14H3.2M19 14h1.8" />
    </svg>
  );
}

/** Boat / cutter */
export function Boat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 15h18l-2.2 4.2a2 2 0 0 1-1.8 1.1H7a2 2 0 0 1-1.8-1.1L3 15Z" />
      <path d="M6 15V6l8 4-8 0" />
      <path d="M6 6 4 4" />
    </svg>
  );
}

/** Waves / current */
export function Waves(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 8c1.5 0 1.5-1.5 3-1.5S6.5 8 8 8s1.5-1.5 3-1.5S12.5 8 14 8s1.5-1.5 3-1.5S18.5 8 20 8s1.5-1.5 2-1.5" />
      <path d="M2 13c1.5 0 1.5-1.5 3-1.5S6.5 13 8 13s1.5-1.5 3-1.5S12.5 13 14 13s1.5-1.5 3-1.5S18.5 13 20 13s1.5-1.5 2-1.5" />
      <path d="M2 18c1.5 0 1.5-1.5 3-1.5S6.5 18 8 18s1.5-1.5 3-1.5S12.5 18 14 18s1.5-1.5 3-1.5S18.5 18 20 18s1.5-1.5 2-1.5" />
    </svg>
  );
}

/** Tide gauge — vertical level marker */
export function TideGauge(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3v18" />
      <path d="M5 7h3M5 11h4M5 15h3M5 19h4" />
      <path d="M13 14c1.3 0 1.3-1.3 2.6-1.3S17 14 18.3 14s1.3-1.3 2.7-1.3" />
      <path d="M13 18c1.3 0 1.3-1.3 2.6-1.3S17 18 18.3 18s1.3-1.3 2.7-1.3" />
    </svg>
  );
}

/** Compass rose */
export function CompassRose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 4.5 13.6 12 12 19.5 10.4 12 12 4.5Z" />
      <path d="M4.5 12 12 10.4 19.5 12 12 13.6 4.5 12Z" />
    </svg>
  );
}

/** Net */
export function Net(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16l-2 9a6 6 0 0 1-12 0L4 5Z" />
      <path d="M8 5l1.5 11M16 5l-1.5 11M5 9h14M6 13h12" />
    </svg>
  );
}

/** Lighthouse */
export function Lighthouse(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 9h6l1 11H8L9 9Z" />
      <path d="M9.5 13h5M9 9l.6-3h4.8L15 9" />
      <path d="M12 3v1.5" />
      <path d="M16.5 6.5 19 5M7.5 6.5 5 5" />
    </svg>
  );
}

export const CoastalIcons = {
  Mahi,
  Hook,
  AnchorMark,
  Boat,
  Waves,
  TideGauge,
  CompassRose,
  Net,
  Lighthouse,
};

export default CoastalIcons;
