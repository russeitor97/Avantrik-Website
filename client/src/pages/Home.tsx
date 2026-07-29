import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { HeroSection } from "@/components/ui/hero-section";
import { ServiceCard } from "@/components/ui/service-card";
import { CalculatorHero } from "@/components/home/CalculatorHero";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCounter } from "@/components/ui/stat-counter";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useHref, useLang, type PageKey } from "@/lib/i18n";
import { Zap, Wind, Cpu, Activity, ArrowRight, CheckCircle, ShieldCheck, Clock, Globe2 } from "lucide-react";

const SERVICE_ICONS = { audits: Activity, hvac: Wind, electrical: Zap, geothermal: Cpu };

const T = {
  es: {
    title: "Ingeniería, HVAC y Eficiencia Energética en Querétaro | Avantrik",
    description:
      "Empresa de ingeniería en Querétaro especializada en HVAC industrial, auditorías energéticas, BMS e ingeniería eléctrica para plantas y edificios. Servicio en Querétaro y el Bajío.",
    heroTitle: "INGENIERÍA PARA EL FUTURO DE LA INDUSTRIA",
    heroSubtitle:
      "Avantrik ofrece soluciones técnicas de alta precisión para infraestructura industrial, eficiencia energética y optimización de sistemas.",
    heroCta: "Solicitar Auditoría",
    heroSecondaryCta: "Contáctanos",
    services: {
      audits: {
        title: "Auditorías Energéticas",
        description:
          "Análisis exhaustivo del consumo energético de su instalación con estrategias de optimización basadas en datos.",
      },
      hvac: {
        title: "HVAC Industrial",
        description:
          "Sistemas de control climático de alto rendimiento diseñados para entornos industriales complejos y plantas de fabricación.",
      },
      electrical: {
        title: "Ingeniería Eléctrica",
        description:
          "Planeación, instalación y modernización de infraestructura eléctrica avanzada de baja y media tensión.",
      },
      geothermal: {
        title: "Sistemas Geotérmicos",
        description:
          "Soluciones de calefacción y refrigeración sostenibles que aprovechan la energía térmica subterránea para una eficiencia a largo plazo.",
      },
    },
    introEyebrow: "Ingeniería en Querétaro · HVAC y Eficiencia Energética",
    introTitle: "Soluciones de Ingeniería, HVAC y Energía para la Industria",
    introBody:
      "Avantrik es una firma de ingeniería con base en Querétaro, dedicada a optimizar la infraestructura industrial y comercial en Querétaro y el Bajío. No solo reparamos sistemas; los re-ingeniamos para lograr la máxima eficiencia y fiabilidad.",
    introBullets: [
      "Reducción de Costos Operativos",
      "Optimización de Sistemas",
      "Eficiencia Energética",
      "Ingeniería Aplicada",
    ],
    aboutCta: "Más Sobre Nosotros",
    statLabel: "Ahorro Energético Promedio para Clientes",
    servicesEyebrow: "Nuestra Experiencia",
    servicesTitle: "Soluciones Especializadas de Ingeniería",
    servicesSubtitle:
      "Brindamos servicios integrales para entornos residenciales, comerciales e industriales, entregando soluciones a medida que impulsan el rendimiento.",
    whyEyebrow: "Por qué Avantrik",
    whyTitle: "Ingeniería con respaldo y resultados medibles",
    metrics: {
      years: "Años de experiencia",
      savings: "Ahorro energético promedio",
      iso: "Sistema de gestión de calidad",
      binational: "Operación binacional",
      binationalValue: "MX · EE.UU.",
    },
    sectors: "Industrias · Hospitales · Comercios · Desarrollos habitacionales",
    ctaTitle: "¿Listo para Optimizar su Infraestructura?",
    ctaBody:
      "Programe una consulta con nuestro equipo de ingeniería para identificar brechas de eficiencia y oportunidades de modernización.",
    ctaButton: "Iniciar un Proyecto",
  },
  en: {
    title: "Engineering, Industrial HVAC & Energy Efficiency in Querétaro | Avantrik",
    description:
      "Engineering firm in Querétaro, Mexico specializing in industrial HVAC, energy audits, BMS and electrical engineering for plants and buildings. Serving Querétaro and the Bajío region.",
    heroTitle: "ENGINEERING FOR THE FUTURE OF INDUSTRY",
    heroSubtitle:
      "Avantrik delivers high-precision technical solutions for industrial infrastructure, energy efficiency and systems optimization.",
    heroCta: "Request an Audit",
    heroSecondaryCta: "Contact Us",
    services: {
      audits: {
        title: "Energy Audits",
        description:
          "In-depth analysis of your facility's energy consumption, with data-driven optimization strategies.",
      },
      hvac: {
        title: "Industrial HVAC",
        description:
          "High-performance climate control systems engineered for complex industrial environments and manufacturing plants.",
      },
      electrical: {
        title: "Electrical Engineering",
        description:
          "Planning, installation and modernization of advanced low- and medium-voltage electrical infrastructure.",
      },
      geothermal: {
        title: "Geothermal Systems",
        description:
          "Sustainable heating and cooling solutions that tap underground thermal energy for long-term efficiency.",
      },
    },
    introEyebrow: "Engineering in Querétaro · HVAC and Energy Efficiency",
    introTitle: "Engineering, HVAC and Energy Solutions for Industry",
    introBody:
      "Avantrik is an engineering firm based in Querétaro, Mexico, dedicated to optimizing industrial and commercial infrastructure across Querétaro and the Bajío region. We don't just repair systems — we re-engineer them for maximum efficiency and reliability.",
    introBullets: [
      "Lower Operating Costs",
      "Systems Optimization",
      "Energy Efficiency",
      "Applied Engineering",
    ],
    aboutCta: "More About Us",
    statLabel: "Average Energy Savings for Clients",
    servicesEyebrow: "Our Expertise",
    servicesTitle: "Specialized Engineering Solutions",
    servicesSubtitle:
      "We provide end-to-end services for residential, commercial and industrial environments, delivering tailored solutions that drive performance.",
    whyEyebrow: "Why Avantrik",
    whyTitle: "Engineering backed by credentials and measurable results",
    metrics: {
      years: "Years of experience",
      savings: "Average energy savings",
      iso: "Quality management system",
      binational: "Binational operation",
      binationalValue: "MX · USA",
    },
    sectors: "Industry · Hospitals · Retail · Residential developments",
    ctaTitle: "Ready to Optimize Your Facility?",
    ctaBody:
      "Schedule a consultation with our engineering team to identify efficiency gaps and modernization opportunities.",
    ctaButton: "Start a Project",
  },
};

