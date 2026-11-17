import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n";
import { srcChica, srcGrande, type Foto } from "@/lib/proyectos";

const T = {
  es: { ver: "Ver foto", anterior: "Foto anterior", siguiente: "Foto siguiente", cerrar: "Cerrar" },
  en: { ver: "View photo", anterior: "Previous photo", siguiente: "Next photo", cerrar: "Close" },
};

/**
 * Cuadrícula de fotos reales con su descripción. Al tocar una se abre en
 * grande y se puede pasar a la siguiente con las flechas (o el teclado).
 */
export function GaleriaFotos({ fotos, columnas = 3 }: { fotos: Foto[]; columnas?: 3 | 4 }) {
  const lang = useLang();
  const t = T[lang];
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <>
      <ul className={columnas === 4 ? "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4" : "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3"}>
        {fotos.map((foto, i) => (
          <li key={foto.archivo}>
            <button
              type="button"
              onClick={() => setAbierta(i)}
              aria-label={`${t.ver}: ${foto[lang]}`}
              className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-sm bg-secondary">
                <img
                  src={srcChica(foto)}
                  alt={foto[lang]}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <p className="mt-2 text-sm leading-snug text-muted-foreground">{foto[lang]}</p>
            </button>
          </li>
        ))}
      </ul>

      <VisorFotos fotos={fotos} abierta={abierta} setAbierta={setAbierta} />
    </>
  );
}

/** Foto a pantalla completa con flechas (y teclado) para pasar a la siguiente. */
export function VisorFotos({
  fotos, abierta, setAbierta,
}: {
  fotos: Foto[];
  abierta: number | null;
  setAbierta: (i: number | null) => void;
}) {
  const lang = useLang();
  const t = T[lang];
  const mover = useCallback(
    (d: number) => abierta !== null && setAbierta((abierta + d + fotos.length) % fotos.length),
    [abierta, fotos.length, setAbierta],
  );

  useEffect(() => {
    if (abierta === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierta, mover]);

  const f = abierta === null ? null : fotos[abierta];
  return (
    <Dialog open={f !== null} onOpenChange={(o) => !o && setAbierta(null)}>
      <DialogContent className="max-w-5xl border-0 bg-ink p-0 text-white sm:rounded-sm [&>button]:hidden">
        {f && (
          <figure>
            <DialogTitle className="sr-only">{f[lang]}</DialogTitle>
            <div className="relative flex max-h-[80vh] items-center justify-center bg-black">
              <img src={srcGrande(f)} alt={f[lang]} width={f.ancho} height={f.alto} className="max-h-[80vh] w-auto max-w-full object-contain" />
              <button type="button" onClick={() => mover(-1)} aria-label={t.anterior} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-sm bg-black/50 p-2 hover:bg-black/70">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => mover(1)} aria-label={t.siguiente} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-black/50 p-2 hover:bg-black/70">
                <ChevronRight className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => setAbierta(null)} aria-label={t.cerrar} className="absolute right-2 top-2 rounded-sm bg-black/50 p-2 hover:bg-black/70">
                <X className="h-5 w-5" />
              </button>
            </div>
            <figcaption className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span>{f[lang]}</span>
              <span className="shrink-0 tabular-nums text-white/50">
                {abierta! + 1} / {fotos.length}
              </span>
            </figcaption>
          </figure>
        )}
      </DialogContent>
    </Dialog>
  );
}
