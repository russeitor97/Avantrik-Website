import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { useCopy, useHref } from "@/lib/i18n";

interface Audit {
  n: string;
  title: string;
  objetivo: string;
  alcance: string;
}

const T = {
  es: {
    title: "Auditorías Energéticas Industriales en Querétaro | Avantrik",
    description:
      "Auditorías energéticas industriales en Querétaro. Diagnóstico, análisis y optimización del consumo energético para reducir costos eléctricos y mejorar la eficiencia en Querétaro y el Bajío.",
    heroTitle: "Auditorías Energéticas Industriales",
    heroSubtitle:
      "Auditorías energéticas industriales basadas en datos para identificar desperdicios, reducir costos eléctricos y optimizar el consumo energético en empresas.",
    h2: "AUDITORÍAS ENERGÉTICAS INDUSTRIALES Y CERTIFICACIONES DEL PERSONAL",
    objectiveLabel: "Objetivo:",
    scopeLabel: "Alcance:",
    audits: [
      { n: "01", title: "Auditoría Energética Preliminar (Walk-Through)", objetivo: "Diagnóstico rápido para identificar oportunidades de ahorro.", alcance: "Revisión de facturas CFE, inspección general, estimación inicial de ahorros." },
      { n: "02", title: "Auditoría Energética Detallada (Nivel 2)", objetivo: "Evaluación profunda de sistemas energéticos.", alcance: "HVAC, motores, iluminación, aire comprimido, mediciones reales." },
      { n: "03", title: "Auditoría Energética Integral o de Inversión (Nivel 3)", objetivo: "Justificar CAPEX y proyectos de modernización.", alcance: "Modelado energético, mediciones 30 días, ROI, VAN, TIR." },
      { n: "04", title: "Auditoría para Implementación de ISO 50001", objetivo: "Sistema de Gestión de Energía.", alcance: "EnPIs, línea base, controles operativos, auditoría anual." },
      { n: "05", title: "Auditoría HVAC (Chillers, VRF, Paquetes y más)", objetivo: "Optimización térmica y reducción de costos.", alcance: "kW/TR real, controles, CAI, ventilación ASHRAE." },
      { n: "06", title: "Auditoría de Refrigeración Industrial/Comercial", objetivo: "Optimización de cadenas frías.", alcance: "Evaporadores, condensadores, cargas térmicas." },
      { n: "07", title: "Auditoría de cumplimiento de Código Red 2.0 CRE", objetivo: "Reducir demanda, armónicos y costos eléctricos.", alcance: "FP, armónicos, tarifas MT/BT, calidad de energía para cumplimiento CRE." },
      { n: "08", title: "Auditoría / Dictamen de Perito Ambiental – Estado de Querétaro", objetivo: "Verificar el cumplimiento ambiental del establecimiento conforme a la normatividad ambiental estatal y federal aplicable en el Estado de Querétaro.", alcance: "Revisar permisos, licencias y obligaciones ambientales del establecimiento y emitir dictamen técnico por Perito Ambiental acreditado en Querétaro." },
    ] as Audit[],
    analyzeTitle: "¿QUÉ ANALIZAMOS?",
    analyzeIntro: "Durante la auditoría energética evaluamos:",
    analyzeItems: [
      "Sistemas HVAC y climatización",
      "Infraestructura eléctrica de baja y media tensión",
      "Consumo energético por áreas y procesos",
      "Equipos críticos y su eficiencia operativa",
      "Patrones de uso y oportunidades de optimización",
    ],
    getTitle: "¿QUÉ OBTIENE TU EMPRESA?",
    getIntro:
      "Al finalizar la auditoría energética, tu empresa obtiene información clara y accionable para la toma de decisiones técnicas y financieras.",
    getItems: [
      "Diagnóstico del consumo energético actual",
      "Identificación de ineficiencias y pérdidas",
      "Recomendaciones técnicas priorizadas",
      "Propuestas de mejora enfocadas en ahorro energético",
      "Base técnica para proyectos de eficiencia energética",
    ],
    ctaTitle: "Inicie su Auditoría",
    ctaBody:
      "Deje de pagar por energía que no utiliza. Contáctenos para programar una evaluación preliminar.",
    ctaButton: "Solicitar Cotización",
    whyTitle: "¿Por qué Avantrik?",
    whyItems: [
      "Gestores de Energía Certificados (CEM)",
      "Equipos de grado industrial",
      "Informes accionables enfocados en ROI",
    ],
  },
  en: {
    title: "Industrial Energy Audits in Querétaro | Avantrik",
    description:
      "Industrial energy audits in Querétaro, Mexico. Diagnosis, analysis and optimization of energy consumption to cut electricity costs and improve efficiency across Querétaro and the Bajío region.",
    heroTitle: "Industrial Energy Audits",
    heroSubtitle:
      "Data-driven industrial energy audits that pinpoint waste, cut electricity costs and optimize energy consumption across your operation.",
    h2: "INDUSTRIAL ENERGY AUDITS AND TEAM CERTIFICATIONS",
    objectiveLabel: "Objective:",
    scopeLabel: "Scope:",
    audits: [
      { n: "01", title: "Preliminary Energy Audit (Walk-Through)", objetivo: "Rapid diagnosis to identify savings opportunities.", alcance: "CFE bill review, general inspection, initial savings estimate." },
      { n: "02", title: "Detailed Energy Audit (Level 2)", objetivo: "In-depth evaluation of energy systems.", alcance: "HVAC, motors, lighting, compressed air, on-site measurements." },
      { n: "03", title: "Comprehensive or Investment-Grade Audit (Level 3)", objetivo: "Justify CAPEX and modernization projects.", alcance: "Energy modeling, 30-day metering, ROI, NPV, IRR." },
      { n: "04", title: "ISO 50001 Implementation Audit", objetivo: "Energy Management System.", alcance: "EnPIs, baseline, operational controls, annual audit." },
      { n: "05", title: "HVAC Audit (Chillers, VRF, Packaged Units and more)", objetivo: "Thermal optimization and cost reduction.", alcance: "Actual kW/TR, controls, indoor air quality, ASHRAE ventilation." },
      { n: "06", title: "Industrial / Commercial Refrigeration Audit", objetivo: "Cold chain optimization.", alcance: "Evaporators, condensers, thermal loads." },
      { n: "07", title: "CRE Código de Red 2.0 Compliance Audit", objetivo: "Reduce demand, harmonics and electricity costs.", alcance: "Power factor, harmonics, MV/LV tariffs, power quality for CRE compliance." },
      { n: "08", title: "Environmental Expert Audit / Opinion – State of Querétaro", objetivo: "Verify the facility's environmental compliance under the state and federal environmental regulations applicable in the State of Querétaro.", alcance: "Review the facility's permits, licenses and environmental obligations and issue a technical opinion signed by an accredited Environmental Expert in Querétaro." },
    ] as Audit[],
    analyzeTitle: "WHAT DO WE ANALYZE?",
    analyzeIntro: "During the energy audit we evaluate:",
    analyzeItems: [
      "HVAC and climate control systems",
      "Low- and medium-voltage electrical infrastructure",
      "Energy consumption by area and process",
      "Critical equipment and its operating efficiency",
      "Usage patterns and optimization opportunities",
    ],
    getTitle: "WHAT DOES YOUR COMPANY GET?",
    getIntro:
      "At the end of the energy audit, your company gets clear, actionable information to support technical and financial decisions.",
    getItems: [
      "Diagnosis of current energy consumption",
      "Identification of inefficiencies and losses",
      "Prioritized technical recommendations",
      "Improvement proposals focused on energy savings",
      "A technical basis for energy efficiency projects",
    ],
    ctaTitle: "Start Your Audit",
    ctaBody:
      "Stop paying for energy you don't use. Contact us to schedule a preliminary assessment.",
    ctaButton: "Request a Quote",
    whyTitle: "Why Avantrik?",
    whyItems: [
      "Certified Energy Managers (CEM)",
      "Industrial-grade instrumentation",
      "Actionable, ROI-focused reports",
    ],
  },
};

