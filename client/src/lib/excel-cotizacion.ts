/**
 * Importar / exportar la cotización en Excel con el mismo formato de columnas
 * que usa Santiago: Sistema | Sección | Concepto | Unidad | Cantidad | Precio
 * unitario | Subtotal precio | Unidad compra | Cantidad compra | Costo unitario
 * | Subtotal costo | Proveedor.
 *
 * - Lee todas las hojas que tengan ese encabezado (p. ej. "Hoja 1" y
 *   "Equipos_hoja2"); las que no (la "Propuesta_comercial") se ignoran.
 * - Renglones de SUBTOTAL / TOTAL se saltan.
 * - Si una hoja no trae columna Sistema, el sistema es el nombre de la hoja.
 * - El proveedor y costo de cada renglón entran como costo ESTIMADO (no es
 *   una cotización formal; las formales se registran en la app).
 */
import type ExcelJSType from "exceljs";
import {
  agrupar, analizar, nid, normalizar,
  type Moneda, type Partida, type Proyecto,
} from "./cotizaciones";

type Col =
  | "sistema" | "seccion" | "item" | "concepto" | "unidad" | "cantidad" | "precio"
  | "unidadCompra" | "cantidadCompra" | "costo" | "proveedor" | "entrega" | "notas";

const ENCABEZADOS: [Col, RegExp][] = [
  ["unidadCompra", /^unidad (de )?compra/],
  ["cantidadCompra", /^cantidad (de )?compra|^cant\.? compra/],
  ["costo", /^costo unit|^costo$|^c\.? ?u\.?$/],
  ["precio", /^precio unit|^p\.? ?u\.?$|^precio de venta|^precio$/],
  ["sistema", /^sistema/],
  ["seccion", /^seccion/],
  ["item", /^item$|^pda\.?$|^partida$|^no\.?$|^#$/],
  ["concepto", /concepto|descripcion/],
  ["unidad", /^unidad$|^u\.?m\.?$|^unid\.?$/],
  ["cantidad", /^cantidad$|^cant\.?$/],
  ["proveedor", /^proveedor/],
  ["entrega", /entrega/],
  ["notas", /^notas?$|^observaciones/],
];

function texto(v: ExcelJSType.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return texto(v.result as ExcelJSType.CellValue);
    if ("text" in v) return String(v.text);
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return "";
  }
  return String(v);
}

