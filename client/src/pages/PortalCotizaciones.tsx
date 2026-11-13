import { useEffect, useMemo, useState } from "react";
import { useSeo } from "@/lib/seo";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useToast } from "@/hooks/use-toast";
import { getSession, authHeaders, clearSession } from "@/lib/portal-auth";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ClipboardCopy, Copy, FileText, Loader2, LogOut, Package, Paperclip, Plus,
  RefreshCcw, Save, Search, Trash2, X, FileSpreadsheet, PencilLine,
} from "lucide-react";

/* ═════════════════════════ Tipos ═════════════════════════ */

const ESTATUS = ["Solicitada", "Recibida", "Aprobada", "Rechazada"] as const;
type Estatus = (typeof ESTATUS)[number];
type Moneda = "MXN" | "USD";

interface Partida {
  descripcion: string;
  marca: string;
  cantidad: number;
  unidad: string;
  precio: number;
}

interface Adjunto {
  nombre: string;
  tipo: string;
  tamano: number;
}

interface Cotizacion {
  id: string;
  folio: string;
  proyecto: string;
  cliente: string;
  proveedor: string;
  contacto: string;
  telefono: string;
  correo: string;
  folioProveedor: string;
  fecha: string;
  vigencia: string;
  moneda: Moneda;
  entrega: string;
  condicionesPago: string;
  estatus: Estatus;
  iva: boolean;
  notas: string;
  partidas: Partida[];
  adjunto: Adjunto | null;
  creadoPor: string;
  actualizadoPor: string;
  creado: number;
  actualizado: number;
}

/** En el editor los números se manejan como texto para no pelear con el input. */
interface PartidaDraft {
  uid: string;
  descripcion: string;
  marca: string;
  cantidad: string;
  unidad: string;
  precio: string;
}

type Draft = Omit<
  Cotizacion,
  "id" | "folio" | "partidas" | "adjunto" | "creadoPor" | "actualizadoPor" | "creado" | "actualizado"
> & {
  id?: string;
  folio?: string;
  adjunto?: Adjunto | null;
  partidas: PartidaDraft[];
};

/* ═════════════════════════ Utilidades ═════════════════════════ */

const IVA = 0.16;
const MAX_ADJUNTO = 4 * 1024 * 1024;
const UNIDADES = ["pza", "m", "m²", "m³", "kg", "lt", "rollo", "caja", "juego", "lote", "servicio", "hr"];

class SesionExpirada extends Error {}

const uid = () => Math.random().toString(36).slice(2, 10);

