import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSeo } from "@/lib/seo";
import { Link, useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useToast } from "@/hooks/use-toast";
import { getSession, authHeaders, clearSession } from "@/lib/portal-auth";
import { leerPdf, type PartidaLeida, type ResultadoPdf } from "@/lib/pdf-partidas";
import {
  agrupar, analizar, aNumero, coincide, colorMargen, costoTotal, dinero, nid, normalizar, nuevaOferta, nuevaPartida,
  ofertaValida, pct, resumenTexto, totalizar,
  type Archivo, type Moneda, type Oferta, type Partida, type Proyecto,
} from "@/lib/cotizaciones";
import type { ResultadoExcel } from "@/lib/excel-cotizacion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardCopy, Copy, Download, FileSpreadsheet,
  FileUp, FolderKanban, Loader2, LogOut, MessageCircle, Paperclip, Plus, RefreshCcw, Search, Trash2, X,
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

function validarArchivo(f: File): string | null {
  const ok = f.type === "application/pdf" || /^image\/(jpeg|png|webp)$/.test(f.type);
  if (!ok) return "Sube un PDF o una foto (JPG, PNG).";
  if (f.type === "application/pdf" && f.size > MAX_ARCHIVO) return "El PDF pesa más de 4 MB.";
  return null;
}

async function subirArchivo(proyectoId: string, f: File, rol: Archivo["rol"]): Promise<Archivo> {
  const blob = await prepararArchivo(f);
  if (blob.size > MAX_ARCHIVO) throw new Error("El archivo pesa más de 4 MB.");
  const tipo = blob.type || f.type;
  const nombre = tipo === "image/jpeg" && f.type !== "image/jpeg" ? f.name.replace(/\.\w+$/, ".jpg") : f.name;
  const res = await api(`/api/cotizaciones/${proyectoId}/archivos`, {
    method: "POST",
    headers: { "Content-Type": tipo, "X-File-Name": encodeURIComponent(nombre), "X-File-Rol": rol },
    body: blob,
  });
  if (!res.ok) throw await errorDe(res, "No se pudo subir el archivo.");
  return (await res.json()).archivo;
}

async function bajarArchivo(proyectoId: string, a: Archivo): Promise<Blob> {
  const res = await api(`/api/cotizaciones/${proyectoId}/archivos/${a.id}`);
  if (!res.ok) throw await errorDe(res, "No se pudo abrir el archivo.");
  return res.blob();
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
      setItems((await res.json()).items || []);
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

  const proveedores = useMemo(
    () => Array.from(new Set(items.flatMap((p) => p.partidas.flatMap((pa) => pa.ofertas.map((o) => o.proveedor.trim()))).filter(Boolean))).sort(),
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
            coincide([p.nombre, p.cliente, p.folio, ...p.partidas.map((pa) => `${pa.descripcion} ${pa.ofertas.map((o) => o.proveedor).join(" ")}`)].join(" "), q),
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

  async function crear(nombre: string) {
    try {
      const res = await api("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, moneda: "MXN", margenObjetivo: 20, partidas: [] }),
      });
      if (!res.ok) throw await errorDe(res, "No se pudo crear el proyecto.");
      const item: Proyecto = (await res.json()).item;
      setItems((its) => [item, ...its]);
      setCreando(false);
      abrir(item.id);
    } catch (err) {
      manejarError(err, "No se pudo crear el proyecto.");
    }
  }

  async function eliminar(p: Proyecto) {
    if (!window.confirm(`¿Eliminar el proyecto "${p.nombre}" con todos sus renglones, opciones y archivos? No se puede deshacer.`)) return;
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
                <FolderKanban className="h-8 w-8 text-accent" /> Cotizaciones
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/60">Venta al cliente vs. costo con proveedores · {session.email}</p>
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
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Crea el proyecto y sube tu Excel de cotización (o el PDF que mandó el tío). Después ve agregando las opciones de
                proveedor de cada concepto.
              </p>
              <Button onClick={onNuevo} className="mt-5 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Proyecto</th>
                <th className="px-3 py-2.5">Estatus</th>
                <th className="px-3 py-2.5 text-right">Conceptos</th>
                <th className="px-3 py-2.5 text-right">Venta</th>
                <th className="px-3 py-2.5 text-right">Costo</th>
                <th className="px-3 py-2.5 text-right">Margen</th>
                <th className="px-4 py-2.5 text-right">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const t = totalizar(p.partidas, p);
                return (
                  <tr key={p.id} onClick={() => onAbrir(p.id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <p className="font-heading font-bold text-foreground">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{[p.cliente, p.folio].filter(Boolean).join(" · ")}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", p.estatus === "Comprado" ? "bg-emerald-500/15 text-emerald-800" : "bg-accent/20 text-accent-foreground")}>
                        {p.estatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {t.conCosto}/{t.total} <span className="text-xs text-muted-foreground">con costo</span>
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

function NuevoProyecto({ abierto, onCerrar, onCrear }: { abierto: boolean; onCerrar: () => void; onCrear: (n: string) => Promise<void> }) {
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (abierto) setNombre("");
  }, [abierto]);
  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className="rounded-sm">
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>Un proyecto ya confirmado que hay que comprar.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!nombre.trim()) return;
            setEnviando(true);
            await onCrear(nombre.trim());
            setEnviando(false);
          }}
          className="space-y-4"
        >
          <Input autoFocus placeholder="Ej. Proyecto SIEQ" value={nombre} onChange={(e) => setNombre(e.target.value)} />
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

/* ═════════════════════════ Celdas editables ═════════════════════════ */

/**
 * Celda tipo hoja de cálculo: se ve como texto, se edita al enfocarla y
 * guarda al salir (blur) o con Enter. Escape descarta.
 */
function Celda({
  valor, onCambio, tipo = "texto", moneda = "MXN", placeholder, list, className, multilinea, atenuado, ariaLabel,
}: {
  valor: string | number;
  onCambio: (v: string) => void;
  tipo?: "texto" | "numero" | "dinero";
  moneda?: Moneda;
  placeholder?: string;
  list?: string;
  className?: string;
  multilinea?: boolean;
  atenuado?: boolean;
  ariaLabel?: string;
}) {
  const [foco, setFoco] = useState(false);
  const [borrador, setBorrador] = useState("");
  const crudo = typeof valor === "number" ? (valor ? String(valor) : "") : valor;
  const mostrado =
    tipo === "dinero" && typeof valor === "number" && valor
      ? dinero(valor, moneda)
      : tipo === "numero" && typeof valor === "number" && valor
        ? valor.toLocaleString("es-MX", { maximumFractionDigits: 4 })
        : crudo;

  const base = cn(
    "w-full rounded-sm bg-transparent px-1.5 py-1 text-sm outline-none transition-colors hover:bg-secondary/60 focus:bg-background focus:ring-2 focus:ring-accent",
    tipo !== "texto" && "text-right tabular-nums",
    atenuado && "italic text-muted-foreground",
    className,
  );
  const props = {
    value: foco ? borrador : mostrado,
    placeholder,
    "aria-label": ariaLabel || placeholder,
    onFocus: () => {
      setBorrador(crudo);
      setFoco(true);
    },
    onBlur: () => {
      setFoco(false);
      if (borrador !== crudo) onCambio(borrador);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBorrador(e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !(multilinea && e.shiftKey)) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      } else if (e.key === "Escape") {
        setBorrador(crudo);
        setTimeout(() => (e.target as HTMLElement).blur());
      }
    },
  };
  if (multilinea) return <AreaAutoAlto {...props} className={cn(base, "block resize-none leading-snug")} />;
  return <input {...props} list={list} inputMode={tipo === "texto" ? undefined : "decimal"} className={base} />;
}

/** Textarea que crece en alto con su texto (sin field-sizing, que también ensancharía la columna). */
function AreaAutoAlto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} />;
}

