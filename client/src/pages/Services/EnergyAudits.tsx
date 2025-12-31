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
            <h2 className="text-3xl font-heading font-bold text-foreground">AUDITORÍAS ENERGÉTICAS MÁS SOLICITADAS Y CERTIFICACIONES DEL PERSONAL</h2>
            
            <div className="space-y-10">
              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">1) Auditoría Energética Preliminar (Walk-Through)</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Diagnóstico rápido para identificar oportunidades de ahorro.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> Revisión de facturas CFE, inspección general, estimación inicial de ahorros.</p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">2) Auditoría Energética Detallada (Nivel 2)</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Evaluación profunda de sistemas energéticos.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> HVAC, motores, iluminación, aire comprimido, mediciones reales.</p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">3) Auditoría Energética Integral o de Inversión (Nivel 3)</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Justificar CAPEX y proyectos de modernización.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> Modelado energético, mediciones 30 días, ROI, VAN, TIR.</p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">4) Auditoría para Implementación de ISO 50001</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Sistema de Gestión de Energía.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> EnPIs, línea base, controles operativos, auditoría anual.</p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">5) Auditoría HVAC (Chillers, VRF, Paquetes y más)</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Optimización térmica y reducción de costos.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> kW/TR real, controles, CAI, ventilación ASHRAE.</p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">6) Auditoría de Refrigeración Industrial/Comercial</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Optimización de cadenas frías.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> Evaporadores, condensadores, cargas térmicas.</p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">7) Auditoría de cumplimiento de Código Red 2.0 CRE</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Reducir demanda, armónicos y costos eléctricos.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> FP, armónicos, tarifas MT/BT, calidad de energía para cumplimiento CRE.</p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-heading font-bold mb-2 text-primary">08) Auditoría / Dictamen de Perito Ambiental – Estado de Querétaro</h3>
                <p className="text-muted-foreground mb-2"><strong>Objetivo:</strong> Verificar el cumplimiento ambiental del establecimiento conforme a la normatividad ambiental estatal y federal aplicable en el Estado de Querétaro.</p>
                <p className="text-muted-foreground"><strong>Alcance:</strong> Revisar permisos, licencias y obligaciones ambientales del establecimiento y emitir dictamen técnico por Perito Ambiental acreditado en Querétaro.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-primary text-primary-foreground p-8 rounded-sm shadow-lg">
              <h3 className="font-heading font-bold text-2xl mb-6">¿QUÉ ANALIZAMOS?</h3>
              <p className="mb-4 text-primary-foreground/90">Durante la auditoría energética evaluamos:</p>
              <ul className="space-y-4">
                {[
                  "Sistemas HVAC y climatización",
                  "Infraestructura eléctrica de baja y media tensión",
                  "Consumo energético por áreas y procesos",
                  "Equipos críticos y su eficiencia operativa",
                  "Patrones de uso y oportunidades de optimización"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-secondary p-8 rounded-sm border border-border shadow-md">
              <h3 className="font-heading font-bold text-2xl mb-6 text-primary">¿QUÉ OBTIENE TU EMPRESA?</h3>
              <p className="mb-4 text-muted-foreground text-sm">Al finalizar la auditoría energética, tu empresa obtiene información clara y accionable para la toma de decisiones técnicas y financieras.</p>
              <ul className="space-y-4">
                {[
                  "Diagnóstico del consumo energético actual",
                  "Identificación de ineficiencias y pérdidas",
                  "Recomendaciones técnicas priorizadas",
                  "Propuestas de mejora enfocadas en ahorro energético",
                  "Base técnica para proyectos de eficiencia energética"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

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
