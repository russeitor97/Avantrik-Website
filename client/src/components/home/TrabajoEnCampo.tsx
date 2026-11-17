import { useState } from "react";
import { VisorFotos } from "@/components/proyectos/GaleriaFotos";
import { GALERIA_INICIO, srcChica } from "@/lib/proyectos";
import { useLang } from "@/lib/i18n";

const T = {
  es: { titulo: "Algunos de nuestros trabajos", ver: "Ver foto" },
  en: { titulo: "Some of our work", ver: "View photo" },
};

/**
 * Hilera de fotos reales que se desplaza sola (se pausa al pasar el mouse).
 * Las fotos van dos veces seguidas para que el recorrido no tenga corte.
 * Con "reducir movimiento" activado no se mueve y se puede deslizar a mano.
 */
export function TrabajoEnCampo() {
  const lang = useLang();
  const t = T[lang];
  const [abierta, setAbierta] = useState<number | null>(null);
  const fotos = GALERIA_INICIO;

  return (
    <section className="overflow-hidden bg-background py-16 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-3xl font-heading font-bold text-foreground md:text-4xl">{t.titulo}</h2>
      </div>

      <div className="pausa-al-pasar overflow-x-auto [scrollbar-width:none] motion-safe:overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <ul
          className="animate-marquee flex w-max gap-4"
          style={{ ["--marquee-duracion" as string]: `${fotos.length * 5}s` }}
        >
          {[...fotos, ...fotos].map((f, i) => {
            const real = i % fotos.length;
            const copia = i >= fotos.length;
            return (
              <li key={`${f.archivo}-${i}`} aria-hidden={copia || undefined}>
                <button
                  type="button"
                  tabIndex={copia ? -1 : 0}
                  onClick={() => setAbierta(real)}
                  aria-label={`${t.ver}: ${f[lang]}`}
                  className="block overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <img
                    src={srcChica(f)}
                    alt={copia ? "" : f[lang]}
                    loading="lazy"
                    decoding="async"
                    style={{ aspectRatio: `${f.ancho} / ${f.alto}` }}
                    className="h-56 w-auto object-cover transition-transform duration-500 hover:scale-[1.03] md:h-72"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <VisorFotos fotos={fotos} abierta={abierta} setAbierta={setAbierta} />
    </section>
  );
}
