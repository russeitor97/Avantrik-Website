/**
 * Catálogo de productos: ductería rectangular de lámina galvanizada.
 *
 * Todo el contenido del catálogo vive aquí. Las páginas (/productos y
 * /productos/:slug) solo lo recorren: para agregar, quitar o corregir una
 * pieza no hace falta tocar componentes.
 *
 * Imágenes: `client/public/ductos/<slug>.webp`. Son renders 3D generados con
 * `node scripts/ductos-render/render.mjs`. Para poner una FOTO real, basta con
 * reemplazar el archivo con el mismo nombre (1200 × 900, fondo blanco).
 */
import type { Lang } from "@/lib/i18n";

/**
 * Espesor nominal de lámina galvanizada por calibre (tabla de SMACNA para
 * lámina galvanizada; incluye el recubrimiento de zinc).
 */
export const CALIBRES = [
  { calibre: "26", mm: "0.55", pulg: "0.022" },
  { calibre: "24", mm: "0.70", pulg: "0.028" },
  { calibre: "22", mm: "0.85", pulg: "0.034" },
  { calibre: "20", mm: "1.00", pulg: "0.040" },
  { calibre: "18", mm: "1.31", pulg: "0.052" },
];

/** Datos comunes a todas las piezas. */
export const ESPECIFICACION = {
  es: {
    material: "Lámina de acero galvanizado",
    calibres: "18, 20, 22, 24 y 26",
    medidas: "A la medida: ancho × alto × largo, en cm o pulgadas",
    cierre: "Pittsburgh (longitudinal)",
    union: "TDF o grapa-zeta (entre tramos)",
  },
  en: {
    material: "Galvanized sheet steel",
    calibres: "18, 20, 22, 24 and 26 ga",
    medidas: "Made to size: width × height × length, in cm or inches",
    cierre: "Pittsburgh lock (longitudinal)",
    union: "TDF or S & drive (between sections)",
  },
};

interface Texto {
  nombre: string;
  /** Una línea para la tarjeta y la meta descripción. */
  resumen: string;
  /** 2–3 líneas técnicas para la página de detalle. */
  descripcion: string;
  uso: string;
}

export interface Producto {
  slug: string;
  es: Texto;
  en: Texto;
}

