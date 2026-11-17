import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VisorFotos } from "@/components/proyectos/GaleriaFotos";
import { GALERIA_INICIO, srcChica } from "@/lib/proyectos";
import { useLang } from "@/lib/i18n";

const T = {
  es: { titulo: "Algunos de nuestros trabajos", ver: "Ver foto", anterior: "Fotos anteriores", siguiente: "Más fotos" },
  en: { titulo: "Some of our work", ver: "View photo", anterior: "Previous photos", siguiente: "More photos" },
};

const VELOCIDAD = 40; // px por segundo
const PAUSA_TRAS_USO = 4000; // ms sin moverse sola después de usar las flechas o deslizar

/**
 * Hilera de fotos reales que avanza sola y se puede mover con las flechas o
 * deslizando. Las fotos van dos veces seguidas: al llegar a la mitad el
 * scroll regresa al inicio sin que se note, así nunca se acaba.
 * Se pausa al pasar el mouse; con "reducir movimiento" no avanza sola.
 */
export function TrabajoEnCampo() {
  const lang = useLang();
  const t = T[lang];
  const [abierta, setAbierta] = useState<number | null>(null);
  const fotos = GALERIA_INICIO;
  const pista = useRef<HTMLDivElement>(null);
  const encima = useRef(false);
  const pausaHasta = useRef(0);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pos = el.scrollLeft;
    let antes = performance.now();
    let raf = 0;

    const cuadro = (ahora: number) => {
      const dt = Math.min(ahora - antes, 100) / 1000;
      antes = ahora;
      const mitad = el.scrollWidth / 2;
      // si alguien deslizó a mano, seguir desde donde lo dejó
      if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
      if (!reducir && !encima.current && ahora > pausaHasta.current && abierta === null) {
        pos += VELOCIDAD * dt;
        if (pos >= mitad) pos -= mitad;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);

    const pausar = () => (pausaHasta.current = performance.now() + PAUSA_TRAS_USO);
    el.addEventListener("touchstart", pausar, { passive: true });
    el.addEventListener("wheel", pausar, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("touchstart", pausar);
      el.removeEventListener("wheel", pausar);
    };
  }, [abierta]);

  function mover(dir: 1 | -1) {
    const el = pista.current;
    if (!el) return;
    pausaHasta.current = performance.now() + PAUSA_TRAS_USO;
    const mitad = el.scrollWidth / 2;
    // Saltar (sin que se note) a la otra copia de las fotos para que siempre haya hacia dónde ir.
    if (dir < 0 && el.scrollLeft < el.clientWidth) el.scrollLeft += mitad;
    if (dir > 0 && el.scrollLeft >= mitad) el.scrollLeft -= mitad;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  }

  const flecha =
    "inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-card text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container mx-auto mb-8 flex items-end justify-between gap-4 px-4">
        <h2 className="text-3xl font-heading font-bold text-foreground md:text-4xl">{t.titulo}</h2>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => mover(-1)} aria-label={t.anterior} className={flecha}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => mover(1)} aria-label={t.siguiente} className={flecha}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={pista}
        onMouseEnter={() => (encima.current = true)}
        onMouseLeave={() => (encima.current = false)}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]"
      >
        <ul className="flex w-max gap-4 px-4">
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
                    draggable={false}
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
