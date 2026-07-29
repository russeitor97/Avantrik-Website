/**
 * Metadatos SEO de una página bilingüe.
 *
 * Emite en un solo lugar el title, la descripción, el canonical propio y las
 * etiquetas hreflang que enlazan la versión en español con la de inglés. Sin
 * los hreflang, Google trataría ambas versiones como contenido duplicado.
 *
 * `x-default` apunta al español porque es el mercado principal (Querétaro).
 */
import { PAGES, SITE_URL, useLang, type PageKey } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";

interface SeoProps {
  page: PageKey;
  title: string;
  description: string;
}

export function Seo({ page, title, description }: SeoProps) {
  const lang = useLang();
  const urls = PAGES[page];
  const url = `${SITE_URL}${urls[lang]}`;

  useSeo({
    lang: lang === "en" ? "en" : "es-MX",
    title,
    description,
    canonical: url,
    alternates: [
      { hreflang: "es-MX", href: `${SITE_URL}${urls.es}` },
      { hreflang: "en", href: `${SITE_URL}${urls.en}` },
      { hreflang: "x-default", href: `${SITE_URL}${urls.es}` },
    ],
    openGraph: {
      "og:title": title,
      "og:description": description,
      "og:url": url,
      "og:locale": lang === "en" ? "en_US" : "es_MX",
    },
  });

  return null;
}
