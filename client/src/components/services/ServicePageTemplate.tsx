/**
 * Plantilla de página de servicio.
 *
 * HVAC Industrial, Ingeniería Eléctrica y Geotermia comparten exactamente la
 * misma estructura (hero, intro, dos tarjetas, lista de capacidades y CTA
 * lateral); solo cambian los textos y los iconos. Cada página aporta su
 * diccionario ES/EN y llama a este componente.
 */
import type { LucideIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { Reveal } from "@/components/motion/Reveal";
import { useHref, type PageKey } from "@/lib/i18n";

export interface ServiceCopy {
  title: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  h2: string;
  intro: string;
  cards: { title: string; body: string }[];
  listTitle: string;
  listItems: string[];
  sidebarTitle: string;
  sidebarBody: string;
  sidebarCta: string;
}

interface Props {
  page: PageKey;
  copy: ServiceCopy;
  /** Un icono por tarjeta, en el mismo orden que `copy.cards`. */
  cardIcons: LucideIcon[];
}

export function ServicePageTemplate({ page, copy, cardIcons }: Props) {
  const href = useHref();

  return (
    <Layout>
      <Seo page={page} title={copy.title} description={copy.description} />

      <div className="relative flex h-[52vh] min-h-[420px] items-center overflow-hidden bg-ink-gradient">
        <TechBackdrop />
        <div className="container mx-auto px-4 relative z-10 pt-24">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">{copy.heroTitle}</h1>
            <p className="text-xl text-gray-200 max-w-2xl">
              {copy.heroSubtitle}
            </p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <Reveal className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">{copy.h2}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {copy.intro}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {copy.cards.map((card, i) => {
                  const Icon = cardIcons[i];
                  return (
                    <div key={card.title} className="bg-secondary/50 p-6 rounded-sm border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-md">
                        <Icon className="w-10 h-10 text-accent mb-4" />
                        <h3 className="font-heading font-bold text-xl mb-2">{card.title}</h3>
                        <p className="text-sm text-muted-foreground">{card.body}</p>
                    </div>
                  );
                })}
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">{copy.listTitle}</h3>
            <ul className="space-y-4">
              {copy.listItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="lg:col-span-1">
            <div className="bg-card shadow-lg border border-border p-8 rounded-sm sticky top-24">
              <h3 className="font-heading font-bold text-2xl mb-4">{copy.sidebarTitle}</h3>
              <p className="text-muted-foreground mb-6">{copy.sidebarBody}</p>

              <Link href={href("contact")}>
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  {copy.sidebarCta}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