function numero(v: ExcelJSType.CellValue): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "result" in v) return numero(v.result as ExcelJSType.CellValue);
  const n = Number(texto(v).replace(/[,\s$]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export interface ResultadoExcel {
  partidas: Partida[];
  hojas: { nombre: string; renglones: number }[];
}

/** "Climaproyectos – Rheem 7.5 TR, pagado …" → proveedor "Climaproyectos", notas "Rheem 7.5 TR, pagado …" */
function separarProveedor(s: string): { proveedor: string; notas: string } {
  const limpio = s.replace(/\s+/g, " ").trim();
  const m = limpio.match(/^(.+?)\s+[–—-]\s+(.+)$/);
  return m ? { proveedor: m[1].trim(), notas: m[2].trim() } : { proveedor: limpio, notas: "" };
}

export async function importarExcel(file: Blob, moneda: Moneda): Promise<ResultadoExcel> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const partidas: Partida[] = [];
  const hojas: ResultadoExcel["hojas"] = [];

  wb.eachSheet((ws) => {
    // La hoja de cotizaciones que genera la propia app no es presupuesto.
    if (/cotizaciones\s+proveedores/i.test(ws.name)) return;
    // 1) encabezado dentro de las primeras 20 filas
    let filaEnc = 0;
    let cols: Partial<Record<Col, number>> = {};
    for (let r = 1; r <= Math.min(20, ws.rowCount) && !filaEnc; r++) {
      const c: Partial<Record<Col, number>> = {};
      ws.getRow(r).eachCell((cell, n) => {
        const t = normalizar(texto(cell.value));
        if (!t) return;
        const col = ENCABEZADOS.find(([, re]) => re.test(t))?.[0];
        if (col && c[col] === undefined) c[col] = n;
      });
      if (c.concepto && c.cantidad && c.precio) {
        filaEnc = r;
        cols = c;
      }
    }
    if (!filaEnc) return;

    const sistemaHoja = ws.name.replace(/[_]+/g, " ").replace(/\s*hoja\s*\d+\s*$/i, "").trim() || ws.name;
    const leer = (row: ExcelJSType.Row, col: Col) => (cols[col] ? row.getCell(cols[col]!).value : null);
    let n = 0;

    for (let r = filaEnc + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const concepto = texto(leer(row, "concepto")).replace(/\s+/g, " ").trim();
      const sistemaTxt = texto(leer(row, "sistema")).trim();
      if (!concepto) continue;
      if (/^(sub)?total/i.test(normalizar(concepto)) || /^(sub)?total/i.test(normalizar(sistemaTxt))) continue;

      const pa: Partida = {
        id: nid(),
        sistema: cols.sistema ? sistemaTxt : sistemaHoja,
        seccion: texto(leer(row, "seccion")).trim(),
        descripcion: concepto,
        unidad: texto(leer(row, "unidad")).trim(),
        cantidad: numero(leer(row, "cantidad")),
        venta: numero(leer(row, "precio")),
        notas: texto(leer(row, "notas")).trim(),
        estimado: null,
        adjudicada: "",
      };
      const provTxt = texto(leer(row, "proveedor"));
      const costo = numero(leer(row, "costo"));
      if (provTxt.trim() || costo > 0) {
        const { proveedor, notas } = separarProveedor(provTxt);
        pa.estimado = {
          proveedor,
          unidad: texto(leer(row, "unidadCompra")).trim() || pa.unidad,
          cantidad: cols.cantidadCompra ? numero(leer(row, "cantidadCompra")) : pa.cantidad,
          costo,
          moneda,
          notas: [notas, texto(leer(row, "entrega")).trim()].filter(Boolean).join(" · "),
        };
      }
      partidas.push(pa);
      n++;
    }
    hojas.push({ nombre: ws.name, renglones: n });
  });

  return { partidas, hojas };
}

/* ───────────── Exportar ───────────── */

export async function exportarExcel(p: Proyecto): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Portal Avantrik";
  const ws = wb.addWorksheet("Presupuesto", { views: [{ state: "frozen", ySplit: 4 }] });

  const fmt = p.moneda === "USD" ? '"US$"#,##0.00' : '"$"#,##0.00';
  ws.columns = [
    { width: 18 }, { width: 14 }, { width: 60 }, { width: 8 }, { width: 10 }, { width: 14 }, { width: 15 },
    { width: 28 }, { width: 16 }, { width: 10 }, { width: 10 }, { width: 14 }, { width: 15 }, { width: 15 }, { width: 9 },
    { width: 16 }, { width: 30 },
  ];
  ws.mergeCells("A1:F1");
  ws.getCell("A1").value = `AVANTRIK | ${p.nombre}`;
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A2").value = [p.cliente && `Cliente: ${p.cliente}`, p.folio && `Cot. ${p.folio}`, "Montos sin IVA", p.tipoCambio ? `TC USD ${p.tipoCambio}` : ""]
    .filter(Boolean)
    .join(" · ");

  const enc = [
    "Sistema", "Sección", "Concepto", "Unidad", "Cantidad", "Precio unitario", "Subtotal precio", "Proveedor", "Estatus",
    "Unidad compra", "Cantidad compra", "Costo unitario", "Subtotal costo", "Utilidad", "Margen", "Entrega", "Notas",
  ];
  const filaEnc = ws.getRow(4);
  filaEnc.values = enc;
  filaEnc.font = { bold: true, color: { argb: "FFFFFFFF" } };
  filaEnc.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }));

  let r = 5;
  const subtotales: number[] = [];
  for (const g of agrupar(p.partidas)) {
    const inicio = r;
    const tg = { v: 0, c: 0 };
    for (const pa of g.partidas) {
      const a = analizar(pa, p);
      const venta = a.venta;
      tg.v += venta;
      tg.c += a.costo || 0;
      const estatus = a.opcion ? `Adjudicado ${a.opcion.cot.folio}` : a.estatus;
      const notas = [pa.notas, a.fuente === "estimado" ? pa.estimado?.notas : ""].filter(Boolean).join(" · ");
      ws.getRow(r).values = [
        pa.sistema, pa.seccion, pa.descripcion, pa.unidad, pa.cantidad, pa.venta,
        { formula: `E${r}*F${r}`, result: venta },
        a.proveedor, estatus, a.unidad, a.costo === null ? null : a.cantidad, a.costoUnit,
        a.costo === null ? null : { formula: `K${r}*L${r}`, result: a.costo },
        a.costo === null ? null : { formula: `G${r}-M${r}`, result: venta - a.costo },
        a.costo === null || !venta ? null : { formula: `IF(G${r}=0,"",N${r}/G${r})`, result: (venta - a.costo) / venta },
        a.opcion?.cot.entrega || "",
        notas,
      ];
      ws.getRow(r).getCell(3).alignment = { wrapText: true, vertical: "top" };
      r++;
    }
    const tot = ws.getRow(r);
    tot.values = [
      g.sistema, "", `SUBTOTAL ${g.sistema}`.trim(), "", "", "",
      { formula: `SUM(G${inicio}:G${r - 1})`, result: tg.v }, "", "", "", "", "",
      { formula: `SUM(M${inicio}:M${r - 1})`, result: tg.c },
      { formula: `SUM(N${inicio}:N${r - 1})`, result: tg.v - tg.c },
      { formula: `IF(G${r}=0,"",N${r}/G${r})`, result: tg.v ? (tg.v - tg.c) / tg.v : 0 },
    ];
    tot.font = { bold: true };
    tot.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }));
    subtotales.push(r);
    r += 2;
  }
  const suma = (col: string) => subtotales.map((x) => `${col}${x}`).join(",");
  const total = ws.getRow(r);
  total.values = [
    "TOTAL GENERAL", "", "", "", "", "", { formula: `SUM(${suma("G")})` }, "", "", "", "", "",
    { formula: `SUM(${suma("M")})` }, { formula: `SUM(${suma("N")})` }, { formula: `IF(G${r}=0,"",N${r}/G${r})` },
  ];
  total.font = { bold: true, size: 12 };
  for (const col of ["F", "G", "L", "M", "N"]) ws.getColumn(col).numFmt = fmt;
  ws.getColumn("O").numFmt = "0.0%";

  /* Hoja 2: cotizaciones de proveedores (una fila por línea) */
  const ws2 = wb.addWorksheet("Cotizaciones proveedores", { views: [{ state: "frozen", ySplit: 1 }] });
  ws2.columns = [
    { header: "Folio", width: 9 }, { header: "Proveedor", width: 26 }, { header: "Folio proveedor", width: 14 },
    { header: "Estatus", width: 11 }, { header: "Recibida", width: 11 }, { header: "Vigencia", width: 11 },
    { header: "Entrega", width: 16 }, { header: "Moneda", width: 8 }, { header: "Concepto del presupuesto", width: 50 },
    { header: "Descripción del proveedor", width: 40 }, { header: "Unidad", width: 8 }, { header: "Cantidad", width: 10 },
    { header: "Precio unitario", width: 14 }, { header: "Importe", width: 14 }, { header: "Adjudicada", width: 10 },
    { header: "Contacto", width: 22 }, { header: "Correo", width: 26 }, { header: "Condiciones", width: 26 },
  ];
  ws2.getRow(1).font = { bold: true };
  for (const c of p.cotizaciones) {
    const lineas = c.lineas.length ? c.lineas : [null];
    for (const l of lineas) {
      const pa = l ? p.partidas.find((x) => x.id === l.partidaId) : undefined;
      const fila = ws2.addRow([
        c.folio, c.proveedor, c.folioProveedor, c.estatus, c.fechaRecepcion, c.vigencia, c.entrega, c.moneda,
        pa?.descripcion || (l ? "(sin ligar)" : ""), l?.descripcion || "", l?.unidad || "", l?.cantidad ?? null, l?.precio ?? null,
        null, l && pa?.adjudicada === l.id ? "★" : "", c.contacto, c.correo, c.condiciones,
      ]);
      if (l) fila.getCell(14).value = { formula: `L${fila.number}*M${fila.number}`, result: l.cantidad * l.precio };
    }
  }
  ws2.getColumn(13).numFmt = "#,##0.00";
  ws2.getColumn(14).numFmt = "#,##0.00";

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
