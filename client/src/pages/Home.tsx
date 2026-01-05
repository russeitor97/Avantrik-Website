import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/ui/hero-section";
import { ServiceCard } from "@/components/ui/service-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, Wind, Cpu, Activity, ArrowRight, CheckCircle } from "lucide-react";

import heroImage from "@assets/generated_images/modern_industrial_engineering_facility_with_technical_atmosphere.png";
import energyImage from "@assets/generated_images/digital_energy_audit_tablet_in_factory_setting.png";
import hvacImage from "@assets/generated_images/large_scale_industrial_hvac_systems_on_rooftop.png";
import electricalImage from "@assets/generated_images/professional_industrial_electrical_control_panel.png";
import geothermalImage from "@assets/generated_images/industrial_geothermal_system_visualization.png";

export default function Home() {
  const services = [
    {
      title: "Auditorías Energéticas",
      description: "Análisis exhaustivo del consumo energético de su instalación con estrategias de optimización basadas en datos.",
      icon: Activity,
      href: "/services/energy-audits",
      image: energyImage
    },
    {
      title: "HVAC Industrial",
      description: "Sistemas de control climático de alto rendimiento diseñados para entornos industriales complejos y plantas de fabricación.",
      icon: Wind,
      href: "/services/industrial-hvac",
      image: hvacImage
    },
    {
      title: "Ingeniería Eléctrica",
      description: "Planeación, instalación y modernización de infraestructura eléctrica avanzada de baja y media tensión.",
      icon: Zap,
      href: "/services/electrical-engineering",
      image: electricalImage
    },
    {
      title: "Sistemas Geotérmicos",
      description: "Soluciones de calefacción y refrigeración sostenibles que aprovechan la energía térmica subterránea para una eficiencia a largo plazo.",
      icon: Cpu, // Using Cpu as a placeholder for complex tech/system
      href: "/services/geothermal-systems",
      image: geothermalImage
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
        image={heroImage}
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
            <div className="w-full md:w-1/2">
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
            </div>
            <div className="w-full md:w-1/2 relative h-[400px] bg-secondary/30 rounded-lg overflow-hidden border border-border">
                {/* Abstract visualization or secondary image could go here */}
                <div className="absolute inset-0 bg-primary/5 pattern-grid-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8 bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-sm max-w-xs">
                        <div className="text-5xl font-heading font-bold text-accent mb-2">35%</div>
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ahorro Energético Promedio para Clientes</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-accent font-bold tracking-widest uppercase mb-2 text-sm">Nuestra Experiencia</h2>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Soluciones Especializadas de Ingeniería
            </h3>
            <p className="text-muted-foreground">
              Brindamos servicios integrales para entornos residenciales, comerciales e industriales, entregando soluciones a medida que impulsan el rendimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">¿Listo para Optimizar su Infraestructura?</h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Programe una consulta con nuestro equipo de ingeniería para identificar brechas de eficiencia y oportunidades de modernización.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-14 px-8 uppercase tracking-wide">
                Iniciar un Proyecto
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