export default function Home() {
  const lang = useLang();
  const href = useHref();
  const t = T[lang];

  const services = (["audits", "hvac", "electrical", "geothermal"] as const).map((key) => ({
    title: t.services[key].title,
    description: t.services[key].description,
    icon: SERVICE_ICONS[key],
    href: href(key as PageKey),
  }));

  return (
    <Layout>
      <Seo page="home" title={t.title} description={t.description} />

      <HeroSection
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        ctaText={t.heroCta}
        ctaLink={href("contact")}
        secondaryCtaText={t.heroSecondaryCta}
      />

      {/* Intro Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <Reveal className="w-full md:w-1/2">
              <h2 className="text-accent font-bold tracking-widest uppercase mb-2 text-sm">{t.introEyebrow}</h2>
              <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
                {t.introTitle}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {t.introBody}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {t.introBullets.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span className="font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href={href("about")}>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide">
                  {t.aboutCta}
                </Button>
              </Link>
            </Reveal>
            <Reveal delay={0.15} className="w-full md:w-1/2">
              <div className="relative h-[400px] bg-secondary/30 rounded-sm overflow-hidden border border-border">
                <div className="absolute inset-0 bg-tech-grid opacity-70" />
                <div className="absolute inset-0 bg-brand-glow" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8 bg-background/85 backdrop-blur-sm border border-border shadow-lg rounded-sm max-w-xs">
                        <div className="text-5xl font-heading font-bold text-accent mb-2">
                          <StatCounter to={35} suffix="%" />
                        </div>
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t.statLabel}</div>
                    </div>
                </div>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Calculator — protagonist */}
      <CalculatorHero />

      {/* Services Section */}
      <section className="py-20 bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4">
          <SectionHeading
            align="center"
            eyebrow={t.servicesEyebrow}
            title={t.servicesTitle}
            subtitle={t.servicesSubtitle}
            className="mb-16"
          />

          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <StaggerItem key={service.href} className="h-full">
                <ServiceCard {...service} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Why Avantrik — credentials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <SectionHeading
            align="center"
            eyebrow={t.whyEyebrow}
            title={t.whyTitle}
            className="mb-14"
          />
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { value: <StatCounter to={15} suffix="+" />, label: t.metrics.years, icon: Clock },
              { value: <StatCounter to={35} suffix="%" />, label: t.metrics.savings, icon: Activity },
              { value: "ISO 9001", label: t.metrics.iso, icon: ShieldCheck },
              { value: t.metrics.binationalValue, label: t.metrics.binational, icon: Globe2 },
            ].map((m, i) => (
              <StaggerItem key={i}>
                <div className="h-full rounded-sm border border-border bg-card p-6 text-center transition-colors hover:border-accent/40">
                  <m.icon className="mx-auto mb-3 h-7 w-7 text-accent" />
                  <div className="font-heading text-3xl font-bold text-foreground">{m.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{m.label}</div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal className="text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              {t.sectors}
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-tech-grid opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-brand-glow pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">{t.ctaTitle}</h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              {t.ctaBody}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={href("contact")}>
                <Button size="lg" className="group bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-14 px-8 uppercase tracking-wide rounded-sm">
                  {t.ctaButton}
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
