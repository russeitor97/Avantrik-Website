import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Use on dark (navy/ink) backgrounds. */
  light?: boolean;
  className?: string;
}

/**
 * Consistent section header: accent eyebrow + heading + subtitle.
 * Purely presentational — receives existing copy as props.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        align === "center" && "text-center mx-auto",
        align === "center" && "max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "flex items-center gap-3 mb-3",
            align === "center" && "justify-center",
          )}
        >
          <span className="h-px w-8 bg-accent" />
          <span className="text-accent font-bold tracking-widest uppercase text-xs">
            {eyebrow}
          </span>
          {align === "center" && <span className="h-px w-8 bg-accent" />}
        </div>
      )}
      <h2
        className={cn(
          "text-3xl md:text-4xl font-heading font-bold leading-tight",
          light ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            light ? "text-primary-foreground/70" : "text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
