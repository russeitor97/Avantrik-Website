import { useMemo, useState } from "react";
import { FileSearch, Loader2, Mail, Paperclip, Plus, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  agrupar, aNumero, dinero, hoy, nid, nuevaLinea, parecido,
  type Archivo, type CotizacionProveedor, type EstatusCotizacion, type LineaCotizacion, type Moneda, type Proyecto,
} from "@/lib/cotizaciones";
import type { ResultadoPdf } from "@/lib/pdf-partidas";
import { Celda, SelectNativo } from "./Celda";
import { useProyecto } from "./contexto";

/**
 * Registrar / editar una cotización de proveedor.
 * Se edita un borrador local y se aplica al proyecto al guardar (así se puede cancelar).
 */
export function EditorCotizacion({
  inicial, esNueva, onCerrar,
}: {
  inicial: CotizacionProveedor;
  esNueva: boolean;
  onCerrar: () => void;
}) {
  const { p, cambiar, subirArchivo, leerPdfArchivo, abrirArchivo, subiendo } = useProyecto();
  const { toast } = useToast();
  const [c, setC] = useState<CotizacionProveedor>(inicial);
  // ★ en el borrador: línea → adjudicar sí/no (se aplica al guardar)
  const [estrellas, setEstrellas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(inicial.lineas.map((l) => [l.id, p.partidas.some((pa) => pa.adjudicada === l.id)])),
  );
  const [leyendo, setLeyendo] = useState(false);
  const set = (patch: Partial<CotizacionProveedor>) => setC((x) => ({ ...x, ...patch }));
  const setLinea = (id: string, patch: Partial<LineaCotizacion>) => setC((x) => ({ ...x, lineas: x.lineas.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  const archivosProv = p.archivos.filter((a) => a.rol === "proveedor");
  const archivo = p.archivos.find((a) => a.id === c.archivoId) || null;
  const grupos = useMemo(() => agrupar(p.partidas), [p.partidas]);
  const total = c.lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const sinLigar = c.lineas.filter((l) => !l.partidaId).length;

  function agregarSistema(sistema: string) {
    const ya = new Set(c.lineas.map((l) => l.partidaId));
    const nuevas = p.partidas.filter((pa) => pa.sistema === sistema && !ya.has(pa.id)).map((pa) => nuevaLinea(pa));
    setC((x) => ({ ...x, lineas: [...x.lineas, ...nuevas] }));
  }

  /** Lee el PDF del proveedor y vuelve sus renglones líneas de esta cotización. */
  async function leerYAgregar(a: Archivo, file?: File) {
    setLeyendo(true);
    try {
      const r = await leerPdfArchivo(a, file);
      if (!r || r.partidas.length === 0) {
        toast({ title: "No encontré precios en el PDF", description: "Captura las líneas a mano." });
        return;
      }
      incorporar(r);
      toast({ title: `${r.partidas.length} renglones leídos del PDF`, description: "Revisa que cada línea esté ligada al concepto correcto." });
    } finally {
      setLeyendo(false);
    }
  }

  function incorporar(r: ResultadoPdf) {
    setC((x) => {
      // Cada renglón del PDF se liga al concepto más parecido del presupuesto (si se parece lo suficiente).
      const usadas = new Set(x.lineas.map((l) => l.partidaId).filter(Boolean));
      const lineas = x.lineas.slice();
      const extra: LineaCotizacion[] = [];
      for (const leido of r.partidas) {
        const texto = `${leido.descripcion} ${leido.modelo}`.trim();
        let mejor = "";
        let puntos = 1;
        for (const pa of p.partidas) {
          const s = parecido(texto, pa.descripcion) - (usadas.has(pa.id) ? 1 : 0);
          if (s > puntos) {
            puntos = s;
            mejor = pa.id;
          }
        }
        // Si ese concepto ya estaba en la solicitud sin precio, se rellena en vez de duplicar.
        const i = mejor ? lineas.findIndex((l) => l.partidaId === mejor && !l.precio) : -1;
        if (i >= 0) {
          lineas[i] = { ...lineas[i], precio: leido.precio, descripcion: texto || lineas[i].descripcion, cantidad: leido.cantidad || lineas[i].cantidad, unidad: leido.unidad || lineas[i].unidad };
        } else {
          extra.push({ id: nid(), partidaId: mejor, descripcion: texto, unidad: leido.unidad, cantidad: leido.cantidad, precio: leido.precio });
        }
        if (mejor) usadas.add(mejor);
      }
      return { ...x, moneda: r.moneda, lineas: [...lineas, ...extra] };
    });
  }

  async function subirPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const a = await subirArchivo(f, "proveedor");
    if (!a) return;
    set({ archivoId: a.id });
    if (a.tipo === "application/pdf") await leerYAgregar(a, f);
  }

  function guardar() {
    if (!c.proveedor.trim()) {
      toast({ title: "Falta el proveedor", variant: "destructive" });
      return;
    }
    let final = { ...c, proveedor: c.proveedor.trim() };
    // Si ya trae precios, la solicitud pasó a "Recibida".
    if (final.estatus === "Solicitada" && final.lineas.some((l) => l.precio > 0)) {
      final = { ...final, estatus: "Recibida", fechaRecepcion: final.fechaRecepcion || hoy() };
    }
    cambiar((x) => {
      const existe = x.cotizaciones.some((z) => z.id === final.id);
      const cotizaciones = existe ? x.cotizaciones.map((z) => (z.id === final.id ? final : z)) : [...x.cotizaciones, final];
      const ids = new Set(final.lineas.map((l) => l.id));
      const partidas = x.partidas.map((pa) => {
        // quitar adjudicaciones a líneas borradas, des-estrelladas o re-ligadas a otro concepto
        let adj = pa.adjudicada;
        const lineaAdj = final.lineas.find((l) => l.id === adj);
        if ((adj && !ids.has(adj) && inicial.lineas.some((l) => l.id === adj)) || (lineaAdj && (!estrellas[adj] || lineaAdj.partidaId !== pa.id))) adj = "";
        const estrellada = final.lineas.find((l) => l.partidaId === pa.id && estrellas[l.id] && l.precio > 0);
        if (estrellada) adj = estrellada.id;
        return adj === pa.adjudicada ? pa : { ...pa, adjudicada: adj };
      });
      return { ...x, cotizaciones, partidas };
    });
    onCerrar();
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar la cotización ${c.folio} de ${c.proveedor || "este proveedor"}? Si tenía conceptos adjudicados, regresan a su costo estimado.`)) return;
    const ids = new Set(inicial.lineas.map((l) => l.id));
    cambiar((x) => ({
      ...x,
      cotizaciones: x.cotizaciones.filter((z) => z.id !== c.id),
      partidas: x.partidas.map((pa) => (ids.has(pa.adjudicada) ? { ...pa, adjudicada: "" } : pa)),
    }));
    onCerrar();
  }

  const correo = useMemo(() => solicitudCorreo(p, c), [p, c]);

  return (
    <Dialog open onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-base text-muted-foreground">{c.folio}</span>
            {esNueva ? "Registrar cotización de proveedor" : c.proveedor || "Cotización de proveedor"}
          </DialogTitle>
          <DialogDescription>
            Registra lo que te mandó el proveedor. Liga cada línea al concepto del presupuesto y marca ★ en la que quieras adjudicar.
          </DialogDescription>
        </DialogHeader>

        {/* datos del documento */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Campo label="Proveedor *" className="col-span-2">
            <Input autoFocus={esNueva} list="dl-proveedores" value={c.proveedor} onChange={(e) => set({ proveedor: e.target.value })} placeholder="Ej. Climaproyectos" />
          </Campo>
          <Campo label="Contacto">
            <Input value={c.contacto} onChange={(e) => set({ contacto: e.target.value })} />
          </Campo>
          <Campo label="Correo">
            <Input type="email" value={c.correo} onChange={(e) => set({ correo: e.target.value })} />
          </Campo>
          <Campo label="Teléfono">
            <Input type="tel" value={c.telefono} onChange={(e) => set({ telefono: e.target.value })} />
          </Campo>
          <Campo label="Folio del proveedor">
            <Input value={c.folioProveedor} onChange={(e) => set({ folioProveedor: e.target.value })} />
          </Campo>
          <Campo label="Estatus">
            <SelectNativo value={c.estatus} onChange={(v) => set({ estatus: v as EstatusCotizacion, fechaRecepcion: v === "Recibida" && !c.fechaRecepcion ? hoy() : c.fechaRecepcion })}>
              <option value="Solicitada">Solicitada (esperando)</option>
              <option value="Recibida">Recibida</option>
              <option value="Descartada">Descartada</option>
            </SelectNativo>
          </Campo>
          <Campo label="Se solicitó">
            <Input type="date" value={c.fechaSolicitud} onChange={(e) => set({ fechaSolicitud: e.target.value })} />
          </Campo>
          <Campo label="Se recibió">
            <Input type="date" value={c.fechaRecepcion} onChange={(e) => set({ fechaRecepcion: e.target.value })} />
          </Campo>
          <Campo label="Vigente hasta">
            <Input type="date" value={c.vigencia} onChange={(e) => set({ vigencia: e.target.value })} />
          </Campo>
          <Campo label="Tiempo de entrega">
            <Input value={c.entrega} onChange={(e) => set({ entrega: e.target.value })} placeholder="Ej. 14 semanas" />
          </Campo>
          <Campo label="Moneda">
            <SelectNativo value={c.moneda} onChange={(v) => set({ moneda: v as Moneda })}>
              <option>MXN</option>
              <option>USD</option>
            </SelectNativo>
          </Campo>
          <Campo label="Condiciones de pago" className="col-span-2">
            <Input value={c.condiciones} onChange={(e) => set({ condiciones: e.target.value })} placeholder="Ej. 50% anticipo, LAB bodega" />
          </Campo>
          <Campo label="PDF de la cotización" className="col-span-2 lg:col-span-4">
            <div className="flex items-center gap-2">
              <SelectNativo value={c.archivoId} onChange={(v) => set({ archivoId: v })} className="min-w-0 flex-1">
                <option value="">Sin PDF</option>
                {archivosProv.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </SelectNativo>
              <label className={cn("inline-flex h-9 shrink-0 cursor-pointer items-center rounded-md border border-dashed border-accent/60 px-3 text-xs font-semibold hover:bg-accent/10", subiendo && "pointer-events-none opacity-60")}>
                {subiendo ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Paperclip className="mr-1.5 h-4 w-4" />} Subir
                <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={subirPdf} />
              </label>
              {archivo && (
                <>
                  <Button type="button" size="sm" variant="outline" onClick={() => abrirArchivo(archivo)} className="h-9 shrink-0 rounded-md">Ver</Button>
                  {archivo.tipo === "application/pdf" && (
                    <Button type="button" size="sm" variant="outline" disabled={leyendo} onClick={() => leerYAgregar(archivo)} className="h-9 shrink-0 rounded-md">
                      {leyendo ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileSearch className="mr-1.5 h-4 w-4" />} Leer precios del PDF
                    </Button>
                  )}
                </>
              )}
            </div>
          </Campo>
        </div>

        {/* líneas */}
        <div className="rounded-sm border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wider">Lo que cotiza ({c.lineas.length})</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Agregar todos los conceptos de:</span>
              <SelectNativo value="" onChange={(v) => v && agregarSistema(v)} className="h-8 w-48 text-xs">
                <option value="">— sistema —</option>
                {grupos.map((g) => <option key={g.sistema} value={g.sistema}>{g.sistema || "Sin sistema"} ({g.partidas.length})</option>)}
              </SelectNativo>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="min-w-[16rem] px-2 py-1.5">Concepto del presupuesto</th>
                  <th className="min-w-[12rem] px-2 py-1.5">Descripción del proveedor</th>
                  <th className="w-16 px-2 py-1.5">Unidad</th>
                  <th className="w-20 px-2 py-1.5 text-right">Cant.</th>
                  <th className="w-28 px-2 py-1.5 text-right">P.U. ({c.moneda})</th>
                  <th className="w-28 px-2 py-1.5 text-right">Importe</th>
                  <th className="w-10 px-1 py-1.5 text-center" title="Adjudicar">★</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {c.lineas.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 align-top">
                    <td className="px-1 py-1">
                      <SelectNativo
                        value={l.partidaId}
                        onChange={(v) => {
                          const pa = p.partidas.find((z) => z.id === v);
                          setLinea(l.id, { partidaId: v, ...(pa && !l.descripcion ? { descripcion: pa.descripcion } : {}) });
                        }}
                        className={cn("h-8 text-xs", !l.partidaId && "border-amber-500 text-amber-800")}
                        ariaLabel="Concepto del presupuesto"
                      >
                        <option value="">⚠ Sin ligar a un concepto</option>
                        {grupos.map((g) => (
                          <optgroup key={g.sistema} label={g.sistema || "Sin sistema"}>
                            {g.partidas.map((pa) => (
                              <option key={pa.id} value={pa.id}>
                                {pa.descripcion.slice(0, 80) || "(sin descripción)"} — {pa.cantidad} {pa.unidad}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </SelectNativo>
                    </td>
                    <td className="py-0.5"><Celda valor={l.descripcion} onCambio={(v) => setLinea(l.id, { descripcion: v })} multilinea placeholder="Modelo, marca…" /></td>
                    <td className="py-0.5"><Celda valor={l.unidad} onCambio={(v) => setLinea(l.id, { unidad: v })} list="dl-unidades" ariaLabel="Unidad" /></td>
                    <td className="py-0.5"><Celda tipo="numero" valor={l.cantidad} onCambio={(v) => setLinea(l.id, { cantidad: aNumero(v) })} ariaLabel="Cantidad" /></td>
                    <td className="py-0.5"><Celda tipo="dinero" moneda={c.moneda} valor={l.precio} onCambio={(v) => setLinea(l.id, { precio: aNumero(v) })} ariaLabel="Precio unitario" placeholder="Pendiente" /></td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{l.precio ? dinero(l.precio * l.cantidad, c.moneda) : <span className="text-xs text-muted-foreground">pendiente</span>}</td>
                    <td className="px-1 py-1 text-center">
                      <button
                        type="button"
                        disabled={!l.partidaId || !l.precio}
                        onClick={() =>
                          setEstrellas((s) => {
                            const n = { ...s, [l.id]: !s[l.id] };
                            // una sola ★ por concepto dentro de esta cotización
                            if (n[l.id]) c.lineas.forEach((o) => o.id !== l.id && o.partidaId === l.partidaId && (n[o.id] = false));
                            return n;
                          })
                        }
                        title={!l.partidaId ? "Primero liga la línea a un concepto" : !l.precio ? "Captura el precio" : "Adjudicar"}
                        className={cn("rounded-full p-1 disabled:opacity-30", estrellas[l.id] ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")}
                      >
                        <Star className={cn("h-4 w-4", estrellas[l.id] && "fill-current")} />
                      </button>
                    </td>
                    <td className="px-1 py-1">
                      <button type="button" onClick={() => setC((x) => ({ ...x, lineas: x.lineas.filter((z) => z.id !== l.id) }))} title="Quitar línea" className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {c.lineas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-sm text-muted-foreground">
                      Agrega las líneas: una por cada concepto que te cotiza. Si estás pidiendo cotización, deja el precio vacío y regístrala como “Solicitada”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setC((x) => ({ ...x, lineas: [...x.lineas, nuevaLinea()] }))} className="rounded-sm font-semibold">
              <Plus className="mr-1.5 h-4 w-4" /> Agregar línea
            </Button>
            <div className="text-sm">
              {sinLigar > 0 && <span className="mr-4 text-xs font-semibold text-amber-700">{sinLigar} línea(s) sin ligar</span>}
              <span className="font-heading font-bold">Total {dinero(total, c.moneda)}</span> <span className="text-xs text-muted-foreground">sin IVA</span>
            </div>
          </div>
        </div>

        <Campo label="Notas">
          <Textarea rows={2} value={c.notas} onChange={(e) => set({ notas: e.target.value })} placeholder="Flete, maniobras, garantía, observaciones…" />
        </Campo>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2">
            {!esNueva && (
              <Button type="button" variant="outline" onClick={eliminar} className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
            )}
            <Button type="button" variant="outline" asChild className="rounded-sm" disabled={c.lineas.length === 0}>
              <a href={correo} title="Abre tu correo con la solicitud de cotización ya redactada">
                <Mail className="mr-2 h-4 w-4" /> Solicitar por correo
              </a>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCerrar} className="rounded-sm">Cancelar</Button>
            <Button type="button" onClick={guardar} className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
              Guardar cotización
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** mailto: con la solicitud de cotización redactada (conceptos y cantidades). */
function solicitudCorreo(p: Proyecto, c: CotizacionProveedor): string {
  const lineas = c.lineas.map((l, i) => {
    const pa = p.partidas.find((z) => z.id === l.partidaId);
    const desc = pa?.descripcion || l.descripcion;
    const espec = pa?.notas ? ` (${pa.notas})` : "";
    return `${i + 1}. ${l.cantidad} ${l.unidad} — ${desc}${espec}`;
  });
  const cuerpo = [
    `Buen día${c.contacto ? ` ${c.contacto}` : ""},`,
    "",
    `Por medio del presente le solicitamos cotización de los siguientes materiales/equipos para el proyecto ${p.nombre}:`,
    "",
    ...lineas,
    "",
    "Le agradeceremos indicar precio unitario sin IVA, tiempo de entrega, vigencia de la cotización y condiciones de pago.",
    "",
    "Saludos cordiales,",
    "Avantrik",
  ].join("\n");
  const asunto = `Solicitud de cotización — ${p.nombre} (${c.folio})`;
  return `mailto:${encodeURIComponent(c.correo)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
