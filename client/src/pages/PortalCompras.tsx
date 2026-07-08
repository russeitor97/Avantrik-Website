import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useToast } from "@/hooks/use-toast";
import { getSession, authHeaders, clearSession } from "@/lib/portal-auth";
import { ArrowLeft, ClipboardCopy, Loader2, LogOut, RefreshCcw, Trash2, X, PencilLine, Receipt } from "lucide-react";

/* ── Tipos (mismo esquema de datos que la app original) ── */
interface Compra {
  key: string;
  estado: "pendiente" | "confirmada";
  responsable?: string;
  proyecto?: string;
  imagen?: string;
  creado?: number;
  fecha?: string;
  concepto?: string;
  monto?: number;
  justificacion?: string;
  fechaPago?: string;
  estatus?: string;
  factura?: string;
}

interface Draft {
  fecha: string;
  monto: string;
  concepto: string;
  justificacion: string;
  factura: string;
}

const todayInput = () => new Date().toISOString().slice(0, 10);

/** Igual que la app original: ISO → M/D/YYYY para pegar en Excel. */
function isoToExcel(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }
  const p = iso.slice(0, 10).split("-");
  return `${parseInt(p[1], 10)}/${parseInt(p[2], 10)}/${p[0]}`;
}

export default function PortalCompras() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [items, setItems] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPO, setFiltroPO] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [fotoGrande, setFotoGrande] = useState<string | null>(null);

  const session = getSession();

  /* Guard: sin sesión → al login */
  useEffect(() => {
    if (!session) navigate("/portal");
  }, [session, navigate]);

  async function cargar() {
    setLoading(true);
    try {
      const res = await fetch("/api/compras", { headers: authHeaders() });
      if (res.status === 401) {
        clearSession();
        navigate("/portal");
        return;
      }
      const data = await res.json();
      const list: Compra[] = (data.items || []).sort(
        (a: Compra, b: Compra) => (b.creado || 0) - (a.creado || 0),
      );
      setItems(list);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las compras.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendientes = items.filter((i) => i.estado === "pendiente");
  const confirmadas = items.filter((i) => i.estado === "confirmada");

  const proyectos = useMemo(() => {
    const set = new Set<string>();
    confirmadas.forEach((i) => i.proyecto && set.add(i.proyecto));
    return Array.from(set);
  }, [confirmadas]);

  const confFiltradas = filtroPO ? confirmadas.filter((i) => i.proyecto === filtroPO) : confirmadas;
  const total = confFiltradas.reduce((s, i) => s + (Number(i.monto) || 0), 0);

  function abrirCaptura(key: string) {
    setDrafts((d) => ({
      ...d,
      [key]: d[key] || { fecha: todayInput(), monto: "", concepto: "", justificacion: "", factura: "" },
    }));
  }

  function setDraft(key: string, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
  }

  async function confirmar(item: Compra) {
    const d = drafts[item.key];
    if (!d?.fecha || !d?.monto || !d?.concepto) {
      toast({ title: "Faltan datos", description: "Fecha, monto y concepto son obligatorios.", variant: "destructive" });
      return;
    }
    setBusy((b) => ({ ...b, [item.key]: true }));
    try {
      const res = await fetch(`/api/compras/${encodeURIComponent(item.key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          fecha: isoToExcel(d.fecha),
          monto: parseFloat(d.monto) || 0,
          concepto: d.concepto,
          justificacion: d.justificacion,
          factura: d.factura,
          proyecto: item.proyecto || "",
          fechaPago: isoToExcel(d.fecha),
        }),
      });
      if (!res.ok) throw new Error();
      setDrafts(({ [item.key]: _omit, ...rest }) => rest);
      toast({ title: "Compra confirmada", description: "Registrada como Pagada." });
      cargar();
    } catch {
      toast({ title: "Error", description: "No se pudo guardar. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setBusy((b) => ({ ...b, [item.key]: false }));
    }
  }

  async function eliminar(key: string, msg: string) {
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const res = await fetch(`/api/compras/${encodeURIComponent(key)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) throw new Error();
      setItems((its) => its.filter((i) => i.key !== key));
      toast({ title: msg });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  /** Mismo TSV que la app original (sin encabezados, para la columna B de Compras). */
  function copiarCSV() {
    if (confFiltradas.length === 0) {
      toast({ title: "No hay compras confirmadas para copiar" });
      return;
    }
    const rows = confFiltradas
      .slice()
      .reverse()
      .map((i) =>
        [i.fecha, i.concepto, i.monto, i.proyecto, i.justificacion, i.responsable, i.fechaPago, i.estatus, i.factura].join("\t"),
      );
    const tsv = rows.join("\n");
    navigator.clipboard?.writeText(tsv).then(
      () => toast({ title: "CSV copiado", description: "Pégalo en Compras, columna B." }),
      () => toast({ title: "Error al copiar", variant: "destructive" }),
    );
  }

  if (!session) return null;

  return (
    <Layout>
      <Helmet>
        <title>Registro de Compras | Portal Avantrik</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header band */}
      <section className="relative overflow-hidden bg-ink-gradient pb-10 pt-28 text-primary-foreground">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link
                href="/portal"
                className="mb-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-accent hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Portal
              </Link>
              <h1 className="flex items-center gap-3 font-heading text-3xl font-bold text-white md:text-4xl">
                <Receipt className="h-8 w-8 text-accent" /> Registro de Compras
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/60">
                Panel de administración · {session.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cargar}
                className="rounded-sm border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { clearSession(); navigate("/portal"); }}
                className="rounded-sm border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" /> Salir
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-10">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-accent" />
            Cargando…
          </div>
        ) : (
          <>
            {/* ───── Pendientes ───── */}
            <h2 className="mb-4 font-heading text-xl font-bold text-foreground">
              Pendientes de procesar{" "}
              <span className="text-accent">({pendientes.length})</span>
            </h2>

            {pendientes.length === 0 ? (
              <div className="mb-10 rounded-sm border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
                No hay tickets pendientes. Los que suba el equipo en{" "}
                <span className="font-semibold text-foreground">/subir-ticket</span> aparecerán aquí.
              </div>
            ) : (
              <div className="mb-10 space-y-4">
                {pendientes.map((item) => {
                  const d = drafts[item.key];
                  return (
                    <div key={item.key} className="rounded-sm border border-accent/40 bg-card p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        {item.imagen && (
                          <button
                            type="button"
                            onClick={() => setFotoGrande(item.imagen!)}
                            className="shrink-0 overflow-hidden rounded-sm border border-border transition-transform hover:scale-105"
                            title="Ver foto completa"
                          >
                            <img src={item.imagen} alt="Ticket" className="h-16 w-16 object-cover" />
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-heading font-bold text-foreground">{item.responsable || "Sin nombre"}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.proyecto ? `${item.proyecto} · ` : ""}
                            {item.creado ? new Date(item.creado).toLocaleDateString("es-MX") : ""}
                          </p>
                        </div>
                        {!d && (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              onClick={() => abrirCaptura(item.key)}
                              className="rounded-sm bg-primary font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
                            >
                              <PencilLine className="mr-2 h-4 w-4" /> Capturar datos
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy[item.key]}
                              onClick={() => eliminar(item.key, "Ticket descartado")}
                              className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10"
                            >
                              Descartar
                            </Button>
                          </div>
                        )}
                      </div>

                      {d && (
                        <div className="mt-5 border-t border-border pt-5">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label>Fecha</Label>
                              <Input type="date" value={d.fecha} onChange={(e) => setDraft(item.key, { fecha: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Monto</Label>
                              <Input type="number" step="0.01" placeholder="0.00" value={d.monto} onChange={(e) => setDraft(item.key, { monto: e.target.value })} />
                            </div>
                          </div>
                          <div className="mt-4 space-y-1.5">
                            <Label>Concepto (proveedor)</Label>
                            <Input placeholder="Ej. Home Depot" value={d.concepto} onChange={(e) => setDraft(item.key, { concepto: e.target.value })} />
                          </div>
                          <div className="mt-4 space-y-1.5">
                            <Label>Justificación (qué se compró)</Label>
                            <Textarea rows={2} value={d.justificacion} onChange={(e) => setDraft(item.key, { justificacion: e.target.value })} />
                          </div>
                          <div className="mt-4 space-y-1.5">
                            <Label>Factura / Folio</Label>
                            <Input placeholder="Opcional" value={d.factura} onChange={(e) => setDraft(item.key, { factura: e.target.value })} />
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
                            Estatus se guarda como <strong>Pagada</strong> y Fecha pago = misma fecha.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={busy[item.key]}
                              onClick={() => confirmar(item)}
                              className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
                            >
                              {busy[item.key] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Confirmar y guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDrafts(({ [item.key]: _omit, ...rest }) => rest)}
                              className="rounded-sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ───── Confirmadas ───── */}
            <h2 className="mb-4 font-heading text-xl font-bold text-foreground">Compras registradas</h2>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="w-full sm:w-56">
                <Select value={filtroPO || "__all__"} onValueChange={(v) => setFiltroPO(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Todas las PO" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las PO</SelectItem>
                    {proyectos.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={copiarCSV}
                variant="outline"
                className="rounded-sm border-primary font-bold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar CSV
              </Button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-sm border border-border bg-card p-5">
                <div className="font-heading text-2xl font-bold text-foreground">
                  ${total.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Total</div>
              </div>
              <div className="rounded-sm border border-border bg-card p-5">
                <div className="font-heading text-2xl font-bold text-foreground">{confFiltradas.length}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Registros</div>
              </div>
            </div>

            {confFiltradas.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
                {pendientes.length > 0
                  ? "Sin compras confirmadas todavía — procesa los pendientes de arriba."
                  : "Aún no hay compras registradas."}
              </div>
            ) : (
              <div className="space-y-3">
                {confFiltradas.map((i) => (
                  <div key={i.key} className="relative rounded-sm border border-border bg-card p-4 pr-12 transition-colors hover:border-accent/40">
                    <button
                      type="button"
                      title="Eliminar"
                      disabled={busy[i.key]}
                      onClick={() => eliminar(i.key, "Registro eliminado")}
                      className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-heading font-bold text-foreground">{i.concepto || "Sin concepto"}</p>
                      <p className="whitespace-nowrap font-heading font-bold text-primary">
                        ${(Number(i.monto) || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {i.fecha}
                      {i.factura ? ` · Folio ${i.factura}` : ""}
                      {i.proyecto ? ` · ${i.proyecto}` : ""}
                      {i.responsable ? ` · ${i.responsable}` : ""}
                    </p>
                    {i.justificacion && <p className="mt-0.5 text-sm text-muted-foreground">{i.justificacion}</p>}
                    <span className="mt-2 inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent-foreground/80">
                      {i.estatus}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              El CSV no lleva encabezados: pégalo directo debajo del último registro en la columna B de la hoja Compras.
            </p>
          </>
        )}
      </section>

      {/* Visor de foto */}
      {fotoGrande && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-6 backdrop-blur-sm"
          onClick={() => setFotoGrande(null)}
          role="dialog"
          aria-label="Foto del ticket"
        >
          <button
            type="button"
            className="absolute right-5 top-5 text-white/70 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-7 w-7" />
          </button>
          <img src={fotoGrande} alt="Ticket" className="max-h-full max-w-full rounded-sm shadow-2xl" />
        </div>
      )}
    </Layout>
  );
}
