import { Sprout, ArrowDownCircle } from "lucide-react";
import { ServicePageTemplate, type ServiceCopy } from "@/components/services/ServicePageTemplate";
import { useCopy, type Lang } from "@/lib/i18n";

const T: Record<Lang, ServiceCopy> = {
  es: {
    title: "Sistemas Geotérmicos Industriales en Querétaro | Avantrik",
    description:
      "Sistemas geotérmicos industriales en Querétaro. Soluciones de calefacción y refrigeración de alta eficiencia para plantas y edificios con reducción de costos y emisiones en Querétaro y el Bajío.",
    heroTitle: "Sistemas Geotérmicos Industriales",
    heroSubtitle:
      "Sistemas geotérmicos industriales para calefacción y refrigeración de edificios y plantas, enfocados en eficiencia energética, reducción de costos operativos y sostenibilidad a largo plazo.",
    h2: "Sistemas Geotérmicos de Alta Eficiencia para la Industria",
    intro:
      "La tecnología geotérmica aprovecha la temperatura constante de la tierra para proporcionar calefacción y refrigeración altamente eficientes. Para grandes edificios industriales y comerciales, esto se traduce en reducciones masivas en los costos operativos y la huella de carbono durante el ciclo de vida del sistema.",
    cards: [
      {
        title: "Bombas de Calor de Fuente Terrestre",
        body: "Sistemas de intercambio de alta eficiencia utilizando campos de bucle vertical u horizontal.",
      },
      {
        title: "Retorno de Inversión Sostenible",
        body: "Análisis de ahorros a largo plazo y evaluación de elegibilidad para créditos de carbono.",
      },
    ],
    listTitle: "¿Por qué Geotermia?",
    listItems: [
      "Reducción de hasta el 70% en costos de calefacción/refrigeración",
      "Los sistemas duran de 25 a 50 años con mantenimiento mínimo",
      "Operación silenciosa y sin unidades condensadoras exteriores",
      "Rendimiento constante independientemente de los climas extremos",
      "Reducción de las emisiones de carbono de la instalación",
    ],
    sidebarTitle: "Estudio de Viabilidad",
    sidebarBody:
      "¿Es su sitio adecuado para la geotermia? Realizamos pruebas geológicas y de conductividad térmica.",
    sidebarCta: "Solicitar Evaluación",
  },
  en: {
    title: "Industrial Geothermal Systems in Querétaro | Avantrik",
    description:
      "Industrial geothermal systems in Querétaro, Mexico. High-efficiency heating and cooling solutions for plants and buildings that cut operating costs and emissions across Querétaro and the Bajío region.",
    heroTitle: "Industrial Geothermal Systems",
    heroSubtitle:
      "Industrial geothermal systems for heating and cooling buildings and plants, focused on energy efficiency, lower operating costs and long-term sustainability.",
    h2: "High-Efficiency Geothermal Systems for Industry",
    intro:
      "Geothermal technology taps the earth's constant temperature to deliver highly efficient heating and cooling. For large industrial and commercial buildings, that translates into major reductions in operating costs and carbon footprint over the system's lifetime.",
    cards: [
      {
        title: "Ground-Source Heat Pumps",
        body: "High-efficiency exchange systems using vertical or horizontal loop fields.",
      },
      {
        title: "Sustainable Return on Investment",
        body: "Long-term savings analysis and carbon credit eligibility assessment.",
      },
    ],
    listTitle: "Why Geothermal?",
    listItems: [
      "Up to 70% reduction in heating and cooling costs",
      "Systems last 25 to 50 years with minimal maintenance",
      "Quiet operation with no outdoor condensing units",
      "Consistent performance regardless of extreme weather",
      "Lower carbon emissions for the facility",
    ],
    sidebarTitle: "Feasibility Study",
    sidebarBody:
      "Is your site suitable for geothermal? We run geological and thermal conductivity testing.",
    sidebarCta: "Request an Assessment",
  },
};

export default function GeothermalSystems() {
  return (
    <ServicePageTemplate
      page="geothermal"
      copy={useCopy(T)}
      cardIcons={[ArrowDownCircle, Sprout]}
    />
  );
}
