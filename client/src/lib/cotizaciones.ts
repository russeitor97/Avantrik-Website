/**
 * Modelo y cálculos de la app de Cotizaciones (mismo esquema que el Excel de
 * compras de Santiago): cada renglón tiene el lado de VENTA (lo que cotizamos
 * al cliente) y el lado de COMPRA (lo que cuesta con el proveedor), que puede
 * ir en otra unidad y cantidad (ej. venta en Ml, compra en galón).
 *
 * Un renglón puede tener varias opciones de proveedor; la elegida es la que
 * cuenta. Si no se ha elegido ninguna, cuenta la más barata.
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

export interface Oferta {
  id: string;
  proveedor: string;
  unidad: string; // unidad de compra
  cantidad: number; // cantidad de compra
  costo: number; // costo unitario sin IVA, en su moneda
  moneda: Moneda;
  entrega: string;
  notas: string;
  archivoId: string;
}

export interface Partida {
  id: string;
  sistema: string;
  seccion: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  venta: number; // precio unitario de venta sin IVA (moneda del proyecto)
  notas: string;
  ofertas: Oferta[];
  elegida: string;
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
  archivos: Archivo[];
  version: number;
  creadoPor: string;
  actualizadoPor: string;
  creado: number;
  actualizado: number;
}

export type Cambio = Pick<Proyecto, "moneda" | "tipoCambio">;

export const nid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

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

export function nuevaOferta(pa?: Partial<Partida>, moneda: Moneda = "MXN"): Oferta {
  return {
    id: nid(),
    proveedor: "",
    unidad: pa?.unidad || "",
    cantidad: pa?.cantidad || 1,
    costo: 0,
    moneda,
    entrega: "",
    notas: "",
    archivoId: "",
  };
}

export function nuevaPartida(sistema = "", moneda: Moneda = "MXN"): Partida {
  void moneda;
  return { id: nid(), sistema, seccion: "", descripcion: "", unidad: "Pza", cantidad: 1, venta: 0, notas: "", ofertas: [], elegida: "" };
}

/** Una oferta "cuenta" si ya tiene proveedor o costo (la mano de obra propia puede costar $0). */
export const ofertaValida = (o: Oferta) => o.proveedor.trim() !== "" || o.costo > 0;

/** Costo unitario de la oferta en la moneda del proyecto (null si falta tipo de cambio). */
export function costoUnitEnProyecto(o: Oferta, p: Cambio): number | null {
  if (o.moneda === p.moneda) return o.costo;
  if (!p.tipoCambio) return null;
  return o.moneda === "USD" ? o.costo * p.tipoCambio : o.costo / p.tipoCambio;
}

/** Costo total de la oferta (cantidad de compra × costo) en la moneda del proyecto. */
export function costoTotal(o: Oferta, p: Cambio): number | null {
  const u = costoUnitEnProyecto(o, p);
  return u === null ? null : u * (o.cantidad || 0);
}

export interface Analisis {
  venta: number; // subtotal de venta
  costo: number | null; // subtotal de costo con la oferta que cuenta
  oferta: Oferta | null;
  porElegida: boolean;
  masBarata: string;
  utilidad: number | null;
  margen: number | null;
  validas: number;
}

export function analizar(pa: Partida, p: Cambio): Analisis {
  const venta = (pa.venta || 0) * (pa.cantidad || 0);
  const conv = pa.ofertas
    .filter(ofertaValida)
    .map((o) => ({ o, c: costoTotal(o, p) }))
    .filter((x): x is { o: Oferta; c: number } => x.c !== null)
    .sort((a, b) => a.c - b.c);
  const masBarata = conv.length > 1 ? conv[0].o.id : "";
  const elegida = conv.find((x) => x.o.id === pa.elegida);
  const usar = elegida || conv[0];
  if (!usar) return { venta, costo: null, oferta: null, porElegida: false, masBarata, utilidad: null, margen: null, validas: 0 };
  const utilidad = venta - usar.c;
  return {
    venta,
    costo: usar.c,
    oferta: usar.o,
    porElegida: !!elegida,
    masBarata,
    utilidad,
    margen: venta > 0 ? utilidad / venta : null,
    validas: conv.length,
  };
}

