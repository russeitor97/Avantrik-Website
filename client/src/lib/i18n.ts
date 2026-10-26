/**
 * Bilingüe ES/EN con URLs separadas.
 *
 * El español vive en la raíz (`/hvac-industrial`) y el inglés bajo `/en`
 * (`/en/industrial-hvac`). Cada idioma tiene su propia URL para que Google
 * pueda indexar ambas versiones por separado; las etiquetas hreflang que
 * emite <Seo> le dicen que son la misma página en otro idioma.
 *
 * El idioma NO se guarda en estado: se deduce de la URL. Así, compartir un
 * link comparte también el idioma y no hay forma de que se desincronicen.
 */
import { useLocation } from "wouter";

export type Lang = "es" | "en";

export const SITE_URL = "https://www.avantrik.com";

/** Páginas públicas con su slug en cada idioma. */
export const PAGES = {
  home: { es: "/", en: "/en" },
  about: { es: "/about", en: "/en/about" },
  contact: { es: "/contact", en: "/en/contact" },
  calculator: { es: "/calculadora-ahorro", en: "/en/savings-calculator" },
  audits: { es: "/auditoria-energetica", en: "/en/energy-audits" },
  hvac: { es: "/hvac-industrial", en: "/en/industrial-hvac" },
  electrical: { es: "/ingenieria-electrica", en: "/en/electrical-engineering" },
  geothermal: { es: "/geotermia", en: "/en/geothermal-systems" },
  ducts: { es: "/ductos-lamina-galvanizada", en: "/en/sheet-metal-ducts" },
  privacy: { es: "/aviso-de-privacidad", en: "/en/privacy-policy" },
} as const;

export type PageKey = keyof typeof PAGES;

/** Quita la barra final para comparar rutas ("/en/" y "/en" son la misma). */
function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function langFromPath(path: string): Lang {
  const p = normalize(path);
  return p === "/en" || p.startsWith("/en/") ? "en" : "es";
}

/** Idioma actual, deducido de la URL. */
export function useLang(): Lang {
  const [location] = useLocation();
  return langFromPath(location);
}

/** Ruta de una página en un idioma concreto. */
export function pagePath(page: PageKey, lang: Lang): string {
  return PAGES[page][lang];
}

/**
 * Devuelve una función para construir hrefs en el idioma actual.
 * Uso: `const href = useHref(); <Link href={href("hvac")}>`
 */
export function useHref(): (page: PageKey) => string {
  const lang = useLang();
  return (page: PageKey) => PAGES[page][lang];
}

/**
 * Para el botón de idioma: a dónde ir para ver la página actual en el otro
 * idioma. Si la URL no corresponde a una página conocida (portal, 404), cae
 * al inicio del otro idioma.
 */
export function useLangSwitch(): { target: Lang; href: string; label: string } {
  const [location] = useLocation();
  const lang = langFromPath(location);
  const target: Lang = lang === "es" ? "en" : "es";
  const current = normalize(location);

  const match = (Object.keys(PAGES) as PageKey[]).find(
    (key) => normalize(PAGES[key][lang]) === current,
  );

  return {
    target,
    href: match ? PAGES[match][target] : PAGES.home[target],
    label: target === "en" ? "EN" : "ES",
  };
}

/** Elige el contenido del idioma actual de un diccionario `{ es, en }`. */
export function useCopy<T>(dict: Record<Lang, T>): T {
  return dict[useLang()];
}
