import { Zap, ShieldCheck } from "lucide-react";
import { ServicePageTemplate, type ServiceCopy } from "@/components/services/ServicePageTemplate";
import { useCopy, type Lang } from "@/lib/i18n";

const T: Record<Lang, ServiceCopy> = {
  es: {
    title: "Ingeniería Eléctrica Industrial en Querétaro | Avantrik",
    description:
      "Ingeniería eléctrica industrial en Querétaro. Diseño e instalación de sistemas de baja y media tensión, tableros eléctricos, auditorías de seguridad y eficiencia energética para empresas en Querétaro y el Bajío.",
    heroTitle: "Ingeniería Eléctrica Industrial para Empresas",
    heroSubtitle:
      "Proyectos de ingeniería eléctrica industrial para plantas y edificios, enfocados en seguridad eléctrica, eficiencia energética y operación confiable en baja y media tensión.",
    h2: "Servicios de Ingeniería Eléctrica Industrial",
    intro:
      "Nos especializamos en sistemas eléctricos de Baja y Media Tensión. Desde tableros principales hasta redes de distribución, aseguramos que su instalación tenga energía estable, segura y eficiente. Nuestros ingenieros diseñan sistemas que minimizan el tiempo de inactividad y soportan pesadas cargas industriales.",
    cards: [
      {
        title: "Tableros y Distribución",
        body: "Instalación y mantenimiento de tableros de baja/media tensión y transformadores.",
      },
      {
        title: "Protección y Seguridad",
        body: "Análisis de arco eléctrico, sistemas de tierras y protección contra sobretensiones.",
      },
    ],
    listTitle: "Servicios Técnicos",
    listItems: [
      "Análisis de carga eléctrica y planeación de capacidad",
      "Diseño de tableros de control y automatización industrial",
      "Sistemas de energía de emergencia (Generadores/UPS)",
      "Bancos de capacitores para corrección de factor de potencia",
      "Retrofit de iluminación LED para naves industriales",
    ],
    sidebarTitle: "Auditoría de Seguridad Eléctrica",
    sidebarBody:
      "Asegúrese de que su infraestructura eléctrica cumpla con las normas de seguridad y estándares operativos vigentes.",
    sidebarCta: "Programar Inspección",
  },
  en: {
    title: "Industrial Electrical Engineering in Querétaro | Avantrik",
    description:
      "Industrial electrical engineering in Querétaro, Mexico. Design and installation of low- and medium-voltage systems, switchboards, safety audits and energy efficiency for companies across Querétaro and the Bajío region.",
    heroTitle: "Industrial Electrical Engineering for Business",
    heroSubtitle:
      "Industrial electrical engineering projects for plants and buildings, focused on electrical safety, energy efficiency and reliable low- and medium-voltage operation.",
    h2: "Industrial Electrical Engineering Services",
    intro:
      "We specialize in low- and medium-voltage electrical systems. From main switchboards to distribution networks, we make sure your facility runs on stable, safe and efficient power. Our engineers design systems that minimize downtime and carry heavy industrial loads.",
    cards: [
      {
        title: "Switchboards and Distribution",
        body: "Installation and maintenance of low/medium-voltage switchboards and transformers.",
      },
      {
        title: "Protection and Safety",
        body: "Arc flash analysis, grounding systems and surge protection.",
      },
    ],
    listTitle: "Technical Services",
    listItems: [
      "Electrical load analysis and capacity planning",
      "Control panel design and industrial automation",
      "Emergency power systems (generators / UPS)",
      "Capacitor banks for power factor correction",
      "LED lighting retrofits for industrial facilities",
    ],
    sidebarTitle: "Electrical Safety Audit",
    sidebarBody:
      "Make sure your electrical infrastructure meets current safety regulations and operating standards.",
    sidebarCta: "Schedule an Inspection",
  },
};

export default function ElectricalEngineering() {
  return (
    <ServicePageTemplate
      page="electrical"
      copy={useCopy(T)}
      cardIcons={[Zap, ShieldCheck]}
    />
  );
}