function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fechaCorta(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dinero(n: number, moneda: Moneda = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    currencyDisplay: moneda === "MXN" ? "narrowSymbol" : "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

const aNumero = (s: string) => {
  const n = Number(String(s).replace(/[,\s$]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function totales(partidas: { cantidad: number; precio: number }[], iva: boolean) {
  const subtotal = partidas.reduce((s, p) => s + (p.cantidad || 0) * (p.precio || 0), 0);
  const impuesto = iva ? subtotal * IVA : 0;
  return { subtotal, impuesto, total: subtotal + impuesto };
}

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Todas las palabras de la búsqueda deben aparecer (en cualquier orden). */
function coincide(texto: string, q: string): boolean {
  const t = normalizar(texto);
  return normalizar(q)
    .split(" ")
    .filter(Boolean)
    .every((w) => t.includes(w));
}

const vencida = (c: { vigencia: string; estatus: Estatus }) =>
  !!c.vigencia && c.vigencia < hoy() && c.estatus !== "Rechazada" && c.estatus !== "Aprobada";

const ESTILO_ESTATUS: Record<Estatus, string> = {
  Solicitada: "bg-sky-500/15 text-sky-800",
  Recibida: "bg-accent/20 text-accent-foreground",
  Aprobada: "bg-emerald-500/15 text-emerald-800",
  Rechazada: "bg-destructive/10 text-destructive",
};

function vacio(): Draft {
  return {
    proyecto: "",
    cliente: "",
    proveedor: "",
    contacto: "",
    telefono: "",
    correo: "",
    folioProveedor: "",
    fecha: hoy(),
    vigencia: "",
    moneda: "MXN",
    entrega: "",
    condicionesPago: "",
    estatus: "Recibida",
    iva: true,
    notas: "",
    partidas: [{ uid: uid(), descripcion: "", marca: "", cantidad: "1", unidad: "pza", precio: "" }],
  };
}

function aDraft(c: Cotizacion): Draft {
  const { partidas, creadoPor: _a, actualizadoPor: _b, creado: _c, actualizado: _d, ...resto } = c;
  return {
    ...resto,
    partidas: partidas.map((p) => ({
      uid: uid(),
      descripcion: p.descripcion,
      marca: p.marca,
      cantidad: String(p.cantidad ?? ""),
      unidad: p.unidad,
      precio: p.precio ? String(p.precio) : "",
    })),
  };
}

/** Las fotos grandes se comprimen; los PDF se suben tal cual (máx 4 MB). */
function prepararArchivo(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.size < 1.5 * 1024 * 1024) return Promise.resolve(file);
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 2000;
      const k = Math.min(1, max / Math.max(img.width, img.height));
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

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(path, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), ...authHeaders() },
  });
  if (res.status === 401) throw new SesionExpirada();
  return res;
}

async function errorDe(res: Response, fallback: string): Promise<Error> {
  const data = await res.json().catch(() => null);
  return new Error(data?.error || fallback);
}

const ENCABEZADOS = [
  "Folio", "Fecha", "Proyecto", "Cliente", "Proveedor", "Estatus", "Descripción",
  "Marca / Modelo", "Cantidad", "Unidad", "Precio unitario", "Importe", "Moneda",
];

function filaExcel(c: Cotizacion, p: Partida): string[] {
  return [
    c.folio, c.fecha, c.proyecto, c.cliente, c.proveedor, c.estatus, p.descripcion, p.marca,
    String(p.cantidad), p.unidad, p.precio.toFixed(2), (p.cantidad * p.precio).toFixed(2), c.moneda,
  ];
}

/* ═════════════════════════ Página ═════════════════════════ */

export default function PortalCotizaciones() {
  useSeo({
    lang: "es-MX",
    title: "Cotizaciones | Portal Avantrik",
    robots: "noindex, nofollow",
  });
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const session = getSession();

  const [items, setItems] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("cotizaciones");
  const [editando, setEditando] = useState<Draft | null>(null);

  // filtros de la lista
  const [q, setQ] = useState("");
  const [fProyecto, setFProyecto] = useState("");
  const [fEstatus, setFEstatus] = useState("");
  // buscador de materiales
  const [qMat, setQMat] = useState("");

  useEffect(() => {
    if (!session) navigate("/portal");
  }, [session, navigate]);

  function manejarError(err: unknown, msg: string) {
    if (err instanceof SesionExpirada) {
      clearSession();
      navigate("/portal");
      return;
    }
    toast({
      title: "Error",
      description: err instanceof Error && err.message ? err.message : msg,
      variant: "destructive",
    });
  }

  async function cargar() {
    setLoading(true);
    try {
      const res = await api("/api/cotizaciones");
      if (!res.ok) throw await errorDe(res, "No se pudieron cargar las cotizaciones.");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      manejarError(err, "No se pudieron cargar las cotizaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ordenadas = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b.creado - a.creado),
    [items],
  );

  const proyectos = useMemo(
    () => Array.from(new Set(items.map((i) => i.proyecto).filter(Boolean))).sort(),
    [items],
  );
  const proveedores = useMemo(
    () => Array.from(new Set(items.map((i) => i.proveedor).filter(Boolean))).sort(),
    [items],
  );
  const clientes = useMemo(
    () => Array.from(new Set(items.map((i) => i.cliente).filter(Boolean))).sort(),
    [items],
  );

  const filtradas = useMemo(
    () =>
      ordenadas.filter((c) => {
        if (fProyecto && c.proyecto !== fProyecto) return false;
        if (fEstatus && c.estatus !== fEstatus) return false;
        if (!q.trim()) return true;
        const texto = [
          c.folio, c.proyecto, c.cliente, c.proveedor, c.contacto, c.folioProveedor, c.notas,
          ...c.partidas.map((p) => `${p.descripcion} ${p.marca}`),
        ].join(" ");
        return coincide(texto, q);
      }),
    [ordenadas, q, fProyecto, fEstatus],
  );

  const resumen = useMemo(() => {
    let mxn = 0;
    let usd = 0;
    filtradas.forEach((c) => {
      const { total } = totales(c.partidas, c.iva);
      if (c.moneda === "USD") usd += total;
      else mxn += total;
    });
    return { mxn, usd, proveedores: new Set(filtradas.map((c) => c.proveedor).filter(Boolean)).size };
  }, [filtradas]);

  function abrirNueva() {
    setEditando({ ...vacio(), proyecto: fProyecto });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function abrir(c: Cotizacion) {
    setEditando(aDraft(c));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Misma lista de materiales para pedírsela a otro proveedor y comparar. */
  function pedirAOtro(c: Cotizacion) {
    const d = aDraft(c);
    setEditando({
      ...vacio(),
      proyecto: d.proyecto,
      cliente: d.cliente,
      moneda: d.moneda,
      iva: d.iva,
      estatus: "Solicitada",
      notas: `Misma lista que ${c.folio} (${c.proveedor || "sin proveedor"}).`,
      partidas: d.partidas.map((p) => ({ ...p, uid: uid(), precio: "" })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminar(c: Cotizacion) {
    if (!window.confirm(`¿Eliminar ${c.folio} de ${c.proveedor || "proveedor sin nombre"}? No se puede deshacer.`)) return;
    try {
      const res = await api(`/api/cotizaciones/${encodeURIComponent(c.id)}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw await errorDe(res, "No se pudo eliminar.");
      setItems((its) => its.filter((i) => i.id !== c.id));
      setEditando(null);
      toast({ title: `${c.folio} eliminada` });
    } catch (err) {
      manejarError(err, "No se pudo eliminar.");
    }
  }

  async function abrirAdjunto(c: Cotizacion) {
    // La ventana se abre en el clic (antes del await) para que no la bloquee el navegador.
    const w = window.open("", "_blank");
    try {
      const res = await api(`/api/cotizaciones/${encodeURIComponent(c.id)}/adjunto`);
      if (!res.ok) throw await errorDe(res, "No se pudo abrir el archivo.");
      const url = URL.createObjectURL(await res.blob());
      if (w) {
        w.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = c.adjunto?.nombre || `${c.folio}`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      w?.close();
      manejarError(err, "No se pudo abrir el archivo.");
    }
  }

  function copiar(filas: string[][], cuantas: string) {
    if (filas.length === 0) {
      toast({ title: "No hay nada que copiar con estos filtros" });
      return;
    }
    const tsv = [ENCABEZADOS, ...filas].map((f) => f.map((v) => v.replace(/[\t\n]/g, " ")).join("\t")).join("\n");
    navigator.clipboard?.writeText(tsv).then(
      () => toast({ title: "Copiado", description: `${cuantas}. Pégalo en Excel en la celda A1.` }),
      () => toast({ title: "Error al copiar", variant: "destructive" }),
    );
  }

  function guardada(c: Cotizacion) {
    setItems((its) => {
      const i = its.findIndex((x) => x.id === c.id);
      if (i === -1) return [c, ...its];
      const copia = its.slice();
      copia[i] = c;
      return copia;
    });
  }

  if (!session) return null;

  return (
    <Layout>
      {/* Encabezado */}
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
                <FileSpreadsheet className="h-8 w-8 text-accent" /> Cotizaciones
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/60">{session.email}</p>
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
        {/* datalists compartidos para autocompletar */}
        <datalist id="dl-proyectos">{proyectos.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="dl-proveedores">{proveedores.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="dl-clientes">{clientes.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="dl-unidades">{UNIDADES.map((u) => <option key={u} value={u} />)}</datalist>

        {editando ? (
          <Editor
            inicial={editando}
            onCerrar={() => setEditando(null)}
            onGuardada={(c) => {
              guardada(c);
              setEditando(null);
              setTab("cotizaciones");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onEliminar={(id) => {
              const c = items.find((i) => i.id === id);
              if (c) eliminar(c);
            }}
            onAdjuntoQuitado={(id) =>
              setItems((its) => its.map((i) => (i.id === id ? { ...i, adjunto: null } : i)))
            }
            onError={manejarError}
          />
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-2 rounded-sm bg-secondary/60 p-2">
                <TabsTrigger
                  value="cotizaciones"
                  className="rounded-sm py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <FileText className="mr-2 h-4 w-4" /> Cotizaciones
                </TabsTrigger>
                <TabsTrigger
                  value="materiales"
                  className="rounded-sm py-2.5 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Package className="mr-2 h-4 w-4" /> Buscar material
                </TabsTrigger>
              </TabsList>
              <Button
                onClick={abrirNueva}
                className="h-11 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Nueva cotización
              </Button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-accent-foreground/70" />
                Cargando…
              </div>
            ) : (
              <>
                {/* ═══════════ TAB: COTIZACIONES ═══════════ */}
                <TabsContent value="cotizaciones" className="mt-0">
                  <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_14rem_12rem_auto]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por proyecto, proveedor, folio o material…"
                        className="bg-background pl-9"
                      />
                    </div>
                    <Select value={fProyecto || "__all__"} onValueChange={(v) => setFProyecto(v === "__all__" ? "" : v)}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Todos los proyectos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos los proyectos</SelectItem>
                        {proyectos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={fEstatus || "__all__"} onValueChange={(v) => setFEstatus(v === "__all__" ? "" : v)}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Todos los estatus" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos los estatus</SelectItem>
                        {ESTATUS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() =>
                        copiar(
                          filtradas.flatMap((c) => c.partidas.map((p) => filaExcel(c, p))),
                          `${filtradas.length} cotizaciones`,
                        )
                      }
                      className="rounded-sm border-primary font-bold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar a Excel
                    </Button>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Stat valor={String(filtradas.length)} etiqueta="Cotizaciones" />
                    <Stat valor={String(resumen.proveedores)} etiqueta="Proveedores" />
                    <Stat valor={dinero(resumen.mxn)} etiqueta="Total MXN (con IVA)" />
                    <Stat valor={dinero(resumen.usd, "USD")} etiqueta="Total USD (con IVA)" />
                  </div>

                  {filtradas.length === 0 ? (
                    <div className="rounded-sm border border-dashed border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
                      {items.length === 0 ? (
                        <>
                          Aún no hay cotizaciones. Empieza con{" "}
                          <button type="button" onClick={abrirNueva} className="font-semibold text-foreground underline underline-offset-2">
                            Nueva cotización
                          </button>
                          .
                        </>
                      ) : (
                        "Nada coincide con la búsqueda o los filtros."
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filtradas.map((c) => (
                        <TarjetaCotizacion
                          key={c.id}
                          c={c}
                          onAbrir={() => abrir(c)}
                          onAdjunto={() => abrirAdjunto(c)}
                          onPedirAOtro={() => pedirAOtro(c)}
                          onEliminar={() => eliminar(c)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ═══════════ TAB: BUSCAR MATERIAL ═══════════ */}
                <TabsContent value="materiales" className="mt-0">
                  <BuscadorMateriales
                    cotizaciones={ordenadas}
                    q={qMat}
                    setQ={setQMat}
                    onAbrir={abrir}
                    onCopiar={copiar}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
      </section>
    </Layout>
  );
}

/* ═════════════════════════ Componentes ═════════════════════════ */

function Stat({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="truncate font-heading text-xl font-bold text-foreground md:text-2xl">{valor}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{etiqueta}</div>
    </div>
  );
}

function ChipEstatus({ estatus }: { estatus: Estatus }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", ESTILO_ESTATUS[estatus])}>
      {estatus}
    </span>
  );
}

function TarjetaCotizacion({
  c, onAbrir, onAdjunto, onPedirAOtro, onEliminar,
}: {
  c: Cotizacion;
  onAbrir: () => void;
  onAdjunto: () => void;
  onPedirAOtro: () => void;
  onEliminar: () => void;
}) {
  const { total } = totales(c.partidas, c.iva);
  const resumen = c.partidas
    .slice(0, 3)
    .map((p) => p.descripcion)
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="group rounded-sm border border-border bg-card transition-colors hover:border-accent/50">
      <button type="button" onClick={onAbrir} className="block w-full p-4 text-left md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">{c.folio}</span>
              <ChipEstatus estatus={c.estatus} />
              {vencida(c) && (
                <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-800">Vencida</span>
              )}
            </div>
            <p className="font-heading text-lg font-bold text-foreground">
              {c.proveedor || "Proveedor sin nombre"}
            </p>
            <p className="text-sm text-muted-foreground">
              {[c.proyecto, c.cliente, fechaCorta(c.fecha)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="whitespace-nowrap font-heading text-lg font-bold text-primary">{dinero(total, c.moneda)}</p>
            <p className="text-xs text-muted-foreground">
              {c.partidas.length} {c.partidas.length === 1 ? "partida" : "partidas"}
              {c.iva ? " · IVA incl." : " · sin IVA"}
            </p>
          </div>
        </div>
        {resumen && (
          <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
            {resumen}
            {c.partidas.length > 3 ? " …" : ""}
          </p>
        )}
      </button>
      <div className="flex flex-wrap items-center gap-1 border-t border-border px-3 py-2">
        {c.adjunto && (
          <AccionChica onClick={onAdjunto} icon={<Paperclip className="h-3.5 w-3.5" />}>
            Ver archivo
          </AccionChica>
        )}
        <AccionChica onClick={onAbrir} icon={<PencilLine className="h-3.5 w-3.5" />}>
          Editar
        </AccionChica>
        <AccionChica onClick={onPedirAOtro} icon={<Copy className="h-3.5 w-3.5" />}>
          Pedir a otro proveedor
        </AccionChica>
        <AccionChica onClick={onEliminar} icon={<Trash2 className="h-3.5 w-3.5" />} peligro>
          Eliminar
        </AccionChica>
      </div>
    </div>
  );
}

function AccionChica({
  onClick, icon, children, peligro,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  peligro?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-semibold transition-colors",
        peligro
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ───────────── Buscador de materiales ───────────── */

function BuscadorMateriales({
  cotizaciones, q, setQ, onAbrir, onCopiar,
}: {
  cotizaciones: Cotizacion[];
  q: string;
  setQ: (s: string) => void;
  onAbrir: (c: Cotizacion) => void;
  onCopiar: (filas: string[][], cuantas: string) => void;
}) {
  const filas = useMemo(() => {
    const todas = cotizaciones.flatMap((c) => c.partidas.map((p) => ({ c, p, clave: normalizar(p.descripcion) })));
    const hallados = q.trim()
      ? todas.filter(({ c, p }) => coincide(`${p.descripcion} ${p.marca} ${c.proveedor} ${c.proyecto}`, q))
      : todas;
    // Más barato por material: mismo texto de descripción y misma moneda, al menos 2 precios.
    const minimos = new Map<string, number>();
    const cuenta = new Map<string, number>();
    hallados.forEach(({ c, p, clave }) => {
      if (!p.precio) return;
      const k = `${clave}|${c.moneda}`;
      cuenta.set(k, (cuenta.get(k) || 0) + 1);
      minimos.set(k, Math.min(minimos.get(k) ?? Infinity, p.precio));
    });
    return hallados
      .map((f) => {
        const k = `${f.clave}|${f.c.moneda}`;
        return { ...f, masBarato: (cuenta.get(k) || 0) > 1 && f.p.precio === minimos.get(k) };
      })
      .sort((a, b) =>
        q.trim()
          ? a.clave.localeCompare(b.clave) || a.p.precio - b.p.precio
          : (b.c.fecha || "").localeCompare(a.c.fecha || ""),
      );
  }, [cotizaciones, q]);

  const visibles = filas.slice(0, 300);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. tubo cobre 3/4, manejadora, cable 12 AWG…"
            className="bg-background pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => onCopiar(filas.map(({ c, p }) => filaExcel(c, p)), `${filas.length} materiales`)}
          className="rounded-sm border-primary font-bold uppercase tracking-wide text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar a Excel
        </Button>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {filas.length === 0
          ? q.trim()
            ? "Ningún material coincide."
            : "Aún no hay materiales cotizados."
          : `${filas.length} ${filas.length === 1 ? "precio encontrado" : "precios encontrados"}${
              filas.length > visibles.length ? ` (mostrando ${visibles.length})` : ""
            }. Toca uno para abrir su cotización.`}
      </p>

      {visibles.length > 0 && (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {/* encabezado (solo escritorio) */}
          <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_6rem_5.5rem_8rem] gap-3 border-b border-border bg-secondary/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Material</span>
            <span>Proveedor</span>
            <span>Proyecto</span>
            <span>Fecha</span>
            <span className="text-right">Cant.</span>
            <span className="text-right">Precio unit.</span>
          </div>
          {visibles.map(({ c, p, masBarato }, i) => (
            <button
              key={`${c.id}-${i}`}
              type="button"
              onClick={() => onAbrir(c)}
              className={cn(
                "grid w-full grid-cols-2 gap-x-3 gap-y-1 border-b border-border px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-secondary/40 md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_6rem_5.5rem_8rem] md:items-center",
                masBarato && "bg-emerald-500/5",
              )}
            >
              <span className="col-span-2 min-w-0 md:col-span-1">
                <span className="block font-semibold text-foreground">{p.descripcion || "—"}</span>
                {p.marca && <span className="block text-xs text-muted-foreground">{p.marca}</span>}
              </span>
              <span className="min-w-0 truncate text-muted-foreground">
                {c.proveedor || "—"} <span className="md:hidden">· {c.estatus}</span>
              </span>
              <span className="min-w-0 truncate text-right text-muted-foreground md:text-left">{c.proyecto || "—"}</span>
              <span className="text-muted-foreground">{fechaCorta(c.fecha)}</span>
              <span className="text-right text-muted-foreground">
                {p.cantidad} {p.unidad}
              </span>
              <span className="col-span-2 text-right md:col-span-1">
                <span className="block font-heading font-bold text-primary">{dinero(p.precio, c.moneda)}</span>
                {masBarato && (
                  <span className="mt-0.5 inline-block whitespace-nowrap rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    Más barato
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        “Más barato” compara partidas con la misma descripción y moneda. Escribe los materiales igual en
        todas las cotizaciones para que se comparen.
      </p>
    </div>
  );
}

/* ───────────── Editor ───────────── */

function Editor({
  inicial, onCerrar, onGuardada, onEliminar, onAdjuntoQuitado, onError,
}: {
  inicial: Draft;
  onCerrar: () => void;
  onGuardada: (c: Cotizacion) => void;
  onEliminar: (id: string) => void;
  onAdjuntoQuitado: (id: string) => void;
  onError: (err: unknown, msg: string) => void;
}) {
  const { toast } = useToast();
  const [d, setD] = useState<Draft>(inicial);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [quitando, setQuitando] = useState(false);
  const [error, setError] = useState("");
  const [sucio, setSucio] = useState(false);

  const set = (patch: Partial<Draft>) => {
    setD((x) => ({ ...x, ...patch }));
    setSucio(true);
  };
  const setPartida = (u: string, patch: Partial<PartidaDraft>) => {
    setD((x) => ({ ...x, partidas: x.partidas.map((p) => (p.uid === u ? { ...p, ...patch } : p)) }));
    setSucio(true);
  };
  const agregarPartida = () => {
    setD((x) => ({
      ...x,
      partidas: [...x.partidas, { uid: uid(), descripcion: "", marca: "", cantidad: "1", unidad: "pza", precio: "" }],
    }));
    setSucio(true);
  };
  const quitarPartida = (u: string) => {
    setD((x) => ({ ...x, partidas: x.partidas.filter((p) => p.uid !== u) }));
    setSucio(true);
  };

  const t = totales(
    d.partidas.map((p) => ({ cantidad: aNumero(p.cantidad), precio: aNumero(p.precio) })),
    d.iva,
  );

  function cerrar() {
    if ((sucio || archivo) && !window.confirm("Tienes cambios sin guardar. ¿Salir de todos modos?")) return;
    onCerrar();
    window.scrollTo({ top: 0 });
  }

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const ok = f.type === "application/pdf" || /^image\/(jpeg|png|webp)$/.test(f.type);
    if (!ok) {
      toast({ title: "Formato no válido", description: "Sube un PDF o una foto (JPG, PNG).", variant: "destructive" });
      return;
    }
    if (f.type === "application/pdf" && f.size > MAX_ADJUNTO) {
      toast({ title: "PDF muy pesado", description: "Máximo 4 MB.", variant: "destructive" });
      return;
    }
    setArchivo(f);
  }

  async function subirAdjunto(id: string, f: File): Promise<Adjunto> {
    const blob = await prepararArchivo(f);
    if (blob.size > MAX_ADJUNTO) throw new Error("El archivo pesa más de 4 MB.");
    const tipo = blob.type || f.type;
    const nombre = tipo === "image/jpeg" && f.type !== "image/jpeg" ? f.name.replace(/\.\w+$/, ".jpg") : f.name;
    const res = await api(`/api/cotizaciones/${encodeURIComponent(id)}/adjunto`, {
      method: "PUT",
      headers: { "Content-Type": tipo, "X-File-Name": encodeURIComponent(nombre) },
      body: blob,
    });
    if (!res.ok) throw await errorDe(res, "No se pudo subir el archivo.");
    return (await res.json()).adjunto;
  }

  async function guardar() {
    setError("");
    if (!d.proyecto.trim() && !d.proveedor.trim()) {
      setError("Captura al menos el proyecto o el proveedor.");
      return;
    }
    setGuardando(true);
    try {
      const { id: _id, folio: _f, adjunto: _a, partidas, ...campos } = d;
      const body = {
        ...campos,
        partidas: partidas.map((p) => ({
          descripcion: p.descripcion,
          marca: p.marca,
          cantidad: aNumero(p.cantidad),
          unidad: p.unidad,
          precio: aNumero(p.precio),
        })),
      };
      const res = await api(d.id ? `/api/cotizaciones/${encodeURIComponent(d.id)}` : "/api/cotizaciones", {
        method: d.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await errorDe(res, "No se pudo guardar.");
      let item: Cotizacion = (await res.json()).item;

      if (archivo) {
        try {
          item = { ...item, adjunto: await subirAdjunto(item.id, archivo) };
        } catch (err) {
          // La cotización sí quedó guardada: se avisa y se puede reintentar el archivo.
          onGuardada(item);
          onError(err, "La cotización se guardó, pero el archivo no se pudo subir.");
          return;
        }
      }
      toast({ title: d.id ? `${item.folio} actualizada` : `${item.folio} guardada` });
      onGuardada(item);
    } catch (err) {
      if (err instanceof SesionExpirada) onError(err, "");
      else setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function quitarAdjunto() {
    if (!d.id || !window.confirm("¿Quitar el archivo de esta cotización?")) return;
    setQuitando(true);
    try {
      const res = await api(`/api/cotizaciones/${encodeURIComponent(d.id)}/adjunto`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw await errorDe(res, "No se pudo quitar el archivo.");
      setD((x) => ({ ...x, adjunto: null }));
      onAdjuntoQuitado(d.id);
    } catch (err) {
      onError(err, "No se pudo quitar el archivo.");
    } finally {
      setQuitando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={cerrar}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a la lista
        </button>
        <h2 className="font-heading text-2xl font-bold text-foreground">
          {d.folio ? d.folio : "Nueva cotización"}
        </h2>
      </div>

      {error && (
        <div className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Datos generales */}
      <Bloque titulo="Proyecto y proveedor">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Proyecto / PO">
            <Input list="dl-proyectos" placeholder="Ej. PO-018 Nave Bombardier" value={d.proyecto} onChange={(e) => set({ proyecto: e.target.value })} />
          </Campo>
          <Campo label="Cliente">
            <Input list="dl-clientes" placeholder="Opcional" value={d.cliente} onChange={(e) => set({ cliente: e.target.value })} />
          </Campo>
          <Campo label="Estatus">
            <Select value={d.estatus} onValueChange={(v) => set({ estatus: v as Estatus })}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTATUS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Proveedor">
            <Input list="dl-proveedores" placeholder="Ej. Grainger" value={d.proveedor} onChange={(e) => set({ proveedor: e.target.value })} />
          </Campo>
          <Campo label="Contacto">
            <Input placeholder="Nombre del vendedor" value={d.contacto} onChange={(e) => set({ contacto: e.target.value })} />
          </Campo>
          <Campo label="Folio del proveedor">
            <Input placeholder="Núm. de su cotización" value={d.folioProveedor} onChange={(e) => set({ folioProveedor: e.target.value })} />
          </Campo>
          <Campo label="Teléfono">
            <Input type="tel" value={d.telefono} onChange={(e) => set({ telefono: e.target.value })} />
          </Campo>
          <Campo label="Correo">
            <Input type="email" value={d.correo} onChange={(e) => set({ correo: e.target.value })} />
          </Campo>
          <Campo label="Fecha de la cotización">
            <Input type="date" value={d.fecha} onChange={(e) => set({ fecha: e.target.value })} />
          </Campo>
          <Campo label="Vigente hasta">
            <Input type="date" value={d.vigencia} onChange={(e) => set({ vigencia: e.target.value })} />
          </Campo>
          <Campo label="Tiempo de entrega">
            <Input placeholder="Ej. 3 semanas" value={d.entrega} onChange={(e) => set({ entrega: e.target.value })} />
          </Campo>
          <Campo label="Condiciones de pago">
            <Input placeholder="Ej. 50% anticipo, crédito 30 días" value={d.condicionesPago} onChange={(e) => set({ condicionesPago: e.target.value })} />
          </Campo>
        </div>
      </Bloque>

      {/* Partidas */}
      <Bloque
        titulo="Materiales y equipos"
        extra={
          <div className="flex items-center gap-4">
            <div className="w-28">
              <Select value={d.moneda} onValueChange={(v) => set({ moneda: v as Moneda })}>
                <SelectTrigger className="h-9 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      >
        <div className="hidden grid-cols-[minmax(0,3fr)_minmax(0,1.6fr)_5.5rem_6rem_8rem_8rem_2.25rem] gap-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
          <span>Descripción</span>
          <span>Marca / modelo</span>
          <span>Cantidad</span>
          <span>Unidad</span>
          <span>Precio unit.</span>
          <span className="text-right">Importe</span>
          <span />
        </div>
        <div className="space-y-3 md:space-y-2">
          {d.partidas.map((p, i) => (
            <div
              key={p.uid}
              className="grid grid-cols-2 gap-2 rounded-sm border border-border p-3 md:grid-cols-[minmax(0,3fr)_minmax(0,1.6fr)_5.5rem_6rem_8rem_8rem_2.25rem] md:items-center md:border-0 md:p-0"
            >
              <Input
                aria-label={`Descripción partida ${i + 1}`}
                placeholder="Descripción"
                value={p.descripcion}
                onChange={(e) => setPartida(p.uid, { descripcion: e.target.value })}
                className="col-span-2 md:col-span-1"
              />
              <Input
                aria-label="Marca o modelo"
                placeholder="Marca / modelo"
                value={p.marca}
                onChange={(e) => setPartida(p.uid, { marca: e.target.value })}
                className="col-span-2 md:col-span-1"
              />
              <Input
                aria-label="Cantidad"
                placeholder="Cant."
                inputMode="decimal"
                value={p.cantidad}
                onChange={(e) => setPartida(p.uid, { cantidad: e.target.value })}
              />
              <Input
                aria-label="Unidad"
                list="dl-unidades"
                placeholder="Unidad"
                value={p.unidad}
                onChange={(e) => setPartida(p.uid, { unidad: e.target.value })}
              />
              <Input
                aria-label="Precio unitario"
                placeholder="P. unitario"
                inputMode="decimal"
                value={p.precio}
                onChange={(e) => setPartida(p.uid, { precio: e.target.value })}
              />
              <span className="flex items-center justify-end font-heading text-sm font-bold text-foreground">
                {dinero(aNumero(p.cantidad) * aNumero(p.precio), d.moneda)}
              </span>
              <button
                type="button"
                aria-label="Quitar partida"
                onClick={() => quitarPartida(p.uid)}
                className="col-span-2 inline-flex h-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive md:col-span-1"
              >
                <X className="h-4 w-4" />
                <span className="ml-1 text-xs md:hidden">Quitar</span>
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={agregarPartida} className="mt-3 rounded-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Agregar partida
        </Button>

        <div className="mt-6 flex flex-col items-end gap-1 border-t border-border pt-4 text-sm">
          <label className="mb-2 flex items-center gap-2 text-muted-foreground">
            <Switch checked={d.iva} onCheckedChange={(v) => set({ iva: v })} />
            Agregar IVA 16% (los precios unitarios son sin IVA)
          </label>
          <div className="flex w-full max-w-xs justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{dinero(t.subtotal, d.moneda)}</span>
          </div>
          {d.iva && (
            <div className="flex w-full max-w-xs justify-between text-muted-foreground">
              <span>IVA 16%</span>
              <span>{dinero(t.impuesto, d.moneda)}</span>
            </div>
          )}
          <div className="flex w-full max-w-xs justify-between font-heading text-lg font-bold text-foreground">
            <span>Total</span>
            <span>{dinero(t.total, d.moneda)}</span>
          </div>
        </div>
      </Bloque>

      {/* Archivo y notas */}
      <Bloque titulo="Archivo del proveedor y notas">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>PDF o foto de la cotización</Label>
            {d.adjunto && !archivo && (
              <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-accent-foreground/70" />
                  <span className="truncate">{d.adjunto.nombre}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{(d.adjunto.tamano / 1024 / 1024).toFixed(1)} MB</span>
                </span>
                <button
                  type="button"
                  disabled={quitando}
                  onClick={quitarAdjunto}
                  className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-destructive"
                >
                  {quitando ? "Quitando…" : "Quitar"}
                </button>
              </div>
            )}
            {archivo && (
              <div className="flex items-center justify-between gap-3 rounded-sm border border-accent/50 bg-accent/10 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0" />
                  <span className="truncate">{archivo.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">se sube al guardar</span>
                </span>
                <button type="button" onClick={() => setArchivo(null)} className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  Cancelar
                </button>
              </div>
            )}
            <label className="block cursor-pointer rounded-sm border-2 border-dashed border-accent/50 bg-accent/5 px-4 py-6 text-center text-sm transition-colors hover:bg-accent/10">
              <Paperclip className="mx-auto mb-1.5 h-6 w-6 text-accent-foreground/70" />
              <span className="font-semibold text-foreground">
                {d.adjunto || archivo ? "Reemplazar archivo" : "Adjuntar PDF o foto"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Máximo 4 MB</span>
              <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={elegirArchivo} />
            </label>
          </div>
          <Campo label="Notas">
            <Textarea
              rows={7}
              placeholder="Alcance, exclusiones, flete, garantía, lo que haya que recordar…"
              value={d.notas}
              onChange={(e) => set({ notas: e.target.value })}
            />
          </Campo>
        </div>
      </Bloque>

      {d.id && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEliminar(d.id!)}
            className="rounded-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar esta cotización
          </Button>
        </div>
      )}

      {/* Acciones (pr-20 en móvil: deja libre el botón flotante de WhatsApp) */}
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-border bg-background/95 py-3 pl-4 pr-20 backdrop-blur sm:pr-4">
        <Button
          onClick={guardar}
          disabled={guardando}
          className="h-11 flex-1 rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90 sm:flex-none"
        >
          {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        <Button variant="outline" onClick={cerrar} className="h-11 flex-1 rounded-sm sm:flex-none">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function Bloque({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold uppercase tracking-widest text-foreground">{titulo}</h3>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
