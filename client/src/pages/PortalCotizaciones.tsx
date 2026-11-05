import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo } from "@/lib/seo";
import { Link, useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useToast } from "@/hooks/use-toast";
import { getSession, authHeaders, clearSession } from "@/lib/portal-auth";
import { leerPdf, type PartidaLeida, type ResultadoPdf } from "@/lib/pdf-partidas";
import {
  agrupar, analizar, aNumero, coincide, colorMargen, dinero, nuevaCotizacion, nuevaLinea, nuevaPartida, pct, resumenTexto, totalizar,
  type Archivo, type CotizacionProveedor, type Moneda, type Partida, type Proyecto,
} from "@/lib/cotizaciones";
import type { ResultadoExcel } from "@/lib/excel-cotizacion";
import { cn } from "@/lib/utils";
import { Ctx, type ProyectoCtx } from "@/components/cotizaciones/contexto";
import { SelectNativo } from "@/components/cotizaciones/Celda";
import { TablaPresupuesto } from "@/components/cotizaciones/TablaPresupuesto";
import { CotizacionesProveedores } from "@/components/cotizaciones/CotizacionesProveedores";
import { Comparativo } from "@/components/cotizaciones/Comparativo";
import { EditorCotizacion } from "@/components/cotizaciones/EditorCotizacion";
import { DialogoExcel, DialogoPdf } from "@/components/cotizaciones/Importar";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCopy, Download, FileSpreadsheet, FileUp, FolderKanban, Inbox, Loader2, LogOut,
  MessageCircle, Paperclip, Plus, RefreshCcw, Scale, Search, Table2, Trash2, X,
} from "lucide-react";

/* ═════════════════════════ API ═════════════════════════ */

const MAX_ARCHIVO = 4 * 1024 * 1024;
class SesionExpirada extends Error {}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(path, { ...init, headers: { ...(init.headers as Record<string, string>), ...authHeaders() } });
  if (res.status === 401) throw new SesionExpirada();
  return res;
}

async function errorDe(res: Response, fallback: string) {
  const data = await res.json().catch(() => null);
  return new Error(data?.error || fallback);
}

/** Proyectos guardados con versiones anteriores del modelo → forma actual. */
function normalizarProyecto(x: Proyecto): Proyecto {
  return {
    ...x,
    cotizaciones: Array.isArray(x.cotizaciones) ? x.cotizaciones : [],
    archivos: Array.isArray(x.archivos) ? x.archivos : [],
    partidas: (x.partidas || []).map((pa) => ({ ...nuevaPartida(), ...pa, estimado: pa.estimado ?? null, adjudicada: pa.adjudicada ?? "" })),
  };
}

function prepararArchivo(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.size < 1.5 * 1024 * 1024) return Promise.resolve(file);
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 2000 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      const ctx = canvas.getContext("2d");
      if (!ctx) return rej(new Error("Canvas no disponible"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo comprimir"))), "image/jpeg", 0.8);
    };
    img.onerror = () => rej(new Error("No se pudo leer la imagen"));
    img.src = url;
  });
}

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/* ═════════════════════════ Página ═════════════════════════ */

