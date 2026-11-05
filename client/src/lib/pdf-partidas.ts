/**
 * Lectura de partidas desde el PDF de una cotización — sin IA, gratis.
 *
 * pdf.js saca el texto con su posición (x, y). Con eso se reconstruyen las
 * filas, se busca el encabezado de la tabla (CANT / DESCRIPCIÓN / P. UNITARIO /
 * IMPORTE) y cada renglón que trae un precio se vuelve una partida; los
 * renglones de texto de alrededor se pegan a la descripción más cercana.
 *
 * Es heurístico: el resultado SIEMPRE se muestra para revisar y corregir
 * antes de guardarse.
 */

export interface Celda {
  x: number;
  x2: number;
  s: string;
}

export interface Fila {
  y: number;
  pagina: number;
  celdas: Celda[];
  texto: string;
}

export interface PartidaLeida {
  descripcion: string;
  modelo: string;
  cantidad: number;
  unidad: string;
  precio: number;
  importe: number;
}

export interface ResultadoPdf {
  partidas: PartidaLeida[];
  moneda: "MXN" | "USD";
  /** false = no se encontró el encabezado de la tabla; se adivinó por renglones con precio */
  conEncabezado: boolean;
  texto: string;
}

interface ItemPdf {
  str: string;
  x: number;
  y: number;
  w: number;
}

/* ───────────── utilidades ───────────── */

