import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Activity, BarChart3, Settings, TrendingUp } from "lucide-react";
import energyImage from "@assets/generated_images/digital_energy_audit_tablet_in_factory_setting.png";

export default function EnergyAudits() {
  return (
    <Layout>
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${energyImage})` }}>
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Auditorías Energéticas</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Análisis basado en datos para identificar desperdicios, reducir costos y optimizar patrones de consumo.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Análisis de Energía de Precisión</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nuestras auditorías energéticas van más allá de simples lecturas de medidores. Utilizamos equipos de monitoreo avanzados y análisis de software para mapear el perfil energético completo de su instalación. Identificamos exactamente dónde, cuándo y cómo se desperdicia la energía.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <BarChart3 className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Perfilado de Consumo</h3>
                    <p className="text-sm text-muted-foreground">Perfilado de carga detallado para comprender la demanda pico y las ineficiencias de la carga base.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Settings className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Eficiencia de Equipos</h3>
                    <p className="text-sm text-muted-foreground">Análisis de rendimiento de motores, compresores y sistemas térmicos.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">Lo que Entregamos</h3>
            <ul className="space-y-4">
              {[
                "Informe exhaustivo alineado con la norma ISO 50001",
                "Análisis de ROI para las mejoras recomendadas",
                "Imagen térmica de paneles eléctricos y envolvente del edificio",
                "Análisis de calidad de energía (armónicos, caídas de voltaje)",
                "Estrategia de optimización de estructura tarifaria"
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
              <h3 className="font-heading font-bold text-2xl mb-4">Inicie su Auditoría</h3>
              <p className="text-muted-foreground mb-6">Deje de pagar por energía que no utiliza. Contáctenos para programar una evaluación preliminar.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Solicitar Cotización
                </Button>
              </Link>
              
              <div className="border-t border-border pt-6 mt-6">
                <h4 className="font-bold text-sm uppercase mb-2">¿Por qué Avantrik?</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                   <li>• Gestores de Energía Certificados (CEM)</li>
                   <li>• Equipos de grado industrial</li>
                   <li>• Informes accionables enfocados en ROI</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
