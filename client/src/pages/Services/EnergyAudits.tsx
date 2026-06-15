import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Activity, BarChart3, Settings, TrendingUp } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";

const audits = [
  { n: "01", title: "Auditoría Energética Preliminar (Walk-Through)", objetivo: "Diagnóstico rápido para identificar oportunidades de ahorro.", alcance: "Revisión de facturas CFE, inspección general, estimación inicial de ahorros." },
  { n: "02", title: "Auditoría Energética Detallada (Nivel 2)", objetivo: "Evaluación profunda de sistemas energéticos.", alcance: "HVAC, motores, iluminación, aire comprimido, mediciones reales." },
  { n: "03", title: "Auditoría Energética Integral o de Inversión (Nivel 3)", objetivo: "Justificar CAPEX y proyectos de modernización.", alcance: "Modelado energético, mediciones 30 días, ROI, VAN, TIR." },
  { n: "04", title: "Auditoría para Implementación de ISO 50001", objetivo: "Sistema de Gestión de Energía.", alcance: "EnPIs, línea base, controles operativos, auditoría anual." },
  { n: "05", title: "Auditoría HVAC (Chillers, VRF, Paquetes y más)", objetivo: "Optimización térmica y reducción de costos.", alcance: "kW/TR real, controles, CAI, ventilación ASHRAE." },
  { n: "06", title: "Auditoría de Refrigeración Industrial/Comercial", objetivo: "Optimización de cadenas frías.", alcance: "Evaporadores, condensadores, cargas térmicas." },
  { n: "07", title: "Auditoría de cumplimiento de Código Red 2.0 CRE", objetivo: "Reducir demanda, armónicos y costos eléctricos.", alcance: "FP, armónicos, tarifas MT/BT, calidad de energía para cumplimiento CRE." },
  { n: "08", title: "Auditoría / Dictamen de Perito Ambiental – Estado de Querétaro", objetivo: "Verificar el cumplimiento ambiental del establecimiento conforme a la normatividad ambiental estatal y federal aplicable en el Estado de Querétaro.", alcance: "Revisar permisos, licencias y obligaciones ambientales del establecimiento y emitir dictamen técnico por Perito Ambiental acreditado en Querétaro." },
];

export default function EnergyAudits() {
  return (
    <Layout>    <Helmet>
        <title>Auditorías Energéticas Industriales | Avantrik México</title>

        <meta
          name="description"
          content="Auditorías energéticas industriales en México. Diagnóstico, análisis y optimización del consumo energético para reducir costos eléctricos y mejorar la eficiencia."
        />

        <link
          rel="canonical"
          href="https://www.avantrik.com/auditoria-energetica"
        />
      </Helmet>

      <div className="relative flex h-[52vh] min-h-[420px] items-center overflow-hidden bg-ink-gradient">
        <TechBackdrop />
        <div className="container mx-auto px-4 relative z-10 pt-24">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Auditorías Energéticas Industriales
</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Auditorías energéticas industriales basadas en datos para identificar desperdicios,
              reducir costos eléctricos y optimizar el consumo energético en empresas.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">AUDITORÍAS ENERGÉTICAS INDUSTRIALES Y CERTIFICACIONES DEL PERSONAL
</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {audits.map((a) => (
                <div
                  key={a.n}
                  className="group relative flex flex-col rounded-sm border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary font-heading text-sm font-bold text-primary-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                      {a.n}
                    </span>
                    <h3 className="pt-1 font-heading text-base font-bold leading-tight text-primary">
                      {a.title}
                    </h3>
                  </div>
                  <p className="mb-1.5 text-sm leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">Objetivo:</strong> {a.objetivo}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">Alcance:</strong> {a.alcance}
                  </p>
                </div>
              ))}
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