export const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** "$3,850.87", "3,850.87 USD", "-$1,200" → número. Exige formato de dinero (no un "1" suelto). */
export function leerDinero(s: string): number | null {
  const t = s.replace(/\b(usd|mxn|mn|m\.n\.|dlls?|pesos)\b/gi, "").replace(/\s/g, "");
  if (!/^-?\$?(\d{1,3}(,\d{3})+|\d+)(\.\d{1,4})?$/.test(t)) return null;
  const tienePinta = t.includes("$") || t.includes(",") || /\.\d{2}$/.test(t);
  if (!tienePinta) return null;
  const n = Number(t.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function leerNumero(s: string): number | null {
  const t = s.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/* ───────────── 1) texto → filas ───────────── */

export function agruparFilas(items: ItemPdf[], pagina: number): Fila[] {
  // Los "espacios" de pdf.js a veces son items anchos que cubren el hueco entre
  // columnas: si se juntan, toda la fila se vuelve una sola celda.
  const limpios = items.filter((i) => i.str.trim() !== "");
  limpios.sort((a, b) => b.y - a.y || a.x - b.x);
  const grupos: ItemPdf[][] = [];
  for (const it of limpios) {
    const g = grupos.find((gr) => Math.abs(gr[0].y - it.y) <= 2.5);
    if (g) g.push(it);
    else grupos.push([it]);
  }
  return grupos
    .map((g) => {
      g.sort((a, b) => a.x - b.x);
      const celdas: Celda[] = [];
      for (const it of g) {
        const ult = celdas[celdas.length - 1];
        const gap = ult ? it.x - ult.x2 : Infinity;
        if (ult && gap < 4) {
          const espacio = gap > 0.8 && !ult.s.endsWith(" ") && !it.str.startsWith(" ") ? " " : "";
          ult.s += espacio + it.str;
          ult.x2 = Math.max(ult.x2, it.x + it.w);
        } else {
          celdas.push({ x: it.x, x2: it.x + it.w, s: it.str });
        }
      }
      const finales = celdas
        .map((c) => ({ ...c, s: c.s.normalize("NFC").replace(/\s+/g, " ").trim() }))
        .filter((c) => c.s);
      return { y: g[0].y, pagina, celdas: finales, texto: finales.map((c) => c.s).join("  ") };
    })
    .filter((f) => f.celdas.length > 0);
}

/* ───────────── 2) filas → partidas ───────────── */

type Col = "cant" | "desc" | "modelo" | "unidad" | "pu" | "importe" | "otra";

const CLAVES: [Col, RegExp][] = [
  ["pu", /p\.?\s*unit|precio\s*u|^p\.?\s*u\.?$|unitario|precio\s*lista|^precio$/],
  ["importe", /importe|^total|^monto|^subtotal|precio\s*total|^neto/],
  ["cant", /^cant|^qty|^ctd|^piezas?$|^pzas?\.?$|^no\.?\s*de\s*piezas/],
  ["unidad", /^(unidad|unid\.?|u\.?\s*m\.?|um|u\/m|medida)$/],
  ["modelo", /modelo|^clave|codigo|^sku|parte|catalogo|^marca/],
  ["desc", /descrip|concepto|articulo|producto|partida|^equipo|material/],
];

function columnaDeEncabezado(s: string): Col | null {
  const t = sinAcentos(s).trim();
  for (const [col, re] of CLAVES) if (re.test(t)) return col;
  return null;
}

const FIN_TABLA = /^(sub-?\s?total|subtotal|total\b|importe con letra|i\.?v\.?a\.?\b|gran total|suma)/;
const RUIDO = /(valido hasta|vigencia|validez|tiempo de entrega|condiciones|observaciones|^nota|precios sujetos|disponibilidad|importe con letra|pagina \d)/;

interface Encabezado {
  fila: number;
  cols: { col: Col; centro: number }[];
}

function buscarEncabezado(filas: Fila[], desde: number): Encabezado | null {
  for (let i = desde; i < filas.length; i++) {
    const cols = filas[i].celdas
      .map((c) => ({ col: columnaDeEncabezado(c.s), centro: (c.x + c.x2) / 2 }))
      .filter((c): c is { col: Col; centro: number } => c.col !== null);
    const tiene = (k: Col) => cols.some((c) => c.col === k);
    if ((tiene("pu") || tiene("importe")) && (tiene("desc") || tiene("cant")) && cols.length >= 3) {
      // Las celdas del encabezado que no reconocimos ("#", "ALMACÉN") también son columnas: así no se les pega texto ajeno.
      const otras = filas[i].celdas
        .filter((c) => columnaDeEncabezado(c.s) === null)
        .map((c) => ({ col: "otra" as Col, centro: (c.x + c.x2) / 2 }));
      return { fila: i, cols: [...cols, ...otras] };
    }
  }
  return null;
}

function columnaMasCercana(enc: Encabezado, c: Celda): Col {
  // Texto largo alineado a la izquierda: su inicio cae bajo "DESCRIPCIÓN" aunque su centro se corra.
  const centro = (c.x + c.x2) / 2;
  let mejor = enc.cols[0];
  let dist = Infinity;
  for (const col of enc.cols) {
    const d = Math.min(Math.abs(col.centro - centro), Math.abs(col.centro - c.x) * 1.4);
    if (d < dist) {
      dist = d;
      mejor = col;
    }
  }
  return mejor.col;
}

interface Renglon {
  y: number;
  pagina: number;
  porCol: Partial<Record<Col, string[]>>;
  ancla: boolean;
}

function partidasConEncabezado(filas: Fila[]): PartidaLeida[] {
  const salida: PartidaLeida[] = [];
  let i = 0;
  while (i < filas.length) {
    const enc = buscarEncabezado(filas, i);
    if (!enc) break;
    const renglones: Renglon[] = [];
    let j = enc.fila + 1;
    for (; j < filas.length; j++) {
      const f = filas[j];
      if (f.pagina !== filas[enc.fila].pagina) break;
      const t = sinAcentos(f.texto);
      if (f.celdas.some((c) => FIN_TABLA.test(sinAcentos(c.s)))) break;
      if (RUIDO.test(t)) continue;
      if (buscarEncabezado([f], 0)) break; // encabezado repetido
      const porCol: Partial<Record<Col, string[]>> = {};
      for (const c of f.celdas) {
        const col = columnaMasCercana(enc, c);
        (porCol[col] ||= []).push(c.s);
      }
      const ancla =
        (porCol.pu || []).some((s) => leerDinero(s) !== null) ||
        (porCol.importe || []).some((s) => leerDinero(s) !== null);
      renglones.push({ y: f.y, pagina: f.pagina, porCol, ancla });
    }
    i = j + 1;

    const anclas = renglones.filter((r) => r.ancla);
    if (anclas.length === 0) continue;
    const altoLinea =
      renglones.length > 1
        ? Math.max(8, Math.min(...renglones.slice(1).map((r, k) => Math.abs(renglones[k].y - r.y)).filter((d) => d > 0)))
        : 12;

    const textos = new Map<Renglon, { desc: string[]; modelo: string[]; unidad: string[] }>();
    anclas.forEach((a) => textos.set(a, { desc: [], modelo: [], unidad: [] }));
    for (const r of renglones) {
      let destino = r;
      if (!r.ancla) {
        let best: Renglon | null = null;
        let d = Infinity;
        for (const a of anclas) {
          const dd = Math.abs(a.y - r.y);
          if (dd < d) {
            d = dd;
            best = a;
          }
        }
        if (!best || d > altoLinea * 4) continue;
        destino = best;
      }
      const t = textos.get(destino)!;
      t.desc.push(...(r.porCol.desc || []));
      t.modelo.push(...(r.porCol.modelo || []));
      t.unidad.push(...(r.porCol.unidad || []));
      // Sin columna de modelo, un código suelto a la izquierda suele caer en "otra": se ignora.
    }

    for (const a of anclas) {
      const t = textos.get(a)!;
      const pu = (a.porCol.pu || []).map(leerDinero).find((n) => n !== null) ?? null;
      const imp = (a.porCol.importe || []).map(leerDinero).find((n) => n !== null) ?? null;
      let cant = (a.porCol.cant || []).map(leerNumero).find((n) => n !== null) ?? null;
      let precio = pu ?? 0;
      if (!pu && imp !== null) precio = cant ? imp / cant : imp;
      if (cant === null) cant = pu && imp ? Math.round((imp / pu) * 100) / 100 : 1;
      // Una cantidad pegada a la unidad ("2 PZA") en la columna de cantidad
      let unidad = t.unidad.join(" ");
      if (!unidad) {
        const m = (a.porCol.cant || []).join(" ").match(/[a-z]{1,6}\.?$/i);
        if (m) unidad = m[0];
      }
      salida.push({
        descripcion: t.desc.join(" ").replace(/\s+/g, " ").trim(),
        modelo: t.modelo.join(" ").replace(/\s+/g, " ").trim(),
        cantidad: cant,
        unidad: unidad.toLowerCase(),
        precio: Math.round(precio * 100) / 100,
        importe: Math.round((imp ?? precio * cant) * 100) / 100,
      });
    }
  }
  return salida;
}

/** Sin encabezado reconocible: cada renglón con texto y precio es una partida. */
function partidasSinEncabezado(filas: Fila[]): PartidaLeida[] {
  const salida: PartidaLeida[] = [];
  for (const f of filas) {
    const t = sinAcentos(f.texto);
    if (FIN_TABLA.test(t) || RUIDO.test(t)) continue;
    const montos = f.celdas.map((c) => leerDinero(c.s)).filter((n): n is number => n !== null);
    const texto = f.celdas.filter((c) => leerDinero(c.s) === null && leerNumero(c.s) === null).map((c) => c.s);
    if (montos.length === 0 || texto.join("").replace(/[^a-z]/gi, "").length < 4) continue;
    const primera = leerNumero(f.celdas[0].s);
    const cantidad = primera !== null && primera < 10000 ? primera : 1;
    const precio = montos.length >= 2 ? montos[montos.length - 2] : montos[0];
    salida.push({
      descripcion: texto.join(" "),
      modelo: "",
      cantidad,
      unidad: "",
      precio,
      importe: montos[montos.length - 1],
    });
  }
  return salida;
}

export function detectarPartidas(filas: Fila[]): ResultadoPdf {
  const texto = filas.map((f) => f.texto).join("\n");
  const moneda = /\busd\b|dolares|dlls/.test(sinAcentos(texto)) ? "USD" : "MXN";
  const conEnc = partidasConEncabezado(filas);
  if (conEnc.length > 0) return { partidas: conEnc, moneda, conEncabezado: true, texto };
  return { partidas: partidasSinEncabezado(filas), moneda, conEncabezado: false, texto };
}

/* ───────────── 3) archivo → resultado (navegador) ───────────── */

export async function leerPdf(file: Blob): Promise<ResultadoPdf> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const filas: Fila[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 15); p++) {
    const page = await doc.getPage(p);
    const contenido = await page.getTextContent();
    const items: ItemPdf[] = [];
    for (const it of contenido.items) {
      if (!("str" in it)) continue;
      items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width });
    }
    filas.push(...agruparFilas(items, p));
  }
  return detectarPartidas(filas);
}
