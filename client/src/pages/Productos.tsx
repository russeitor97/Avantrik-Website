import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { QuoteForm } from "@/components/ductos/QuoteForm";
import { TarjetaProducto } from "@/components/productos/TarjetaProducto";
import { JsonLd } from "@/components/productos/JsonLd";
import { CALIBRES, ESPECIFICACION, PRODUCTOS } from "@/lib/productos";
import { SITE_URL, productPath, useLang } from "@/lib/i18n";

const T = {
  es: {
    title: "Productos: Ductos de Lámina Galvanizada a la Medida | Avantrik Querétaro",
    description:
      "Ductos rectangulares de lámina galvanizada y conexiones a la medida: tramo recto, codos, reducciones, tees, yees, plenums, tapas y cuellos. Calibres 18 a 26. Querétaro.",
    h1: "Productos",
    intro: "Ductos rectangulares de lámina galvanizada y sus conexiones, fabricados a la medida de cada proyecto.",
    specH2: "Especificaciones",
    spec: ["Material", "Calibres", "Medidas", "Cierre", "Unión entre tramos"],
    gaugeH2: "Calibres",
    gaugeCols: ["Calibre", "Espesor (mm)", "Espesor (pulg)"],
    gaugeNote: "Espesor nominal de lámina galvanizada. El calibre de cada ducto se define según su sección y la presión del sistema.",
    otherH2: "¿Necesita una pieza que no está aquí?",
    otherBody: "La fabricamos con su plano o con las medidas de obra. Mándenos lo que necesita en el formulario.",
    formH2: "Solicitar cotización",
  },
  en: {
    title: "Products: Custom Galvanized Sheet Metal Duct | Avantrik Querétaro",
    description:
      "Custom rectangular galvanized duct and fittings: straight duct, elbows, transitions, tees, wyes, plenums, end caps and connectors. 18 to 26 gauge. Querétaro, Mexico.",
    h1: "Products",
    intro: "Rectangular galvanized sheet metal duct and fittings, made to the size of each project.",
    specH2: "Specifications",
    spec: ["Material", "Gauges", "Sizes", "Seam", "Transverse joint"],
    gaugeH2: "Gauges",
    gaugeCols: ["Gauge", "Thickness (mm)", "Thickness (in)"],
    gaugeNote: "Nominal galvanized sheet thickness. The gauge for each duct is set by its size and the system pressure.",
    otherH2: "Need a part that isn't listed?",
    otherBody: "We make it from your drawing or site measurements. Tell us what you need in the form.",
    formH2: "Request a quote",
  },
};

export default function Productos() {
  const lang = useLang();
  const t = T[lang];
  const e = ESPECIFICACION[lang];
  const filas = [e.material, e.calibres, e.medidas, e.cierre, e.union];

  // Llegar con /productos#cotizar (botón del inicio): bajar al formulario
  // después de que el Layout suba la página al inicio.
  useEffect(() => {
    if (window.location.hash !== "#cotizar") return;
    const id = setTimeout(() => document.getElementById("cotizar")?.scrollIntoView({ behavior: "smooth" }), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <Layout>
      <Seo page="products" title={t.title} description={t.description} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t.h1,
          itemListElement: PRODUCTOS.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p[lang].nombre,
            url: `${SITE_URL}${productPath(p.slug, lang)}`,
          })),
        }}
      />

      <section className="bg-ink pb-12 pt-32 text-white">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">{t.h1}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/75">{t.intro}</p>
        </div>
      </section>

      <section className="bg-secondary/50 py-14">
        <div className="container mx-auto px-4">
          <ul className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {PRODUCTOS.map((p, i) => (
              <li key={p.slug}>
                <TarjetaProducto p={p} eager={i < 4} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="mb-5 text-2xl">{t.specH2}</h2>
            <dl className="divide-y divide-border border-y border-border">
              {t.spec.map((k, i) => (
                <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 py-3 text-sm">
                  <dt className="font-semibold text-foreground">{k}</dt>
                  <dd className="text-muted-foreground">{filas[i]}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="mb-5 text-2xl">{t.gaugeH2}</h2>
            <table className="w-full border-y border-border text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  {t.gaugeCols.map((c) => (
                    <th key={c} className="py-3 pr-4 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CALIBRES.map((c) => (
                  <tr key={c.calibre} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-semibold">{c.calibre}</td>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">{c.mm}</td>
                    <td className="py-3 pr-4 tabular-nums text-muted-foreground">{c.pulg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">{t.gaugeNote}</p>
          </div>
        </div>
      </section>

      <section id="cotizar" className="scroll-mt-24 border-t border-border bg-secondary/50 py-16">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-2xl">{t.otherH2}</h2>
            <p className="mt-3 text-muted-foreground">{t.otherBody}</p>
          </div>
          <div className="rounded-sm border border-border bg-card p-6 md:p-8">
            <h2 className="mb-6 text-2xl">{t.formH2}</h2>
            <QuoteForm />
          </div>
        </div>
      </section>
    </Layout>
  );
}