export interface Totales {
  venta: number;
  ventaConCosto: number;
  costo: number;
  utilidad: number;
  margen: number | null;
  conCosto: number;
  total: number;
}

export function totalizar(partidas: Partida[], p: Cambio): Totales {
  const t: Totales = { venta: 0, ventaConCosto: 0, costo: 0, utilidad: 0, margen: null, conCosto: 0, total: partidas.length };
  for (const pa of partidas) {
    const a = analizar(pa, p);
    t.venta += a.venta;
    if (a.costo !== null) {
      t.conCosto++;
      t.ventaConCosto += a.venta;
      t.costo += a.costo;
    }
  }
  t.utilidad = t.ventaConCosto - t.costo;
  t.margen = t.ventaConCosto > 0 ? t.utilidad / t.ventaConCosto : null;
  return t;
}

/** Sistemas en el orden en que aparecen. */
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
  l.push(`*${p.nombre}* — resumen de compras`);
  const sub = [p.cliente && `Cliente: ${p.cliente}`, p.folio && `Cot. ${p.folio}`].filter(Boolean).join(" · ");
  if (sub) l.push(sub);
  l.push(`_Precios sin IVA${p.tipoCambio ? ` · TC USD ${dinero(p.tipoCambio)}` : ""}_`);

  l.push("");
  l.push("*Por sistema*");
  for (const g of agrupar(p.partidas)) {
    const tg = totalizar(g.partidas, p);
    l.push(
      `• ${g.sistema || "Sin sistema"}: venta ${dinero(tg.venta, p.moneda, 0)} · costo ${dinero(tg.costo, p.moneda, 0)} · margen ${pct(tg.margen)}${
        tg.conCosto < tg.total ? ` (${tg.total - tg.conCosto} sin costo)` : ""
      }`,
    );
  }

  const comparativos = p.partidas.filter((pa) => pa.ofertas.filter(ofertaValida).length > 1);
  if (comparativos.length) {
    l.push("");
    l.push("*Comparativos de proveedores*");
    for (const pa of comparativos) {
      const a = analizar(pa, p);
      l.push(`_${pa.descripcion.slice(0, 90)}_ (${pa.cantidad} ${pa.unidad}, venta ${dinero(a.venta, p.moneda, 0)})`);
      const ops = pa.ofertas
        .filter(ofertaValida)
        .map((o) => ({ o, c: costoTotal(o, p) }))
        .sort((x, y) => (x.c ?? Infinity) - (y.c ?? Infinity));
      for (const { o, c } of ops) {
        const m = c !== null && a.venta > 0 ? (a.venta - c) / a.venta : null;
        const marca = o.id === pa.elegida ? "✅" : "▫️";
        const usd = o.moneda !== p.moneda ? ` (${dinero(o.costo, o.moneda)} c/u)` : "";
        l.push(`${marca} ${o.proveedor || "Proveedor"}: ${c === null ? "falta TC" : dinero(c, p.moneda, 0)}${usd} · ${[o.entrega, `margen ${pct(m)}`].filter(Boolean).join(" · ")}`);
      }
    }
  }

  const pendientes = p.partidas.filter((pa) => analizar(pa, p).costo === null);
  if (pendientes.length) {
    l.push("");
    l.push(`*Pendientes de cotizar (${pendientes.length})*`);
    pendientes.slice(0, 15).forEach((pa) => l.push(`⏳ ${pa.descripcion.slice(0, 80)}`));
    if (pendientes.length > 15) l.push(`… y ${pendientes.length - 15} más`);
  }

  l.push("");
  l.push(`*Total* (${t.conCosto} de ${t.total} conceptos con costo)`);
  l.push(`Venta: ${dinero(t.ventaConCosto, p.moneda)}`);
  l.push(`Costo: ${dinero(t.costo, p.moneda)}`);
  l.push(`Utilidad: ${dinero(t.utilidad, p.moneda)} (${pct(t.margen)})`);
  return l.join("\n");
}
