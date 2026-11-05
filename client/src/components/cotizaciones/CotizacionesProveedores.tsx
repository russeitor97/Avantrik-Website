import { useMemo, useState } from "react";
import { Mail, Paperclip, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { coincide, diasDesde, dinero, estatusVisible, fechaCorta, totalCotizacion, type CotizacionProveedor } from "@/lib/cotizaciones";
import { SelectNativo } from "./Celda";
import { ChipCotizacion, useProyecto } from "./contexto";

/** La base de datos de cotizaciones de proveedores del proyecto. */
export function CotizacionesProveedores() {
  const { p, editarCotizacion, abrirArchivo } = useProyecto();
  const [q, setQ] = useState("");
  const [fEstatus, setFEstatus] = useState("");

  const lista = useMemo(
    () =>
      p.cotizaciones
        .slice()
        .sort((a, b) => b.creado - a.creado)
        .filter((c) => (!fEstatus || c.estatus === fEstatus) && (!q.trim() || coincide(`${c.folio} ${c.proveedor} ${c.contacto} ${c.folioProveedor} ${c.lineas.map((l) => l.descripcion).join(" ")}`, q))),
    [p.cotizaciones, q, fEstatus],
  );
  const sinRespuesta = p.cotizaciones.filter((c) => c.estatus === "Solicitada" && (diasDesde(c.fechaSolicitud) ?? 0) >= 3);

  const th = "border-b border-border bg-secondary px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => editarCotizacion(null)} className="h-9 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" /> Registrar cotización
        </Button>
        <div className="relative min-w-[14rem] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proveedor, folio o material…" className="h-9 bg-background pl-9" />
        </div>
        <div className="w-44">
          <SelectNativo value={fEstatus} onChange={setFEstatus} ariaLabel="Filtrar por estatus">
            <option value="">Todas</option>
            <option value="Solicitada">Solicitadas</option>
            <option value="Recibida">Recibidas</option>
            <option value="Descartada">Descartadas</option>
          </SelectNativo>
        </div>
      </div>

      {sinRespuesta.length > 0 && (
        <p className="flex items-center gap-2 rounded-sm bg-amber-500/10 px-3 py-2 text-sm text-amber-900">
          <Mail className="h-4 w-4" />
          {sinRespuesta.length === 1 ? "1 solicitud lleva" : `${sinRespuesta.length} solicitudes llevan`} 3 días o más sin respuesta:{" "}
          {sinRespuesta.map((c) => c.proveedor || c.folio).join(", ")}. Vale la pena darles seguimiento.
        </p>
      )}

      {p.cotizaciones.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          Aquí se guardan las cotizaciones que te mandan los proveedores (o las que pediste y estás esperando).
          <br />
          Registra cada una con su PDF, folio, vigencia y entrega; después elige la mejor en el <strong className="text-foreground">Comparativo</strong>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr>
                <th className={th}>Folio</th>
                <th className={th}>Proveedor</th>
                <th className={th}>Estatus</th>
                <th className={th}>Solicitada</th>
                <th className={th}>Recibida</th>
                <th className={th}>Vigencia</th>
                <th className={th}>Entrega</th>
                <th className={cn(th, "text-right")}>Conceptos</th>
                <th className={cn(th, "text-right")}>Importe</th>
                <th className={cn(th, "w-10")} />
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <Fila key={c.id} c={c} onAbrir={() => editarCotizacion(c)} onPdf={() => {
                  const a = p.archivos.find((z) => z.id === c.archivoId);
                  if (a) abrirArchivo(a);
                }} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Fila({ c, onAbrir, onPdf }: { c: CotizacionProveedor; onAbrir: () => void; onPdf: () => void }) {
  const { p } = useProyecto();
  const ev = estatusVisible(c, p);
  const ligadas = c.lineas.filter((l) => l.partidaId).length;
  const conPrecio = c.lineas.filter((l) => l.precio > 0).length;
  const td = "border-b border-border px-3 py-2.5";
  return (
    <tr onClick={onAbrir} className={cn("cursor-pointer hover:bg-secondary/40", c.estatus === "Descartada" && "opacity-60")}>
      <td className={cn(td, "font-mono text-xs font-bold")}>{c.folio}</td>
      <td className={td}>
        <p className="font-semibold text-foreground">{c.proveedor || "—"}</p>
        <p className="text-xs text-muted-foreground">{[c.contacto, c.folioProveedor && `Folio ${c.folioProveedor}`].filter(Boolean).join(" · ")}</p>
      </td>
      <td className={td}><ChipCotizacion {...ev} /></td>
      <td className={cn(td, "text-xs text-muted-foreground")}>{fechaCorta(c.fechaSolicitud) || "—"}</td>
      <td className={cn(td, "text-xs text-muted-foreground")}>{fechaCorta(c.fechaRecepcion) || "—"}</td>
      <td className={cn(td, "text-xs", ev.texto === "Vencida" ? "font-semibold text-destructive" : "text-muted-foreground")}>{fechaCorta(c.vigencia) || "—"}</td>
      <td className={cn(td, "text-xs")}>{c.entrega || "—"}</td>
      <td className={cn(td, "text-right text-xs tabular-nums")}>
        {c.lineas.length}
        {ligadas < c.lineas.length && <span className="block text-amber-700">{c.lineas.length - ligadas} sin ligar</span>}
        {c.estatus !== "Solicitada" && conPrecio < c.lineas.length && <span className="block text-muted-foreground">{c.lineas.length - conPrecio} sin precio</span>}
      </td>
      <td className={cn(td, "text-right font-semibold tabular-nums")}>{totalCotizacion(c) ? dinero(totalCotizacion(c), c.moneda) : "—"}</td>
      <td className={td}>
        {c.archivoId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPdf();
            }}
            title="Ver PDF"
            className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
