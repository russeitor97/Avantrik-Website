import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo } from "@/lib/seo";
import { Link, useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useToast } from "@/hooks/use-toast";
import { getSession, authHeaders, clearSession } from "@/lib/portal-auth";
import { leerPdf, type PartidaLeida, type ResultadoPdf } from "@/lib/pdf-partidas";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, ClipboardCopy, FileText, FileUp, Loader2, LogOut,
  MessageCircle, Paperclip, PencilLine, Plus, RefreshCcw, Search, Trash2, X, FolderKanban, Truck,
} from "lucide-react";

/* ═════════════════════════ Tipos ═════════════════════════ */

type Moneda = "MXN" | "USD";

interface Archivo {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  rol: "nuestra" | "proveedor";
  subido: number;
  subidoPor: string;
}

interface Oferta {
  id: string;
  proveedor: string;
  precio: number; // P.U. sin IVA, en su moneda
  moneda: Moneda;
  entrega: string;
  notas: string;
  archivoId: string;
}

interface Partida {
  id: string;
  descripcion: string;
  modelo: string;
  cantidad: number;
  unidad: string;
  venta: number; // P.U. sin IVA que cotizamos al cliente, en la moneda del proyecto
  costoEst: number; // costo que se estimó al cotizar (opcional)
  notas: string;
  ofertas: Oferta[];
  elegida: string;
}

interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  folio: string;
  moneda: Moneda;
  tipoCambio: number;
  margenObjetivo: number;
  estatus: "Cotizando" | "Comprado";
  notas: string;
  partidas: Partida[];
  archivos: Archivo[];
  version: number;
  creadoPor: string;
  actualizadoPor: string;
  creado: number;
  actualizado: number;
}

/* ═════════════════════════ Utilidades ═════════════════════════ */

const MAX_ARCHIVO = 4 * 1024 * 1024;
const UNIDADES = ["pza", "m", "m²", "kg", "lt", "rollo", "caja", "juego", "lote", "servicio", "hr"];

class SesionExpirada extends Error {}

const nid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function dinero(n: number, m: Moneda = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: m,
    currencyDisplay: m === "MXN" ? "narrowSymbol" : "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

const pct = (n: number | null) => (n === null ? "—" : `${(n * 100).toFixed(1)}%`);

const aNumero = (s: string) => {
  const n = Number(String(s).replace(/[,\s$]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

function coincide(texto: string, q: string) {
  const t = normalizar(texto);
  return normalizar(q).split(" ").filter(Boolean).every((w) => t.includes(w));
}

/** Precio de la oferta convertido a la moneda del proyecto (null si falta tipo de cambio). */
function enMonedaProyecto(o: Oferta, p: Pick<Proyecto, "moneda" | "tipoCambio">): number | null {
  if (o.moneda === p.moneda) return o.precio;
  if (!p.tipoCambio) return null;
  return o.moneda === "USD" ? o.precio * p.tipoCambio : o.precio / p.tipoCambio;
}

interface Analisis {
  costoUnit: number | null; // del proveedor elegido o, si no hay, del más barato
  oferta: Oferta | null;
  porElegida: boolean;
  masBarata: string; // id
  margen: number | null; // sobre venta
  utilidad: number | null; // total de la partida
}

function analizar(pa: Partida, p: Pick<Proyecto, "moneda" | "tipoCambio">): Analisis {
  const conv = pa.ofertas
    .filter((o) => o.precio > 0)
    .map((o) => ({ o, c: enMonedaProyecto(o, p) }))
    .filter((x): x is { o: Oferta; c: number } => x.c !== null)
    .sort((a, b) => a.c - b.c);
  const masBarata = conv[0]?.o.id || "";
  const elegida = conv.find((x) => x.o.id === pa.elegida);
  const usar = elegida || conv[0];
  if (!usar) return { costoUnit: null, oferta: null, porElegida: false, masBarata, margen: null, utilidad: null };
  const margen = pa.venta > 0 ? (pa.venta - usar.c) / pa.venta : null;
  return {
    costoUnit: usar.c,
    oferta: usar.o,
    porElegida: !!elegida,
    masBarata,
    margen,
    utilidad: (pa.venta - usar.c) * (pa.cantidad || 0),
  };
}

function totalesProyecto(p: Proyecto) {
  let venta = 0;
  let ventaCotizada = 0;
  let costo = 0;
  let cotizadas = 0;
  let elegidas = 0;
  for (const pa of p.partidas) {
    const v = pa.venta * (pa.cantidad || 0);
    venta += v;
    const a = analizar(pa, p);
    if (a.costoUnit !== null) {
      cotizadas++;
      ventaCotizada += v;
      costo += a.costoUnit * (pa.cantidad || 0);
      if (a.porElegida) elegidas++;
    }
  }
  const utilidad = ventaCotizada - costo;
  return {
    venta,
    ventaCotizada,
    costo,
    utilidad,
    margen: ventaCotizada > 0 ? utilidad / ventaCotizada : null,
    cotizadas,
    elegidas,
    total: p.partidas.length,
  };
}

function colorMargen(m: number | null, objetivo: number) {
  if (m === null) return "text-muted-foreground";
  if (m < 0) return "text-destructive";
  if (m * 100 < objetivo) return "text-amber-700";
  return "text-emerald-700";
}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), ...authHeaders() },
  });
  if (res.status === 401) throw new SesionExpirada();
  return res;
}

async function errorDe(res: Response, fallback: string) {
  const data = await res.json().catch(() => null);
  return new Error(data?.error || fallback);
}

/** Fotos grandes se comprimen; los PDF van tal cual (máx 4 MB). */
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

