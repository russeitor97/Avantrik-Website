import { Link, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/ductos/QuoteForm";
import { TarjetaProducto } from "@/components/productos/TarjetaProducto";
import { JsonLd } from "@/components/productos/JsonLd";
import { useSeo } from "@/lib/seo";
import { ESPECIFICACION, PRODUCTOS, imagenDe, productoPorSlug } from "@/lib/productos";
import { PAGES, SITE_URL, productPath, useLang } from "@/lib/i18n";
import NotFound from "@/pages/not-found";

const WHATSAPP_URL = "https://walink.co/e1h4ub";

const T = {
  es: {
    productos: "Productos",
    spec: ["Material", "Calibres", "Medidas", "Cierre", "Unión entre tramos", "Uso"],
    cotizar: "Solicitar cotización",
    whatsapp: "WhatsApp",
    otros: "Otros productos",
    formH2: "Solicitar cotización",
    formIntro: "Indique medidas y cantidad si ya las tiene. Si no, con la descripción del proyecto podemos empezar.",
    suf: "Ducto galvanizado a la medida | Avantrik",
  },
  en: {
    productos: "Products",
    spec: ["Material", "Gauges", "Sizes", "Seam", "Transverse joint", "Use"],
    cotizar: "Request a quote",
    whatsapp: "WhatsApp",
    otros: "Other products",
    formH2: "Request a quote",
    formIntro: "Include sizes and quantity if you have them. If not, a project description is enough to start.",
    suf: "Custom galvanized duct | Avantrik",
  },
};

export default function Producto() {
  const { slug = "" } = useParams<{ slug: string }>();
  const p = productoPorSlug(slug);
  if (!p) return <NotFound />;
  return <Ficha slug={slug} />;
}

function Ficha({ slug }: { slug: string }) {
  const lang = useLang();
  const t = T[lang];
  const p = productoPorSlug(slug)!;
  const d = p[lang];
  const e = ESPECIFICACION[lang];
  const filas = [e.material, e.calibres, e.medidas, e.cierre, e.union, d.uso];
  const url = `${SITE_URL}${productPath(slug, lang)}`;
  const imagen = `${SITE_URL}${imagenDe(slug)}`;
  const title = `${d.nombre} — ${t.suf}`;

  useSeo({
    lang: lang === "en" ? "en" : "es-MX",
    title,
    description: `${d.resumen} ${e.material}, ${lang === "en" ? "18 to 26 gauge" : "calibres 18 a 26"}.`,
    canonical: url,
    alternates: [
      { hreflang: "es-MX", href: `${SITE_URL}${productPath(slug, "es")}` },
      { hreflang: "en", href: `${SITE_URL}${productPath(slug, "en")}` },
      { hreflang: "x-default", href: `${SITE_URL}${productPath(slug, "es")}` },
    ],
    openGraph: { "og:title": title, "og:description": d.resumen, "og:url": url, "og:image": imagen, "og:locale": lang === "en" ? "en_US" : "es_MX" },
    twitter: { "twitter:title": title, "twitter:description": d.resumen },
  });

  // Los 4 siguientes del catálogo (dando la vuelta al final)
  const i = PRODUCTOS.findIndex((x) => x.slug === slug);
  const otros = [1, 2, 3, 4].map((k) => PRODUCTOS[(i + k) % PRODUCTOS.length]);

  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: d.nombre,
          description: d.descripcion,
          image: imagen,
          url,
          material: e.material,
          brand: { "@type": "Brand", name: "Avantrik" },
          manufacturer: { "@type": "Organization", name: "Avantrik", url: SITE_URL },
        }}
      />

      <div className="bg-ink pb-5 pt-28 text-sm text-white/70">
        <nav className="container mx-auto px-4" aria-label="breadcrumb">
          <Link href={PAGES.products[lang]} className="hover:text-white">{t.productos}</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{d.nombre}</span>
        </nav>
      </div>

      <section className="py-12">
        <div className="container mx-auto grid items-start gap-10 px-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-sm border border-border bg-white">
            <img src={imagenDe(slug)} alt={d.nombre} width={1200} height={900} className="h-auto w-full" fetchPriority="high" />
          </div>
          <div>
            <h1 className="font-heading text-4xl font-bold">{d.nombre}</h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">{d.descripcion}</p>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {t.spec.map((k, j) => (
                <div key={k} className="grid grid-cols-[9.5rem_1fr] gap-4 py-2.5 text-sm">
                  <dt className="font-semibold">{k}</dt>
                  <dd className="text-muted-foreground">{filas[j]}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
                <a href="#cotizar">{t.cotizar}</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-sm font-bold uppercase tracking-wide">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-6 text-2xl">{t.otros}</h2>
          <ul className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {otros.map((o) => (
              <li key={o.slug}><TarjetaProducto p={o} /></li>
            ))}
          </ul>
        </div>
      </section>

      <section id="cotizar" className="scroll-mt-24 py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-2xl">{t.formH2}</h2>
          <p className="mb-6 mt-2 text-muted-foreground">{t.formIntro}</p>
          <div className="rounded-sm border border-border bg-card p-6 md:p-8">
            <QuoteForm key={slug} preselected={p.es.nombre} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
