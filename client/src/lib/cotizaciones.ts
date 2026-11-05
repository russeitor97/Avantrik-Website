/**
 * Modelo y cálculos de la app de Cotizaciones (portal Avantrik).
 *
 * Flujo de compras de un proyecto:
 *  1. PRESUPUESTO: la cotización que se le dio al cliente, concepto por
 *     concepto (lado VENTA). Cada concepto puede traer un costo ESTIMADO
 *     (precio de referencia que se usó al cotizar).
 *  2. COTIZACIONES DE PROVEEDORES: los documentos que mandan los
 *     proveedores (folio, vigencia, entrega, PDF). Cada línea se liga a un
 *     concepto del presupuesto. Una cotización puede cubrir varios conceptos.
 *  3. COMPARATIVO: por concepto, todas las ofertas lado a lado. La que se
 *     marca como favorita (★) queda ADJUDICADA y su precio pasa al costo.
 *
 * Costo de un concepto = el de la oferta adjudicada; si no hay, el estimado.
 * Todo sin IVA. La compra puede ir en otra unidad/cantidad que la venta.
 */

export type Moneda = "MXN" | "USD";

export interface Archivo {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  rol: "nuestra" | "proveedor";
  subido: number;
  subidoPor: string;
}

/** Costo de referencia capturado a mano o traído del Excel (no es una cotización formal). */
export interface Estimado {
  proveedor: string;
  unidad: string;
  cantidad: number;
  costo: number;
  moneda: Moneda;
  notas: string;
}

export interface Partida {
  id: string;
  sistema: string;
  seccion: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  venta: number; // P.U. de venta sin IVA, moneda del proyecto
  notas: string;
  estimado: Estimado | null;
  adjudicada: string; // id de la línea de cotización elegida (★)
}

export type EstatusCotizacion = "Solicitada" | "Recibida" | "Descartada";

export interface LineaCotizacion {
  id: string;
  partidaId: string; // concepto del presupuesto al que corresponde ("" = sin ligar)
  descripcion: string; // como lo describe el proveedor
  unidad: string;
  cantidad: number;
  precio: number; // P.U. sin IVA en la moneda de la cotización
}

export interface CotizacionProveedor {
  id: string;
  folio: string; // interno: SC-001
  proveedor: string;
  contacto: string;
  correo: string;
  telefono: string;
  folioProveedor: string;
  fechaSolicitud: string; // YYYY-MM-DD
  fechaRecepcion: string;
  vigencia: string;
  entrega: string;
  condiciones: string;
  moneda: Moneda;
  estatus: EstatusCotizacion;
  notas: string;
  archivoId: string;
  lineas: LineaCotizacion[];
  creadoPor: string;
  creado: number;
}

export interface Proyecto {
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
  cotizaciones: CotizacionProveedor[];
  archivos: Archivo[];
  version: number;
  creadoPor: string;
  actualizadoPor: string;
  creado: number;
  actualizado: number;
}

export type Cambio = Pick<Proyecto, "moneda" | "tipoCambio">;

/* ───────────── utilidades ───────────── */

export const nid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fechaCorta(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "2-digit" });
}

export function diasDesde(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return Math.floor((Date.parse(`${hoy()}T12:00:00`) - Date.parse(`${iso}T12:00:00`)) / 86_400_000);
}

export function dinero(n: number, m: Moneda = "MXN", decimales = 2): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: m,
    currencyDisplay: m === "MXN" ? "narrowSymbol" : "code",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n || 0);
}

