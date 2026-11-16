import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useHref, useLang } from "@/lib/i18n";

const T = {
  es: {
    h2: "Fabricamos ductos de lámina galvanizada",
    sub: "Ductos rectangulares y conexiones a la medida, calibres 18 a 26.",
    ver: "Ver productos",
    cotizar: "Cotizar",
    alt: "Catálogo de ductos y conexiones de lámina galvanizada: ducto recto, codos, tee, cruz, yee, desviación, reducciones, plenum, tapa, cuellos y perfiles de unión",
  },
  en: {
    h2: "We fabricate galvanized sheet metal duct",
    sub: "Rectangular duct and fittings made to size, 18 to 26 gauge.",
    ver: "View products",
    cotizar: "Get a quote",
    alt: "Galvanized sheet metal duct and fittings catalog: straight duct, elbows, tee, cross, wye, offset, transitions, plenum, end cap, connectors and cleats",
  },
};

/**
 * Banda del inicio con todo el catálogo en una sola imagen.
 * El fondo es el mismo azul de la imagen (scripts/ductos-render), así no se ve el borde.
 */
export function CatalogoInicio() {
  const t = T[useLang()];
  const href = useHref();
  return (
    <section className="bg-ink pt-14 text-white md:pt-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold leading-tight md:text-5xl">{t.h2}</h2>
            <p className="mt-3 text-lg text-white/75">{t.sub}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-sm bg-accent px-7 font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
              <Link href={href("products")}>{t.ver}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-sm border-white/40 bg-transparent px-7 font-bold uppercase tracking-wide text-white hover:bg-white/10 hover:text-white">
              <Link href={`${href("products")}#cotizar`}>{t.cotizar}</Link>
            </Button>
          </div>
        </div>
      </div>
      <Link href={href("products")} className="block overflow-hidden">
        <img
          src="/ductos/catalogo.webp"
          alt={t.alt}
          width={2400}
          height={1100}
          loading="lazy"
          decoding="async"
          className="-ml-[22%] h-auto w-[144%] max-w-none md:mx-auto md:w-full md:max-w-[1600px]"
        />
      </Link>
    </section>
  );
}