/* ═════════════════════════ Detalle de proyecto ═════════════════════════ */

type EstadoGuardado = "guardado" | "pendiente" | "guardando" | "error" | "conflicto";

function DetalleProyecto({
  inicial, onVolver, onCambio, onEliminar, onError,
}: {
  inicial: Proyecto;
  onVolver: () => void;
  onCambio: (p: Proyecto) => void;
  onEliminar: () => void;
  onError: (err: unknown, msg: string) => void;
}) {
  const { toast } = useToast();
  const [p, setP] = useState<Proyecto>(inicial);
  const [estado, setEstado] = useState<EstadoGuardado>("guardado");
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);
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
      const item: Proyecto = (await res.json()).item;
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
  const toggle = (id: string) =>
    setAbiertos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function agregarRenglon(sistema: string, despuesDe?: string) {
    const nueva = nuevaPartida(sistema, p.moneda);
    cambiar((x) => {
      const ps = x.partidas.slice();
      let i = despuesDe ? ps.findIndex((z) => z.id === despuesDe) : -1;
      if (i === -1) {
        // al final de su sistema
        for (let k = ps.length - 1; k >= 0; k--) if (ps[k].sistema === sistema) { i = k; break; }
      }
      ps.splice(i === -1 ? ps.length : i + 1, 0, nueva);
      return { ...x, partidas: ps };
    });
    setTimeout(() => document.querySelector<HTMLTextAreaElement>(`[data-concepto="${nueva.id}"]`)?.focus(), 50);
  }

  function duplicar(pa: Partida) {
    const copia: Partida = {
      ...pa,
      id: nid(),
      ofertas: pa.ofertas.map((o) => ({ ...o, id: nid() })),
      elegida: "",
    };
    const idx = pa.ofertas.findIndex((o) => o.id === pa.elegida);
    if (idx >= 0) copia.elegida = copia.ofertas[idx].id;
    cambiar((x) => {
      const ps = x.partidas.slice();
      ps.splice(ps.findIndex((z) => z.id === pa.id) + 1, 0, copia);
      return { ...x, partidas: ps };
    });
  }

  function quitar(pa: Partida) {
    if ((pa.descripcion || pa.ofertas.length) && !window.confirm(`¿Quitar el renglón "${pa.descripcion.slice(0, 60) || "sin concepto"}"?`)) return;
    cambiar((x) => ({ ...x, partidas: x.partidas.filter((z) => z.id !== pa.id) }));
  }

  function renombrarSistema(viejo: string, nuevo: string) {
    cambiar((x) => ({ ...x, partidas: x.partidas.map((pa) => (pa.sistema === viejo ? { ...pa, sistema: nuevo.trim() } : pa)) }));
  }

  /* ── Archivos ── */
  async function onSubir(f: File, rol: Archivo["rol"]): Promise<Archivo | null> {
    const err = validarArchivo(f);
    if (err) {
      toast({ title: "Archivo no válido", description: err, variant: "destructive" });
      return null;
    }
    setSubiendo(true);
    try {
      const a = await subirArchivo(p.id, f, rol);
      setP((x) => ({ ...x, archivos: [...x.archivos, a] }));
      return a;
    } catch (e) {
      onError(e, "No se pudo subir el archivo.");
      return null;
    } finally {
      setSubiendo(false);
    }
  }

  async function abrirArchivo(a: Archivo) {
    const w = window.open("", "_blank");
    try {
      const url = URL.createObjectURL(await bajarArchivo(p.id, a));
      if (w) w.location.href = url;
      else descargar(await bajarArchivo(p.id, a), a.nombre);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      w?.close();
      onError(e, "No se pudo abrir el archivo.");
    }
  }

  async function quitarArchivo(a: Archivo) {
    if (!window.confirm(`¿Quitar "${a.nombre}"?`)) return;
    try {
      const res = await api(`/api/cotizaciones/${p.id}/archivos/${a.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw await errorDe(res, "No se pudo quitar.");
      setP((x) => ({ ...x, archivos: x.archivos.filter((z) => z.id !== a.id) }));
      if (p.partidas.some((pa) => pa.ofertas.some((o) => o.archivoId === a.id))) {
        cambiar((x) => ({
          ...x,
          partidas: x.partidas.map((pa) => ({ ...pa, ofertas: pa.ofertas.map((o) => (o.archivoId === a.id ? { ...o, archivoId: "" } : o)) })),
        }));
      }
    } catch (e) {
      onError(e, "No se pudo quitar el archivo.");
    }
  }

  /* ── Importar ── */
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
          toast({
            title: "No encontré la tabla en el Excel",
            description: "Necesito una fila de encabezados con Concepto, Cantidad y Precio unitario.",
            variant: "destructive",
          });
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
    cambiar((x) => ({ ...x, partidas: modo === "reemplazar" ? nuevas : [...x.partidas, ...nuevas] }));
    setImportXls(null);
    toast({ title: `${nuevas.length} renglones importados` });
  }

  async function aplicarPdf(filas: PartidaLeida[], sistema: string, guardarPdf: boolean) {
    if (!importPdf) return;
    const nuevas: Partida[] = filas.map((f) => ({
      ...nuevaPartida(sistema, p.moneda),
      descripcion: [f.descripcion, f.modelo].filter(Boolean).join(" — "),
      unidad: f.unidad,
      cantidad: f.cantidad,
      venta: f.precio,
    }));
    cambiar((x) => ({ ...x, partidas: [...x.partidas, ...nuevas] }));
    const archivo = importPdf.archivo;
    setImportPdf(null);
    toast({ title: `${nuevas.length} renglones agregados` });
    if (guardarPdf) await onSubir(archivo, "nuestra");
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

  const t = totalizar(p.partidas, p);
  const grupos = agrupar(p.partidas);
  const necesitaTC = p.partidas.some((pa) => pa.ofertas.some((o) => o.moneda !== p.moneda)) && !p.tipoCambio;
  const archivosProv = p.archivos.filter((a) => a.rol === "proveedor");

  const visible = (pa: Partida) => {
    if (soloPendientes && analizar(pa, p).costo !== null) return false;
    if (!q.trim()) return true;
    return coincide(`${pa.sistema} ${pa.seccion} ${pa.descripcion} ${pa.ofertas.map((o) => `${o.proveedor} ${o.notas}`).join(" ")}`, q);
  };

  return (
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
        <CampoMini label="Moneda venta" className="w-24">
          <select value={p.moneda} onChange={(e) => set({ moneda: e.target.value as Moneda })} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option>MXN</option>
            <option>USD</option>
          </select>
        </CampoMini>
        <CampoMini label="TC USD" className="w-24">
          <Input
            inputMode="decimal"
            value={p.tipoCambio ? String(p.tipoCambio) : ""}
            onChange={(e) => set({ tipoCambio: aNumero(e.target.value) })}
            placeholder="18.50"
            className={cn("h-9", necesitaTC && "border-amber-500 ring-1 ring-amber-500")}
          />
        </CampoMini>
        <CampoMini label="Margen obj. %" className="w-24">
          <Input inputMode="decimal" value={String(p.margenObjetivo)} onChange={(e) => set({ margenObjetivo: aNumero(e.target.value) })} className="h-9" />
        </CampoMini>
        <CampoMini label="Estatus" className="w-32">
          <select value={p.estatus} onChange={(e) => set({ estatus: e.target.value as Proyecto["estatus"] })} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option>Cotizando</option>
            <option>Comprado</option>
          </select>
        </CampoMini>
      </div>
      {necesitaTC && <p className="-mt-3 text-xs font-semibold text-amber-700">Hay costos en otra moneda: pon el tipo de cambio para sumarlos.</p>}

      {/* totales */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi etiqueta="Venta" valor={dinero(t.venta, p.moneda)} />
        <Kpi etiqueta="Costo" valor={dinero(t.costo, p.moneda)} />
        <Kpi etiqueta="Utilidad" valor={dinero(t.utilidad, p.moneda)} clase={colorMargen(t.margen, p.margenObjetivo)} />
        <Kpi etiqueta="Margen" valor={pct(t.margen)} clase={colorMargen(t.margen, p.margenObjetivo)} nota={`objetivo ${p.margenObjetivo}%`} />
        <Kpi etiqueta="Con costo" valor={`${t.conCosto} / ${t.total}`} nota={t.total - t.conCosto ? `${t.total - t.conCosto} pendientes` : "todo cotizado"} />
      </div>

      {/* barra de herramientas */}
      <div className="flex flex-wrap items-center gap-2">
        <label className={cn("inline-flex h-10 cursor-pointer items-center rounded-sm bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground hover:bg-primary/90", leyendo && "pointer-events-none opacity-60")}>
          {leyendo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
          {leyendo ? "Leyendo…" : "Importar Excel o PDF"}
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf" className="hidden" onChange={elegirImportacion} />
        </label>
        <Button variant="outline" onClick={bajarExcel} disabled={p.partidas.length === 0} className="h-10 rounded-sm">
          <Download className="mr-2 h-4 w-4" /> Descargar Excel
        </Button>
        <div className="relative min-w-[14rem] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar conceptos o proveedores…" className="h-10 bg-background pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={soloPendientes} onCheckedChange={(v) => setSoloPendientes(!!v)} /> Solo sin costo
        </label>
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

      {/* ═══════════ LA TABLA ═══════════ */}
      {p.partidas.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          <FileSpreadsheet className="mx-auto mb-3 h-9 w-9 text-accent-foreground/60" />
          Sube tu <strong className="text-foreground">Excel de cotización</strong> (mismas columnas: Sistema, Sección, Concepto, Unidad,
          Cantidad, Precio unitario, Unidad compra, Cantidad compra, Costo unitario, Proveedor) o el PDF de nuestra cotización.
          <div className="mt-4">
            <Button variant="outline" onClick={() => agregarRenglon("General")} className="rounded-sm">
              <Plus className="mr-2 h-4 w-4" /> O empieza a capturar a mano
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-h-[78vh] overflow-auto rounded-sm border border-border bg-card shadow-sm">
          <table className="w-full min-w-[1300px] border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-20">
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider">
                <th className="w-8 border-b border-border bg-secondary" />
                <th className="w-32 border-b border-border bg-secondary px-2 py-2 text-muted-foreground">Sección</th>
                <th className="min-w-[13.5rem] border-b border-border bg-secondary px-2 py-2 text-muted-foreground">Concepto</th>
                <th className="w-16 border-b border-border bg-secondary px-2 py-2 text-muted-foreground">Unidad</th>
                <th className="min-w-[4.5rem] border-b border-border bg-secondary px-2 py-2 text-right text-muted-foreground">Cant.</th>
                <th className="min-w-[7rem] border-b border-border bg-secondary px-2 py-2 text-right text-muted-foreground">P.U. venta</th>
                <th className="min-w-[7rem] whitespace-nowrap border-b border-r-2 border-border border-r-primary/30 bg-secondary px-2 py-2 text-right text-muted-foreground">Subtotal venta</th>
                <th className="min-w-[10rem] border-b-2 border-b-accent bg-secondary px-2 py-2 text-accent-foreground">Proveedor</th>
                <th className="min-w-[4.5rem] border-b-2 border-b-accent bg-secondary px-2 py-2 text-accent-foreground">U. compra</th>
                <th className="min-w-[4.5rem] border-b-2 border-b-accent bg-secondary px-2 py-2 text-right text-accent-foreground">Cant. compra</th>
                <th className="min-w-[7rem] border-b-2 border-b-accent bg-secondary px-2 py-2 text-right text-accent-foreground">Costo unit.</th>
                <th className="min-w-[7rem] whitespace-nowrap border-b-2 border-b-accent bg-secondary px-2 py-2 text-right text-accent-foreground">Subtotal costo</th>
                                <th className="min-w-[6.5rem] border-b border-border bg-secondary px-2 py-2 text-right text-muted-foreground">Margen</th>
                <th className="w-16 border-b border-border bg-secondary" />
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const filas = g.partidas.filter(visible);
                if (filas.length === 0 && (q || soloPendientes)) return null;
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
                            <Plus className="h-3.5 w-3.5" /> Renglón
                          </button>
                        </div>
                      </td>
                      <td className="border-b border-r-2 border-border border-r-primary/30 px-2 py-1.5 text-right font-bold tabular-nums">{dinero(tg.venta, p.moneda)}</td>
                      <td colSpan={4} className="border-b border-border px-2 py-1.5 text-xs text-muted-foreground">
                        {tg.conCosto < tg.total ? `${tg.total - tg.conCosto} sin costo` : ""}
                      </td>
                      <td className="border-b border-border px-2 py-1.5 text-right font-bold tabular-nums">{dinero(tg.costo, p.moneda)}</td>
                      <td className={cn("border-b border-border px-2 py-1 text-right font-bold tabular-nums", colorMargen(tg.margen, p.margenObjetivo))}>
                        {pct(tg.margen)}
                        <span className="block text-[11px] font-semibold">{dinero(tg.utilidad, p.moneda, 0)}</span>
                      </td>
                      <td className="border-b border-border" />
                    </tr>
                    {filas.map((pa) => (
                      <FilaPartida
                        key={pa.id}
                        pa={pa}
                        p={p}
                        abierta={abiertos.has(pa.id)}
                        onToggle={() => toggle(pa.id)}
                        onCambiar={(fn) => setPartida(pa.id, fn)}
                        onDuplicar={() => duplicar(pa)}
                        onQuitar={() => quitar(pa)}
                        onAgregarAbajo={() => agregarRenglon(pa.sistema, pa.id)}
                        archivosProv={archivosProv}
                        onSubir={(f) => onSubir(f, "proveedor")}
                        onAbrirArchivo={abrirArchivo}
                        subiendo={subiendo}
                      />
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 z-10">
              <tr className="font-heading text-sm font-bold">
                <td className="border-t-2 border-primary/40 bg-secondary" />
                <td colSpan={5} className="border-t-2 border-primary/40 bg-secondary px-2 py-2.5 uppercase tracking-wide">
                  Total general
                  <button
                    type="button"
                    onClick={() => {
                      const nombre = window.prompt("Nombre del nuevo sistema", "");
                      if (nombre?.trim()) agregarRenglon(nombre.trim());
                    }}
                    className="ml-3 inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-sans text-xs font-semibold normal-case tracking-normal text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" /> Nuevo sistema
                  </button>
                </td>
                <td className="border-r-2 border-t-2 border-primary/40 border-r-primary/30 bg-secondary px-2 py-2.5 text-right tabular-nums">{dinero(t.venta, p.moneda)}</td>
                <td colSpan={4} className="border-t-2 border-primary/40 bg-secondary" />
                <td className="border-t-2 border-primary/40 bg-secondary px-2 py-2.5 text-right tabular-nums">{dinero(t.costo, p.moneda)}</td>
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
      <p className="text-xs text-muted-foreground">
        Precios sin IVA. Toca <ChevronRight className="inline h-3 w-3" /> en un renglón para ver y comparar varias opciones de proveedor; la que
        marques con ✓ es la que cuenta (si no eliges, cuenta la más barata). Las celdas se guardan solas al salir de ellas.
      </p>

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
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{rol === "nuestra" ? "Nuestra cotización" : "De proveedores"}</p>
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
          <div className="flex flex-wrap gap-2">
            {(["nuestra", "proveedor"] as const).map((rol) => (
              <label key={rol} className={cn("inline-flex cursor-pointer items-center rounded-sm border border-dashed border-accent/60 px-3 py-2 text-xs font-semibold hover:bg-accent/10", subiendo && "pointer-events-none opacity-60")}>
                <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                {rol === "nuestra" ? "Subir nuestra cotización" : "Subir de proveedor"}
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) onSubir(f, rol);
                  }}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-foreground">Notas del proyecto</h3>
          <Textarea rows={6} value={p.notas} onChange={(e) => set({ notas: e.target.value })} placeholder="Tiempos de entrega a obra, acuerdos, pendientes…" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onEliminar} className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar proyecto
        </Button>
      </div>

      {importXls && (
        <DialogoExcel resultado={importXls} p={p} onCancelar={() => setImportXls(null)} onAplicar={aplicarExcel} />
      )}
      {importPdf && (
        <DialogoPdf
          resultado={importPdf.resultado}
          nombreArchivo={importPdf.archivo.name}
          sistemas={grupos.map((g) => g.sistema).filter(Boolean)}
          onCancelar={() => setImportPdf(null)}
          onConfirmar={aplicarPdf}
        />
      )}
    </div>
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

/* ═════════════════════════ Renglón ═════════════════════════ */

function FilaPartida({
  pa, p, abierta, onToggle, onCambiar, onDuplicar, onQuitar, onAgregarAbajo, archivosProv, onSubir, onAbrirArchivo, subiendo,
}: {
  pa: Partida;
  p: Proyecto;
  abierta: boolean;
  onToggle: () => void;
  onCambiar: (fn: (pa: Partida) => Partida) => void;
  onDuplicar: () => void;
  onQuitar: () => void;
  onAgregarAbajo: () => void;
  archivosProv: Archivo[];
  onSubir: (f: File) => Promise<Archivo | null>;
  onAbrirArchivo: (a: Archivo) => void;
  subiendo: boolean;
}) {
  const a = analizar(pa, p);
  const validas = pa.ofertas.filter(ofertaValida).length;
  // Las celdas de compra editan la opción que cuenta; si no hay ninguna, la crean (y queda elegida).
  const objetivo = a.oferta;
  const mostrada: Oferta = objetivo || nuevaOferta(pa, p.moneda);
  const atenuado = !!objetivo && !a.porElegida && validas > 1;

  function editarCompra(patch: Partial<Oferta>) {
    onCambiar((x) => {
      if (objetivo) {
        return { ...x, elegida: objetivo.id, ofertas: x.ofertas.map((o) => (o.id === objetivo.id ? { ...o, ...patch } : o)) };
      }
      const o = { ...nuevaOferta(x, p.moneda), ...patch };
      return { ...x, ofertas: [...x.ofertas, o], elegida: o.id };
    });
  }

  const set = (patch: Partial<Partida>) => onCambiar((x) => ({ ...x, ...patch }));
  const td = "border-b border-border px-0.5 py-0.5 align-top";
  const cu = objetivo ? (objetivo.moneda === p.moneda ? objetivo.costo : null) : null;

  return (
    <>
      <tr className={cn("group", abierta && "bg-accent/[0.04]")}>
        <td className={cn(td, "text-center")}>
          <button
            type="button"
            onClick={onToggle}
            aria-label={abierta ? "Ocultar opciones de proveedor" : "Ver opciones de proveedor"}
            aria-expanded={abierta}
            className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {abierta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className={td}>
          <Celda valor={pa.seccion} onCambio={(v) => set({ seccion: v })} placeholder="Sección" className="text-muted-foreground" />
        </td>
        <td className={td}>
          <ConceptoCelda pa={pa} onCambio={(v) => set({ descripcion: v })} />
        </td>
        <td className={td}>
          <Celda valor={pa.unidad} onCambio={(v) => set({ unidad: v })} list="dl-unidades" ariaLabel="Unidad de venta" />
        </td>
        <td className={td}>
          <Celda tipo="numero" valor={pa.cantidad} onCambio={(v) => set({ cantidad: aNumero(v) })} ariaLabel="Cantidad de venta" />
        </td>
        <td className={td}>
          <Celda tipo="dinero" moneda={p.moneda} valor={pa.venta} onCambio={(v) => set({ venta: aNumero(v) })} ariaLabel="Precio unitario de venta" />
        </td>
        <td className={cn(td, "border-r-2 border-r-primary/30 px-2 py-1.5 text-right font-semibold tabular-nums")}>{dinero(a.venta, p.moneda)}</td>

        {/* compra */}
        <td className={cn(td, "bg-accent/[0.05]")}>
          <div className="flex items-start gap-1">
            <Celda valor={mostrada.proveedor} onCambio={(v) => editarCompra({ proveedor: v })} list="dl-proveedores" placeholder="Proveedor" atenuado={atenuado} />
            {validas > 1 && (
              <button
                type="button"
                onClick={onToggle}
                title="Ver opciones"
                className={cn(
                  "mt-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  a.porElegida ? "bg-emerald-500/15 text-emerald-800" : "bg-amber-500/15 text-amber-800",
                )}
              >
                {validas} op.
              </button>
            )}
          </div>
        </td>
        <td className={cn(td, "bg-accent/[0.05]")}>
          <Celda valor={mostrada.unidad} onCambio={(v) => editarCompra({ unidad: v })} list="dl-unidades" atenuado={atenuado} ariaLabel="Unidad de compra" />
        </td>
        <td className={cn(td, "bg-accent/[0.05]")}>
          <Celda tipo="numero" valor={objetivo ? mostrada.cantidad : 0} onCambio={(v) => editarCompra({ cantidad: aNumero(v) })} atenuado={atenuado} ariaLabel="Cantidad de compra" />
        </td>
        <td className={cn(td, "bg-accent/[0.05]")}>
          <Celda
            tipo="dinero"
            moneda={mostrada.moneda}
            valor={objetivo ? mostrada.costo : 0}
            onCambio={(v) => editarCompra({ costo: aNumero(v) })}
            atenuado={atenuado}
            ariaLabel="Costo unitario"
          />
          {objetivo && cu === null && <p className="px-1.5 text-[10px] text-muted-foreground">{objetivo.moneda}</p>}
        </td>
        <td className={cn(td, "bg-accent/[0.05] px-2 py-1.5 text-right tabular-nums", atenuado && "italic text-muted-foreground")}>
          {a.costo === null ? (objetivo ? <span className="text-xs text-amber-700">falta TC</span> : <span className="text-muted-foreground">—</span>) : dinero(a.costo, p.moneda)}
        </td>
        <td className={cn(td, "px-2 py-1 text-right tabular-nums", colorMargen(a.margen, p.margenObjetivo))}>
          <span className="font-bold">{pct(a.margen)}</span>
          {a.utilidad !== null && <span className="block text-[11px]">{dinero(a.utilidad, p.moneda, 0)}</span>}
        </td>
        <td className={cn(td, "whitespace-nowrap px-1 py-1")}>
          <div className="flex justify-end opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <button type="button" onClick={onAgregarAbajo} title="Agregar renglón abajo" className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onDuplicar} title="Duplicar renglón" className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onQuitar} title="Quitar renglón" className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {abierta && (
        <tr>
          <td className="border-b border-border bg-accent/[0.04]" />
          <td colSpan={13} className="border-b border-border bg-accent/[0.04] px-3 pb-4 pt-1">
            <PanelOpciones
              pa={pa}
              p={p}
              onCambiar={onCambiar}
              archivosProv={archivosProv}
              onSubir={onSubir}
              onAbrirArchivo={onAbrirArchivo}
              subiendo={subiendo}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function ConceptoCelda({ pa, onCambio }: { pa: Partida; onCambio: (v: string) => void }) {
  // Celda multilínea con data-concepto para poder enfocar el renglón nuevo.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ta = ref.current?.querySelector("textarea");
    if (ta) ta.dataset.concepto = pa.id;
  }, [pa.id]);
  return (
    <div ref={ref}>
      <Celda valor={pa.descripcion} onCambio={onCambio} multilinea placeholder="Concepto" ariaLabel="Concepto" />
    </div>
  );
}

/* ═════════════════════════ Opciones de proveedor ═════════════════════════ */

const cacheLecturas = new Map<string, ResultadoPdf>();

function PanelOpciones({
  pa, p, onCambiar, archivosProv, onSubir, onAbrirArchivo, subiendo,
}: {
  pa: Partida;
  p: Proyecto;
  onCambiar: (fn: (pa: Partida) => Partida) => void;
  archivosProv: Archivo[];
  onSubir: (f: File) => Promise<Archivo | null>;
  onAbrirArchivo: (a: Archivo) => void;
  subiendo: boolean;
}) {
  const a = analizar(pa, p);
  const [lectura, setLectura] = useState<{ ofertaId: string; r: ResultadoPdf } | null>(null);
  const [leyendo, setLeyendo] = useState("");

  const setOferta = (id: string, patch: Partial<Oferta>) =>
    onCambiar((x) => ({ ...x, ofertas: x.ofertas.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));

  function agregar() {
    const base = a.oferta;
    const o = { ...nuevaOferta(pa, p.moneda), unidad: base?.unidad || pa.unidad, cantidad: base?.cantidad || pa.cantidad };
    onCambiar((x) => ({ ...x, ofertas: [...x.ofertas, o] }));
    setTimeout(() => document.querySelector<HTMLInputElement>(`[data-oferta="${o.id}"] input`)?.focus(), 50);
  }

  async function leer(ofertaId: string, arch: Archivo, file?: File) {
    if (arch.tipo !== "application/pdf") return;
    const enCache = cacheLecturas.get(arch.id);
    if (enCache) return setLectura({ ofertaId, r: enCache });
    setLeyendo(ofertaId);
    try {
      const r = await leerPdf(file || (await bajarArchivo(p.id, arch)));
      cacheLecturas.set(arch.id, r);
      setLectura({ ofertaId, r });
    } catch {
      setLectura(null);
    } finally {
      setLeyendo("");
    }
  }

  const sugerencias = useMemo(() => {
    if (!lectura) return [];
    const palabras = normalizar(pa.descripcion).split(" ").filter((w) => w.length > 2);
    return lectura.r.partidas
      .filter((x) => x.precio > 0)
      .map((x) => ({ x, puntos: palabras.filter((w) => normalizar(`${x.descripcion} ${x.modelo}`).includes(w)).length }))
      .sort((m, n) => n.puntos - m.puntos)
      .slice(0, 6);
  }, [lectura, pa.descripcion]);

  const ordenadas = pa.ofertas.slice().sort((x, y) => (costoTotal(x, p) ?? Infinity) - (costoTotal(y, p) ?? Infinity));
  const th = "px-1.5 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

  return (
    // w-0 min-w-full: el panel ocupa el ancho de la tabla sin ensancharla; si no cabe, se desplaza solo él.
    <div className="w-0 min-w-full overflow-x-auto rounded-sm border border-accent/30 bg-card">
      <div className="flex min-w-[64rem] flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          Opciones de proveedor <span className="font-normal normal-case tracking-normal text-muted-foreground">— marca con ✓ la preferida</span>
        </p>
        <div className="flex min-w-[18rem] flex-1 items-center gap-2 md:max-w-md">
          <span className="shrink-0 text-xs text-muted-foreground">Notas:</span>
          <Celda valor={pa.notas} onCambio={(v) => onCambiar((x) => ({ ...x, notas: v }))} placeholder="Especificación a respetar, marca similar…" className="border border-border" />
        </div>
      </div>
      <table className="w-full min-w-[64rem] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-10" />
            <th className={cn(th, "min-w-[12rem]")}>Proveedor</th>
            <th className={cn(th, "w-20")}>U. compra</th>
            <th className={cn(th, "w-20 text-right")}>Cant.</th>
            <th className={cn(th, "w-28 text-right")}>Costo unit.</th>
            <th className={cn(th, "w-20")}>Moneda</th>
            <th className={cn(th, "w-32 text-right")}>Subtotal ({p.moneda})</th>
            <th className={cn(th, "w-20 text-right")}>Margen</th>
            <th className={cn(th, "w-32")}>Entrega</th>
            <th className={cn(th, "min-w-[10rem]")}>Notas</th>
            <th className={cn(th, "w-48")}>PDF</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((o) => {
            const c = costoTotal(o, p);
            const m = c !== null && a.venta > 0 ? (a.venta - c) / a.venta : null;
            const elegida = pa.elegida === o.id;
            const arch = archivosProv.find((z) => z.id === o.archivoId) || null;
            return (
              <Fragment key={o.id}>
                <tr data-oferta={o.id} className={cn("border-b border-border/60 align-top", elegida && "bg-emerald-500/10")}>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onCambiar((x) => ({ ...x, elegida: x.elegida === o.id ? "" : o.id }))}
                      title={elegida ? "Quitar como preferida" : "Elegir como preferida"}
                      aria-pressed={elegida}
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                        elegida ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40 hover:border-emerald-600",
                      )}
                    >
                      {elegida && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                  <td className="py-0.5">
                    <div className="flex items-center gap-1">
                      <Celda valor={o.proveedor} onCambio={(v) => setOferta(o.id, { proveedor: v })} list="dl-proveedores" placeholder="Proveedor" />
                      {a.masBarata === o.id && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">Más barato</span>
                      )}
                    </div>
                  </td>
                  <td className="py-0.5"><Celda valor={o.unidad} onCambio={(v) => setOferta(o.id, { unidad: v })} list="dl-unidades" ariaLabel="Unidad de compra" /></td>
                  <td className="py-0.5"><Celda tipo="numero" valor={o.cantidad} onCambio={(v) => setOferta(o.id, { cantidad: aNumero(v) })} ariaLabel="Cantidad de compra" /></td>
                  <td className="py-0.5"><Celda tipo="dinero" moneda={o.moneda} valor={o.costo} onCambio={(v) => setOferta(o.id, { costo: aNumero(v) })} ariaLabel="Costo unitario" /></td>
                  <td className="py-0.5">
                    <select
                      value={o.moneda}
                      onChange={(e) => setOferta(o.id, { moneda: e.target.value as Moneda })}
                      aria-label="Moneda"
                      className="w-full rounded-sm bg-transparent px-1 py-1 text-sm hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option>MXN</option>
                      <option>USD</option>
                    </select>
                  </td>
                  <td className="px-1.5 py-1.5 text-right tabular-nums">{c === null ? <span className="text-xs text-amber-700">falta TC</span> : dinero(c, p.moneda)}</td>
                  <td className={cn("px-1.5 py-1.5 text-right font-bold tabular-nums", colorMargen(m, p.margenObjetivo))}>{pct(m)}</td>
                  <td className="py-0.5"><Celda valor={o.entrega} onCambio={(v) => setOferta(o.id, { entrega: v })} placeholder="Ej. 2 semanas" ariaLabel="Entrega" /></td>
                  <td className="py-0.5"><Celda valor={o.notas} onCambio={(v) => setOferta(o.id, { notas: v })} placeholder="Marca, garantía, flete…" ariaLabel="Notas" multilinea /></td>
                  <td className="px-1 py-1">
                    <div className="flex items-center gap-1">
                      {/* <select> nativo: el de Radix se resetea cuando aparece la opción recién subida */}
                      <select
                        value={o.archivoId}
                        onChange={(e) => {
                          setOferta(o.id, { archivoId: e.target.value });
                          const z = archivosProv.find((q) => q.id === e.target.value);
                          if (z) leer(o.id, z);
                        }}
                        aria-label="PDF del proveedor"
                        className="min-w-0 flex-1 truncate rounded-sm border border-border bg-background px-1 py-1 text-xs"
                      >
                        <option value="">Sin PDF</option>
                        {archivosProv.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                      </select>
                      {arch && (
                        <button type="button" onClick={() => onAbrirArchivo(arch)} title="Abrir PDF" className="shrink-0 rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Paperclip className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <label title="Subir PDF del proveedor" className={cn("shrink-0 cursor-pointer rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground", subiendo && "pointer-events-none opacity-50")}>
                        {subiendo || leyendo === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (!f) return;
                            const z = await onSubir(f);
                            if (z) {
                              setOferta(o.id, { archivoId: z.id });
                              leer(o.id, z, f);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </td>
                  <td className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => onCambiar((x) => ({ ...x, ofertas: x.ofertas.filter((z) => z.id !== o.id), elegida: x.elegida === o.id ? "" : x.elegida }))}
                      title="Quitar opción"
                      className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                {lectura?.ofertaId === o.id && (
                  <tr className="border-b border-border/60">
                    <td />
                    <td colSpan={11} className="px-1.5 pb-2">
                      {sugerencias.length ? (
                        <>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Precios en el PDF — toca uno para usarlo como costo unitario</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sugerencias.map(({ x }, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setOferta(o.id, { costo: x.precio, moneda: lectura.r.moneda });
                                  setLectura(null);
                                }}
                                className="max-w-full rounded-sm border border-border bg-secondary/40 px-2 py-1 text-left text-xs hover:border-accent"
                              >
                                <span className="font-bold">{dinero(x.precio, lectura.r.moneda)}</span>{" "}
                                <span className="text-muted-foreground">{(x.descripcion || x.modelo).slice(0, 60)}</span>
                              </button>
                            ))}
                            <button type="button" onClick={() => setLectura(null)} className="px-2 text-xs text-muted-foreground underline">cerrar</button>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No encontré precios en ese PDF; captúralo a mano.</p>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="px-2 py-2">
        <Button variant="ghost" size="sm" onClick={agregar} className="rounded-sm font-semibold text-foreground">
          <Plus className="mr-1.5 h-4 w-4" /> Agregar opción de proveedor
        </Button>
      </div>
    </div>
  );
}

/* ═════════════════════════ Diálogos de importación ═════════════════════════ */

function DialogoExcel({
  resultado, p, onCancelar, onAplicar,
}: {
  resultado: ResultadoExcel;
  p: Proyecto;
  onCancelar: () => void;
  onAplicar: (modo: "reemplazar" | "agregar") => void;
}) {
  const grupos = agrupar(resultado.partidas);
  const t = totalizar(resultado.partidas, p);
  return (
    <Dialog open onOpenChange={(o) => !o && onCancelar()}>
      <DialogContent className="max-w-2xl rounded-sm">
        <DialogHeader>
          <DialogTitle>Importar Excel</DialogTitle>
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
                <th className="px-3 py-2 text-right">Costo</th>
                <th className="px-3 py-2 text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => {
                const tg = totalizar(g.partidas, p);
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
          El proveedor y costo de cada renglón quedan como su opción elegida. Después puedes agregar más opciones para comparar.
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
              if (p.partidas.length > 0 && !window.confirm(`Esto reemplaza los ${p.partidas.length} renglones actuales. ¿Seguro?`)) return;
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

function DialogoPdf({
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
          <DialogDescription>{nombreArchivo} — revisa y corrige antes de agregarlos. Los precios son los de venta.</DialogDescription>
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
