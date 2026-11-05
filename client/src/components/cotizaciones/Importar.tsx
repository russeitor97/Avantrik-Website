import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { agrupar, aNumero, dinero, pct, totalizar, type Proyecto } from "@/lib/cotizaciones";
import type { ResultadoExcel } from "@/lib/excel-cotizacion";
import type { PartidaLeida, ResultadoPdf } from "@/lib/pdf-partidas";

export function DialogoExcel({
  resultado, p, onCancelar, onAplicar,
}: {
  resultado: ResultadoExcel;
  p: Proyecto;
  onCancelar: () => void;
  onAplicar: (modo: "reemplazar" | "agregar") => void;
}) {
  // se calcula como si fuera el proyecto, para mostrar totales con su TC y moneda
  const prueba: Proyecto = { ...p, partidas: resultado.partidas, cotizaciones: [] };
  const grupos = agrupar(resultado.partidas);
  const t = totalizar(resultado.partidas, prueba);
  return (
    <Dialog open onOpenChange={(o) => !o && onCancelar()}>
      <DialogContent className="max-w-2xl rounded-sm">
        <DialogHeader>
          <DialogTitle>Importar presupuesto desde Excel</DialogTitle>
          <DialogDescription>
            Encontré {resultado.partidas.length} conceptos en {resultado.hojas.map((h) => `“${h.nombre}” (${h.renglones})`).join(" y ")}.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-sm border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Sistema</th>
                <th className="px-3 py-2 text-right">Conceptos</th>
                <th className="px-3 py-2 text-right">Venta</th>
                <th className="px-3 py-2 text-right">Costo estimado</th>
                <th className="px-3 py-2 text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const tg = totalizar(g.partidas, prueba);
                return (
                  <tr key={g.sistema} className="border-t border-border">
                    <td className="px-3 py-1.5 font-semibold">{g.sistema || "—"}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{g.partidas.length}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{dinero(tg.venta, p.moneda)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{dinero(tg.costo, p.moneda)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{pct(tg.margen)}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border font-bold">
                <td className="px-3 py-1.5">Total</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{t.total}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{dinero(t.venta, p.moneda)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{dinero(t.costo, p.moneda)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{pct(t.margen)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          El proveedor y costo de cada renglón entran como <strong>costo estimado</strong> (referencia). Cuando registres las cotizaciones
          formales de los proveedores y adjudiques una (★), ese precio sustituye al estimado.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancelar} className="rounded-sm">Cancelar</Button>
          {p.partidas.length > 0 && (
            <Button variant="outline" onClick={() => onAplicar("agregar")} className="rounded-sm">
              Agregar al final
            </Button>
          )}
          <Button
            onClick={() => {
              if (p.partidas.length > 0 && !window.confirm(`Esto reemplaza los ${p.partidas.length} conceptos actuales (las cotizaciones ligadas quedarán "sin ligar"). ¿Seguro?`)) return;
              onAplicar("reemplazar");
            }}
            className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
          >
            {p.partidas.length > 0 ? "Reemplazar todo" : `Importar ${t.total} conceptos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FilaImport extends PartidaLeida {
  incluir: boolean;
}

export function DialogoPdf({
  resultado, nombreArchivo, sistemas, onCancelar, onConfirmar,
}: {
  resultado: ResultadoPdf;
  nombreArchivo: string;
  sistemas: string[];
  onCancelar: () => void;
  onConfirmar: (filas: PartidaLeida[], sistema: string, guardarPdf: boolean) => void;
}) {
  const [filas, setFilas] = useState<FilaImport[]>(resultado.partidas.map((x) => ({ ...x, incluir: true })));
  const [guardarPdf, setGuardarPdf] = useState(true);
  const [sistema, setSistema] = useState(sistemas[0] || "General");
  const setFila = (i: number, patch: Partial<FilaImport>) => setFilas((fs) => fs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const elegidas = filas.filter((x) => x.incluir && x.descripcion.trim());
  const total = elegidas.reduce((s, x) => s + x.cantidad * x.precio, 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onCancelar()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-sm">
        <DialogHeader>
          <DialogTitle>Conceptos encontrados en el PDF</DialogTitle>
          <DialogDescription>{nombreArchivo} — revisa y corrige antes de agregarlos. Los precios son los de venta al cliente.</DialogDescription>
        </DialogHeader>
        {filas.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No encontré conceptos con precio en este PDF (puede ser un escaneo). Captúralos en la tabla o sube el Excel.
          </div>
        ) : (
          <>
            {!resultado.conEncabezado && (
              <p className="rounded-sm bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
                No reconocí la tabla del PDF; estos conceptos se adivinaron por renglones con precio. Revísalos con cuidado.
              </p>
            )}
            <div className="space-y-2">
              {filas.map((x, i) => (
                <div key={i} className={cn("grid grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem_7.5rem] items-center gap-2", !x.incluir && "opacity-40")}>
                  <Checkbox checked={x.incluir} onCheckedChange={(v) => setFila(i, { incluir: !!v })} aria-label="Incluir" />
                  <Input value={x.descripcion} onChange={(e) => setFila(i, { descripcion: e.target.value })} aria-label="Concepto" />
                  <Input inputMode="decimal" value={String(x.cantidad)} onChange={(e) => setFila(i, { cantidad: aNumero(e.target.value) })} aria-label="Cantidad" />
                  <Input value={x.unidad} onChange={(e) => setFila(i, { unidad: e.target.value })} aria-label="Unidad" />
                  <Input inputMode="decimal" value={String(x.precio)} onChange={(e) => setFila(i, { precio: aNumero(e.target.value) })} aria-label="Precio unitario" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
              <label className="flex items-center gap-2">
                Sistema:
                <Input list="dl-sistemas-pdf" value={sistema} onChange={(e) => setSistema(e.target.value)} className="h-9 w-48" />
                <datalist id="dl-sistemas-pdf">{sistemas.map((s) => <option key={s} value={s} />)}</datalist>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={guardarPdf} onCheckedChange={(v) => setGuardarPdf(!!v)} /> Guardar el PDF en archivos
              </label>
              <span className="font-heading font-bold">Subtotal {dinero(total, resultado.moneda)}</span>
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} className="rounded-sm">Cancelar</Button>
          <Button
            disabled={elegidas.length === 0}
            onClick={() => onConfirmar(elegidas.map(({ incluir: _i, ...r }) => r), sistema.trim() || "General", guardarPdf)}
            className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
          >
            Agregar {elegidas.length} conceptos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