export const pct = (n: number | null) => (n === null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(1)}%`);

export function aNumero(s: string | number): number {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  const n = Number(String(s).replace(/[,\s$]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

export function coincide(texto: string, q: string) {
  const t = normalizar(texto);
  return normalizar(q).split(" ").filter(Boolean).every((w) => t.includes(w));
}

/** Parecido entre dos descripciones: palabras significativas en común. */
export function parecido(a: string, b: string): number {
  const pb = new Set(normalizar(b).split(" ").filter((w) => w.length > 2));
  return normalizar(a)
    .split(" ")
    .filter((w) => w.length > 2 && pb.has(w)).length;
}

export function convertir(monto: number, de: Moneda, p: Cambio): number | null {
  if (de === p.moneda) return monto;
  if (!p.tipoCambio) return null;
  return de === "USD" ? monto * p.tipoCambio : monto / p.tipoCambio;
}

export function nuevaPartida(sistema = ""): Partida {
  return { id: nid(), sistema, seccion: "", descripcion: "", unidad: "Pza", cantidad: 1, venta: 0, notas: "", estimado: null, adjudicada: "" };
}

export function nuevaCotizacion(p: Proyecto, email = ""): CotizacionProveedor {
  const max = p.cotizaciones.reduce((m, c) => Math.max(m, Number(c.folio.replace(/\D/g, "")) || 0), 0);
  return {
    id: nid(),
    folio: `SC-${String(max + 1).padStart(3, "0")}`,
    proveedor: "",
    contacto: "",
    correo: "",
    telefono: "",
    folioProveedor: "",
    fechaSolicitud: hoy(),
    fechaRecepcion: "",
    vigencia: "",
    entrega: "",
    condiciones: "",
    moneda: p.moneda,
    estatus: "Solicitada",
    notas: "",
    archivoId: "",
    lineas: [],
    creadoPor: email,
    creado: Date.now(),
  };
}

export function nuevaLinea(pa?: Partida): LineaCotizacion {
  return {
    id: nid(),
    partidaId: pa?.id || "",
    descripcion: pa?.descripcion || "",
    unidad: pa?.estimado?.unidad || pa?.unidad || "",
    cantidad: pa?.estimado?.cantidad || pa?.cantidad || 1,
    precio: 0,
  };
}

/* ───────────── análisis ───────────── */

export interface Opcion {
  cot: CotizacionProveedor;
  linea: LineaCotizacion;
  costoUnit: number | null; // en moneda del proyecto
  costo: number | null; // total (cantidad de compra × P.U.), moneda del proyecto
  margen: number | null;
}

export type EstatusConcepto = "Adjudicado" | "Por decidir" | "Cotizando" | "Estimado" | "Sin costo";

export interface Analisis {
  venta: number;
  costo: number | null;
  costoUnit: number | null;
  fuente: "adjudicado" | "estimado" | null;
  proveedor: string;
  unidad: string;
  cantidad: number;
  opcion: Opcion | null; // la adjudicada
  opciones: Opcion[]; // con precio, ordenadas de menor a mayor costo
  masBarata: string; // id de línea
  pendientes: CotizacionProveedor[]; // solicitudes sin precio para este concepto
  utilidad: number | null;
  margen: number | null;
  estatus: EstatusConcepto;
}

export function opcionesDe(pa: Partida, p: Proyecto): { conPrecio: Opcion[]; pendientes: CotizacionProveedor[] } {
  const venta = pa.venta * pa.cantidad;
  const conPrecio: Opcion[] = [];
  const pendientes: CotizacionProveedor[] = [];
  for (const cot of p.cotizaciones) {
    if (cot.estatus === "Descartada") continue;
    for (const linea of cot.lineas) {
      if (linea.partidaId !== pa.id) continue;
      if (!(linea.precio > 0)) {
        if (!pendientes.includes(cot)) pendientes.push(cot);
        continue;
      }
      const costoUnit = convertir(linea.precio, cot.moneda, p);
      const costo = costoUnit === null ? null : costoUnit * (linea.cantidad || 0);
      conPrecio.push({ cot, linea, costoUnit, costo, margen: costo !== null && venta > 0 ? (venta - costo) / venta : null });
    }
  }
  conPrecio.sort((a, b) => (a.costo ?? Infinity) - (b.costo ?? Infinity));
  return { conPrecio, pendientes };
}

export function analizar(pa: Partida, p: Proyecto): Analisis {
  const venta = (pa.venta || 0) * (pa.cantidad || 0);
  const { conPrecio, pendientes } = opcionesDe(pa, p);
  const masBarata = conPrecio.length > 1 && conPrecio[0].costo !== null ? conPrecio[0].linea.id : "";
  const opcion = conPrecio.find((o) => o.linea.id === pa.adjudicada) || null;

  let costo: number | null = null;
  let costoUnit: number | null = null;
  let fuente: Analisis["fuente"] = null;
  let proveedor = "";
  let unidad = "";
  let cantidad = 0;
  if (opcion && opcion.costo !== null) {
    costo = opcion.costo;
    costoUnit = opcion.costoUnit;
    fuente = "adjudicado";
    proveedor = opcion.cot.proveedor;
    unidad = opcion.linea.unidad;
    cantidad = opcion.linea.cantidad;
  } else if (pa.estimado && (pa.estimado.costo > 0 || pa.estimado.proveedor.trim())) {
    costoUnit = convertir(pa.estimado.costo, pa.estimado.moneda, p);
    costo = costoUnit === null ? null : costoUnit * (pa.estimado.cantidad || 0);
    fuente = costo === null ? null : "estimado";
    proveedor = pa.estimado.proveedor;
    unidad = pa.estimado.unidad;
    cantidad = pa.estimado.cantidad;
  }

  const estatus: EstatusConcepto = opcion
    ? "Adjudicado"
    : conPrecio.length
      ? "Por decidir"
      : pendientes.length
        ? "Cotizando"
        : fuente === "estimado"
          ? "Estimado"
          : "Sin costo";

  const utilidad = costo === null ? null : venta - costo;
  return {
    venta,
    costo,
    costoUnit,
    fuente,
    proveedor,
    unidad,
    cantidad,
    opcion,
    opciones: conPrecio,
    masBarata,
    pendientes,
    utilidad,
    margen: utilidad !== null && venta > 0 ? utilidad / venta : null,
    estatus,
  };
}

export interface Totales {
  venta: number;
  ventaConCosto: number;
  costo: number;
  costoAdjudicado: number;
  utilidad: number;
  margen: number | null;
  total: number;
  porEstatus: Record<EstatusConcepto, number>;
}

export function totalizar(partidas: Partida[], p: Proyecto): Totales {
  const t: Totales = {
    venta: 0,
    ventaConCosto: 0,
    costo: 0,
    costoAdjudicado: 0,
    utilidad: 0,
    margen: null,
    total: partidas.length,
    porEstatus: { Adjudicado: 0, "Por decidir": 0, Cotizando: 0, Estimado: 0, "Sin costo": 0 },
  };
  for (const pa of partidas) {
    const a = analizar(pa, p);
    t.venta += a.venta;
    t.porEstatus[a.estatus]++;
    if (a.costo !== null) {
      t.ventaConCosto += a.venta;
      t.costo += a.costo;
      if (a.fuente === "adjudicado") t.costoAdjudicado += a.costo;
    }
  }
  t.utilidad = t.ventaConCosto - t.costo;
  t.margen = t.ventaConCosto > 0 ? t.utilidad / t.ventaConCosto : null;
  return t;
}

export function agrupar(partidas: Partida[]): { sistema: string; partidas: Partida[] }[] {
  const grupos: { sistema: string; partidas: Partida[] }[] = [];
  for (const pa of partidas) {
    let g = grupos.find((x) => x.sistema === pa.sistema);
    if (!g) {
      g = { sistema: pa.sistema, partidas: [] };
      grupos.push(g);
    }
    g.partidas.push(pa);
  }
  return grupos;
}

export function totalCotizacion(c: CotizacionProveedor): number {
  return c.lineas.reduce((s, l) => s + (l.precio || 0) * (l.cantidad || 0), 0);
}

export function estatusVisible(c: CotizacionProveedor, p: Proyecto): { texto: string; tono: "gris" | "azul" | "ambar" | "verde" | "rojo" } {
  const adjudicadas = c.lineas.filter((l) => p.partidas.some((pa) => pa.adjudicada === l.id)).length;
  if (c.estatus === "Descartada") return { texto: "Descartada", tono: "gris" };
  if (adjudicadas) return { texto: adjudicadas === c.lineas.length ? "Adjudicada" : `Adjudicada (${adjudicadas}/${c.lineas.length})`, tono: "verde" };
  if (c.estatus === "Solicitada") {
    const d = diasDesde(c.fechaSolicitud);
    return { texto: d !== null && d >= 3 ? `Sin respuesta · ${d} días` : "Solicitada", tono: d !== null && d >= 3 ? "ambar" : "azul" };
  }
  if (c.vigencia && c.vigencia < hoy()) return { texto: "Vencida", tono: "rojo" };
  return { texto: "Recibida", tono: "azul" };
}

export function colorMargen(m: number | null, objetivo: number) {
  if (m === null) return "text-muted-foreground";
  if (m < 0) return "text-destructive";
  if (m * 100 < objetivo) return "text-amber-700";
  return "text-emerald-700";
}

/* ───────────── Resumen para el grupo (WhatsApp) ───────────── */

export function resumenTexto(p: Proyecto): string {
  const l: string[] = [];
  const t = totalizar(p.partidas, p);
  l.push(`*${p.nombre}* — estado de compras`);
  const sub = [p.cliente && `Cliente: ${p.cliente}`, p.folio && `Cot. ${p.folio}`].filter(Boolean).join(" · ");
  if (sub) l.push(sub);
  l.push(`_Montos sin IVA${p.tipoCambio ? ` · TC USD ${dinero(p.tipoCambio)}` : ""}_`);

  l.push("");
  l.push(
    `Avance: ✅ ${t.porEstatus.Adjudicado} adjudicados · 🟡 ${t.porEstatus["Por decidir"]} por decidir · 📨 ${t.porEstatus.Cotizando} cotizando · 📝 ${t.porEstatus.Estimado} estimados · ⏳ ${t.porEstatus["Sin costo"]} sin costo`,
  );

  const porDecidir = p.partidas.map((pa) => ({ pa, a: analizar(pa, p) })).filter((x) => x.a.opciones.length > 0);
  if (porDecidir.length) {
    l.push("");
    l.push("*Comparativos*");
    for (const { pa, a } of porDecidir) {
      l.push(`_${pa.descripcion.slice(0, 90)}_ (${pa.cantidad} ${pa.unidad} · venta ${dinero(a.venta, p.moneda, 0)})`);
      for (const o of a.opciones) {
        const marca = o.linea.id === pa.adjudicada ? "★" : "▫️";
        const usd = o.cot.moneda !== p.moneda ? ` (${dinero(o.linea.precio, o.cot.moneda)} c/u)` : "";
        l.push(
          `${marca} ${o.cot.proveedor || "Proveedor"} ${o.cot.folio}: ${o.costo === null ? "falta TC" : dinero(o.costo, p.moneda, 0)}${usd} · ${[
            o.cot.entrega,
            `margen ${pct(o.margen)}`,
            o.linea.id === a.masBarata ? "más barato" : "",
          ]
            .filter(Boolean)
            .join(" · ")}`,
        );
      }
    }
  }

  const solicitadas = p.cotizaciones.filter((c) => c.estatus === "Solicitada");
  if (solicitadas.length) {
    l.push("");
    l.push("*Cotizaciones solicitadas sin respuesta*");
    for (const c of solicitadas) {
      const d = diasDesde(c.fechaSolicitud);
      l.push(`📨 ${c.proveedor || "Proveedor"} (${c.folio})${d !== null ? ` · hace ${d} días` : ""}`);
    }
  }

  l.push("");
  l.push("*Por sistema*");
  for (const g of agrupar(p.partidas)) {
    const tg = totalizar(g.partidas, p);
    l.push(`• ${g.sistema || "Sin sistema"}: venta ${dinero(tg.venta, p.moneda, 0)} · costo ${dinero(tg.costo, p.moneda, 0)} · margen ${pct(tg.margen)}`);
  }

  l.push("");
  l.push(`*Total* (${t.total - t.porEstatus["Sin costo"]} de ${t.total} conceptos con costo)`);
  l.push(`Venta: ${dinero(t.ventaConCosto, p.moneda)}`);
  l.push(`Costo: ${dinero(t.costo, p.moneda)} (adjudicado ${dinero(t.costoAdjudicado, p.moneda, 0)})`);
  l.push(`Utilidad: ${dinero(t.utilidad, p.moneda)} (${pct(t.margen)})`);
  return l.join("\n");
}
