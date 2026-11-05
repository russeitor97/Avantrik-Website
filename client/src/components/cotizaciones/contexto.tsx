import { createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import type { Archivo, CotizacionProveedor, EstatusConcepto, Partida, Proyecto } from "@/lib/cotizaciones";
import type { ResultadoPdf } from "@/lib/pdf-partidas";

/** Lo que las secciones del proyecto necesitan del contenedor (estado + acciones). */
export interface ProyectoCtx {
  p: Proyecto;
  email: string;
  cambiar: (fn: (p: Proyecto) => Proyecto) => void;
  setPartida: (id: string, fn: (pa: Partida) => Partida) => void;
  /** ★ — adjudica (o quita) una línea de cotización a su concepto */
  adjudicar: (partidaId: string, lineaId: string) => void;
  /** Abre el editor de cotización: una existente, o una nueva (opcionalmente ya ligada a conceptos) */
  editarCotizacion: (c: CotizacionProveedor | null, partidaIds?: string[]) => void;
  subirArchivo: (f: File, rol: Archivo["rol"]) => Promise<Archivo | null>;
  abrirArchivo: (a: Archivo) => void;
  leerPdfArchivo: (a: Archivo, file?: File) => Promise<ResultadoPdf | null>;
  subiendo: boolean;
}

export const Ctx = createContext<ProyectoCtx | null>(null);

export function useProyecto(): ProyectoCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useProyecto fuera del proyecto");
  return c;
}

const TONOS: Record<EstatusConcepto, string> = {
  Adjudicado: "bg-emerald-500/15 text-emerald-800",
  "Por decidir": "bg-amber-500/20 text-amber-900",
  Cotizando: "bg-sky-500/15 text-sky-800",
  Estimado: "bg-slate-500/15 text-slate-700",
  "Sin costo": "bg-destructive/10 text-destructive",
};

export function ChipEstatus({ estatus, extra, className }: { estatus: EstatusConcepto; extra?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", TONOS[estatus], className)}>
      {estatus}
      {extra ? ` ${extra}` : ""}
    </span>
  );
}

const TONO_COT = {
  gris: "bg-slate-500/15 text-slate-600",
  azul: "bg-sky-500/15 text-sky-800",
  ambar: "bg-amber-500/20 text-amber-900",
  verde: "bg-emerald-500/15 text-emerald-800",
  rojo: "bg-destructive/10 text-destructive",
} as const;

export function ChipCotizacion({ texto, tono }: { texto: string; tono: keyof typeof TONO_COT }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", TONO_COT[tono])}>{texto}</span>;
}