export default function PortalCotizaciones() {
  useSeo({ lang: "es-MX", title: "Cotizaciones | Portal Avantrik", robots: "noindex, nofollow" });
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const abiertoId = new URLSearchParams(search).get("p") || "";
  const session = getSession();

  const [items, setItems] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!session) navigate("/portal");
  }, [session, navigate]);

  function manejarError(err: unknown, msg: string) {
    if (err instanceof SesionExpirada) {
      clearSession();
      navigate("/portal");
      return;
    }
    toast({ title: "Error", description: err instanceof Error && err.message ? err.message : msg, variant: "destructive" });
  }

  async function cargar() {
    setLoading(true);
    try {
      const res = await api("/api/cotizaciones");
      if (!res.ok) throw await errorDe(res, "No se pudieron cargar los proyectos.");
      setItems(((await res.json()).items || []).map(normalizarProyecto));
    } catch (err) {
      manejarError(err, "No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // proveedores de TODOS los proyectos, para autocompletar
  const proveedores = useMemo(
    () =>
      Array.from(
        new Set(items.flatMap((p) => [...p.cotizaciones.map((c) => c.proveedor), ...p.partidas.map((pa) => pa.estimado?.proveedor || "")]).map((s) => s.trim()).filter(Boolean)),
      ).sort(),
    [items],
  );

  const filtrados = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => b.actualizado - a.actualizado)
        .filter(
          (p) =>
            !q.trim() ||
            coincide([p.nombre, p.cliente, p.folio, ...p.partidas.map((pa) => pa.descripcion), ...p.cotizaciones.map((c) => c.proveedor)].join(" "), q),
        ),
    [items, q],
  );

  const abrir = (id: string) => {
    navigate(`/portal/cotizaciones?p=${id}`);
    window.scrollTo({ top: 0 });
  };
  const cerrar = () => {
    navigate("/portal/cotizaciones");
    window.scrollTo({ top: 0 });
  };

  async function crear(nombre: string, cliente: string) {
    try {
      const res = await api("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, cliente, moneda: "MXN", margenObjetivo: 20, partidas: [], cotizaciones: [] }),
      });
      if (!res.ok) throw await errorDe(res, "No se pudo crear el proyecto.");
      const item = normalizarProyecto((await res.json()).item);
      setItems((its) => [item, ...its]);
      setCreando(false);
      abrir(item.id);
    } catch (err) {
      manejarError(err, "No se pudo crear el proyecto.");
    }
  }

  async function eliminar(p: Proyecto) {
    if (!window.confirm(`¿Eliminar el proyecto "${p.nombre}" con su presupuesto, cotizaciones de proveedores y archivos? No se puede deshacer.`)) return;
    try {
      const res = await api(`/api/cotizaciones/${p.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw await errorDe(res, "No se pudo eliminar.");
      setItems((its) => its.filter((i) => i.id !== p.id));
      cerrar();
      toast({ title: "Proyecto eliminado" });
    } catch (err) {
      manejarError(err, "No se pudo eliminar.");
    }
  }

  if (!session) return null;
  const abierto = items.find((i) => i.id === abiertoId);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-ink-gradient pb-8 pt-28 text-primary-foreground">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link href="/portal" className="mb-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-accent hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Portal
              </Link>
              <h1 className="flex items-center gap-3 font-heading text-3xl font-bold text-white md:text-4xl">
                <FolderKanban className="h-8 w-8 text-accent" /> Compras de proyecto
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/60">Presupuesto · cotizaciones de proveedores · comparativo · {session.email}</p>
            </div>
            <div className="flex gap-2">
              {!abiertoId && (
                <Button variant="outline" size="sm" onClick={cargar} className="rounded-sm border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearSession();
                  navigate("/portal");
                }}
                className="rounded-sm border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" /> Salir
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1720px] px-4 py-8">
        <datalist id="dl-proveedores">{proveedores.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="dl-unidades">
          {["Pza", "Ml", "m2", "Kg", "Lote", "Jgo", "Rollo", "Galón", "Bolsa", "Tramo", "Caja", "Servicio", "Hr"].map((u) => <option key={u} value={u} />)}
        </datalist>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-accent-foreground/70" />
            Cargando…
          </div>
        ) : abiertoId ? (
          abierto ? (
            <DetalleProyecto
              key={abierto.id}
              inicial={abierto}
              email={session.email}
              onVolver={cerrar}
              onCambio={(p) => setItems((its) => its.map((i) => (i.id === p.id ? p : i)))}
              onEliminar={() => eliminar(abierto)}
              onError={manejarError}
            />
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
              Este proyecto ya no existe.{" "}
              <button type="button" onClick={cerrar} className="font-semibold text-foreground underline underline-offset-2">
                Volver a la lista
              </button>
            </div>
          )
        ) : (
          <ListaProyectos items={filtrados} hayAlguno={items.length > 0} q={q} setQ={setQ} onAbrir={abrir} onNuevo={() => setCreando(true)} />
        )}
      </section>

      <NuevoProyecto abierto={creando} onCerrar={() => setCreando(false)} onCrear={crear} />
    </Layout>
  );
}

/* ═════════════════════════ Lista de proyectos ═════════════════════════ */

function ListaProyectos({
  items, hayAlguno, q, setQ, onAbrir, onNuevo,
}: {
  items: Proyecto[];
  hayAlguno: boolean;
  q: string;
  setQ: (s: string) => void;
  onAbrir: (id: string) => void;
  onNuevo: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proyecto, cliente, concepto o proveedor…" className="bg-background pl-9" />
        </div>
        <Button onClick={onNuevo} className="h-11 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-14 text-center">
          {hayAlguno ? (
            <p className="text-sm text-muted-foreground">Nada coincide con la búsqueda.</p>
          ) : (
            <>
              <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-accent-foreground/60" />
              <p className="font-heading text-lg font-bold text-foreground">Empieza con tu primer proyecto</p>
              <ol className="mx-auto mt-3 max-w-md space-y-1 text-left text-sm text-muted-foreground">
                <li><strong className="text-foreground">1.</strong> Crea el proyecto y sube el presupuesto (Excel o PDF de la cotización al cliente).</li>
                <li><strong className="text-foreground">2.</strong> Registra las cotizaciones que te manden los proveedores.</li>
                <li><strong className="text-foreground">3.</strong> En el comparativo marca la favorita ★: su precio pasa al costo.</li>
              </ol>
              <Button onClick={onNuevo} className="mt-5 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Proyecto</th>
                <th className="px-3 py-2.5">Estatus</th>
                <th className="px-3 py-2.5">Avance de compras</th>
                <th className="px-3 py-2.5 text-right">Venta</th>
                <th className="px-3 py-2.5 text-right">Costo</th>
                <th className="px-3 py-2.5 text-right">Margen</th>
                <th className="px-4 py-2.5 text-right">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const t = totalizar(p.partidas, p);
                const avance = t.total ? t.porEstatus.Adjudicado / t.total : 0;
                return (
                  <tr key={p.id} onClick={() => onAbrir(p.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-heading font-bold text-foreground">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{[p.cliente, p.folio, `${p.cotizaciones.length} cotizaciones de proveedor`].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", p.estatus === "Comprado" ? "bg-emerald-500/15 text-emerald-800" : "bg-accent/20 text-accent-foreground")}>
                        {p.estatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full bg-emerald-600" style={{ width: `${avance * 100}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.porEstatus.Adjudicado}/{t.total} adjudicados
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{dinero(t.venta, p.moneda)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{dinero(t.costo, p.moneda)}</td>
                    <td className={cn("px-3 py-3 text-right font-bold tabular-nums", colorMargen(t.margen, p.margenObjetivo))}>{pct(t.margen)}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{new Date(p.actualizado).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NuevoProyecto({ abierto, onCerrar, onCrear }: { abierto: boolean; onCerrar: () => void; onCrear: (n: string, c: string) => Promise<void> }) {
  const [nombre, setNombre] = useState("");
  const [cliente, setCliente] = useState("");
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (abierto) {
      setNombre("");
      setCliente("");
    }
  }, [abierto]);
  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="rounded-sm">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>Un proyecto ya confirmado por el cliente, listo para comprar.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!nombre.trim()) return;
            setEnviando(true);
            await onCrear(nombre.trim(), cliente.trim());
            setEnviando(false);
          }}
          className="space-y-3"
        >
          <Input autoFocus placeholder="Nombre del proyecto (ej. SIEQ — HVAC nave 2)" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input placeholder="Cliente (opcional)" value={cliente} onChange={(e) => setCliente(e.target.value)} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar} className="rounded-sm">Cancelar</Button>
            <Button type="submit" disabled={!nombre.trim() || enviando} className="rounded-sm bg-accent font-bold uppercase text-accent-foreground hover:bg-accent/90">
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ═════════════════════════ Detalle de proyecto ═════════════════════════ */

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error" | "conflicto";
const cacheLecturas = new Map<string, ResultadoPdf>();