/* ─────────── Resumen para el grupo (WhatsApp) y Excel ─────────── */

function resumenTexto(p: Proyecto): string {
  const t = totalesProyecto(p);
  const l: string[] = [];
  l.push(`*${p.nombre}* — comparativo de proveedores`);
  const sub = [p.cliente && `Cliente: ${p.cliente}`, p.folio && `Cot. ${p.folio}`].filter(Boolean).join(" · ");
  if (sub) l.push(sub);
  l.push(`_Precios unitarios sin IVA${p.tipoCambio ? ` · TC USD ${dinero(p.tipoCambio)}` : ""}_`);
  p.partidas.forEach((pa, i) => {
    const a = analizar(pa, p);
    l.push("");
    l.push(`*${i + 1}. ${pa.descripcion || "Sin descripción"}* (${pa.cantidad} ${pa.unidad})`);
    l.push(`Venta: ${dinero(pa.venta, p.moneda)} c/u`);
    if (pa.ofertas.length === 0) {
      l.push("⏳ Sin cotizar todavía");
      return;
    }
    const ordenadas = pa.ofertas
      .slice()
      .sort((x, y) => (enMonedaProyecto(x, p) ?? Infinity) - (enMonedaProyecto(y, p) ?? Infinity));
    for (const o of ordenadas) {
      const c = enMonedaProyecto(o, p);
      const m = c !== null && pa.venta > 0 ? (pa.venta - c) / pa.venta : null;
      const marca = o.id === pa.elegida ? "✅" : "•";
      const precio =
        o.moneda !== p.moneda && c !== null
          ? `${dinero(o.precio, o.moneda)} (≈${dinero(c, p.moneda)})`
          : dinero(o.precio, o.moneda);
      const extras = [o.entrega, `margen ${pct(m)}`, o.id === a.masBarata && ordenadas.length > 1 ? "más barato" : ""]
        .filter(Boolean)
        .join(" · ");
      l.push(`${marca} ${o.proveedor || "Proveedor"}: ${precio} · ${extras}`);
    }
  });
  l.push("");
  l.push(`*Totales* (${t.cotizadas} de ${t.total} partidas cotizadas)`);
  l.push(`Venta: ${dinero(t.ventaCotizada, p.moneda)}`);
  l.push(`Costo: ${dinero(t.costo, p.moneda)}`);
  l.push(`Utilidad: ${dinero(t.utilidad, p.moneda)} (${pct(t.margen)})`);
  if (t.elegidas < t.cotizadas) l.push("_Donde no hay ✅ se tomó el proveedor más barato._");
  return l.join("\n");
}