export const PRODUCTOS: Producto[] = [
  {
    slug: "ducto-recto",
    es: {
      nombre: "Ducto recto",
      resumen: "Tramo recto rectangular con quiebre en X y bridas en ambos extremos.",
      descripcion:
        "Tramo recto de sección rectangular o cuadrada, cerrado con junta Pittsburgh en una arista. Las caras llevan quiebre en X para darle rigidez a la lámina y evitar que vibre.",
      uso: "Troncales y ramales de inyección, retorno y extracción.",
    },
    en: {
      nombre: "Straight duct",
      resumen: "Rectangular straight section, cross-broken, flanged at both ends.",
      descripcion:
        "Straight section of rectangular or square cross-section, closed with a Pittsburgh lock on one corner. Faces are cross-broken to stiffen the sheet and keep it from drumming.",
      uso: "Supply, return and exhaust mains and branches.",
    },
  },
  {
    slug: "codo-90",
    es: {
      nombre: "Codo 90°",
      resumen: "Cambio de dirección a 90° con garganta y talón de radio.",
      descripcion:
        "Codo de radio con garganta y talón curvos, que cambia la dirección del ducto 90° con menor caída de presión que un codo recto. Se fabrica horizontal o vertical según el giro que necesite la red.",
      uso: "Cambios de dirección en troncales y ramales.",
    },
    en: {
      nombre: "90° elbow",
      resumen: "90° change of direction with radius throat and heel.",
      descripcion:
        "Radius elbow with curved throat and heel that turns the duct 90° with lower pressure drop than a square elbow. Made in the easy or hard way to suit the run.",
      uso: "Changes of direction in mains and branches.",
    },
  },
  {
    slug: "codo-45",
    es: {
      nombre: "Codo 45°",
      resumen: "Cambio de dirección a 45° con radio.",
      descripcion:
        "Codo de radio a 45° para desvíos suaves de la red. Mismo cierre Pittsburgh y bridas que el resto de las piezas, así se une directo a cualquier tramo.",
      uso: "Desvíos suaves y libramientos de obstáculos.",
    },
    en: {
      nombre: "45° elbow",
      resumen: "45° radius change of direction.",
      descripcion:
        "45° radius elbow for gentle changes of direction. Same Pittsburgh lock and flanges as the rest of the line, so it joins straight onto any section.",
      uso: "Gentle offsets and clearing obstructions.",
    },
  },
  {
    slug: "reduccion-concentrica",
    es: {
      nombre: "Reducción concéntrica",
      resumen: "Transición de una sección mayor a una menor, centrada.",
      descripcion:
        "Transición que cambia el ancho y el alto del ducto manteniendo el mismo eje. Se usa donde el caudal baja después de una derivación o para llegar a un equipo de otra medida.",
      uso: "Cambios de sección en troncales y conexión a equipos.",
    },
    en: {
      nombre: "Concentric transition",
      resumen: "Centered transition from a larger to a smaller section.",
      descripcion:
        "Transition that changes duct width and height on the same centerline. Used where airflow drops after a branch or to meet equipment of a different size.",
      uso: "Size changes in mains and equipment connections.",
    },
  },
  {
    slug: "reduccion-excentrica",
    es: {
      nombre: "Reducción excéntrica",
      resumen: "Transición con una cara a paño, recta de lado a lado.",
      descripcion:
        "Transición con una de sus caras recta, para que el fondo o el lomo del ducto se mantenga a la misma altura. Útil cuando el ducto va pegado a losa o a un muro.",
      uso: "Cambios de sección con una cara fija contra losa o muro.",
    },
    en: {
      nombre: "Eccentric transition",
      resumen: "Transition with one flat side kept in line.",
      descripcion:
        "Transition with one face kept flat so the top or bottom of the duct stays at the same elevation. Useful when the duct runs tight to a slab or wall.",
      uso: "Size changes with one face held against a slab or wall.",
    },
  },
  {
    slug: "desviacion",
    es: {
      nombre: "Desviación",
      resumen: "Desplaza el ducto de lado sin cambiar su dirección.",
      descripcion:
        "Pieza en S que desplaza el eje del ducto hacia un lado o hacia arriba y sigue en la misma dirección. Se fabrica con el desplazamiento y el largo que pida el levantamiento.",
      uso: "Librar vigas, tuberías y otros ductos.",
    },
    en: {
      nombre: "Offset",
      resumen: "Shifts the duct sideways without changing direction.",
      descripcion:
        "S-shaped fitting that shifts the duct centerline sideways or up and carries on in the same direction. Made to the offset and length taken from the site survey.",
      uso: "Clearing beams, pipes and other ducts.",
    },
  },
  {
    slug: "tee",
    es: {
      nombre: "Tee",
      resumen: "Derivación a 90° desde un tramo principal.",
      descripcion:
        "Tramo principal con una salida lateral a 90°. La boca de la derivación se fabrica a la medida del ramal y lleva su propia brida para unirse sin piezas adicionales.",
      uso: "Salidas a ramales de inyección o retorno.",
    },
    en: {
      nombre: "Tee",
      resumen: "90° branch off a main section.",
      descripcion:
        "Main section with a 90° side outlet. The branch opening is made to the branch size and carries its own flange, so it connects without extra parts.",
      uso: "Supply or return branch takeoffs.",
    },
  },
  {
    slug: "cruz",
    es: {
      nombre: "Cruz",
      resumen: "Dos derivaciones opuestas desde el mismo tramo.",
      descripcion:
        "Tramo principal con dos salidas laterales enfrentadas. Reparte el aire a ambos lados de la troncal en un solo punto.",
      uso: "Distribución simétrica a dos ramales.",
    },
    en: {
      nombre: "Cross",
      resumen: "Two opposite branches from the same section.",
      descripcion:
        "Main section with two facing side outlets. Splits air to both sides of the main at a single point.",
      uso: "Symmetrical split to two branches.",
    },
  },
  {
    slug: "yee-pantalon",
    es: {
      nombre: "Yee (pantalón)",
      resumen: "Una entrada que se divide en dos ramales curvos.",
      descripcion:
        "Divide un ducto en dos ramales con curvas a 45°, para repartir el aire con menos turbulencia que una tee. El ancho de cada ramal se ajusta al caudal que lleva.",
      uso: "Bifurcaciones de troncal.",
    },
    en: {
      nombre: "Wye (pair of pants)",
      resumen: "One inlet splitting into two curved branches.",
      descripcion:
        "Splits one duct into two branches with 45° curves, dividing air with less turbulence than a tee. Each branch width is sized to the airflow it carries.",
      uso: "Main duct splits.",
    },
  },
  {
    slug: "injerto",
    es: {
      nombre: "Injerto (zapato)",
      resumen: "Toma lateral con entrada a 45° para montar sobre un ducto.",
      descripcion:
        "Toma para ramal que se monta sobre el costado de un ducto existente. Su entrada a 45° conduce el aire hacia el ramal con menor pérdida que una toma recta.",
      uso: "Ramales nuevos sobre troncales ya instaladas.",
    },
    en: {
      nombre: "45° shoe tap",
      resumen: "Side takeoff with a 45° entry, mounted on a duct.",
      descripcion:
        "Branch takeoff mounted on the side of an existing duct. Its 45° entry turns air into the branch with less loss than a straight tap.",
      uso: "New branches on installed mains.",
    },
  },
  {
    slug: "casquillo",
    es: {
      nombre: "Casquillo (toma recta)",
      resumen: "Collarín recto con pestaña para fijar sobre el ducto.",
      descripcion:
        "Collarín de sección rectangular con pestaña perimetral para fijarse sobre el ducto. Es la toma más sencilla para conectar un ramal, una rejilla o un difusor.",
      uso: "Tomas para rejillas, difusores y ramales cortos.",
    },
    en: {
      nombre: "Straight tap (collar)",
      resumen: "Straight collar with a flange to fasten onto a duct.",
      descripcion:
        "Rectangular collar with a perimeter flange to fasten onto the duct. The simplest way to connect a branch, a grille or a diffuser.",
      uso: "Taps for grilles, diffusers and short branches.",
    },
  },
  {
    slug: "plenum",
    es: {
      nombre: "Plenum",
      resumen: "Caja de distribución con boca inferior y cuello lateral.",
      descripcion:
        "Caja que recibe el aire por un cuello y lo entrega por una boca amplia, como la de un difusor de techo o la descarga de un equipo. Se fabrica a la medida del difusor o del equipo.",
      uso: "Cajas para difusores y conexión a equipos.",
    },
    en: {
      nombre: "Plenum box",
      resumen: "Distribution box with a bottom opening and side collar.",
      descripcion:
        "Box that takes air in through a collar and delivers it through a wide opening, such as a ceiling diffuser or an equipment discharge. Made to the diffuser or equipment size.",
      uso: "Diffuser boxes and equipment connections.",
    },
  },
  {
    slug: "tapa",
    es: {
      nombre: "Tapa",
      resumen: "Cierre para el extremo de un ducto.",
      descripcion:
        "Charola con brida que cierra el extremo de un tramo. Se usa al final de una troncal o para dejar preparada una salida que se conectará después.",
      uso: "Fin de troncal y salidas futuras.",
    },
    en: {
      nombre: "End cap",
      resumen: "Closure for the end of a duct.",
      descripcion:
        "Flanged tray that closes off the end of a section. Used at the end of a main or to blank off an outlet that will be connected later.",
      uso: "End of mains and future outlets.",
    },
  },
  {
    slug: "cuello-lona",
    es: {
      nombre: "Cuello de lona",
      resumen: "Junta flexible entre el equipo y el ducto.",
      descripcion:
        "Conexión de lona entre dos marcos de lámina. Corta la vibración del ventilador o de la manejadora para que no pase al ducto ni se convierta en ruido.",
      uso: "Conexión a manejadoras, ventiladores y extractores.",
    },
    en: {
      nombre: "Flexible connector",
      resumen: "Flexible joint between equipment and duct.",
      descripcion:
        "Fabric connection between two sheet metal frames. Isolates fan or air handler vibration so it doesn't travel into the duct or turn into noise.",
      uso: "Connections to air handlers, fans and exhausters.",
    },
  },
  {
    slug: "cuello-ganso",
    es: {
      nombre: "Cuello de ganso",
      resumen: "Descarga a intemperie con vuelta de 180°.",
      descripcion:
        "Descarga que sube y regresa 180° para que la lluvia no entre al ducto. Se coloca en azotea a la salida de extractores o tomas de aire exterior.",
      uso: "Descargas y tomas de aire en azotea.",
    },
    en: {
      nombre: "Gooseneck",
      resumen: "Weatherproof outlet with a 180° return.",
      descripcion:
        "Outlet that rises and turns back 180° so rain can't enter the duct. Fitted on the roof at exhaust discharges or outside air intakes.",
      uso: "Rooftop discharges and air intakes.",
    },
  },
  {
    slug: "perfiles",
    es: {
      nombre: "Perfiles de unión",
      resumen: "Grapa y perfil zeta para unir tramos.",
      descripcion:
        "Perfiles de lámina con los que se unen los tramos entre sí: el perfil zeta (S) se ensambla en las caras largas y la grapa (drive) se desliza en las cortas.",
      uso: "Unión transversal de tramos en el sistema grapa-zeta.",
    },
    en: {
      nombre: "S & drive cleats",
      resumen: "S cleats and drive cleats for joining sections.",
      descripcion:
        "Sheet metal profiles used to join sections: the S cleat goes on the long sides and the drive cleat slides onto the short sides.",
      uso: "Transverse joints in the S & drive system.",
    },
  },
];

export const imagenDe = (slug: string) => `/ductos/${slug}.webp`;

export function productoPorSlug(slug: string): Producto | undefined {
  return PRODUCTOS.find((p) => p.slug === slug);
}

/** Opciones del selector de pieza en el formulario de cotización. */
export function quoteOptions(lang: Lang): { value: string; label: string }[] {
  // El valor viaja en el correo al equipo, que siempre lo lee en español.
  return PRODUCTOS.map((p) => ({ value: p.es.nombre, label: p[lang].nombre }));
}
