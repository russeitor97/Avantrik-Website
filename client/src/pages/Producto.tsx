import { Suspense, lazy, useCallback, useState } from "react";
import { Link, useParams } from "wouter";
import { Image as ImageIcon, Loader2, Rotate3d } from "lucide-react";
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

// three.js solo se descarga cuando alguien pide ver la pieza en 3D.
const cargarVisor = () => import("@/components/productos/Visor3D");
const Visor3D = lazy(cargarVisor);

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
    ver3d: "Girar en 3D",
    verFoto: "Ver foto",
    cargando: "Cargando modelo 3D…",
    ayuda: "Arrastra para girar · rueda o pellizco para acercar",
    sinWebgl: "Su navegador no puede mostrar el modelo 3D.",
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
    ver3d: "Rotate in 3D",
    verFoto: "View photo",
    cargando: "Loading 3D model…",
    ayuda: "Drag to rotate · scroll or pinch to zoom",
    sinWebgl: "Your browser can't display the 3D model.",
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
          <VistaProducto key={slug} slug={slug} alt={d.nombre} t={t} />
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

/** Foto de la pieza, con botón para cambiar al visor 3D (y regresar). */
function VistaProducto({ slug, alt, t }: { slug: string; alt: string; t: (typeof T)["es"] }) {
  const [modo, setModo] = useState<"foto" | "3d">("foto");
  const [sinWebgl, setSinWebgl] = useState(false);
  const alFallar = useCallback(() => {
    setSinWebgl(true);
    setModo("foto");
  }, []);
  const boton =
    "absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-sm border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary";

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-border bg-white">
      {modo === "foto" ? (
        <>
          <img src={imagenDe(slug)} alt={alt} width={1200} height={900} className="h-full w-full object-contain" {...{ fetchpriority: "high" }} />
          {!sinWebgl ? (
            <button type="button" onClick={() => setModo("3d")} onPointerEnter={cargarVisor} onFocus={cargarVisor} className={boton}>
              <Rotate3d className="h-4 w-4" /> {t.ver3d}
            </button>
          ) : (
            <p className="absolute bottom-3 right-3 text-xs text-muted-foreground">{t.sinWebgl}</p>
          )}
        </>
      ) : (
        <>
          <Suspense
            fallback={
              <div className="relative h-full w-full">
                <img src={imagenDe(slug)} alt={alt} className="h-full w-full object-contain opacity-40" />
                <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.cargando}
                </p>
              </div>
            }
          >
            <Visor3D slug={slug} onError={alFallar} />
          </Suspense>
          <p className="pointer-events-none absolute bottom-3 left-3 hidden text-xs text-muted-foreground sm:block">{t.ayuda}</p>
          <button type="button" onClick={() => setModo("foto")} className={boton}>
            <ImageIcon className="h-4 w-4" /> {t.verFoto}
          </button>
        </>
      )}
    </div>
  );
}
