/**
 * Fotos reales de trabajos de Avantrik.
 *
 * Archivos en client/public/proyectos/<archivo>.webp (1600 px) y
 * <archivo>-800.webp (miniatura). Para agregar una foto: ponla en esa carpeta
 * con los dos tamaños y súmala aquí con su descripción.
 *
 * Las descripciones dicen lo que se ve, sin nombrar al cliente ni la planta:
 * para publicar nombres o logotipos de clientes hace falta su autorización.
 */
import type { Lang } from "@/lib/i18n";

export interface Foto {
  archivo: string;
  ancho: number;
  alto: number;
  es: string;
  en: string;
}

const F = (archivo: string, ancho: number, alto: number, es: string, en: string): Foto => ({ archivo, ancho, alto, es, en });

export const FOTOS = {
  azotea: F("01-azotea-chimeneas-extraccion", 1600, 900, "Revisión de sistemas de extracción en azotea", "Rooftop exhaust system inspection"),
  manejadora: F("02-manejadora-azotea", 1600, 900, "Unidad manejadora de aire en azotea", "Rooftop air handling unit"),
  cuartoBombas: F("03-cuarto-bombas-agua-helada", 1600, 1325, "Cuarto de bombas de agua helada", "Chilled water pump room"),
  equipoMuro: F("04-equipo-avantrik-muro", 1280, 1600, "Equipo de aire acondicionado de montaje en muro", "Wall-mounted air conditioning unit"),
  tecnicoSerpentin: F("05-tecnico-tuberia-serpentin", 1280, 1600, "Conexión de tubería a serpentín", "Piping connection to a coil"),
  condensadora: F("07-condensadora-azotea", 1075, 1344, "Condensadora instalada en azotea", "Condensing unit installed on the roof"),
  tecnicoAzotea: F("08-tecnico-manejadora-azotea", 720, 900, "Trabajo en tubería de agua helada", "Chilled water piping work"),
  tuberiaAislada: F("09-tuberia-aislada-manejadora", 900, 1120, "Tubería aislada hacia manejadora", "Insulated piping to an air handler"),
  limpiezaSerpentin: F("10-lavado-serpentin-azotea", 1075, 1344, "Limpieza de serpentín en azotea", "Rooftop coil cleaning"),
  cabezales: F("11-cabezales-serpentin", 1472, 1068, "Cabezales de serpentín conectados", "Connected coil headers"),
  conexionSerpentin: F("12-conexion-serpentin", 900, 1216, "Conexión de serpentín con válvulas", "Coil connection with valves"),
  serpentin: F("13-serpentin-limpio", 1080, 1216, "Banco de serpentines de agua helada", "Chilled water coil bank"),
  recirculacion: F("14-bombas-recirculacion", 900, 1056, "Bombas de recirculación", "Recirculation pumps"),
  bombaLinea: F("15-bomba-en-linea", 900, 1024, "Bomba en línea", "In-line pump"),
  bombaAguaHelada: F("16-bomba-agua-helada", 900, 1120, "Bomba de agua helada", "Chilled water pump"),
  valvula: F("17-valvula-y-bomba", 900, 864, "Válvula y bomba en gabinete de equipo", "Valve and pump inside an equipment cabinet"),
  maniobra: F("18-maniobra-unidad-paquete", 1328, 888, "Maniobra de una unidad paquete", "Rigging a packaged unit"),
  diseno3d: F("20-diseno-ductos-3d", 1133, 637, "Diseño de la red de ductos en 3D", "3D ductwork design"),
};

export const srcGrande = (f: Foto) => `/proyectos/${f.archivo}.webp`;
export const srcChica = (f: Foto) => `/proyectos/${f.archivo}-800.webp`;
export const textoFoto = (f: Foto, lang: Lang) => f[lang];

/** Selección para el inicio. */
export const GALERIA_INICIO: Foto[] = [
  FOTOS.manejadora,
  FOTOS.cuartoBombas,
  FOTOS.maniobra,
  FOTOS.tecnicoSerpentin,
  FOTOS.condensadora,
  FOTOS.bombaAguaHelada,
];

/** Página de HVAC industrial. */
export const GALERIA_HVAC: Foto[] = [
  FOTOS.manejadora,
  FOTOS.cuartoBombas,
  FOTOS.tecnicoAzotea,
  FOTOS.limpiezaSerpentin,
  FOTOS.cabezales,
  FOTOS.tuberiaAislada,
  FOTOS.serpentin,
  FOTOS.recirculacion,
  FOTOS.equipoMuro,
  FOTOS.conexionSerpentin,
  FOTOS.bombaLinea,
  FOTOS.valvula,
];
