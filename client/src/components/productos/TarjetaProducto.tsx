import { Link } from "wouter";
import { imagenDe, type Producto } from "@/lib/productos";
import { productPath, useLang } from "@/lib/i18n";

/** Tarjeta del catálogo: foto sobre blanco y el nombre en una barra de color sólido. */
export function TarjetaProducto({ p, eager = false }: { p: Producto; eager?: boolean }) {
  const lang = useLang();
  const t = p[lang];
  return (
    <Link
      href={productPath(p.slug, lang)}
      className="group block overflow-hidden rounded-sm border border-border bg-white transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="aspect-[4/3] bg-white">
        <img
          src={imagenDe(p.slug)}
          alt={t.nombre}
          width={1200}
          height={900}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex min-h-[3.25rem] items-center justify-center bg-primary px-3 py-2 text-center font-heading text-sm font-semibold uppercase leading-tight tracking-wide text-primary-foreground transition-colors group-hover:bg-primary/90 md:text-base">
        {t.nombre}
      </div>
    </Link>
  );
}