function DetalleProyecto({
  inicial, email, onVolver, onCambio, onEliminar, onError,
}: {
  inicial: Proyecto;
  email: string;
  onVolver: () => void;
  onCambio: (p: Proyecto) => void;
  onEliminar: () => void;
  onError: (err: unknown, msg: string) => void;
}) {
  const { toast } = useToast();
  const [p, setP] = useState<Proyecto>(inicial);
  const [estado, setEstado] = useState<EstadoGuardado>("guardado");
  const [tab, setTab] = useState("presupuesto");
  const [editor, setEditor] = useState<{ cot: CotizacionProveedor; nueva: boolean } | null>(null);
  const [importPdf, setImportPdf] = useState<{ archivo: File; resultado: ResultadoPdf } | null>(null);
  const [importXls, setImportXls] = useState<ResultadoExcel | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const pRef = useRef(p);
  pRef.current = p;
  const cambios = useRef(0);
  const guardando = useRef(false);

  function cambiar(fn: (x: Proyecto) => Proyecto) {
    cambios.current++;
    setP(fn);
    setEstado((e) => (e === "conflicto" ? e : "pendiente"));
  }

  async function guardar() {
    if (guardando.current) return;
    guardando.current = true;
    setEstado("guardando");
    const n = cambios.current;
    const enviado = pRef.current;
    try {
      const res = await api(`/api/cotizaciones/${enviado.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enviado),
      });
      if (res.status === 409) {
        setEstado("conflicto");
        return;
      }
      if (!res.ok) throw await errorDe(res, "No se pudo guardar.");
      const item: Proyecto = (await res.json()).item;
      setP((cur) => ({ ...cur, version: item.version, archivos: item.archivos, actualizado: item.actualizado }));
      onCambio({ ...pRef.current, version: item.version, archivos: item.archivos, actualizado: item.actualizado });
      setEstado(cambios.current === n ? "guardado" : "pendiente");
    } catch (err) {
      setEstado("error");
      onError(err, "No se pudo guardar.");
    } finally {
      guardando.current = false;
    }
  }

  // Autoguardado 1 s después del último cambio.
  useEffect(() => {
    if (estado !== "pendiente") return;
    const t = setTimeout(guardar, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, estado]);

  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (estado === "pendiente" || estado === "guardando" || estado === "error") e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [estado]);

  async function recargar() {
    try {
      const res = await api(`/api/cotizaciones/${p.id}`);
      if (!res.ok) throw await errorDe(res, "No se pudo recargar.");
      const item = normalizarProyecto((await res.json()).item);
      cambios.current++;
      setP(item);
      onCambio(item);
      setEstado("guardado");
    } catch (err) {
      onError(err, "No se pudo recargar.");
    }
  }

  async function volver() {
    if (estado === "pendiente" || estado === "error") await guardar();
    onVolver();
  }

  const set = (patch: Partial<Proyecto>) => cambiar((x) => ({ ...x, ...patch }));
  const setPartida = (id: string, fn: (pa: Partida) => Partida) =>
    cambiar((x) => ({ ...x, partidas: x.partidas.map((pa) => (pa.id === id ? fn(pa) : pa)) }));

  /* ── Archivos ── */
  async function subirArchivo(f: File, rol: Archivo["rol"]): Promise<Archivo | null> {
    const ok = f.type === "application/pdf" || /^image\/(jpeg|png|webp)$/.test(f.type);
    if (!ok || (f.type === "application/pdf" && f.size > MAX_ARCHIVO)) {
      toast({ title: "Archivo no válido", description: ok ? "El PDF pesa más de 4 MB." : "Sube un PDF o una foto (JPG, PNG).", variant: "destructive" });
      return null;
    }
    setSubiendo(true);
    try {
      const blob = await prepararArchivo(f);
      if (blob.size > MAX_ARCHIVO) throw new Error("El archivo pesa más de 4 MB.");
      const tipo = blob.type || f.type;
      const nombre = tipo === "image/jpeg" && f.type !== "image/jpeg" ? f.name.replace(/\.\w+$/, ".jpg") : f.name;
      const res = await api(`/api/cotizaciones/${p.id}/archivos`, {
        method: "POST",
        headers: { "Content-Type": tipo, "X-File-Name": encodeURIComponent(nombre), "X-File-Rol": rol },
        body: blob,
      });
      if (!res.ok) throw await errorDe(res, "No se pudo subir el archivo.");
      const a: Archivo = (await res.json()).archivo;
      setP((x) => ({ ...x, archivos: [...x.archivos, a] }));
      return a;
    } catch (e) {
      onError(e, "No se pudo subir el archivo.");
      return null;
    } finally {
      setSubiendo(false);
    }
  }

  async function bajar(a: Archivo): Promise<Blob> {
    const res = await api(`/api/cotizaciones/${p.id}/archivos/${a.id}`);
    if (!res.ok) throw await errorDe(res, "No se pudo abrir el archivo.");
    return res.blob();
  }

  async function abrirArchivo(a: Archivo) {
    const w = window.open("", "_blank"); // se abre en el clic para que el navegador no la bloquee
    try {
      const blob = await bajar(a);
      if (w) {
        const url = URL.createObjectURL(blob);
        w.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else descargar(blob, a.nombre);
    } catch (e) {
      w?.close();
      onError(e, "No se pudo abrir el archivo.");
    }
  }

  async function leerPdfArchivo(a: Archivo, file?: File): Promise<ResultadoPdf | null> {
    if (a.tipo !== "application/pdf") return null;
    const c = cacheLecturas.get(a.id);
    if (c) return c;
    try {
      const r = await leerPdf(file || (await bajar(a)));
      cacheLecturas.set(a.id, r);
      return r;
    } catch {
      return null;
    }
  }

  async function quitarArchivo(a: Archivo) {
    if (!window.confirm(`¿Quitar "${a.nombre}"?`)) return;
    try {
      const res = await api(`/api/cotizaciones/${p.id}/archivos/${a.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw await errorDe(res, "No se pudo quitar.");
      setP((x) => ({ ...x, archivos: x.archivos.filter((z) => z.id !== a.id) }));
      if (p.cotizaciones.some((c) => c.archivoId === a.id)) {
        cambiar((x) => ({ ...x, cotizaciones: x.cotizaciones.map((c) => (c.archivoId === a.id ? { ...c, archivoId: "" } : c)) }));
      }
    } catch (e) {
      onError(e, "No se pudo quitar el archivo.");
    }
  }

  /* ── Importar presupuesto ── */
  async function elegirImportacion(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setLeyendo(true);
    try {
      if (/\.xlsx$/i.test(f.name) || f.type.includes("spreadsheet")) {
        const { importarExcel } = await import("@/lib/excel-cotizacion");
        const r = await importarExcel(f, p.moneda);
        if (r.partidas.length === 0) {
          toast({ title: "No encontré la tabla en el Excel", description: "Necesito una fila de encabezados con Concepto, Cantidad y Precio unitario.", variant: "destructive" });
        } else setImportXls(r);
      } else if (f.type === "application/pdf") {
        setImportPdf({ archivo: f, resultado: await leerPdf(f) });
      } else {
        toast({ title: "Formato no soportado", description: "Sube un Excel (.xlsx) o un PDF.", variant: "destructive" });
      }
    } catch {
      toast({ title: "No se pudo leer el archivo", variant: "destructive" });
    } finally {
      setLeyendo(false);
    }
  }

  function aplicarExcel(modo: "reemplazar" | "agregar") {
    if (!importXls) return;
    const nuevas = importXls.partidas;
    cambiar((x) => {
      if (modo === "agregar") return { ...x, partidas: [...x.partidas, ...nuevas] };
      // reemplazar: las líneas de cotizaciones ligadas a conceptos viejos quedan sin ligar
      return { ...x, partidas: nuevas, cotizaciones: x.cotizaciones.map((c) => ({ ...c, lineas: c.lineas.map((l) => ({ ...l, partidaId: "" })) })) };
    });
    setImportXls(null);
    toast({ title: `${nuevas.length} conceptos importados` });
  }

  async function aplicarPdf(filas: PartidaLeida[], sistema: string, guardarPdf: boolean) {
    if (!importPdf) return;
    const nuevas: Partida[] = filas.map((f) => ({
      ...nuevaPartida(sistema),
      descripcion: [f.descripcion, f.modelo].filter(Boolean).join(" — "),
      unidad: f.unidad,
      cantidad: f.cantidad,
      venta: f.precio,
    }));
    cambiar((x) => ({ ...x, partidas: [...x.partidas, ...nuevas] }));
    const archivo = importPdf.archivo;
    setImportPdf(null);
    toast({ title: `${nuevas.length} conceptos agregados` });
    if (guardarPdf) await subirArchivo(archivo, "nuestra");
  }

  async function bajarExcel() {
    try {
      const { exportarExcel } = await import("@/lib/excel-cotizacion");
      descargar(await exportarExcel(p), `${p.nombre.replace(/[\\/:*?"<>|]+/g, "-")}.xlsx`);
    } catch {
      toast({ title: "No se pudo generar el Excel", variant: "destructive" });
    }
  }

  function copiar(texto: string, titulo: string) {
    navigator.clipboard?.writeText(texto).then(
      () => toast({ title: titulo }),
      () => toast({ title: "Error al copiar", variant: "destructive" }),
    );
  }

  const ctx: ProyectoCtx = {
    p,
    email,
    cambiar,
    setPartida,
    adjudicar: (partidaId, lineaId) => setPartida(partidaId, (pa) => ({ ...pa, adjudicada: pa.adjudicada === lineaId ? "" : lineaId })),
    editarCotizacion: (c, partidaIds) => {
      if (c) return setEditor({ cot: c, nueva: false });
      const nueva = nuevaCotizacion(p, email);
      nueva.lineas = (partidaIds || []).map((id) => nuevaLinea(p.partidas.find((pa) => pa.id === id)));
      setEditor({ cot: nueva, nueva: true });
    },
    subirArchivo,
    abrirArchivo,
    leerPdfArchivo,
    subiendo,
  };

  const t = totalizar(p.partidas, p);
  const necesitaTC = p.cotizaciones.some((c) => c.moneda !== p.moneda) || p.partidas.some((pa) => pa.estimado && pa.estimado.moneda !== p.moneda);
  const porDecidir = p.partidas.filter((pa) => analizar(pa, p).estatus === "Por decidir").length;
  const avance = t.total ? t.porEstatus.Adjudicado / t.total : 0;
  const tabCls = "rounded-sm px-4 py-2 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

  return (
    <Ctx.Provider value={ctx}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={volver} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Todos los proyectos
          </button>
          <IndicadorGuardado estado={estado} onReintentar={guardar} />
        </div>

        {estado === "conflicto" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Otra persona guardó cambios en este proyecto. Recarga para ver la versión más reciente (tus últimos cambios no se guardaron).
            </span>
            <Button size="sm" variant="outline" onClick={recargar} className="rounded-sm border-amber-600/50">
              <RefreshCcw className="mr-2 h-4 w-4" /> Recargar
            </Button>
          </div>
        )}

        {/* datos del proyecto */}
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-sm border border-border bg-card p-4">
          <div className="min-w-[16rem] flex-1">
            <input
              value={p.nombre}
              onChange={(e) => set({ nombre: e.target.value })}
              aria-label="Nombre del proyecto"
              className="w-full rounded-sm bg-transparent px-1 font-heading text-2xl font-bold text-foreground outline-none hover:bg-secondary/50 focus:ring-2 focus:ring-accent"
            />
          </div>
          <CampoMini label="Cliente" className="w-48">
            <Input value={p.cliente} onChange={(e) => set({ cliente: e.target.value })} className="h-9" />
          </CampoMini>
          <CampoMini label="Folio cotización" className="w-32">
            <Input value={p.folio} onChange={(e) => set({ folio: e.target.value })} className="h-9" />
          </CampoMini>
          <CampoMini label="Moneda" className="w-24">
            <SelectNativo value={p.moneda} onChange={(v) => set({ moneda: v as Moneda })}>
              <option>MXN</option>
              <option>USD</option>
            </SelectNativo>
          </CampoMini>
          <CampoMini label="TC USD" className="w-24">
            <Input
              inputMode="decimal"
              value={p.tipoCambio ? String(p.tipoCambio) : ""}
              onChange={(e) => set({ tipoCambio: aNumero(e.target.value) })}
              placeholder="18.50"
              className={cn("h-9", necesitaTC && !p.tipoCambio && "border-amber-500 ring-1 ring-amber-500")}
            />
          </CampoMini>
          <CampoMini label="Margen obj. %" className="w-24">
            <Input inputMode="decimal" value={String(p.margenObjetivo)} onChange={(e) => set({ margenObjetivo: aNumero(e.target.value) })} className="h-9" />
          </CampoMini>
          <CampoMini label="Estatus" className="w-32">
            <SelectNativo value={p.estatus} onChange={(v) => set({ estatus: v as Proyecto["estatus"] })}>
              <option>Cotizando</option>
              <option>Comprado</option>
            </SelectNativo>
          </CampoMini>
        </div>
        {necesitaTC && !p.tipoCambio && <p className="-mt-3 text-xs font-semibold text-amber-700">Hay precios en dólares: pon el tipo de cambio para sumarlos.</p>}

        {/* indicadores */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Kpi etiqueta="Venta" valor={dinero(t.venta, p.moneda)} nota="lo cotizado al cliente" />
          <Kpi etiqueta="Costo" valor={dinero(t.costo, p.moneda)} nota={`adjudicado ${dinero(t.costoAdjudicado, p.moneda, 0)}`} />
          <Kpi etiqueta="Utilidad" valor={dinero(t.utilidad, p.moneda)} clase={colorMargen(t.margen, p.margenObjetivo)} nota="de conceptos con costo" />
          <Kpi etiqueta="Margen" valor={pct(t.margen)} clase={colorMargen(t.margen, p.margenObjetivo)} nota={`objetivo ${p.margenObjetivo}%`} />
          <div className="rounded-sm border border-border bg-card px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Avance de compras</div>
            <div className="mt-0.5 font-heading text-xl font-bold tabular-nums">
              {t.porEstatus.Adjudicado}/{t.total} <span className="text-sm font-semibold text-muted-foreground">adjudicados</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-emerald-600 transition-all" style={{ width: `${avance * 100}%` }} />
            </div>
          </div>
        </div>

        {/* acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <label className={cn("inline-flex h-10 cursor-pointer items-center rounded-sm border border-input bg-background px-4 text-sm font-semibold hover:bg-secondary", leyendo && "pointer-events-none opacity-60")}>
            {leyendo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {leyendo ? "Leyendo…" : "Importar presupuesto (Excel o PDF)"}
            <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf" className="hidden" onChange={elegirImportacion} />
          </label>
          <Button variant="outline" onClick={bajarExcel} disabled={p.partidas.length === 0} className="h-10 rounded-sm">
            <Download className="mr-2 h-4 w-4" /> Descargar Excel
          </Button>
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <Button variant="outline" onClick={() => copiar(resumenTexto(p), "Resumen copiado — pégalo en el grupo")} disabled={p.partidas.length === 0} className="h-10 rounded-sm">
              <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar resumen
            </Button>
            <Button asChild className="h-10 rounded-sm bg-[#25D366] font-semibold text-white hover:bg-[#1ebe5b]">
              <a href={`https://wa.me/?text=${encodeURIComponent(resumenTexto(p))}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </div>

        {p.partidas.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            <FileSpreadsheet className="mx-auto mb-3 h-9 w-9 text-accent-foreground/60" />
            Empieza subiendo el <strong className="text-foreground">presupuesto</strong> con “Importar presupuesto”: tu Excel (columnas Sistema, Sección,
            Concepto, Unidad, Cantidad, Precio unitario y, si las tienes, Unidad compra, Cantidad compra, Costo unitario, Proveedor) o el PDF de la cotización al cliente.
            <div className="mt-4">
              <Button variant="outline" onClick={() => cambiar((x) => ({ ...x, partidas: [nuevaPartida("General")] }))} className="rounded-sm">
                <Plus className="mr-2 h-4 w-4" /> O captura a mano
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="h-auto flex-wrap gap-1 rounded-sm bg-secondary/70 p-1">
              <TabsTrigger value="presupuesto" className={tabCls}>
                <Table2 className="mr-2 h-4 w-4" /> Presupuesto
              </TabsTrigger>
              <TabsTrigger value="cotizaciones" className={tabCls}>
                <Inbox className="mr-2 h-4 w-4" /> Cotizaciones de proveedores
                <span className="ml-2 rounded-full bg-background/80 px-1.5 text-[10px] text-foreground">{p.cotizaciones.length}</span>
              </TabsTrigger>
              <TabsTrigger value="comparativo" className={tabCls}>
                <Scale className="mr-2 h-4 w-4" /> Comparativo
                {porDecidir > 0 && <span className="ml-2 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{porDecidir} por decidir</span>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="presupuesto" className="mt-0">
              <TablaPresupuesto />
              <p className="mt-2 text-xs text-muted-foreground">
                Montos sin IVA. Costo en <em>cursiva</em> = estimado (referencia). Con ★ = adjudicado desde la cotización de un proveedor. Abre un
                concepto con › para ver y comparar sus cotizaciones. Las celdas se guardan solas.
              </p>
            </TabsContent>
            <TabsContent value="cotizaciones" className="mt-0">
              <CotizacionesProveedores />
            </TabsContent>
            <TabsContent value="comparativo" className="mt-0">
              <Comparativo />
            </TabsContent>
          </Tabs>
        )}

        {/* archivos y notas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-sm border border-border bg-card p-5">
            <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-foreground">Archivos</h3>
            {p.archivos.length === 0 && <p className="mb-3 text-sm text-muted-foreground">Aún no hay archivos.</p>}
            {(["nuestra", "proveedor"] as const).map((rol) => {
              const lista = p.archivos.filter((a) => a.rol === rol);
              if (!lista.length) return null;
              return (
                <div key={rol} className="mb-3">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{rol === "nuestra" ? "Nuestra cotización al cliente" : "De proveedores"}</p>
                  <ul className="space-y-1">
                    {lista.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 rounded-sm bg-secondary/40 px-3 py-1.5 text-sm">
                        <button type="button" onClick={() => abrirArchivo(a)} className="flex min-w-0 items-center gap-2 text-left hover:underline">
                          <Paperclip className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{a.nombre}</span>
                        </button>
                        <button type="button" onClick={() => quitarArchivo(a)} aria-label={`Quitar ${a.nombre}`} className="shrink-0 text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <label className={cn("inline-flex cursor-pointer items-center rounded-sm border border-dashed border-accent/60 px-3 py-2 text-xs font-semibold hover:bg-accent/10", subiendo && "pointer-events-none opacity-60")}>
              <Paperclip className="mr-1.5 h-3.5 w-3.5" /> Subir nuestra cotización (PDF)
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) subirArchivo(f, "nuestra");
                }}
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">Los PDF de proveedores se suben desde cada cotización de proveedor.</p>
          </div>
          <div className="rounded-sm border border-border bg-card p-5">
            <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-foreground">Notas del proyecto</h3>
            <Textarea rows={6} value={p.notas} onChange={(e) => set({ notas: e.target.value })} placeholder="Fechas de entrega a obra, acuerdos con el cliente, pendientes…" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onEliminar} className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar proyecto
          </Button>
        </div>

        {editor && <EditorCotizacion key={editor.cot.id} inicial={editor.cot} esNueva={editor.nueva} onCerrar={() => setEditor(null)} />}
        {importXls && <DialogoExcel resultado={importXls} p={p} onCancelar={() => setImportXls(null)} onAplicar={aplicarExcel} />}
        {importPdf && (
          <DialogoPdf
            resultado={importPdf.resultado}
            nombreArchivo={importPdf.archivo.name}
            sistemas={agrupar(p.partidas).map((g) => g.sistema).filter(Boolean)}
            onCancelar={() => setImportPdf(null)}
            onConfirmar={aplicarPdf}
          />
        )}
      </div>
    </Ctx.Provider>
  );
}

function IndicadorGuardado({ estado, onReintentar }: { estado: EstadoGuardado; onReintentar: () => void }) {
  if (estado === "guardado")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" /> Guardado
      </span>
    );
  if (estado === "error")
    return (
      <button type="button" onClick={onReintentar} className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive underline">
        <AlertTriangle className="h-4 w-4" /> No se guardó — reintentar
      </button>
    );
  if (estado === "conflicto") return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
    </span>
  );
}

function Kpi({ etiqueta, valor, nota, clase }: { etiqueta: string; valor: string; nota?: string; clase?: string }) {
  return (
    <div className="rounded-sm border border-border bg-card px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{etiqueta}</div>
      <div className={cn("mt-0.5 truncate font-heading text-xl font-bold tabular-nums text-foreground", clase)}>{valor}</div>
      {nota && <div className="text-xs text-muted-foreground">{nota}</div>}
    </div>
  );
}

function CampoMini({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
