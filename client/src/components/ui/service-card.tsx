import { Link } from "wouter";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MouseEvent } from "react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  /** Optional — kept for API compatibility; no longer rendered as a photo. */
  image?: string;
  className?: string;
}

export function ServiceCard({
  title,
  description,
  icon: Icon,
  href,
  className,
}: ServiceCardProps) {
  // Spotlight que sigue al cursor (solo CSS vars, sin re-render)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--sx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--sy", `${e.clientY - rect.top}px`);
  };

  return (
    <Link href={href}>
      <a className={cn("group block h-full", className)}>
        <div
          onMouseMove={handleMouseMove}
          className="relative flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-xl"
        >
          {/* Spotlight overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(240px circle at var(--sx, 50%) var(--sy, 50%), hsl(var(--accent) / 0.14), transparent 65%)",
            }}
            aria-hidden="true"
          />

          {/* Icon header on navy with brand grid */}
          <div className="relative overflow-hidden bg-primary p-6">
            <div className="absolute inset-0 bg-tech-grid opacity-40" />
            <div className="relative flex items-center justify-between">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-accent text-accent-foreground shadow-md transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-6 w-6" />
              </span>
              <ArrowRight className="h-5 w-5 text-white/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent" />
            </div>
          </div>

          {/* Accent rule */}
          <div className="h-1 w-full bg-gradient-to-r from-accent to-accent/0 transition-all duration-500 group-hover:from-accent group-hover:to-accent/60" />

          <div className="flex flex-grow flex-col p-6">
            <h3 className="font-heading text-xl font-bold uppercase text-foreground transition-colors group-hover:text-accent">
              {title}
            </h3>
            <p className="mt-3 flex-grow leading-relaxed text-muted-foreground">
              {description}
            </p>
            <span className="mt-6 inline-flex items-center text-sm font-bold uppercase text-primary transition-colors group-hover:text-accent">
              Más información
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </a>
    </Link>
  );
}
