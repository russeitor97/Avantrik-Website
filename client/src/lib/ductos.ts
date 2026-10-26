/**
 * Catálogo de ductería rectangular de lámina galvanizada.
 *
 * Los productos viven aquí y no dentro del componente para que agregar o
 * quitar piezas no implique tocar la página. `Ductos.tsx` solo los recorre.
 *
 * Para publicar una foto: coloca el archivo en `client/public/ductos/` y pon
 * su ruta en `image`. Mientras sea `null`, la tarjeta muestra un marcador
 * neutro en vez de una imagen rota.
 */
import type { Lang } from "@/lib/i18n";

/**
 * ⚠️ PENDIENTE DE CONFIRMAR CON PRODUCCIÓN ANTES DE PUBLICAR.
 *
 * Estos valores son el rango habitual de proveedores mexicanos comparables,
 * NO una capacidad verificada de Avantrik. Ajústalos en cuanto se conozcan los
 * calibres, tramos y medidas reales que se podrán ofrecer.
 */
export const DUCT_SPECS = {
  material: { es: "Lámina galvanizada", en: "Galvanized sheet steel" },
  gauges: "16 – 26",
  length: { es: "Tramos de 1.22 m", en: "1.22 m sections" },
  minSize: '3" × 3"',
  seam: "Pittsburgh",
  joints: { es: "TDF o grapa-zeta", en: "TDF or Z-bar and drive cleat" },
};

export type FamilyId =
  | "recto"
  | "codos"
  | "transiciones"
  | "derivaciones"
  | "terminales"
  | "refuerzos";

export interface Family {
  id: FamilyId;
  es: string;
  en: string;
}

export const FAMILIES: Family[] = [
  { id: "recto", es: "Ducto recto", en: "Straight duct" },
  { id: "codos", es: "Codos", en: "Elbows" },
  { id: "transiciones", es: "Transiciones", en: "Transitions" },
  { id: "derivaciones", es: "Derivaciones", en: "Branches" },
  { id: "terminales", es: "Terminales", en: "Terminations" },
  { id: "refuerzos", es: "Perfiles y refuerzos", en: "Profiles and reinforcement" },
];

interface Copy {
  name: string;
  /** Qué es la pieza, en una frase técnica. */
  description: string;
  /** Dónde se usa normalmente. */
  use: string;
}

export interface DuctProduct {
  id: string;
  family: FamilyId;
  /** Ruta bajo `client/public/`, o `null` mientras no haya foto propia. */
  image: string | null;
  es: Copy;
  en: Copy;
}