function tablaExcel(p: Proyecto): string {
  const enc = [
    "#", "Descripción", "Modelo", "Cantidad", "Unidad", `Venta P.U. (${p.moneda})`, "Proveedor", "Precio P.U.",
    "Moneda", `Precio en ${p.moneda}`, "Entrega", "Margen %", `Utilidad total (${p.moneda})`, "Elegido",
  ];
  const filas: string[][] = [];
  p.partidas.forEach((pa, i) => {
    const base = [String(i + 1), pa.descripcion, pa.modelo, String(pa.cantidad), pa.unidad, pa.venta.toFixed(2)];
    if (pa.ofertas.length === 0) filas.push([...base, "", "", "", "", "", "", "", ""]);
    for (const o of pa.ofertas) {
      const c = enMonedaProyecto(o, p);
      const m = c !== null && pa.venta > 0 ? (pa.venta - c) / pa.venta : null;
      filas.push([
        ...base, o.proveedor, o.precio.toFixed(2), o.moneda, c === null ? "" : c.toFixed(2), o.entrega,
        m === null ? "" : (m * 100).toFixed(1), c === null ? "" : ((pa.venta - c) * pa.cantidad).toFixed(2),
        o.id === pa.elegida ? "Sí" : "",
      ]);
    }
  });
  return [enc, ...filas].map((f) => f.map((v) => String(v).replace(/[\t\n]/g, " ")).join("\t")).join("\n");
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
    () =>
      Array.from(new Set(items.flatMap((p) => p.partidas.flatMap((pa) => pa.ofertas.map((o) => o.proveedor))).filter(Boolean))).sort(),
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
            coincide(
              [p.nombre, p.cliente, p.folio, ...p.partidas.map((pa) => `${pa.descripcion} ${pa.modelo} ${pa.ofertas.map((o) => o.proveedor).join(" ")}`)].join(" "),
              q,
            ),
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

  const actualizarEnLista = (p: Proyecto) => setItems((its) => its.map((i) => (i.id === p.id ? p : i)));

  async function eliminar(p: Proyecto) {
    if (!window.confirm(`¿Eliminar el proyecto "${p.nombre}" con todas sus ofertas y archivos? No se puede deshacer.`)) return;
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
      <section className="relative overflow-hidden bg-ink-gradient pb-10 pt-28 text-primary-foreground">
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
              <p className="mt-1 text-sm text-primary-foreground/60">
                Nuestra cotización vs. precios de proveedores · {session.email}
              </p>
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

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <datalist id="dl-proveedores">{proveedores.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="dl-unidades">{UNIDADES.map((u) => <option key={u} value={u} />)}</datalist>

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
              onCambio={actualizarEnLista}
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
          <>
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proyecto, cliente, material o proveedor…" className="bg-background pl-9" />
              </div>
              <Button onClick={() => setCreando(true)} className="h-11 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
              </Button>
            </div>

            {filtrados.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border bg-card px-6 py-14 text-center">
                {items.length === 0 ? (
                  <>
                    <FolderKanban className="mx-auto mb-3 h-10 w-10 text-accent-foreground/60" />
                    <p className="font-heading text-lg font-bold text-foreground">Empieza con tu primer proyecto</p>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                      Crea el proyecto (ej. “Proyecto CIEC”), sube el PDF de nuestra cotización para sacar las partidas y
                      ve agregando los precios de cada proveedor.
                    </p>
                    <Button onClick={() => setCreando(true)} className="mt-5 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
                      <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nada coincide con la búsqueda.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filtrados.map((p) => (
                  <TarjetaProyecto key={p.id} p={p} onAbrir={() => abrir(p.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <NuevoProyecto abierto={creando} onCerrar={() => setCreando(false)} onCrear={crear} />
    </Layout>
  );
}

/* ═════════════════════════ Lista ═════════════════════════ */

function TarjetaProyecto({ p, onAbrir }: { p: Proyecto; onAbrir: () => void }) {
  const t = totalesProyecto(p);
  return (
    <button type="button" onClick={onAbrir} className="group rounded-sm border border-border bg-card p-5 text-left transition-colors hover:border-accent/60">
      <div className="mb-1 flex items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", p.estatus === "Comprado" ? "bg-emerald-500/15 text-emerald-800" : "bg-accent/20 text-accent-foreground")}>
          {p.estatus}
        </span>
        {p.folio && <span className="font-mono text-xs text-muted-foreground">{p.folio}</span>}
      </div>
      <p className="font-heading text-xl font-bold text-foreground">{p.nombre}</p>
      {p.cliente && <p className="text-sm text-muted-foreground">{p.cliente}</p>}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Partidas</p>
          <p className="font-semibold text-foreground">
            {t.cotizadas}/{t.total} <span className="font-normal text-muted-foreground">cotizadas</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Venta</p>
          <p className="font-semibold text-foreground">{dinero(t.venta, p.moneda)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Margen</p>
          <p className={cn("font-heading font-bold", colorMargen(t.margen, p.margenObjetivo))}>{pct(t.margen)}</p>
        </div>
      </div>
    </button>
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
          <Input autoFocus placeholder="Ej. Proyecto CIEC" value={nombre} onChange={(e) => setNombre(e.target.value)} />
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

/* ═════════════════════════ Detalle ═════════════════════════ */

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
  const [importando, setImportando] = useState<{ archivo: File; resultado: ResultadoPdf } | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [agregando, setAgregando] = useState(false);

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

  // Autoguardado: 1 s después del último cambio.
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
    const w = window.open("", "_blank"); // se abre en el clic para que no la bloquee el navegador
    try {
      const url = URL.createObjectURL(await bajarArchivo(p.id, a));
      if (w) w.location.href = url;
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = a.nombre;
        link.click();
      }
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
      // las ofertas que apuntaban a ese archivo se quedan sin él
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

  /* ── Importar nuestra cotización ── */
  async function elegirPdfNuestro(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast({ title: "Tiene que ser PDF", description: "Para leer las partidas se necesita el PDF original (no foto).", variant: "destructive" });
      return;
    }
    setLeyendo(true);
    try {
      const resultado = await leerPdf(f);
      setImportando({ archivo: f, resultado });
    } catch {
      toast({ title: "No se pudo leer el PDF", description: "Puedes capturar las partidas a mano.", variant: "destructive" });
    } finally {
      setLeyendo(false);
    }
  }

  async function confirmarImportacion(filas: PartidaLeida[], guardarPdf: boolean, monedaPdf: Moneda) {
    if (!importando) return;
    const nuevas: Partida[] = filas.map((f) => ({
      id: nid(),
      descripcion: f.descripcion,
      modelo: f.modelo,
      cantidad: f.cantidad,
      unidad: f.unidad,
      venta: f.precio,
      costoEst: 0,
      notas: "",
      ofertas: [],
      elegida: "",
    }));
    cambiar((x) => ({
      ...x,
      moneda: x.partidas.length === 0 ? monedaPdf : x.moneda,
      partidas: [...x.partidas, ...nuevas],
    }));
    const archivo = importando.archivo;
    setImportando(null);
    toast({ title: `${nuevas.length} partidas agregadas`, description: "Revisa que cantidades y precios estén bien." });
    if (guardarPdf) await onSubir(archivo, "nuestra");
  }

  function agregarPartida(pa: Omit<Partida, "id" | "ofertas" | "elegida">) {
    cambiar((x) => ({ ...x, partidas: [...x.partidas, { ...pa, id: nid(), ofertas: [], elegida: "" }] }));
    setAgregando(false);
  }

  function copiar(texto: string, titulo: string) {
    navigator.clipboard?.writeText(texto).then(
      () => toast({ title: titulo }),
      () => toast({ title: "Error al copiar", variant: "destructive" }),
    );
  }

  const t = totalesProyecto(p);
  const necesitaTC = p.partidas.some((pa) => pa.ofertas.some((o) => o.moneda !== p.moneda)) && !p.tipoCambio;
  const nuestras = p.archivos.filter((a) => a.rol === "nuestra");
  const deProveedores = p.archivos.filter((a) => a.rol === "proveedor");

  return (
    <div className="space-y-6">
      {/* barra superior */}
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
      <div className="rounded-sm border border-border bg-card p-5 shadow-sm md:p-6">
        <Input
          value={p.nombre}
          onChange={(e) => set({ nombre: e.target.value })}
          aria-label="Nombre del proyecto"
          className="mb-4 h-auto border-0 bg-transparent px-0 font-heading text-2xl font-bold shadow-none focus-visible:ring-0 md:text-3xl"
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
          <Campo label="Cliente" className="col-span-2">
            <Input value={p.cliente} onChange={(e) => set({ cliente: e.target.value })} placeholder="Opcional" />
          </Campo>
          <Campo label="Folio de nuestra cotización">
            <Input value={p.folio} onChange={(e) => set({ folio: e.target.value })} placeholder="Ej. AV-118" />
          </Campo>
          <Campo label="Moneda de venta">
            <Select value={p.moneda} onValueChange={(v) => set({ moneda: v as Moneda })}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MXN">MXN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Tipo de cambio USD">
            <Input
              inputMode="decimal"
              value={p.tipoCambio ? String(p.tipoCambio) : ""}
              onChange={(e) => set({ tipoCambio: aNumero(e.target.value) })}
              placeholder="Ej. 18.50"
              className={cn(necesitaTC && "border-amber-500 ring-1 ring-amber-500")}
            />
          </Campo>
          <Campo label="Margen objetivo %">
            <Input inputMode="decimal" value={String(p.margenObjetivo)} onChange={(e) => set({ margenObjetivo: aNumero(e.target.value) })} />
          </Campo>
        </div>
        {necesitaTC && (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            Hay precios en otra moneda: pon el tipo de cambio para poder compararlos.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Select value={p.estatus} onValueChange={(v) => set({ estatus: v as Proyecto["estatus"] })}>
            <SelectTrigger className="h-9 w-40 bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Cotizando">Cotizando</SelectItem>
              <SelectItem value="Comprado">Comprado</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Precios unitarios sin IVA en todo el proyecto.</span>
        </div>
      </div>

      {/* resumen */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi etiqueta="Venta (nuestra cotización)" valor={dinero(t.venta, p.moneda)} />
        <Kpi etiqueta="Costo con proveedores" valor={dinero(t.costo, p.moneda)} nota={`${t.cotizadas} de ${t.total} partidas cotizadas`} />
        <Kpi etiqueta="Utilidad" valor={dinero(t.utilidad, p.moneda)} clase={colorMargen(t.margen, p.margenObjetivo)} nota="de las partidas cotizadas" />
        <Kpi etiqueta="Margen" valor={pct(t.margen)} clase={colorMargen(t.margen, p.margenObjetivo)} nota={`objetivo ${p.margenObjetivo}%`} />
      </div>

      {/* acciones */}
      <div className="flex flex-wrap gap-2">
        <label className={cn("inline-flex h-10 cursor-pointer items-center rounded-sm bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90", leyendo && "pointer-events-none opacity-60")}>
          {leyendo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
          {leyendo ? "Leyendo PDF…" : "Importar partidas de PDF"}
          <input type="file" accept="application/pdf" className="hidden" onChange={elegirPdfNuestro} />
        </label>
        <Button variant="outline" onClick={() => setAgregando(true)} className="h-10 rounded-sm">
          <Plus className="mr-2 h-4 w-4" /> Partida a mano
        </Button>
        <div className="flex flex-wrap gap-2 md:ml-auto">
          <Button variant="outline" onClick={() => copiar(resumenTexto(p), "Resumen copiado — pégalo en el grupo")} className="h-10 rounded-sm" disabled={p.partidas.length === 0}>
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar resumen
          </Button>
          <Button asChild className="h-10 rounded-sm bg-[#25D366] font-semibold text-white hover:bg-[#1ebe5b]">
            <a href={`https://wa.me/?text=${encodeURIComponent(resumenTexto(p))}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Enviar por WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={() => copiar(tablaExcel(p), "Tabla copiada — pégala en Excel (celda A1)")} className="h-10 rounded-sm" disabled={p.partidas.length === 0}>
            <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar a Excel
          </Button>
        </div>
      </div>

      {agregando && <FormPartida onGuardar={agregarPartida} onCancelar={() => setAgregando(false)} moneda={p.moneda} />}

      {/* partidas */}
      {p.partidas.length === 0 && !agregando ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto mb-3 h-9 w-9 text-accent-foreground/60" />
          Sube el PDF de <strong className="text-foreground">nuestra cotización</strong> con “Importar partidas de PDF” para
          sacar las partidas y precios de venta automáticamente, o agrégalas a mano.
        </div>
      ) : (
        <div className="space-y-4">
          {p.partidas.map((pa, i) => (
            <TarjetaPartida
              key={pa.id}
              n={i + 1}
              pa={pa}
              p={p}
              archivosProv={deProveedores}
              onCambiar={(fn) => setPartida(pa.id, fn)}
              onQuitar={() => {
                if (pa.ofertas.length > 0 && !window.confirm("Esta partida tiene ofertas de proveedores. ¿Quitarla de todos modos?")) return;
                cambiar((x) => ({ ...x, partidas: x.partidas.filter((z) => z.id !== pa.id) }));
              }}
              onSubir={(f) => onSubir(f, "proveedor")}
              onAbrirArchivo={abrirArchivo}
              subiendo={subiendo}
            />
          ))}
        </div>
      )}

      {/* archivos y notas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-foreground">Archivos</h3>
          {p.archivos.length === 0 && <p className="mb-3 text-sm text-muted-foreground">Aún no hay archivos.</p>}
          {[["Nuestra cotización", nuestras], ["De proveedores", deProveedores]].map(([titulo, lista]) =>
            (lista as Archivo[]).length > 0 ? (
              <div key={titulo as string} className="mb-3">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{titulo as string}</p>
                <ul className="space-y-1">
                  {(lista as Archivo[]).map((a) => (
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
            ) : null,
          )}
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
          <Textarea rows={6} value={p.notas} onChange={(e) => set({ notas: e.target.value })} placeholder="Fechas de entrega a obra, acuerdos con el cliente, pendientes…" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onEliminar} className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar proyecto
        </Button>
      </div>

      {importando && (
        <DialogoImportar
          resultado={importando.resultado}
          nombreArchivo={importando.archivo.name}
          onCancelar={() => setImportando(null)}
          onConfirmar={confirmarImportacion}
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
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{etiqueta}</div>
      <div className={cn("mt-1 truncate font-heading text-xl font-bold text-foreground md:text-2xl", clase)}>{valor}</div>
      {nota && <div className="mt-0.5 text-xs text-muted-foreground">{nota}</div>}
    </div>
  );
}

function Campo({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* ───────────── Partida ───────────── */

function FormPartida({
  inicial, moneda, onGuardar, onCancelar,
}: {
  inicial?: Partida;
  moneda: Moneda;
  onGuardar: (pa: Omit<Partida, "id" | "ofertas" | "elegida">) => void;
  onCancelar: () => void;
}) {
  const [f, setF] = useState({
    descripcion: inicial?.descripcion || "",
    modelo: inicial?.modelo || "",
    cantidad: inicial ? String(inicial.cantidad) : "1",
    unidad: inicial?.unidad || "pza",
    venta: inicial?.venta ? String(inicial.venta) : "",
    costoEst: inicial?.costoEst ? String(inicial.costoEst) : "",
    notas: inicial?.notas || "",
  });
  const s = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.descripcion.trim()) return;
        onGuardar({
          descripcion: f.descripcion.trim(),
          modelo: f.modelo.trim(),
          cantidad: aNumero(f.cantidad),
          unidad: f.unidad.trim(),
          venta: aNumero(f.venta),
          costoEst: aNumero(f.costoEst),
          notas: f.notas,
        });
      }}
      className="rounded-sm border border-accent/50 bg-card p-5 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Campo label="Descripción" className="col-span-2 md:col-span-3">
          <Input autoFocus value={f.descripcion} onChange={(e) => s({ descripcion: e.target.value })} placeholder="Ej. Unidad paquete 5 TR" />
        </Campo>
        <Campo label="Marca / modelo" className="col-span-2 md:col-span-3">
          <Input value={f.modelo} onChange={(e) => s({ modelo: e.target.value })} placeholder="Opcional" />
        </Campo>
        <Campo label="Cantidad">
          <Input inputMode="decimal" value={f.cantidad} onChange={(e) => s({ cantidad: e.target.value })} />
        </Campo>
        <Campo label="Unidad">
          <Input list="dl-unidades" value={f.unidad} onChange={(e) => s({ unidad: e.target.value })} />
        </Campo>
        <Campo label={`Venta P.U. (${moneda})`}>
          <Input inputMode="decimal" value={f.venta} onChange={(e) => s({ venta: e.target.value })} placeholder="Lo que cotizamos" />
        </Campo>
        <Campo label={`Costo estimado P.U.`}>
          <Input inputMode="decimal" value={f.costoEst} onChange={(e) => s({ costoEst: e.target.value })} placeholder="Opcional" />
        </Campo>
        <Campo label="Notas" className="col-span-2">
          <Input value={f.notas} onChange={(e) => s({ notas: e.target.value })} placeholder="Especificaciones a respetar…" />
        </Campo>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={!f.descripcion.trim()} className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
          <Check className="mr-2 h-4 w-4" /> {inicial ? "Guardar partida" : "Agregar partida"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancelar} className="rounded-sm">Cancelar</Button>
      </div>
    </form>
  );
}

function TarjetaPartida({
  n, pa, p, archivosProv, onCambiar, onQuitar, onSubir, onAbrirArchivo, subiendo,
}: {
  n: number;
  pa: Partida;
  p: Proyecto;
  archivosProv: Archivo[];
  onCambiar: (fn: (pa: Partida) => Partida) => void;
  onQuitar: () => void;
  onSubir: (f: File) => Promise<Archivo | null>;
  onAbrirArchivo: (a: Archivo) => void;
  subiendo: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [nuevaOferta, setNuevaOferta] = useState(false);
  const [editOferta, setEditOferta] = useState<string | null>(null);
  const a = analizar(pa, p);
  const ordenadas = pa.ofertas
    .slice()
    .sort((x, y) => (enMonedaProyecto(x, p) ?? Infinity) - (enMonedaProyecto(y, p) ?? Infinity));

  if (editando) {
    return (
      <FormPartida
        inicial={pa}
        moneda={p.moneda}
        onCancelar={() => setEditando(false)}
        onGuardar={(d) => {
          onCambiar((x) => ({ ...x, ...d }));
          setEditando(false);
        }}
      />
    );
  }

  const guardarOferta = (o: Oferta) => {
    onCambiar((x) => {
      const existe = x.ofertas.some((z) => z.id === o.id);
      const ofertas = existe ? x.ofertas.map((z) => (z.id === o.id ? o : z)) : [...x.ofertas, o];
      return { ...x, ofertas };
    });
    setNuevaOferta(false);
    setEditOferta(null);
  };

  return (
    <div className={cn("rounded-sm border bg-card shadow-sm", a.porElegida ? "border-emerald-500/40" : "border-border")}>
      {/* encabezado de la partida */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-lg font-bold leading-snug text-foreground">
            <span className="mr-2 text-muted-foreground">{n}.</span>
            {pa.descripcion || "Sin descripción"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[pa.modelo, `${pa.cantidad} ${pa.unidad}`, pa.notas].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex items-start gap-4 sm:text-right">
          <div className="flex-1 sm:flex-none">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Venta P.U.</p>
            <p className="font-heading font-bold text-foreground">{dinero(pa.venta, p.moneda)}</p>
            <p className="text-xs text-muted-foreground">total {dinero(pa.venta * pa.cantidad, p.moneda)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Margen</p>
            <p className={cn("font-heading text-lg font-bold", colorMargen(a.margen, p.margenObjetivo))}>{pct(a.margen)}</p>
            {a.utilidad !== null && (
              <p className={cn("text-xs", colorMargen(a.margen, p.margenObjetivo))}>{dinero(a.utilidad, p.moneda)}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => setEditando(true)} aria-label="Editar partida" className="rounded-sm p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <PencilLine className="h-4 w-4" />
            </button>
            <button type="button" onClick={onQuitar} aria-label="Quitar partida" className="rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {pa.costoEst > 0 && (
        <p className="-mt-2 px-4 pb-3 text-xs text-muted-foreground md:px-5">
          Costo estimado al cotizar: {dinero(pa.costoEst, p.moneda)} c/u
          {a.costoUnit !== null && (
            <span className={a.costoUnit > pa.costoEst ? " font-semibold text-amber-700" : " font-semibold text-emerald-700"}>
              {" "}· el proveedor sale {a.costoUnit > pa.costoEst ? "arriba" : "abajo"} por {dinero(Math.abs(a.costoUnit - pa.costoEst), p.moneda)}
            </span>
          )}
        </p>
      )}

      {/* ofertas */}
      <div className="border-t border-border bg-secondary/20 px-4 py-3 md:px-5">
        {ordenadas.length === 0 && !nuevaOferta && (
          <p className="py-1 text-sm text-muted-foreground">Sin precios de proveedores todavía.</p>
        )}
        {ordenadas.length > 0 && (
          <div className="mb-2 hidden grid-cols-[2rem_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_6rem_4.5rem] gap-3 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
            <span />
            <span>Proveedor</span>
            <span className="text-right">Precio P.U.</span>
            <span>Entrega</span>
            <span className="text-right">Margen</span>
            <span />
          </div>
        )}
        <div className="space-y-1.5">
          {ordenadas.map((o) =>
            editOferta === o.id ? (
              <FormOferta
                key={o.id}
                inicial={o}
                p={p}
                pa={pa}
                archivosProv={archivosProv}
                onSubir={onSubir}
                subiendo={subiendo}
                onGuardar={guardarOferta}
                onCancelar={() => setEditOferta(null)}
              />
            ) : (
              <FilaOferta
                key={o.id}
                o={o}
                p={p}
                pa={pa}
                elegida={pa.elegida === o.id}
                masBarata={a.masBarata === o.id && ordenadas.length > 1}
                archivo={archivosProv.find((z) => z.id === o.archivoId) || null}
                onElegir={() => onCambiar((x) => ({ ...x, elegida: x.elegida === o.id ? "" : o.id }))}
                onEditar={() => setEditOferta(o.id)}
                onQuitar={() => onCambiar((x) => ({ ...x, ofertas: x.ofertas.filter((z) => z.id !== o.id), elegida: x.elegida === o.id ? "" : x.elegida }))}
                onAbrirArchivo={onAbrirArchivo}
              />
            ),
          )}
        </div>
        {nuevaOferta ? (
          <FormOferta
            p={p}
            pa={pa}
            archivosProv={archivosProv}
            onSubir={onSubir}
            subiendo={subiendo}
            onGuardar={guardarOferta}
            onCancelar={() => setNuevaOferta(false)}
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setNuevaOferta(true)} className="mt-1 rounded-sm font-semibold text-foreground">
            <Plus className="mr-1.5 h-4 w-4" /> Agregar precio de proveedor
          </Button>
        )}
      </div>
    </div>
  );
}

function FilaOferta({
  o, p, pa, elegida, masBarata, archivo, onElegir, onEditar, onQuitar, onAbrirArchivo,
}: {
  o: Oferta;
  p: Proyecto;
  pa: Partida;
  elegida: boolean;
  masBarata: boolean;
  archivo: Archivo | null;
  onElegir: () => void;
  onEditar: () => void;
  onQuitar: () => void;
  onAbrirArchivo: (a: Archivo) => void;
}) {
  const c = enMonedaProyecto(o, p);
  const m = c !== null && pa.venta > 0 ? (pa.venta - c) / pa.venta : null;
  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-sm px-2 py-2 text-sm md:grid-cols-[2rem_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_6rem_4.5rem]",
        elegida ? "bg-emerald-500/10 ring-1 ring-emerald-500/40" : "bg-card",
      )}
    >
      <button
        type="button"
        onClick={onElegir}
        title={elegida ? "Quitar como elegido" : "Elegir este proveedor"}
        aria-pressed={elegida}
        className={cn(
          "row-span-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors md:row-span-1",
          elegida ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40 hover:border-emerald-600",
        )}
      >
        {elegida && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">
          {o.proveedor || "Proveedor"}
          {masBarata && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">Más barato</span>}
        </p>
        {(o.notas || archivo) && (
          <p className="truncate text-xs text-muted-foreground">
            {archivo && (
              <button type="button" onClick={() => onAbrirArchivo(archivo)} className="mr-2 inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground">
                <Paperclip className="h-3 w-3" /> PDF
              </button>
            )}
            {o.notas}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="font-heading font-bold text-foreground">{dinero(o.precio, o.moneda)}</p>
        {o.moneda !== p.moneda && <p className="text-xs text-muted-foreground">{c === null ? "falta tipo de cambio" : `≈ ${dinero(c, p.moneda)}`}</p>}
      </div>
      <p className="col-start-2 flex items-center gap-1 text-xs text-muted-foreground md:col-start-auto md:text-sm">
        <Truck className="h-3.5 w-3.5 shrink-0 md:hidden" />
        {o.entrega || "—"}
      </p>
      <p className={cn("text-right font-heading font-bold", colorMargen(m, p.margenObjetivo))}>{pct(m)}</p>
      <div className="col-start-3 row-start-1 hidden justify-end gap-0.5 md:col-start-auto md:row-start-auto md:flex">
        <button type="button" onClick={onEditar} aria-label="Editar precio" className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
          <PencilLine className="h-4 w-4" />
        </button>
        <button type="button" onClick={onQuitar} aria-label="Quitar precio" className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* móvil: acciones en una línea aparte */}
      <div className="col-span-3 flex justify-end gap-3 text-xs md:hidden">
        <button type="button" onClick={onEditar} className="font-semibold text-muted-foreground">Editar</button>
        <button type="button" onClick={onQuitar} className="font-semibold text-muted-foreground">Quitar</button>
      </div>
    </div>
  );
}

/** Lecturas de PDF de proveedores ya hechas en esta sesión (por id de archivo). */
const cacheLecturas = new Map<string, ResultadoPdf>();

function FormOferta({
  inicial, p, pa, archivosProv, onSubir, subiendo, onGuardar, onCancelar,
}: {
  inicial?: Oferta;
  p: Proyecto;
  pa: Partida;
  archivosProv: Archivo[];
  onSubir: (f: File) => Promise<Archivo | null>;
  subiendo: boolean;
  onGuardar: (o: Oferta) => void;
  onCancelar: () => void;
}) {
  const [f, setF] = useState({
    proveedor: inicial?.proveedor || "",
    precio: inicial?.precio ? String(inicial.precio) : "",
    moneda: (inicial?.moneda || p.moneda) as Moneda,
    entrega: inicial?.entrega || "",
    notas: inicial?.notas || "",
    archivoId: inicial?.archivoId || "",
  });
  const [lectura, setLectura] = useState<ResultadoPdf | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const s = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  async function leer(a: Archivo, file?: File) {
    if (a.tipo !== "application/pdf") return;
    const enCache = cacheLecturas.get(a.id);
    if (enCache) return setLectura(enCache);
    setLeyendo(true);
    try {
      const blob = file || (await bajarArchivo(p.id, a));
      const r = await leerPdf(blob);
      cacheLecturas.set(a.id, r);
      setLectura(r);
    } catch {
      setLectura(null);
    } finally {
      setLeyendo(false);
    }
  }

  async function elegirArchivo(id: string) {
    s({ archivoId: id });
    setLectura(null);
    const a = archivosProv.find((z) => z.id === id);
    if (a) leer(a);
  }

  async function subirNuevo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const a = await onSubir(file);
    if (a) {
      s({ archivoId: a.id });
      leer(a, file);
    }
  }

  // Precios del PDF ordenados por parecido con la partida (las palabras en común primero).
  const sugerencias = useMemo(() => {
    if (!lectura) return [];
    const palabras = normalizar(`${pa.descripcion} ${pa.modelo}`).split(" ").filter((w) => w.length > 2);
    return lectura.partidas
      .filter((x) => x.precio > 0)
      .map((x) => {
        const t = normalizar(`${x.descripcion} ${x.modelo}`);
        return { x, puntos: palabras.filter((w) => t.includes(w)).length };
      })
      .sort((a, b) => b.puntos - a.puntos)
      .slice(0, 6);
  }, [lectura, pa.descripcion, pa.modelo]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.proveedor.trim() && !f.precio) return;
        onGuardar({
          id: inicial?.id || nid(),
          proveedor: f.proveedor.trim(),
          precio: aNumero(f.precio),
          moneda: f.moneda,
          entrega: f.entrega.trim(),
          notas: f.notas.trim(),
          archivoId: f.archivoId,
        });
      }}
      className="mt-2 rounded-sm border border-accent/50 bg-card p-3"
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_5.5rem_minmax(0,1fr)]">
        <Input list="dl-proveedores" autoFocus placeholder="Proveedor" value={f.proveedor} onChange={(e) => s({ proveedor: e.target.value })} className="col-span-2 md:col-span-1" aria-label="Proveedor" />
        <Input inputMode="decimal" placeholder="Precio unitario sin IVA" value={f.precio} onChange={(e) => s({ precio: e.target.value })} aria-label="Precio unitario" />
        <Select value={f.moneda} onValueChange={(v) => s({ moneda: v as Moneda })}>
          <SelectTrigger className="bg-background" aria-label="Moneda"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="MXN">MXN</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Entrega (ej. 2 semanas)" value={f.entrega} onChange={(e) => s({ entrega: e.target.value })} className="col-span-2 md:col-span-1" aria-label="Tiempo de entrega" />
        <Input placeholder="Notas (garantía, flete, marca…)" value={f.notas} onChange={(e) => s({ notas: e.target.value })} className="col-span-2 md:col-span-2" aria-label="Notas" />
        <div className="col-span-2 flex items-center gap-2">
          {/* <select> nativo a propósito: el Select de Radix se resetea cuando la opción recién subida aparece en la lista */}
          <select
            value={f.archivoId}
            onChange={(e) => (e.target.value ? elegirArchivo(e.target.value) : s({ archivoId: "" }))}
            aria-label="Cotización del proveedor"
            className="h-10 min-w-0 flex-1 truncate rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Sin PDF del proveedor</option>
            {archivosProv.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <label className={cn("inline-flex h-10 shrink-0 cursor-pointer items-center rounded-sm border border-dashed border-accent/60 px-3 text-xs font-semibold hover:bg-accent/10", subiendo && "pointer-events-none opacity-60")}>
            {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Subir PDF</span>
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={subirNuevo} />
          </label>
        </div>
      </div>

      {leyendo && (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando precios en el PDF…
        </p>
      )}
      {sugerencias.length > 0 && (
        <div className="mt-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Precios encontrados en el PDF — toca uno para usarlo</p>
          <div className="flex flex-wrap gap-1.5">
            {sugerencias.map(({ x }, i) => (
              <button
                key={i}
                type="button"
                onClick={() => s({ precio: String(x.precio), moneda: lectura!.moneda })}
                className="max-w-full rounded-sm border border-border bg-secondary/40 px-2 py-1 text-left text-xs hover:border-accent"
              >
                <span className="font-bold">{dinero(x.precio, lectura!.moneda)}</span>{" "}
                <span className="text-muted-foreground">{(x.descripcion || x.modelo).slice(0, 60)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {lectura && sugerencias.length === 0 && !leyendo && (
        <p className="mt-2 text-xs text-muted-foreground">No se encontraron precios en ese PDF; captúralo a mano.</p>
      )}

      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={!f.proveedor.trim() && !f.precio} className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90">
          <Check className="mr-1.5 h-4 w-4" /> {inicial ? "Guardar" : "Agregar"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancelar} className="rounded-sm">Cancelar</Button>
      </div>
    </form>
  );
}

/* ───────────── Importar partidas del PDF ───────────── */

interface FilaImport extends PartidaLeida {
  incluir: boolean;
}

function DialogoImportar({
  resultado, nombreArchivo, onCancelar, onConfirmar,
}: {
  resultado: ResultadoPdf;
  nombreArchivo: string;
  onCancelar: () => void;
  onConfirmar: (filas: PartidaLeida[], guardarPdf: boolean, moneda: Moneda) => void;
}) {
  const [filas, setFilas] = useState<FilaImport[]>(resultado.partidas.map((x) => ({ ...x, incluir: true })));
  const [guardarPdf, setGuardarPdf] = useState(true);
  const [moneda, setMoneda] = useState<Moneda>(resultado.moneda);
  const setFila = (i: number, patch: Partial<FilaImport>) => setFilas((fs) => fs.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const elegidas = filas.filter((x) => x.incluir && x.descripcion.trim());
  const total = elegidas.reduce((s, x) => s + x.cantidad * x.precio, 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onCancelar()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-sm">
        <DialogHeader>
          <DialogTitle>Partidas encontradas en el PDF</DialogTitle>
          <DialogDescription>
            {nombreArchivo} — revisa y corrige antes de agregarlas. Los precios son los de venta (lo que cotizamos al cliente).
          </DialogDescription>
        </DialogHeader>

        {filas.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No se encontraron partidas con precio en este PDF (puede ser un escaneo o un formato raro). Agrégalas a mano con
            “Partida a mano”.
          </div>
        ) : (
          <>
            {!resultado.conEncabezado && (
              <p className="rounded-sm bg-amber-500/10 px-3 py-2 text-xs text-amber-900">
                No se reconoció la tabla del PDF; estas partidas se adivinaron por renglones con precio. Revísalas con cuidado.
              </p>
            )}
            <div className="hidden grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem_7.5rem] gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
              <span />
              <span>Descripción</span>
              <span>Cant.</span>
              <span>Unidad</span>
              <span>Venta P.U.</span>
            </div>
            <div className="space-y-2">
              {filas.map((x, i) => (
                <div key={i} className={cn("grid grid-cols-[1.5rem_1fr_1fr_1fr] items-center gap-2 md:grid-cols-[1.5rem_minmax(0,1fr)_5rem_4.5rem_7.5rem]", !x.incluir && "opacity-40")}>
                  <Checkbox checked={x.incluir} onCheckedChange={(v) => setFila(i, { incluir: !!v })} aria-label="Incluir partida" className="row-span-2 md:row-span-1" />
                  <Input value={x.descripcion} onChange={(e) => setFila(i, { descripcion: e.target.value })} className="col-span-3 md:col-span-1" aria-label="Descripción" />
                  <Input inputMode="decimal" value={String(x.cantidad)} onChange={(e) => setFila(i, { cantidad: aNumero(e.target.value) })} aria-label="Cantidad" />
                  <Input value={x.unidad} onChange={(e) => setFila(i, { unidad: e.target.value })} aria-label="Unidad" />
                  <Input inputMode="decimal" value={String(x.precio)} onChange={(e) => setFila(i, { precio: aNumero(e.target.value) })} aria-label="Precio de venta unitario" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox checked={guardarPdf} onCheckedChange={(v) => setGuardarPdf(!!v)} /> Guardar el PDF en los archivos del proyecto
              </label>
              <div className="flex items-center gap-3">
                <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)}>
                  <SelectTrigger className="h-9 w-24 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                <span className="font-heading font-bold">Subtotal {dinero(total, moneda)}</span>
              </div>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancelar} className="rounded-sm">Cancelar</Button>
          <Button
            disabled={elegidas.length === 0}
            onClick={() => onConfirmar(elegidas.map(({ incluir: _i, ...r }) => r), guardarPdf, moneda)}
            className="rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
          >
            Agregar {elegidas.length} partidas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
