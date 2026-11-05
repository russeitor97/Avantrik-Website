import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { agrupar, analizar, colorMargen, dinero, pct } from "@/lib/cotizaciones";
import { SelectNativo } from "./Celda";
import { ChipEstatus, useProyecto } from "./contexto";
import { OpcionesConcepto } from "./OpcionesConcepto";

/**
 * Cuadro comparativo: por cada concepto que ya tiene cotizaciones (o que se
 * está cotizando), las ofertas lado a lado para decidir y adjudicar (★).
 */
export function Comparativo() {
  const { p, editarCotizacion } = useProyecto();
  const [vista, setVista] = useState<"pendientes" | "todos">("pendientes");
  const [sistema, setSistema] = useState("");

  const filas = p.partidas
    .map((pa) => ({ pa, a: analizar(pa, p) }))
    .filter(({ pa, a }) => (!sistema || pa.sistema === sistema) && (a.opciones.length > 0 || a.pendientes.length > 0))
    .filter(({ a }) => vista === "todos" || a.estatus !== "Adjudicado");
  const sinNada = p.partidas.filter((pa) => {
    const a = analizar(pa, p);
    return (!sistema || pa.sistema === sistema) && a.opciones.length === 0 && a.pendientes.length === 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-sm border border-border bg-card p-0.5 text-sm">
          {(["pendientes", "todos"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVista(v)}
              className={cn("rounded-sm px-3 py-1.5 font-semibold", vista === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {v === "pendientes" ? "Por decidir" : "Todos (incl. adjudicados)"}
            </button>
          ))}
        </div>
        <div className="w-56">
          <SelectNativo value={sistema} onChange={setSistema} ariaLabel="Sistema">
            <option value="">Todos los sistemas</option>
            {agrupar(p.partidas).map((g) => <option key={g.sistema} value={g.sistema}>{g.sistema || "Sin sistema"}</option>)}
          </SelectNativo>
        </div>
        <span className="text-xs text-muted-foreground">Ordenado de la oferta más barata a la más cara. ★ adjudica y manda el precio al costo.</span>
      </div>

      {filas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {vista === "pendientes" && p.cotizaciones.length > 0
            ? "No hay conceptos por decidir. 🎉"
            : "Todavía no hay cotizaciones de proveedores ligadas a conceptos. Regístralas en la pestaña “Cotizaciones de proveedores”."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {filas.map(({ pa, a }) => (
            <section key={pa.id} className="border-b border-border last:border-b-0">
              <header className="flex flex-wrap items-start justify-between gap-3 bg-secondary/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {[pa.sistema, pa.seccion].filter(Boolean).join(" · ")}
                  </p>
                  <p className="font-semibold leading-snug text-foreground">{pa.descripcion || "Sin descripción"}</p>
                  {pa.notas && <p className="text-xs text-muted-foreground">{pa.notas}</p>}
                </div>
                <div className="flex items-start gap-5 text-right text-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Venta</p>
                    <p className="font-semibold tabular-nums">{dinero(a.venta, p.moneda)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {pa.cantidad} {pa.unidad} × {dinero(pa.venta, p.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Margen actual</p>
                    <p className={cn("font-bold tabular-nums", colorMargen(a.margen, p.margenObjetivo))}>{pct(a.margen)}</p>
                    <ChipEstatus estatus={a.estatus} />
                  </div>
                </div>
              </header>
              <div className="px-2 py-1">
                <OpcionesConcepto pa={pa} />
              </div>
            </section>
          ))}
        </div>
      )}

      {sinNada.length > 0 && (
        <details className="rounded-sm border border-border bg-card px-3 py-2 text-sm">
          <summary className="cursor-pointer font-semibold text-foreground">
            {sinNada.length} conceptos sin ninguna cotización de proveedor
          </summary>
          <ul className="mt-2 space-y-1">
            {sinNada.map((pa) => (
              <li key={pa.id} className="flex items-center justify-between gap-3 border-t border-border/60 pt-1">
                <span className="min-w-0 truncate text-muted-foreground">
                  <span className="text-xs font-semibold uppercase">{pa.sistema}</span> · {pa.descripcion}
                </span>
                <button type="button" onClick={() => editarCotizacion(null, [pa.id])} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Pedir cotización
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