export default function EnergyAudits() {
  const t = useCopy(T);
  const href = useHref();

  return (
    <Layout>
      <Seo page="audits" title={t.title} description={t.description} />

      <div className="relative flex h-[52vh] min-h-[420px] items-center overflow-hidden bg-ink-gradient">
        <TechBackdrop />
        <div className="container mx-auto px-4 relative z-10 pt-24">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">{t.heroTitle}</h1>
            <p className="text-xl text-gray-200 max-w-2xl">{t.heroSubtitle}</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">{t.h2}</h2>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2" step={0.08}>
              {t.audits.map((a) => (
                <StaggerItem key={a.n} className="h-full">
                <div
                  className="group relative flex h-full flex-col rounded-sm border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-xl"
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
                    <strong className="font-semibold text-foreground">{t.objectiveLabel}</strong> {a.objetivo}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">{t.scopeLabel}</strong> {a.alcance}
                  </p>
                </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-primary text-primary-foreground p-8 rounded-sm shadow-lg">
              <h3 className="font-heading font-bold text-2xl mb-6">{t.analyzeTitle}</h3>
              <p className="mb-4 text-primary-foreground/90">{t.analyzeIntro}</p>
              <ul className="space-y-4">
                {t.analyzeItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-secondary p-8 rounded-sm border border-border shadow-md">
              <h3 className="font-heading font-bold text-2xl mb-6 text-primary">{t.getTitle}</h3>
              <p className="mb-4 text-muted-foreground text-sm">{t.getIntro}</p>
              <ul className="space-y-4">
                {t.getItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card shadow-lg border border-border p-8 rounded-sm sticky top-24">
              <h3 className="font-heading font-bold text-2xl mb-4">{t.ctaTitle}</h3>
              <p className="text-muted-foreground mb-6">{t.ctaBody}</p>

              <Button asChild className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                <Link href={href("contact")}>{t.ctaButton}</Link>
              </Button>

              <div className="border-t border-border pt-6 mt-6">
                <h4 className="font-bold text-sm uppercase mb-2">{t.whyTitle}</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  {t.whyItems.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