export const PRODUCTS: DuctProduct[] = [
  {
    id: "ducto-tdf",
    family: "recto",
    image: null,
    es: {
      name: "Ducto rectangular TDF",
      description:
        "Tramo recto con cierre longitudinal Pittsburgh y los extremos preparados para unión TDF, que integra la brida al propio ducto mediante perfil y esquinero.",
      use: "Troncales y redes principales donde se busca armado rápido en obra y una junta transversal más rígida.",
    },
    en: {
      name: "TDF rectangular duct",
      description:
        "Straight section with a Pittsburgh longitudinal seam and ends prepared for a TDF joint, which forms the flange on the duct itself using a profile and corner pieces.",
      use: "Trunk lines and main runs where fast on-site assembly and a stiffer transverse joint matter.",
    },
  },
  {
    id: "ducto-grapa-zeta",
    family: "recto",
    image: null,
    es: {
      name: "Ducto rectangular grapa-zeta",
      description:
        "Tramo recto con cierre longitudinal Pittsburgh y extremos preparados para unión con perfil zeta y grapa, el sistema de junta transversal más extendido en México.",
      use: "Redes de distribución y ramales donde se prioriza costo y disponibilidad de accesorios.",
    },
    en: {
      name: "Z-bar and drive cleat duct",
      description:
        "Straight section with a Pittsburgh longitudinal seam and ends prepared for a Z-bar and drive cleat joint, the most widely used transverse system in Mexico.",
      use: "Distribution networks and branch runs where cost and fitting availability come first.",
    },
  },

  {
    id: "codo-horizontal-90",
    family: "codos",
    image: null,
    es: {
      name: "Codo horizontal 90°",
      description:
        "Cambio de dirección de 90° en el plano horizontal, con radio proporcional al ancho del ducto para sostener el flujo.",
      use: "Giros de trayectoria alrededor de columnas, muros y equipos.",
    },
    en: {
      name: "90° horizontal elbow",
      description:
        "A 90° change of direction in the horizontal plane, with a radius proportional to duct width to preserve airflow.",
      use: "Routing turns around columns, walls and equipment.",
    },
  },
  {
    id: "codo-horizontal-45",
    family: "codos",
    image: null,
    es: {
      name: "Codo horizontal 45°",
      description:
        "Cambio de dirección de 45° en el plano horizontal. Al ser un giro más abierto, introduce menos pérdida de carga que uno de 90°.",
      use: "Desvíos suaves y trazos diagonales en espacios con obstáculos.",
    },
    en: {
      name: "45° horizontal elbow",
      description:
        "A 45° change of direction in the horizontal plane. The gentler turn introduces less pressure loss than a 90° elbow.",
      use: "Soft offsets and diagonal runs in congested spaces.",
    },
  },
  {
    id: "codo-vertical-90",
    family: "codos",
    image: null,
    es: {
      name: "Codo vertical 90°",
      description:
        "Cambio de dirección de 90° en el plano vertical, con el radio referido a la altura del ducto.",
      use: "Subidas y bajadas entre niveles o para librar estructura.",
    },
    en: {
      name: "90° vertical elbow",
      description:
        "A 90° change of direction in the vertical plane, with the radius taken from duct height.",
      use: "Rises and drops between levels or to clear structure.",
    },
  },
  {
    id: "codo-vertical-45",
    family: "codos",
    image: null,
    es: {
      name: "Codo vertical 45°",
      description: "Cambio de dirección de 45° en el plano vertical.",
      use: "Cambios de nivel graduales sin penalizar tanto la caída de presión.",
    },
    en: {
      name: "45° vertical elbow",
      description: "A 45° change of direction in the vertical plane.",
      use: "Gradual level changes with a smaller pressure penalty.",
    },
  },

  {
    id: "reduccion-concentrica",
    family: "transiciones",
    image: null,
    es: {
      name: "Reducción concéntrica",
      description:
        "Transición entre dos secciones distintas manteniendo el mismo eje central en ambos extremos.",
      use: "Cambios de sección en tramos libres, donde no hay que alinear con losa ni con piso.",
    },
    en: {
      name: "Concentric reducer",
      description:
        "A transition between two different cross-sections that keeps the same centerline at both ends.",
      use: "Section changes in open runs with no slab or floor alignment constraint.",
    },
  },
  {
    id: "reduccion-excentrica",
    family: "transiciones",
    image: null,
    es: {
      name: "Reducción excéntrica",
      description:
        "Transición entre dos secciones distintas que conserva alineada una de sus caras en lugar del eje.",
      use: "Cambios de sección pegados a losa o a piso, donde una cara debe quedar a nivel.",
    },
    en: {
      name: "Eccentric reducer",
      description:
        "A transition between two different cross-sections that keeps one face aligned instead of the centerline.",
      use: "Section changes tight to slab or floor, where one face must stay flush.",
    },
  },
  {
    id: "desviacion",
    family: "transiciones",
    image: null,
    es: {
      name: "Desviación",
      description:
        "Pieza que desplaza lateralmente la trayectoria del ducto conservando la misma sección de entrada y salida.",
      use: "Librar vigas, tuberías o instalaciones sin cambiar el tamaño del ducto.",
    },
    en: {
      name: "Offset",
      description:
        "A fitting that shifts the duct run sideways while keeping the same inlet and outlet section.",
      use: "Clearing beams, piping or other services without resizing the duct.",
    },
  },

  {
    id: "tee-rectangular",
    family: "derivaciones",
    image: null,
    es: {
      name: "Tee rectangular",
      description: "Derivación a 90° que divide el flujo del ducto principal en dos salidas.",
      use: "Reparto de aire hacia dos zonas desde un mismo troncal.",
    },
    en: {
      name: "Rectangular tee",
      description: "A 90° branch that splits flow from the main duct into two outlets.",
      use: "Distributing air to two zones from a single trunk.",
    },
  },
  {
    id: "yee-pantalon",
    family: "derivaciones",
    image: null,
    es: {
      name: "Yee pantalón",
      description:
        "Bifurcación simétrica en la que el ducto se abre en dos ramales con ángulo suave.",
      use: "Dividir el caudal de forma equilibrada con menos turbulencia que una tee.",
    },
    en: {
      name: "Pants wye",
      description:
        "A symmetrical split where the duct opens into two branches at a gentle angle.",
      use: "Splitting flow evenly with less turbulence than a tee.",
    },
  },
  {
    id: "cruz-rectangular",
    family: "derivaciones",
    image: null,
    es: {
      name: "Cruz rectangular",
      description: "Derivación con dos salidas opuestas sobre el mismo tramo de ducto principal.",
      use: "Alimentar zonas a ambos lados del troncal desde un solo punto.",
    },
    en: {
      name: "Rectangular cross",
      description: "A branch with two opposing outlets on the same section of main duct.",
      use: "Feeding zones on both sides of a trunk from a single point.",
    },
  },
  {
    id: "injerto-90",
    family: "derivaciones",
    image: null,
    es: {
      name: "Injerto 90°",
      description:
        "Salida lateral a 90° sobre un tramo de ducto, disponible con conexión rectangular o circular.",
      use: "Tomas hacia difusores, rejillas o ramales secundarios.",
    },
    en: {
      name: "90° take-off",
      description:
        "A 90° side outlet on a duct run, available with a rectangular or round connection.",
      use: "Take-offs to diffusers, grilles or secondary branches.",
    },
  },

  {
    id: "casquillo-rectangular",
    family: "terminales",
    image: null,
    es: {
      name: "Casquillo rectangular",
      description: "Collarín de conexión entre el ducto y un difusor, rejilla o equipo.",
      use: "Remate de bocas de inyección y retorno.",
    },
    en: {
      name: "Rectangular collar",
      description: "A connecting collar between the duct and a diffuser, grille or unit.",
      use: "Finishing supply and return openings.",
    },
  },
  {
    id: "casquillo-45",
    family: "terminales",
    image: null,
    es: {
      name: "Casquillo 45°",
      description:
        "Collarín con salida inclinada a 45°, disponible con compuerta de regulación integrada.",
      use: "Tomas en ángulo donde además se necesita balancear el caudal.",
    },
    en: {
      name: "45° collar",
      description:
        "A collar with a 45° angled outlet, available with an integrated balancing damper.",
      use: "Angled take-offs that also need airflow balancing.",
    },
  },
  {
    id: "cuello-lona",
    family: "terminales",
    image: null,
    es: {
      name: "Cuello de lona",
      description:
        "Conexión flexible entre el ducto y el equipo, con un tramo de lona entre dos marcos metálicos.",
      use: "Aislar la red de la vibración de manejadoras y ventiladores.",
    },
    en: {
      name: "Flexible canvas connector",
      description:
        "A flexible connection between duct and unit, with a canvas section between two metal frames.",
      use: "Isolating the network from air handler and fan vibration.",
    },
  },
  {
    id: "cuello-ganso",
    family: "terminales",
    image: null,
    es: {
      name: "Cuello de ganso",
      description:
        "Terminal curva de 135° orientada hacia abajo, con malla, para toma o descarga a la intemperie.",
      use: "Entradas de aire exterior y descargas en azotea protegidas de la lluvia.",
    },
    en: {
      name: "Gooseneck",
      description:
        "A 135° downward-facing curved termination with mesh, for outdoor intake or discharge.",
      use: "Outside-air intakes and rooftop discharges shielded from rain.",
    },
  },
  {
    id: "gorro-rectangular",
    family: "terminales",
    image: null,
    es: {
      name: "Gorro rectangular",
      description: "Sombrerete de remate que cubre la boca vertical del ducto.",
      use: "Protección de descargas verticales en azotea.",
    },
    en: {
      name: "Rectangular cap",
      description: "A finishing hood that covers the duct's vertical opening.",
      use: "Protecting vertical rooftop discharges.",
    },
  },
  {
    id: "bota-aguas",
    family: "terminales",
    image: null,
    es: {
      name: "Bota aguas",
      description:
        "Faldón de sellado para el paso del ducto a través de losa o cubierta, que desvía el escurrimiento.",
      use: "Penetraciones en azotea donde hay que impedir filtraciones.",
    },
    en: {
      name: "Roof flashing",
      description:
        "A sealing skirt for duct penetrations through slab or roof that diverts runoff.",
      use: "Rooftop penetrations where water ingress must be prevented.",
    },
  },

  {
    id: "perfil-zeta",
    family: "refuerzos",
    image: null,
    es: {
      name: "Perfil zeta",
      description: "Perfil en forma de Z que recibe la grapa para formar la junta transversal.",
      use: "Unión entre tramos en sistemas grapa-zeta.",
    },
    en: {
      name: "Z-bar profile",
      description: "A Z-shaped profile that receives the drive cleat to form the transverse joint.",
      use: "Joining sections in Z-bar and drive cleat systems.",
    },
  },
  {
    id: "perfil-grapa",
    family: "refuerzos",
    image: null,
    es: {
      name: "Grapa",
      description: "Perfil de cierre que se desliza sobre el perfil zeta y aprieta la junta.",
      use: "Cierre y sellado de la unión transversal entre tramos.",
    },
    en: {
      name: "Drive cleat",
      description: "A closing profile that slides over the Z-bar and tightens the joint.",
      use: "Closing and sealing the transverse joint between sections.",
    },
  },
  {
    id: "perfil-tdf",
    family: "refuerzos",
    image: null,
    es: {
      name: "Perfil TDF y esquineros",
      description:
        "Perfil de brida integrada con sus esquineros y clips de refuerzo, que atornilla tramo contra tramo.",
      use: "Juntas atornilladas en ductos de sección grande o mayor presión.",
    },
    en: {
      name: "TDF profile and corners",
      description:
        "An integrated flange profile with corner pieces and reinforcement clips that bolts section to section.",
      use: "Bolted joints on large-section or higher-pressure duct.",
    },
  },
];

/** Opciones del selector de pieza en el formulario de cotización. */
export function quoteOptions(lang: Lang): { value: string; label: string }[] {
  const byFamily = FAMILIES.map((f) => ({
    family: f,
    items: PRODUCTS.filter((p) => p.family === f.id),
  }));

  return byFamily.flatMap(({ family, items }) =>
    items.map((p) => ({
      // El valor viaja en el correo al equipo, que siempre lo lee en español.
      value: `${family.es} — ${p.es.name}`,
      label: p[lang].name,
    })),
  );
}
