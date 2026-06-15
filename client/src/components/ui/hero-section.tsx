import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck, MapPin, Clock } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";

interface HeroSectionProps {
  /** Optional — kept for API compatibility; no longer rendered as a raster image. */
  image?: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

const trust = [
  { icon: ShieldCheck, label: "ISO 9001" },
  { icon: Clock, label: "+15 años" },
  { icon: MapPin, label: "México · EE.UU." },
];

export function HeroSection({
  title,
  subtitle,
  ctaText = "Our Services",
  ctaLink = "/services",
  secondaryCtaText = "Contact Us",
  secondaryCtaLink = "/contact",
}: HeroSectionProps) {
  const reduce = useReducedMotion();

  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-ink-gradient text-white">
      <TechBackdrop />

      {/* Floating decorative ring */}
      <div className="pointer-events-none absolute -right-32 top-1/4 hidden lg:block">
        <div className="animate-float-slow h-96 w-96 rounded-full border border-accent/20" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-20">
        <motion.div
          className="max-w-3xl"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-3 border-l-4 border-accent bg-white/5 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <p className="text-accent font-bold tracking-widest uppercase text-xs">
              Excelencia en Ingeniería Industrial
            </p>
          </div>

          <h1 className="font-heading font-bold text-white mb-6 leading-[1.05] text-[clamp(2.5rem,6vw,4.75rem)]">
            {title}
          </h1>

          <p className="mb-10 max-w-xl text-lg md:text-xl text-gray-300 leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={ctaLink}>
              <Button
                size="lg"
                className="group bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base h-14 px-8 rounded-sm uppercase tracking-wide"
              >
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link href={secondaryCtaLink}>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white font-bold text-base h-14 px-8 rounded-sm uppercase tracking-wide"
              >
                {secondaryCtaText}
              </Button>
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6">
            {trust.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-gray-300"
              >
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom fade into page */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
