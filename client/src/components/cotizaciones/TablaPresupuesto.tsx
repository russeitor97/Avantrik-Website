import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Plus, Search, Star, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  agrupar, analizar, aNumero, coincide, colorMargen, dinero, nid, nuevaPartida, pct, totalizar,
  type EstatusConcepto, type Estimado, type Partida,
} from "@/lib/cotizaciones";
import { Celda, SelectNativo } from "./Celda";
import { ChipEstatus, useProyecto } from "./contexto";
import { OpcionesConcepto } from "./OpcionesConcepto";

const ESTATUS: EstatusConcepto[] = ["Sin costo", "Estimado", "Cotizando", "Por decidir", "Adjudicado"];

/**
 * El presupuesto completo en una tabla tipo Excel, agrupado por sistema.
 * Lado izquierdo = VENTA (lo que se cotizó al cliente). Lado derecho = COSTO:
 * si el concepto está adjudicado viene de la cotización del proveedor (solo
 * lectura); si no, es el costo estimado y se puede editar.
 */
export function TablaPresupuesto() {
  const { p, cambiar, setPartida } = useProyecto();
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [fEstatus, setFEstatus] = useState("");

  const toggle = (id: string) =>
    setAbiertos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function agregarRenglon(sistema: string, despuesDe?: string) {
    const nueva = nuevaPartida(sistema);
    cambiar((x) => {
      const ps = x.partidas.slice();
      let i = despuesDe ? ps.findIndex((z) => z.id === despuesDe) : -1;
      if (i === -1) for (let k = ps.length - 1; k >= 0; k--) if (ps[k].sistema === sistema) { i = k; break; }
      ps.splice(i === -1 ? ps.length : i + 1, 0, nueva);
      return { ...x, partidas: ps };
    });
    setTimeout(() => document.querySelector<HTMLTextAreaElement>(`[data-celda="concepto-${nueva.id}"]`)?.focus(), 60);
  }

  function duplicar(pa: Partida) {
    const copia: Partida = { ...pa, id: nid(), adjudicada: "", estimado: pa.estimado ? { ...pa.estimado } : null };
    cambiar((x) => {
      const ps = x.partidas.slice();
      ps.splice(ps.findIndex((z) => z.id === pa.id) + 1, 0, copia);
      return { ...x, partidas: ps };
    });
  }

  function quitar(pa: Partida) {
    const ligadas = p.cotizaciones.some((c) => c.lineas.some((l) => l.partidaId === pa.id));
    const msg = ligadas
      ? `"${pa.descripcion.slice(0, 60)}" tiene cotizaciones de proveedores ligadas (quedarán "sin ligar"). ¿Quitar el concepto?`
      : `¿Quitar el concepto "${pa.descripcion.slice(0, 60) || "sin descripción"}"?`;
    if ((pa.descripcion || ligadas) && !window.confirm(msg)) return;
    cambiar((x) => ({
      ...x,
      partidas: x.partidas.filter((z) => z.id !== pa.id),
      cotizaciones: x.cotizaciones.map((c) => ({ ...c, lineas: c.lineas.map((l) => (l.partidaId === pa.id ? { ...l, partidaId: "" } : l)) })),
    }));
  }

  const renombrarSistema = (viejo: string, nuevo: string) =>
    cambiar((x) => ({ ...x, partidas: x.partidas.map((pa) => (pa.sistema === viejo ? { ...pa, sistema: nuevo.trim() } : pa)) }));

  const visible = (pa: Partida) => {
    if (fEstatus && analizar(pa, p).estatus !== fEstatus) return false;
    return !q.trim() || coincide(`${pa.sistema} ${pa.seccion} ${pa.descripcion} ${pa.estimado?.proveedor || ""}`, q);
  };

  const t = totalizar(p.partidas, p);
  const grupos = agrupar(p.partidas);
  const thV = "border-b border-border bg-secondary px-2 py-2 text-muted-foreground";
  const thC = "border-b-2 border-b-accent bg-secondary px-2 py-2 text-accent-foreground";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar conceptos…" className="h-9 bg-background pl-9" />
        </div>
        <div className="w-48">
          <SelectNativo value={fEstatus} onChange={setFEstatus} ariaLabel="Filtrar por estatus">
            <option value="">Todos los estatus</option>
            {ESTATUS.map((e) => (
              <option key={e} value={e}>
                {e} ({t.porEstatus[e]})
              </option>
            ))}
          </SelectNativo>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {ESTATUS.map((e) =>
            t.porEstatus[e] ? (
              <button key={e} type="button" onClick={() => setFEstatus(fEstatus === e ? "" : e)} className={cn("rounded-full", fEstatus === e && "ring-2 ring-accent")}>
                <ChipEstatus estatus={e} extra={String(t.porEstatus[e])} />
              </button>
            ) : null,
          )}
        </div>
      </div>

      {p.partidas.length === 0 ? null : (
        <div className="max-h-[75vh] overflow-auto rounded-sm border border-border bg-card shadow-sm">
          <table className="w-full min-w-[1320px] border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider">
                <th className="w-8 border-b border-border bg-secondary" />
                <th className={cn(thV, "w-24")}>Sección</th>
                <th className={cn(thV, "min-w-[13rem]")}>Concepto</th>
                <th className={cn(thV, "w-14")}>Unidad</th>
                <th className={cn(thV, "min-w-[4.5rem] text-right")}>Cant.</th>
                <th className={cn(thV, "min-w-[6.5rem] text-right")}>P.U. venta</th>
                <th className={cn(thV, "min-w-[7rem] whitespace-nowrap border-r-2 border-r-primary/30 text-right")}>Subtotal venta</th>
                <th className={cn(thC, "min-w-[6rem]")}>Estatus</th>
                <th className={cn(thC, "min-w-[8rem]")}>Proveedor</th>
                <th className={cn(thC, "w-16")}>U. compra</th>
                <th className={cn(thC, "min-w-[4.5rem] text-right")}>Cant. compra</th>
                <th className={cn(thC, "min-w-[6.5rem] text-right")}>Costo unit.</th>
                <th className={cn(thC, "min-w-[7rem] whitespace-nowrap text-right")}>Subtotal costo</th>
                <th className={cn(thV, "min-w-[5rem] text-right")}>Margen</th>
                <th className="w-12 border-b border-border bg-secondary" />
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const filas = g.partidas.filter(visible);
                if (filas.length === 0 && (q || fEstatus)) return null;
                const tg = totalizar(g.partidas, p);
                return (
                  <Fragment key={g.sistema || "__sin__"}>
                    <tr className="bg-primary/[0.06]">
                      <td className="border-b border-border" />
                      <td colSpan={5} className="border-b border-border px-1 py-1.5">
                        <div className="flex items-center gap-2">
                          <Celda
                            valor={g.sistema}
                            onCambio={(v) => renombrarSistema(g.sistema, v)}
                            placeholder="Sistema"
                            className="max-w-md font-heading text-sm font-bold uppercase tracking-wide text-foreground"
                          />
                          <span className="shrink-0 text-xs text-muted-foreground">{g.partidas.length} conceptos</span>
                          <button
                            type="button"
                            onClick={() => agregarRenglon(g.sistema)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" /> Concepto
                          </button>
                        </div>
                      </td>
                      <td className="border-b border-r-2 border-border border-r-primary/30 px-2 py-1.5 text-right font-bold tabular-nums">{dinero(tg.venta, p.moneda)}</td>
                      <td colSpan={5} className="border-b border-border px-2 py-1.5 text-xs text-muted-foreground">
                        {tg.porEstatus.Adjudicado}/{tg.total} adjudicados
                      </td>
                      <td className="border-b border-border px-2 py-1.5 text-right font-bold tabular-nums">{dinero(tg.costo, p.moneda)}</td>
                      <td className={cn("border-b border-border px-2 py-1 text-right font-bold tabular-nums", colorMargen(tg.margen, p.margenObjetivo))}>
                        {pct(tg.margen)}
                        <span className="block text-[11px] font-semibold">{dinero(tg.utilidad, p.moneda, 0)}</span>
                      </td>
                      <td className="border-b border-border" />
                    </tr>
                    {filas.map((pa) => (
                      <FilaConcepto
                        key={pa.id}
                        pa={pa}
                        abierta={abiertos.has(pa.id)}
                        onToggle={() => toggle(pa.id)}
                        onCambiar={(fn) => setPartida(pa.id, fn)}
                        onDuplicar={() => duplicar(pa)}
                        onQuitar={() => quitar(pa)}
                        onAgregarAbajo={() => agregarRenglon(pa.sistema, pa.id)}
                      />
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-10">
              <tr className="font-heading text-sm font-bold">
                <td className="border-t-2 border-primary/40 bg-secondary" />
                <td colSpan={5} className="border-t-2 border-primary/40 bg-secondary px-2 py-2 uppercase tracking-wide">
                  Total general
                  <button
                    type="button"
                    onClick={() => {
                      const nombre = window.prompt("Nombre del nuevo sistema (ej. Equipos, Eléctrico)", "");
                      if (nombre?.trim()) agregarRenglon(nombre.trim());
                    }}
                    className="ml-3 inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-sans text-xs font-semibold normal-case tracking-normal text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nuevo sistema
                  </button>
                </td>
                <td className="border-r-2 border-t-2 border-primary/40 border-r-primary/30 bg-secondary px-2 py-2 text-right tabular-nums">{dinero(t.venta, p.moneda)}</td>
                <td colSpan={5} className="border-t-2 border-primary/40 bg-secondary px-2 py-2 font-sans text-xs font-semibold text-muted-foreground">
                  {t.porEstatus.Adjudicado}/{t.total} adjudicados · adjudicado {dinero(t.costoAdjudicado, p.moneda, 0)}
                </td>
                <td className="border-t-2 border-primary/40 bg-secondary px-2 py-2 text-right tabular-nums">{dinero(t.costo, p.moneda)}</td>
                <td className={cn("border-t-2 border-primary/40 bg-secondary px-2 py-1.5 text-right tabular-nums", colorMargen(t.margen, p.margenObjetivo))}>
                  {pct(t.margen)}
                  <span className="block font-sans text-[11px] font-semibold">{dinero(t.utilidad, p.moneda, 0)}</span>
                </td>
                <td className="border-t-2 border-primary/40 bg-secondary" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function FilaConcepto({
  pa, abierta, onToggle, onCambiar, onDuplicar, onQuitar, onAgregarAbajo,
}: {
  pa: Partida;
  abierta: boolean;
  onToggle: () => void;
  onCambiar: (fn: (pa: Partida) => Partida) => void;
  onDuplicar: () => void;
  onQuitar: () => void;
  onAgregarAbajo: () => void;
}) {
  const { p } = useProyecto();
  const a = analizar(pa, p);
  const adjudicado = a.fuente === "adjudicado";
  const est: Estimado = pa.estimado || { proveedor: "", unidad: pa.unidad, cantidad: pa.cantidad, costo: 0, moneda: p.moneda, notas: "" };
  const set = (patch: Partial<Partida>) => onCambiar((x) => ({ ...x, ...patch }));
  const setEst = (patch: Partial<Estimado>) => onCambiar((x) => ({ ...x, estimado: { ...est, ...(x.estimado || {}), ...patch } }));
  const td = "border-b border-border px-0.5 py-0.5 align-top";
  const tdC = cn(td, "bg-accent/[0.05]");
  const nOpciones = a.opciones.length;

  return (
    <>
      <tr className={cn("group", abierta && "bg-accent/[0.04]")}>
        <td className={cn(td, "text-center")}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={abierta ? "Ocultar cotizaciones" : "Ver cotizaciones de proveedores"}
            aria-expanded={abierta}
            className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {abierta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className={td}><Celda valor={pa.seccion} onCambio={(v) => set({ seccion: v })} placeholder="Sección" className="text-muted-foreground" /></td>
        <td className={td}>
          <Celda valor={pa.descripcion} onCambio={(v) => set({ descripcion: v })} multilinea placeholder="Concepto" dataId={`concepto-${pa.id}`} />
        </td>
        <td className={td}><Celda valor={pa.unidad} onCambio={(v) => set({ unidad: v })} list="dl-unidades" ariaLabel="Unidad de venta" /></td>
        <td className={td}><Celda tipo="numero" valor={pa.cantidad} onCambio={(v) => set({ cantidad: aNumero(v) })} ariaLabel="Cantidad de venta" /></td>
        <td className={td}><Celda tipo="dinero" moneda={p.moneda} valor={pa.venta} onCambio={(v) => set({ venta: aNumero(v) })} ariaLabel="Precio unitario de venta" /></td>
        <td className={cn(td, "border-r-2 border-r-primary/30 px-2 py-1.5 text-right font-semibold tabular-nums")}>{dinero(a.venta, p.moneda)}</td>

        {/* costo */}
        <td className={cn(tdC, "px-1.5 py-1.5")}>
          <button type="button" onClick={onToggle} title="Ver cotizaciones de este concepto" className="text-left">
            <ChipEstatus estatus={a.estatus} extra={!adjudicado && nOpciones ? `(${nOpciones})` : undefined} />
          </button>
        </td>
        <td className={tdC}>
          {adjudicado ? (
            <button type="button" onClick={onToggle} className="flex w-full items-start gap-1 px-1.5 py-1 text-left" title="Adjudicado desde una cotización de proveedor">
              <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-emerald-600 text-emerald-600" />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{a.proveedor}</span>
                <span className="block font-mono text-[10px] text-muted-foreground">{a.opcion?.cot.folio}</span>
              </span>
            </button>
          ) : (
            <Celda valor={est.proveedor} onCambio={(v) => setEst({ proveedor: v })} list="dl-proveedores" placeholder="Proveedor (estimado)" atenuado />
          )}
        </td>
        <td className={tdC}>
          {adjudicado ? <Celda valor={a.unidad} soloLectura /> : <Celda valor={est.unidad} onCambio={(v) => setEst({ unidad: v })} list="dl-unidades" atenuado ariaLabel="Unidad de compra" />}
        </td>
        <td className={tdC}>
          {adjudicado ? (
            <Celda tipo="numero" valor={a.cantidad} soloLectura />
          ) : (
            <Celda tipo="numero" valor={pa.estimado ? est.cantidad : 0} onCambio={(v) => setEst({ cantidad: aNumero(v) })} atenuado ariaLabel="Cantidad de compra" />
          )}
        </td>
        <td className={tdC}>
          {adjudicado ? (
            <Celda tipo="dinero" moneda={a.opcion?.cot.moneda} valor={a.opcion?.linea.precio || 0} soloLectura />
          ) : (
            <Celda tipo="dinero" moneda={est.moneda} valor={pa.estimado ? est.costo : 0} onCambio={(v) => setEst({ costo: aNumero(v) })} atenuado ariaLabel="Costo unitario estimado" />
          )}
        </td>
        <td className={cn(tdC, "px-2 py-1.5 text-right tabular-nums", !adjudicado && "italic text-muted-foreground")}>
          {a.costo === null ? "—" : dinero(a.costo, p.moneda)}
        </td>
        <td className={cn(td, "px-2 py-1 text-right tabular-nums", colorMargen(a.margen, p.margenObjetivo))}>
          <span className="font-bold">{pct(a.margen)}</span>
          {a.utilidad !== null && <span className="block text-[11px]">{dinero(a.utilidad, p.moneda, 0)}</span>}
        </td>
        <td className={cn(td, "whitespace-nowrap px-1 py-1")}>
          <div className="grid grid-cols-2 justify-items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button type="button" onClick={onAgregarAbajo} title="Agregar concepto abajo" className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onDuplicar} title="Duplicar concepto" className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onQuitar} title="Quitar concepto" className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {abierta && (
        <tr>
          <td className="border-b border-border bg-accent/[0.04]" />
          <td colSpan={14} className="border-b border-border bg-accent/[0.04] px-3 pb-3 pt-1">
            <div className="rounded-sm border border-accent/30 bg-card p-2">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground">Cotizaciones de proveedores para este concepto</p>
                <div className="flex min-w-[16rem] flex-1 items-center gap-2 md:max-w-md">
                  <span className="shrink-0 text-xs text-muted-foreground">Notas:</span>
                  <Celda valor={pa.notas} onCambio={(v) => set({ notas: v })} placeholder="Especificación a respetar, marca o similar…" className="border border-border" />
                </div>
              </div>
              <OpcionesConcepto pa={pa} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
