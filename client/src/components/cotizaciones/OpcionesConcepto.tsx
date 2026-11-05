import { Mail, Paperclip, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { analizar, colorMargen, convertir, diasDesde, dinero, fechaCorta, hoy, pct, type Partida } from "@/lib/cotizaciones";
import { useProyecto } from "./contexto";

/**
 * Cuadro comparativo de UN concepto: todas las ofertas de proveedores
 * (líneas de cotización ligadas a él), de la más barata a la más cara.
 * ★ adjudica la oferta: su costo pasa al presupuesto.
 */
export function OpcionesConcepto({ pa, compacto }: { pa: Partida; compacto?: boolean }) {
  const { p, adjudicar, editarCotizacion, abrirArchivo } = useProyecto();
  const a = analizar(pa, p);
  const est = pa.estimado && (pa.estimado.costo > 0 || pa.estimado.proveedor) ? pa.estimado : null;
  const estCosto = est ? convertir(est.costo * est.cantidad, est.moneda, p) : null;
  const th = "px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="w-0 min-w-full overflow-x-auto">
      <table className="w-full min-w-[60rem] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-10" />
            <th className={cn(th, "min-w-[11rem]")}>Proveedor</th>
            <th className={cn(th, "min-w-[12rem]")}>Lo que ofrece</th>
            <th className={cn(th, "w-24 text-right")}>Cant.</th>
            <th className={cn(th, "w-28 text-right")}>P.U.</th>
            <th className={cn(th, "w-28 text-right")}>Importe ({p.moneda})</th>
            <th className={cn(th, "w-24 text-right")}>vs. estimado</th>
            <th className={cn(th, "w-20 text-right")}>Margen</th>
            <th className={cn(th, "w-28")}>Entrega</th>
            <th className={cn(th, "w-24")}>Vigencia</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {a.opciones.map((o) => {
            const elegida = pa.adjudicada === o.linea.id;
            const vencida = !!o.cot.vigencia && o.cot.vigencia < hoy();
            const arch = p.archivos.find((z) => z.id === o.cot.archivoId);
            const dif = o.costo !== null && estCosto !== null && estCosto > 0 ? (o.costo - estCosto) / estCosto : null;
            return (
              <tr key={o.linea.id} className={cn("border-b border-border/60 align-top", elegida && "bg-emerald-500/10")}>
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => adjudicar(pa.id, o.linea.id)}
                    title={elegida ? "Quitar adjudicación" : "Adjudicar: este precio pasa al costo"}
                    aria-pressed={elegida}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                      elegida ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/30 text-muted-foreground/50 hover:border-amber-500 hover:text-amber-500",
                    )}
                  >
                    <Star className={cn("h-3.5 w-3.5", elegida && "fill-current")} />
                  </button>
                </td>
                <td className="px-2 py-1.5">
                  <button type="button" onClick={() => editarCotizacion(o.cot)} className="text-left font-semibold text-foreground hover:underline">
                    {o.cot.proveedor || "Proveedor"}
                  </button>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                    <span className="font-mono">{o.cot.folio}</span>
                    {o.linea.id === a.masBarata && (
                      <span className="rounded-full bg-emerald-500/15 px-1.5 font-bold uppercase text-emerald-800">más barato</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1.5 text-xs text-muted-foreground">{o.linea.descripcion || "—"}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {o.linea.cantidad} <span className="text-xs text-muted-foreground">{o.linea.unidad}</span>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">{dinero(o.linea.precio, o.cot.moneda)}</td>
                <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                  {o.costo === null ? <span className="text-xs text-amber-700">falta TC</span> : dinero(o.costo, p.moneda)}
                </td>
                <td className={cn("px-2 py-1.5 text-right text-xs tabular-nums", dif === null ? "text-muted-foreground" : dif > 0 ? "text-amber-700" : "text-emerald-700")}>
                  {dif === null ? "—" : `${dif > 0 ? "+" : ""}${(dif * 100).toFixed(1)}%`}
                </td>
                <td className={cn("px-2 py-1.5 text-right font-bold tabular-nums", colorMargen(o.margen, p.margenObjetivo))}>{pct(o.margen)}</td>
                <td className="px-2 py-1.5 text-xs">{o.cot.entrega || "—"}</td>
                <td className={cn("px-2 py-1.5 text-xs", vencida ? "font-semibold text-destructive" : "text-muted-foreground")}>
                  {o.cot.vigencia ? `${vencida ? "Vencida " : ""}${fechaCorta(o.cot.vigencia)}` : "—"}
                </td>
                <td className="px-1 py-1.5">
                  {arch && (
                    <button type="button" onClick={() => abrirArchivo(arch)} title="Ver PDF del proveedor" className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}

          {a.pendientes.map((c) => {
            const d = diasDesde(c.fechaSolicitud);
            return (
              <tr key={`pend-${c.id}`} className="border-b border-border/60 text-xs text-muted-foreground">
                <td className="px-2 py-1.5 text-center">
                  <Mail className="mx-auto h-4 w-4 text-sky-600" />
                </td>
                <td colSpan={10} className="px-2 py-1.5">
                  <button type="button" onClick={() => editarCotizacion(c)} className="font-semibold text-foreground hover:underline">
                    {c.proveedor || "Proveedor"} <span className="font-mono font-normal text-muted-foreground">{c.folio}</span>
                  </button>{" "}
                  — solicitada{d !== null ? ` hace ${d} ${d === 1 ? "día" : "días"}` : ""}, sin precio todavía. Ábrela para capturar lo que te mandaron.
                </td>
              </tr>
            );
          })}

          {est && (
            <tr className="text-xs text-muted-foreground">
              <td className="px-2 py-1.5 text-center text-[10px] font-bold uppercase">Est.</td>
              <td className="px-2 py-1.5 italic">{est.proveedor || "Estimado"}</td>
              <td className="px-2 py-1.5 italic">{est.notas || "Costo de referencia (no es cotización formal)"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">
                {est.cantidad} {est.unidad}
              </td>
              <td className="px-2 py-1.5 text-right tabular-nums">{dinero(est.costo, est.moneda)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{estCosto === null ? "—" : dinero(estCosto, p.moneda)}</td>
              <td colSpan={5} />
            </tr>
          )}

          {a.opciones.length === 0 && a.pendientes.length === 0 && !est && (
            <tr>
              <td colSpan={11} className="px-2 py-3 text-sm text-muted-foreground">
                Todavía no hay cotizaciones de proveedores para este concepto.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!compacto && (
        <div className="flex flex-wrap items-center gap-3 px-1 pt-2">
          <Button variant="ghost" size="sm" onClick={() => editarCotizacion(null, [pa.id])} className="rounded-sm font-semibold text-foreground">
            <Plus className="mr-1.5 h-4 w-4" /> Registrar cotización de proveedor
          </Button>
          <span className="text-xs text-muted-foreground">★ = adjudicar: ese precio se va al costo del presupuesto.</span>
        </div>
      )}
    </div>
  );
}
