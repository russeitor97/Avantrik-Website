import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowRight, TrendingDown } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { StatCounter } from "@/components/ui/stat-counter";
import { TechBackdrop } from "@/components/ui/tech-backdrop";

/**
 * Home protagonist section that drives visitors to the savings calculator.
 * Emotional hook + animated number (the site's existing 35% average-savings
 * stat) + a radial gauge + a large CTA to /calculadora-ahorro.
 * Visual only — links to the existing calculator page, no logic here.
 */
export function CalculatorHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-ink-gradient text-primary-foreground">
      <TechBackdrop />

      <div className="container relative z-10 mx-auto grid items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
        {/* Hook + CTA */}
        <Reveal>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-accent" />
            <span className="text-accent font-bold tracking-widest uppercase text-xs">
              Calculadora de ahorro
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-heading font-bold leading-tight text-white">
            ¿Cuánto está perdiendo tu empresa cada mes?
          </h2>

          <p className="mt-5 max-w-lg text-lg text-primary-foreground/70 leading-relaxed">
            Calcula tu ahorro potencial en energía en menos de 2 minutos. Es
            gratis.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href="/calculadora-ahorro">
              <Button
                size="lg"
                className="group bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wide h-14 px-8 rounded-sm"
              >
                <Calculator className="w-5 h-5 mr-2" /> Calcula tu ahorro
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Reveal>

        {/* Animated gauge */}
        <Reveal delay={0.15} className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm rounded-sm border border-accent/20 bg-primary/30 backdrop-blur-sm p-8 shadow-2xl">
            <div className="flex items-center gap-2 text-accent">
              <TrendingDown className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Potencial de ahorro
              </span>
            </div>

            {/* Radial gauge (semicircle) */}
            <div className="relative mt-4 flex flex-col items-center">
              <svg viewBox="0 0 240 140" className="w-full" aria-hidden="true">
                <path
                  d="M20 130 A100 100 0 0 1 220 130"
                  fill="none"
                  stroke="hsl(var(--primary-foreground) / 0.12)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <motion.path
                  d="M20 130 A100 100 0 0 1 220 130"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="16"
                  strokeLinecap="round"
                  initial={reduce ? { pathLength: 0.35 } : { pathLength: 0 }}
                  whileInView={{ pathLength: 0.35 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>

              <div className="-mt-12 text-center">
                <StatCounter
                  to={35}
                  suffix="%"
                  duration={1.8}
                  className="font-heading text-6xl font-bold text-white text-glow-accent"
                />
                <p className="mt-1 text-sm text-primary-foreground/60">
                  ahorro energético promedio
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
