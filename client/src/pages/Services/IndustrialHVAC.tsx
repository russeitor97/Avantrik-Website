import { Thermometer, Fan } from "lucide-react";
import { ServicePageTemplate, type ServiceCopy } from "@/components/services/ServicePageTemplate";
import { useCopy, type Lang } from "@/lib/i18n";

const T: Record<Lang, ServiceCopy> = {
  es: {
    title: "HVAC Industrial en Querétaro para Plantas y Edificios | Avantrik",
    description:
      "Sistemas HVAC industrial en Querétaro. Diseño, instalación y optimización de climatización industrial para plantas, procesos críticos y edificios de alto desempeño en Querétaro y el Bajío.",
    heroTitle: "HVAC Industrial para Plantas y Edificios Industriales",
    heroSubtitle:
      "Diseño, instalación y optimización de sistemas HVAC industrial para plantas de manufactura y edificios industriales, enfocados en eficiencia energética, confiabilidad operativa y control térmico preciso.",
    h2: "Sistemas HVAC Industriales para Procesos Críticos",
    intro:
      "Los entornos industriales requieren soluciones HVAC robustas que van más allá del confort. Diseñamos, instalamos y optimizamos sistemas que mantienen temperaturas críticas de proceso, aseguran la calidad del aire y operan con la máxima eficiencia energética bajo cargas pesadas.",
    cards: [
      {
        title: "Ventilación y Filtración",
        body: "Manejo de aire de alta capacidad para fábricas con polvo, humos o subproductos químicos.",
      },
      {
        title: "Enfriamiento de Procesos",
        body: "Chillers y torres de enfriamiento integrados directamente con las líneas de fabricación.",
      },
    ],
    listTitle: "Nuestras Capacidades",
    listItems: [
      "Diseño e instalación de plantas de chillers a gran escala",
      "Sistemas de Flujo de Refrigerante Variable (VRF)",
      "Soluciones HVAC para salas blancas (Clean rooms)",
      "Sistemas de ventilación con recuperación de calor",
      "Integración de Sistemas de Gestión de Edificios (BMS) inteligentes",
    ],
    sidebarTitle: "¿Necesita una Actualización?",
    sidebarBody:
      "Los sistemas HVAC modernos pueden reducir los costos de energía hasta en un 40%. Evaluemos su configuración actual.",
    sidebarCta: "Consultar a un Ingeniero",
  },
  en: {
    title: "Industrial HVAC in Querétaro for Plants and Buildings | Avantrik",
    description:
      "Industrial HVAC systems in Querétaro, Mexico. Design, installation and optimization of industrial climate control for plants, critical processes and high-performance buildings across Querétaro and the Bajío region.",
    heroTitle: "Industrial HVAC for Manufacturing Plants and Buildings",
    heroSubtitle:
      "Design, installation and optimization of industrial HVAC systems for manufacturing plants and industrial buildings, focused on energy efficiency, operational reliability and precise thermal control.",
    h2: "Industrial HVAC Systems for Critical Processes",
    intro:
      "Industrial environments demand robust HVAC solutions that go well beyond comfort. We design, install and optimize systems that hold critical process temperatures, ensure air quality and run at peak energy efficiency under heavy loads.",
    cards: [
      {
        title: "Ventilation and Filtration",
        body: "High-capacity air handling for plants dealing with dust, fumes or chemical byproducts.",
      },
      {
        title: "Process Cooling",
        body: "Chillers and cooling towers integrated directly with your manufacturing lines.",
      },
    ],
    listTitle: "Our Capabilities",
    listItems: [
      "Design and installation of large-scale chiller plants",
      "Variable Refrigerant Flow (VRF) systems",
      "Cleanroom HVAC solutions",
      "Heat-recovery ventilation systems",
      "Integration of smart Building Management Systems (BMS)",
    ],
    sidebarTitle: "Time for an Upgrade?",
    sidebarBody:
      "Modern HVAC systems can cut energy costs by up to 40%. Let's assess your current setup.",
    sidebarCta: "Talk to an Engineer",
  },
};

export default function IndustrialHVAC() {
  return (
    <ServicePageTemplate
      page="hvac"
      copy={useCopy(T)}
      cardIcons={[Fan, Thermometer]}
    />
  );
}
