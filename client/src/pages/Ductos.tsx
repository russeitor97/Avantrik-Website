import { useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { Reveal } from "@/components/motion/Reveal";
import { QuoteForm } from "@/components/ductos/QuoteForm";
import { cn } from "@/lib/utils";
import { useCopy, useLang } from "@/lib/i18n";
import { DUCT_SPECS, FAMILIES, PRODUCTS, type FamilyId } from "@/lib/ductos";

/** Espesores nominales de lámina galvanizada. Son valores de norma, no una
 *  tabla de selección: qué calibre toca en cada ducto depende de su sección,
 *  la presión del sistema y el refuerzo. */
const GAUGES = [
  { gauge: "16", mm: "1.52" },
  { gauge: "18", mm: "1.21" },
  { gauge: "20", mm: "0.91" },
  { gauge: "22", mm: "0.76" },
  { gauge: "24", mm: "0.61" },
  { gauge: "26", mm: "0.45" },
];

const T = {
  es: {
    title: "Ductos de Lámina Galvanizada a la Medida en Querétaro | Avantrik",
    description:
      "Fabricación de ductería rectangular de lámina galvanizada a la medida en Querétaro: tramos rectos, codos, transiciones, derivaciones y terminales. Cierre Pittsburgh, unión TDF o grapa-zeta. Solicite cotización.",
    eyebrow: "Fabricación bajo pedido",
    h1: "Ductería rectangular de lámina galvanizada",
    hero: "Fabricamos tramos y piezas a la medida de su proyecto, con cierre longitudinal Pittsburgh y la unión transversal que requiera su instalación. Sin catálogo de inventario: cada pieza se produce con las dimensiones que usted necesita.",
    heroCta: "Solicitar cotización",
    heroCta2: "Ver catálogo",

    joinEyebrow: "La primera decisión",
    joinH2: "Elija el sistema de unión",
    joinIntro:
      "Todos nuestros ductos llevan el mismo cierre longitudinal Pittsburgh. Lo que cambia entre un ducto y otro es cómo se unen los tramos entre sí, y esa decisión afecta el tiempo de montaje, la rigidez del sistema y el costo. Estas son las dos opciones.",
    joints: [
      {
        name: "Grapa-zeta",
        tag: "El estándar del mercado",
        body: "La brida se forma con un perfil zeta y se cierra con una grapa que se desliza por fuera. Es el sistema más extendido en México, el de menor costo por metro y el que más fácil encuentra accesorios de repuesto.",
        points: [
          "Menor costo por tramo",
          "Accesorios disponibles en cualquier plaza",
          "Montaje sin herramienta especial",
        ],
      },
      {
        name: "TDF",
        tag: "Mayor rigidez",
        body: "La brida va integrada en el propio ducto y se atornilla tramo contra tramo con esquineros y clips de refuerzo. Da una junta más rígida y hermética, y acelera el armado en obra a cambio de un costo mayor.",
        points: [
          "Junta más rígida y hermética",
          "Armado más rápido en obra",
          "Mejor comportamiento en secciones grandes",
        ],
      },
    ],
    jointNote:
      "¿No sabe cuál le conviene? Indíquenos la sección del ducto y la presión de trabajo del sistema en la solicitud y le recomendamos el sistema adecuado.",

    specEyebrow: "Especificaciones",
    specH2: "Qué fabricamos",
    specs: [
      { k: "Material", v: DUCT_SPECS.material.es },
      { k: "Calibres", v: DUCT_SPECS.gauges },
      { k: "Cierre longitudinal", v: DUCT_SPECS.seam },
      { k: "Unión transversal", v: DUCT_SPECS.joints.es },
      { k: "Longitud de tramo", v: DUCT_SPECS.length.es },
      { k: "Medida mínima", v: DUCT_SPECS.minSize },
    ],
    specNote:
      "Rangos sujetos a confirmación según la pieza y el proyecto. Las medidas finales se definen en la cotización.",

    gaugeEyebrow: "Criterio técnico",
    gaugeH2: "Cómo se define el calibre",
    gaugeBody:
      "El espesor de la lámina no se elige por costo. Lo determinan la dimensión mayor del ducto, la presión de trabajo del sistema y el refuerzo que lleve la pieza: a mayor sección y mayor presión, calibre más grueso. Un ducto subcalibrado se deforma, vibra y acaba fugando por las juntas.",
    gaugeBody2:
      "En cada cotización verificamos la combinación de sección, presión y refuerzo contra las tablas de SMACNA antes de fabricar. Si nos indica la presión de trabajo, el calibre lo proponemos nosotros.",
    gaugeTableTitle: "Espesor nominal por calibre",
    gaugeCol1: "Calibre",
    gaugeCol2: "Espesor",

    catEyebrow: "Catálogo",
    catH2: "Piezas y accesorios",
    catIntro:
      "Todas las piezas se fabrican a la medida del proyecto y se entregan armadas o listas para armar. Si necesita una pieza que no aparece aquí, la fabricamos conforme a su plano.",
    all: "Todas",
    quoteThis: "Cotizar",
    useLabel: "Uso habitual",
    noImage: "Imagen de referencia pendiente",

    formEyebrow: "Cotización",
    formH2: "Solicite su cotización",
    formIntro:
      "Cuéntenos qué necesita. No hace falta que tenga todas las medidas definidas: con una descripción del proyecto podemos empezar.",
    noPrice:
      "No publicamos precios de lista porque cada pieza se fabrica a medida. El precio depende de la sección, el calibre, la cantidad y el sistema de unión.",
  },
  en: {
    title: "Custom Galvanized Sheet Metal Ducts in Querétaro | Avantrik",
    description:
      "Custom rectangular galvanized sheet metal ductwork in Querétaro, Mexico: straight sections, elbows, transitions, branches and terminations. Pittsburgh seam, TDF or Z-bar joints. Request a quote.",
    eyebrow: "Made to order",
    h1: "Rectangular galvanized sheet metal ductwork",
    hero: "We fabricate sections and fittings to your project's dimensions, with a Pittsburgh longitudinal seam and the transverse joint your installation calls for. No stock catalog: every part is produced at the size you need.",
    heroCta: "Request a quote",
    heroCta2: "View catalog",

    joinEyebrow: "The first decision",
    joinH2: "Choose the joint system",
    joinIntro:
      "All our duct carries the same Pittsburgh longitudinal seam. What changes from one duct to another is how sections join together, and that decision drives assembly time, system stiffness and cost. These are the two options.",
    joints: [
      {
        name: "Z-bar and drive cleat",
        tag: "The market standard",
        body: "The flange is formed with a Z-bar profile and closed with a drive cleat that slides on from outside. It is the most widely used system in Mexico, the lowest cost per meter, and the easiest to source parts for.",
        points: [
          "Lower cost per section",
          "Parts available anywhere",
          "Assembles without special tooling",
        ],
      },
      {
        name: "TDF",
        tag: "Greater stiffness",
        body: "The flange is integrated into the duct itself and bolts section to section with corner pieces and reinforcement clips. It gives a stiffer, tighter joint and speeds up on-site assembly at a higher cost.",
        points: [
          "Stiffer, tighter joint",
          "Faster on-site assembly",
          "Better behavior on large sections",
        ],
      },
    ],
    jointNote:
      "Not sure which suits you? Tell us the duct section and the system's working pressure in your request and we'll recommend the right one.",

    specEyebrow: "Specifications",
    specH2: "What we fabricate",
    specs: [
      { k: "Material", v: DUCT_SPECS.material.en },
      { k: "Gauges", v: DUCT_SPECS.gauges },
      { k: "Longitudinal seam", v: DUCT_SPECS.seam },
      { k: "Transverse joint", v: DUCT_SPECS.joints.en },
      { k: "Section length", v: DUCT_SPECS.length.en },
      { k: "Minimum size", v: DUCT_SPECS.minSize },
    ],
    specNote:
      "Ranges subject to confirmation by part and project. Final dimensions are set in the quote.",

    gaugeEyebrow: "Engineering criteria",
    gaugeH2: "How gauge is determined",
    gaugeBody:
      "Sheet thickness is not a cost decision. It is set by the duct's largest dimension, the system's working pressure and the reinforcement the part carries: larger section and higher pressure mean heavier gauge. An under-gauged duct deforms, vibrates and eventually leaks at the joints.",
    gaugeBody2:
      "On every quote we check the combination of section, pressure and reinforcement against the SMACNA tables before fabricating. Tell us the working pressure and we'll propose the gauge.",
    gaugeTableTitle: "Nominal thickness by gauge",
    gaugeCol1: "Gauge",
    gaugeCol2: "Thickness",

    catEyebrow: "Catalog",
    catH2: "Parts and fittings",
    catIntro:
      "Every part is made to the project's dimensions and delivered assembled or ready to assemble. If you need a part that isn't listed here, we fabricate it from your drawing.",
    all: "All",
    quoteThis: "Get a quote",
    useLabel: "Typical use",
    noImage: "Reference image pending",

    formEyebrow: "Quote",
    formH2: "Request your quote",
    formIntro:
      "Tell us what you need. You don't need every dimension defined yet: a project description is enough to start.",
    noPrice:
      "We don't publish list prices because every part is made to measure. Price depends on section, gauge, quantity and joint system.",
  },
};

/** Encabezado de sección: cintillo pequeño, título y regla de acento. */
function SectionHead({
  eyebrow,
  title,
  light = false,
}: {
  eyebrow: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div className="mb-10">
      <p
        className={cn(
          "mb-2 text-xs font-semibold uppercase tracking-[0.2em]",
          light ? "text-accent" : "text-accent",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "font-heading text-3xl font-bold md:text-4xl",
          light ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      <span className="mt-4 block h-0.5 w-16 bg-accent" aria-hidden="true" />
    </div>
  );
}

/** Marcador mientras no hay fotografía propia de la pieza. */
function ProductImage({ src, alt, label }: { src: string | null; alt: string; label: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-44 w-full border-b border-border object-cover"
      />
    );
  }
  return (
    <div className="flex h-44 w-full items-center justify-center border-b border-border bg-secondary/40 bg-tech-grid">
      <span className="px-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function Ductos() {
  const t = useCopy(T);
  const lang = useLang();
  const [family, setFamily] = useState<FamilyId | "all">("all");
  const [preselected, setPreselected] = useState<string>();
  const formRef = useRef<HTMLDivElement>(null);

  const visible =
    family === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.family === family);

  function requestQuote(value: string) {
    setPreselected(value);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <Layout>
      <Seo page="ducts" title={t.title} description={t.description} />

      {/* Hero */}
      <header className="relative flex min-h-[460px] items-center overflow-hidden bg-ink-gradient py-20">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto px-4 pt-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {t.eyebrow}
          </p>
          <h1 className="max-w-4xl font-heading text-4xl font-bold text-white md:text-6xl">
            {t.h1}
          </h1>
          <span className="mt-6 block h-0.5 w-24 bg-accent" aria-hidden="true" />
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300">{t.hero}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              {t.heroCta}
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent font-bold uppercase tracking-wide text-white hover:bg-white/10 hover:text-white"
            >
              <a href="#catalogo">{t.heroCta2}</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Sistema de unión */}
      <section className="border-b border-border py-20">
        <div className="container mx-auto px-4">
          <Reveal>
            <SectionHead eyebrow={t.joinEyebrow} title={t.joinH2} />
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {t.joinIntro}
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {t.joints.map((j, i) => (
              <Reveal key={j.name} delay={i * 0.08}>
                <article className="h-full border border-border bg-card p-8 rounded-sm">
                  <div className="mb-4 flex items-baseline justify-between gap-4">
                    <h3 className="font-heading text-2xl font-bold text-foreground">{j.name}</h3>
                    <span className="shrink-0 border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground/80">
                      {j.tag}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{j.body}</p>
                  <ul className="mt-6 space-y-2 border-t border-border pt-6">
                    {j.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-foreground">
                        <span
                          className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-accent"
                          aria-hidden="true"
                        />
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className="mt-8 border-l-2 border-accent bg-secondary/40 py-3 pl-4 text-sm text-muted-foreground">
              {t.jointNote}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Especificaciones + calibre */}
      <section className="border-b border-border bg-secondary/30 py-20">
        <div className="container mx-auto grid grid-cols-1 gap-14 px-4 lg:grid-cols-2">
          <Reveal>
            <SectionHead eyebrow={t.specEyebrow} title={t.specH2} />
            <dl className="border-t border-border">
              {t.specs.map((s) => (
                <div
                  key={s.k}
                  className="flex items-baseline justify-between gap-6 border-b border-border py-3"
                >
                  <dt className="text-sm uppercase tracking-wide text-muted-foreground">{s.k}</dt>
                  <dd className="text-right font-mono text-sm font-medium text-foreground">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">{t.specNote}</p>
          </Reveal>

          <Reveal delay={0.08}>
            <SectionHead eyebrow={t.gaugeEyebrow} title={t.gaugeH2} />
            <p className="leading-relaxed text-muted-foreground">{t.gaugeBody}</p>
            <p className="mt-4 leading-relaxed text-muted-foreground">{t.gaugeBody2}</p>

            <div className="mt-8 border border-border bg-card rounded-sm">
              <p className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.gaugeTableTitle}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-2 font-medium text-muted-foreground">{t.gaugeCol1}</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                      {t.gaugeCol2}
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {GAUGES.map((g) => (
                    <tr key={g.gauge} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-foreground">Cal. {g.gauge}</td>
                      <td className="px-4 py-2 text-right text-foreground">{g.mm} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="scroll-mt-24 py-20">
        <div className="container mx-auto px-4">
          <Reveal>
            <SectionHead eyebrow={t.catEyebrow} title={t.catH2} />
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{t.catIntro}</p>
          </Reveal>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => setFamily("all")}
              className={cn(
                "border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                family === "all"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground",
              )}
            >
              {t.all}
            </button>
            {FAMILIES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFamily(f.id)}
                className={cn(
                  "border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                  family === f.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent/50 hover:text-foreground",
                )}
              >
                {f[lang]}
              </button>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => {
              const c = p[lang];
              const familyName = FAMILIES.find((f) => f.id === p.family)!;
              return (
                <article
                  key={p.id}
                  className="flex flex-col border border-border bg-card rounded-sm transition-colors hover:border-accent/50"
                >
                  <ProductImage src={p.image} alt={c.name} label={t.noImage} />
                  <div className="flex flex-1 flex-col p-6">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {familyName[lang]}
                    </p>
                    <h3 className="font-heading text-xl font-bold text-foreground">{c.name}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {c.description}
                    </p>
                    <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wide text-foreground/70">
                        {t.useLabel}:
                      </span>{" "}
                      {c.use}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6 w-full border-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => requestQuote(`${familyName.es} — ${p.es.name}`)}
                    >
                      {t.quoteThis}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cotización */}
      <section ref={formRef} className="scroll-mt-20 bg-ink-gradient py-20 relative overflow-hidden">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto grid grid-cols-1 gap-12 px-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <SectionHead eyebrow={t.formEyebrow} title={t.formH2} light />
            <p className="leading-relaxed text-gray-300">{t.formIntro}</p>
            <p className="mt-6 border-l-2 border-accent pl-4 text-sm text-gray-400">{t.noPrice}</p>
          </div>
          <div className="border border-border bg-card p-8 rounded-sm shadow-lg lg:col-span-3">
            <QuoteForm preselected={preselected} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
