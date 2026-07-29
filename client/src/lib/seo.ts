/**
 * Metadatos de <head> sin dependencias.
 *
 * Sustituye a react-helmet-async, que en este proyecto NO estaba inyectando
 * nada (ni title, ni canonical, ni el noindex del portal): el <head> se
 * quedaba siempre con lo que trae index.html. Como todo el SEO del sitio
 * depende de estas etiquetas, se maneja aquí de forma explícita y verificable.
 *
 * Las etiquetas creadas por este módulo se marcan con `data-seo` para poder
 * limpiarlas al cambiar de página; las que ya existen en index.html se
 * actualizan en su sitio en vez de duplicarse.
 */
import { useEffect } from "react";

export interface HeadTags {
  /** Valor de <html lang>. */
  lang: string;
  title: string;
  description?: string;
  canonical?: string;
  /** hreflang → URL absoluta. */
  alternates?: { hreflang: string; href: string }[];
  /** p. ej. "noindex, nofollow" para páginas privadas. */
  robots?: string;
  /** Etiquetas og:* (atributo `property`). */
  openGraph?: Record<string, string>;
  /** Etiquetas twitter:* (atributo `name`, como las de index.html). */
  twitter?: Record<string, string>;
}

/** Actualiza la etiqueta si ya existe; si no, la crea marcada como `data-seo`. */
function upsert(
  selector: string,
  create: () => HTMLElement,
  apply: (el: HTMLElement) => void,
) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    el.setAttribute("data-seo", "");
    document.head.appendChild(el);
  }
  apply(el);
}

function meta(attr: "name" | "property", key: string, content: string) {
  upsert(
    `meta[${attr}="${key}"]`,
    () => {
      const el = document.createElement("meta");
      el.setAttribute(attr, key);
      return el;
    },
    (el) => el.setAttribute("content", content),
  );
}

export function useSeo({
  lang,
  title,
  description,
  canonical,
  alternates,
  robots,
  openGraph,
  twitter,
}: HeadTags) {
  // Las listas se serializan para que el efecto no se dispare en cada render
  // por recibir un array nuevo con el mismo contenido.
  const altKey = JSON.stringify(alternates ?? []);
  const ogKey = JSON.stringify(openGraph ?? {});
  const twKey = JSON.stringify(twitter ?? {});

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = title;

    if (description) meta("name", "description", description);
    if (robots) meta("name", "robots", robots);

    for (const [key, content] of Object.entries(
      JSON.parse(ogKey) as Record<string, string>,
    )) {
      meta("property", key, content);
    }

    for (const [key, content] of Object.entries(
      JSON.parse(twKey) as Record<string, string>,
    )) {
      meta("name", key, content);
    }

    // canonical y alternates se recrean en cada navegación: son los que
    // cambian de página a página y no deben acumularse.
    document.head
      .querySelectorAll("link[data-seo]")
      .forEach((el) => el.remove());

    const addLink = (rel: string, href: string, hreflang?: string) => {
      const el = document.createElement("link");
      el.setAttribute("rel", rel);
      el.setAttribute("href", href);
      if (hreflang) el.setAttribute("hreflang", hreflang);
      el.setAttribute("data-seo", "");
      document.head.appendChild(el);
    };

    if (canonical) addLink("canonical", canonical);
    for (const alt of JSON.parse(altKey) as NonNullable<HeadTags["alternates"]>) {
      addLink("alternate", alt.href, alt.hreflang);
    }
  }, [lang, title, description, canonical, robots, altKey, ogKey, twKey]);
}
