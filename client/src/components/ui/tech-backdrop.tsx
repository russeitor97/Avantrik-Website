import { cn } from "@/lib/utils";

/**
 * Decorative engineering line-art used behind dark (ink/navy) bands.
 * Pure SVG — no raster images. Marked aria-hidden (purely decorative).
 * Animated dashes respect prefers-reduced-motion via the .animate-dash-flow utility.
 */
export function TechBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* Brand grid + glow layers */}
      <div className="absolute inset-0 bg-tech-grid opacity-60" />
      <div className="absolute inset-0 bg-brand-glow" />

      {/* Flowing technical schematic lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g
          stroke="hsl(var(--accent))"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          className="animate-dash-flow"
        >
          <path d="M-40 180 H520 L600 260 H980 L1060 180 H1500" />
          <path d="M-40 540 H360 L440 460 H760 L840 540 H1200 L1280 460 H1500" />
          <path d="M260 -40 V200 L340 280 V520 L260 600 V760" />
          <path d="M1120 -40 V160 L1040 240 V470 L1120 550 V760" />
        </g>

        {/* Node dots on the schematic */}
        <g fill="hsl(var(--accent))" fillOpacity="0.9">
          <circle cx="600" cy="260" r="4" />
          <circle cx="1060" cy="180" r="4" />
          <circle cx="440" cy="460" r="4" />
          <circle cx="840" cy="540" r="4" />
          <circle cx="340" cy="280" r="3" />
          <circle cx="1040" cy="240" r="3" />
        </g>
      </svg>
    </div>
  );
}
