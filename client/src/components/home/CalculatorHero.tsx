import { useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Calculator, ArrowRight, TrendingDown, Zap } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useHref, useLang } from "@/lib/i18n";

/** Los importes siguen en pesos: la operación y las tarifas CFE son mexicanas. */
const makeFmt = (lang: "es" | "en") => (n: number) =>
  n.toLocaleString(lang === "en" ? "en-US" : "es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });

const T = {
  es: {
    eyebrow: "Calculadora de ahorro",
    headline: "¿Cuánto está perdiendo tu empresa cada mes?",
    sub: "Calcula tu ahorro potencial en energía en menos de 2 minutos. Es gratis.",
    cta: "Calcula tu ahorro",
    potential: "Potencial de ahorro",
    spendLabel: "Tu gasto mensual de energía",
    spendAria: "Gasto mensual de energía en pesos",
    min: "$100 mil",
    max: "$3 millones",
    couldSave: "Podrías estar ahorrando",
    perMonth: "cada mes, solo en climatización",
    todayLabel: "Climatización hoy",
    automatedLabel: "Con automatización",
    disclaimer:
      "Estimación preliminar: 35% del gasto asociado a climatización y control manual actual.",
    detailed: "Obtén tu cálculo detallado →",
  },
  en: {
    eyebrow: "Savings calculator",
    headline: "How much is your plant losing every month?",
    sub: "Estimate your potential energy savings in under 2 minutes. It's free.",
    cta: "Calculate your savings",
    potential: "Savings potential",
    spendLabel: "Your monthly energy spend",
    spendAria: "Monthly energy spend in Mexican pesos",
    min: "$100K",
    max: "$3M",
    couldSave: "You could be saving",
    perMonth: "every month, on HVAC alone",
    todayLabel: "HVAC today",
    automatedLabel: "With automation",
    disclaimer:
      "Preliminary estimate: 35% of spend attributed to HVAC, assuming manual control today.",
    detailed: "Get your detailed calculation →",
  },
};

/**
 * Home protagonist section that drives visitors to the savings calculator.
 * Includes a LIVE mini-estimator: the visitor drags a slider with their
 * monthly energy spend and instantly sees a preliminary savings range.
 *
 * Assumptions mirror the official Calc 1 spec (Excel): HVAC share 35%
 * (suggested industrial value) × 15–25% savings factor (manual control).
 * This is only a marketing teaser — the real calculation lives in
 * /calculadora-ahorro and is NOT modified here.
 */
export function CalculatorHero() {
  const reduce = useReducedMotion();
  const [monthlySpend, setMonthlySpend] = useState(800000);
  const lang = useLang();
  const href = useHref();
  const t = T[lang];
  const fmt = makeFmt(lang);

  const hvacCost = monthlySpend * 0.35; // % sugerido del gasto asociado a A/C
  const savingsLow = hvacCost * 0.15; // factor bajo (control manual)
  const savingsHigh = hvacCost * 0.25; // factor alto (control manual)

  // Ancho de la barra "optimizado": reducción media del gasto de climatización
  const optimizedPct = 100 - ((0.15 + 0.25) / 2) * 100; // 80%

  return (
    <section className="relative overflow-hidden bg-ink-gradient text-primary-foreground">
      <TechBackdrop />

      <div className="container relative z-10 mx-auto grid items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2">
        {/* Hook + CTA */}
        <Reveal>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-accent" />
            <span className="text-accent font-bold tracking-widest uppercase text-xs">
              {t.eyebrow}
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-heading font-bold leading-tight text-white">
            {t.headline}
          </h2>

          <p className="mt-5 max-w-lg text-lg text-primary-foreground/70 leading-relaxed">
            {t.sub}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link href={href("calculator")}>
              <Button
                size="lg"
                className="group bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wide h-14 px-8 rounded-sm"
              >
                <Calculator className="w-5 h-5 mr-2" /> {t.cta}
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Reveal>

        {/* Live mini-estimator */}
        <Reveal delay={0.15} className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md rounded-sm border border-accent/20 bg-primary/30 backdrop-blur-sm p-7 shadow-2xl">
            <div className="flex items-center gap-2 text-accent">
              <TrendingDown className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {t.potential}
              </span>
            </div>

            {/* Slider: gasto mensual */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-4">
                <label
                  htmlFor="gasto-slider"
                  className="text-sm text-primary-foreground/70"
                >
                  {t.spendLabel}
                </label>
                <span className="font-heading text-xl font-bold text-white whitespace-nowrap">
                  {fmt(monthlySpend)}
                </span>
              </div>
              <Slider
                id="gasto-slider"
                value={[monthlySpend]}
                onValueChange={(v) => setMonthlySpend(v[0])}
                min={100000}
                max={3000000}
                step={50000}
                className="mt-4"
                aria-label={t.spendAria}
              />
              <div className="mt-1.5 flex justify-between text-[11px] text-primary-foreground/40">
                <span>{t.min}</span>
                <span>{t.max}</span>
              </div>
            </div>

            {/* Resultado en vivo */}
            <div className="mt-6 rounded-sm border border-accent/30 bg-accent/10 p-4">
              <p className="text-xs uppercase tracking-wide font-medium text-primary-foreground/60 mb-1">
                {t.couldSave}
              </p>
              <p className="font-heading text-2xl md:text-3xl font-bold text-accent text-glow-accent whitespace-nowrap">
                {fmt(savingsLow)} — {fmt(savingsHigh)}
              </p>
              <p className="mt-1 text-xs text-primary-foreground/50">
                {t.perMonth}
              </p>
            </div>

            {/* Barras comparativas */}
            <div className="mt-6 space-y-3" aria-hidden="true">
              <div>
                <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-primary-foreground/50">
                  <span>{t.todayLabel}</span>
                  <span>{fmt(hvacCost)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-primary-foreground/15">
                  <div className="h-full w-full rounded-full bg-primary-foreground/40" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wide text-accent/80">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" /> {t.automatedLabel}
                  </span>
                  <span>≈ {fmt(hvacCost * (optimizedPct / 100))}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-primary-foreground/15">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: `${optimizedPct}%` }}
                    transition={{ duration: reduce ? 0 : 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-primary-foreground/40">
              {t.disclaimer}{" "}
              <Link href={href("calculator")}>
                <a className="text-accent underline-offset-2 hover:underline">
                  {t.detailed}
                </a>
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
