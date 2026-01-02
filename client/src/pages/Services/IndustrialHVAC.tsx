import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Wind, Thermometer, Fan, Gauge } from "lucide-react";
import { Helmet } from "react-helmet-async";
import hvacImage from "@assets/generated_images/large_scale_industrial_hvac_systems_on_rooftop.png";

export default function IndustrialHVAC() {
  return (
    <Layout>
      <Helmet>
        <title>Sistemas HVAC Industriales | Avantrik</title>
        <meta name="description" content="Diseño e instalación de sistemas HVAC industriales para plantas de manufactura. Control térmico preciso y eficiencia energética." />
      </Helmet>
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${hvacImage})` }}>
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">HVAC Industrial para Plantas y Edificios Industriales
</h1>
            <p className="text-xl text-gray-200 max-w-2xl"><p className="text-xl text-gray-200 max-w-2xl">
              Diseño, instalación y optimización de sistemas HVAC industrial para plantas de manufactura y edificios industriales, enfocados en eficiencia energética, confiabilidad operativa y control térmico preciso.
            </p>
</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Sistemas HVAC Industriales para Procesos Críticos</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Los entornos industriales requieren soluciones HVAC robustas que van más allá del confort. Diseñamos, instalamos y optimizamos sistemas que mantienen temperaturas críticas de proceso, aseguran la calidad del aire y operan con la máxima eficiencia energética bajo cargas pesadas.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Fan className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Ventilación y Filtración</h3>
                    <p className="text-sm text-muted-foreground">Manejo de aire de alta capacidad para fábricas con polvo, humos o subproductos químicos.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Thermometer className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Enfriamiento de Procesos</h3>
                    <p className="text-sm text-muted-foreground">Chillers y torres de enfriamiento integrados directamente con las líneas de fabricación.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">Nuestras Capacidades</h3>
            <ul className="space-y-4">
              {[
                "Diseño e instalación de plantas de chillers a gran escala",
                "Sistemas de Flujo de Refrigerante Variable (VRF)",
                "Soluciones HVAC para salas blancas (Clean rooms)",
                "Sistemas de ventilación con recuperación de calor",
                "Integración de Sistemas de Gestión de Edificios (BMS) inteligentes"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card shadow-lg border border-border p-8 rounded-sm sticky top-24">
              <h3 className="font-heading font-bold text-2xl mb-4">¿Necesita una Actualización?</h3>
              <p className="text-muted-foreground mb-6">Los sistemas HVAC modernos pueden reducir los costos de energía hasta en un 40%. Evaluemos su configuración actual.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Consultar a un Ingeniero
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
