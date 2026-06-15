import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/ui/hero-section";
import { ServiceCard } from "@/components/ui/service-card";
import { CalculatorHero } from "@/components/home/CalculatorHero";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCounter } from "@/components/ui/stat-counter";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, Wind, Cpu, Activity, ArrowRight, CheckCircle, ShieldCheck, Clock, Globe2 } from "lucide-react";

export default function Home() {
  const services = [
    {
      title: "Auditorías Energéticas",
      description: "Análisis exhaustivo del consumo energético de su instalación con estrategias de optimización basadas en datos.",
      icon: Activity,
      href: "/auditoria-energetica",
    },
    {
      title: "HVAC Industrial",
      description: "Sistemas de control climático de alto rendimiento diseñados para entornos industriales complejos y plantas de fabricación.",
      icon: Wind,
      href: "/hvac-industrial",
    },
    {
      title: "Ingeniería Eléctrica",
      description: "Planeación, instalación y modernización de infraestructura eléctrica avanzada de baja y media tensión.",
      icon: Zap,
      href: "/ingenieria-electrica",
    },
    {
      title: "Sistemas Geotérmicos",
      description: "Soluciones de calefacción y refrigeración sostenibles que aprovechan la energía térmica subterránea para una eficiencia a largo plazo.",
      icon: Cpu,
      href: "/geotermia",
    }
  ];

  return (
    <Layout>    <Helmet>
        <title>
          Ingeniería Industrial, HVAC y Eficiencia Energética | Avantrik México
        </title>

        <meta
          name="description"
          content="Empresa de ingeniería industrial en México especializada en HVAC industrial, auditorías energéticas, ingeniería eléctrica y soluciones técnicas para plantas y edificios."
        />

        <link
          rel="canonical"
          href="https://www.avantrik.com/"
        />
      </Helmet>

      <HeroSection
        title="INGENIERÍA PARA EL FUTURO DE LA INDUSTRIA"
        subtitle="Avantrik ofrece soluciones técnicas de alta precisión para infraestructura industrial, eficiencia energética y optimización de sistemas."
        ctaText="Solicitar Auditoría"
        ctaLink="/contact"
        secondaryCtaText="Contáctanos"
      />

      {/* Intro Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <Reveal className="w-full md:w-1/2">
              <h2 className="text-accent font-bold tracking-widest uppercase mb-2 text-sm">Ingeniería Industrial y Eficiencia Energética</h2>
              <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
                Soluciones de Ingeniería, HVAC y Energía para la Industria
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Avantrik es una firma de ingeniería dedicada a optimizar la infraestructura industrial y comercial. No solo reparamos sistemas; los re-ingeniamos para lograr la máxima eficiencia y fiabilidad.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {["Reducción de Costos Operativos", "Optimización de Sistemas", "Eficiencia Energética", "Ingeniería Aplicada"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span className="font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide">
                  Más Sobre Nosotros
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
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ahorro Energético Promedio para Clientes</div>
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
            eyebrow="Nuestra Experiencia"
            title="Soluciones Especializadas de Ingeniería"
            subtitle="Brindamos servicios integrales para entornos residenciales, comerciales e industriales, entregando soluciones a medida que impulsan el rendimiento."
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
            eyebrow="Por qué Avantrik"
            title="Ingeniería con respaldo y resultados medibles"
            className="mb-14"
          />
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { value: <StatCounter to={15} suffix="+" />, label: "Años de experiencia", icon: Clock },
              { value: <StatCounter to={35} suffix="%" />, label: "Ahorro energético promedio", icon: Activity },
              { value: "ISO 9001", label: "Sistema de gestión de calidad", icon: ShieldCheck },
              { value: "MX · EE.UU.", label: "Operación binacional", icon: Globe2 },
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
              Industrias · Hospitales · Comercios · Desarrollos habitacionales
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
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">¿Listo para Optimizar su Infraestructura?</h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              Programe una consulta con nuestro equipo de ingeniería para identificar brechas de eficiencia y oportunidades de modernización.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="group bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-14 px-8 uppercase tracking-wide rounded-sm">
                  Iniciar un Proyecto
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
