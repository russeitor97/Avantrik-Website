import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Users, Award, Briefcase } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { useCopy } from "@/lib/i18n";

const T = {
  es: {
    title: "Sobre Avantrik | Ingeniería Industrial y Energética en Querétaro",
    description:
      "Conoce Avantrik: empresa de ingeniería en Querétaro especializada en HVAC industrial, ingeniería eléctrica, BMS y eficiencia energética para industrias y edificios.",
    h1: "Sobre Avantrik",
    tagline: "Excelencia en Ingeniería desde 2005",
    missionEyebrow: "Nuestra Misión",
    missionTitle:
      "Empoderar a las industrias con infraestructura técnica eficiente, sostenible y resiliente.",
    body: [
      "Avantrik es una empresa de ingeniería con base en Querétaro que ofrece soluciones técnicas a clientes residenciales, industriales, comerciales y corporativos. Nuestra experiencia está diseñada para adaptarse a la complejidad y escala de cualquier entorno, garantizando siempre los más altos estándares de calidad.",
      "Nuestro enfoque es profundamente técnico. Creemos que la verdadera eficiencia proviene de una comprensión rigurosa de la física, la termodinámica y los sistemas eléctricos, no solo de la instalación de equipos nuevos. Analizamos, planificamos y ejecutamos con precisión en cada proyecto.",
    ],
    cards: [
      {
        title: "Equipo Experto",
        body: "Ingenieros certificados en disciplinas mecánicas, eléctricas y energéticas.",
      },
      {
        title: "Calidad Primero",
        body: "Procesos certificados ISO 9001 que aseguran una entrega consistente y de alto estándar.",
      },
      {
        title: "Enfoque B2B",
        body: "Dedicados exclusivamente a las necesidades de socios industriales y comerciales.",
      },
    ],
  },
  en: {
    title: "About Avantrik | Industrial & Energy Engineering in Querétaro",
    description:
      "Meet Avantrik: an engineering firm in Querétaro, Mexico specializing in industrial HVAC, electrical engineering, BMS and energy efficiency for industry and buildings.",
    h1: "About Avantrik",
    tagline: "Engineering Excellence since 2005",
    missionEyebrow: "Our Mission",
    missionTitle:
      "Empowering industry with efficient, sustainable and resilient technical infrastructure.",
    body: [
      "Avantrik is an engineering firm based in Querétaro, Mexico, delivering technical solutions to residential, industrial, commercial and corporate clients. Our expertise adapts to the complexity and scale of any environment, always meeting the highest quality standards.",
      "Our approach is deeply technical. We believe real efficiency comes from a rigorous understanding of physics, thermodynamics and electrical systems — not simply from installing new equipment. We analyze, plan and execute with precision on every project.",
    ],
    cards: [
      {
        title: "Expert Team",
        body: "Certified engineers across mechanical, electrical and energy disciplines.",
      },
      {
        title: "Quality First",
        body: "ISO 9001 certified processes that ensure consistent, high-standard delivery.",
      },
      {
        title: "B2B Focus",
        body: "Dedicated exclusively to the needs of industrial and commercial partners.",
      },
    ],
  },
};

const CARD_ICONS = [Users, Award, Briefcase];

export default function About() {
  const t = useCopy(T);

  return (
    <Layout>
      <Seo page="about" title={t.title} description={t.description} />

       <div className="relative flex h-[44vh] min-h-[340px] items-center overflow-hidden bg-ink-gradient">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto px-4 pt-24 text-center">
            <h1 className="mb-4 text-4xl font-heading font-bold text-white md:text-5xl">{t.h1}</h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-300">{t.tagline}</p>
        </div>
      </div>

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
            <Reveal>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">{t.missionEyebrow}</h2>
              <h3 className="mb-8 text-3xl font-heading font-bold text-foreground md:text-4xl">
                  {t.missionTitle}
              </h3>

              <div className="prose prose-lg mb-12 text-muted-foreground">
                  {t.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
              </div>
            </Reveal>

            <Stagger className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                {t.cards.map((card, i) => {
                  const Icon = CARD_ICONS[i];
                  return (
                    <StaggerItem key={card.title}>
                      <div className="h-full rounded-sm border border-border bg-secondary/20 p-6 text-center transition-all hover:-translate-y-1 hover:border-accent/40">
                        <Icon className="mx-auto mb-4 h-12 w-12 text-accent" />
                        <h4 className="mb-2 font-heading text-xl font-bold">{card.title}</h4>
                        <p className="text-sm text-muted-foreground">{card.body}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
            </Stagger>
        </div>
      </section>
    </Layout>
  );
}
