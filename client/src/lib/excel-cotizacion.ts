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
 * - El proveedor y costo de cada renglón se vuelven su opción elegida.
 */
import type ExcelJSType from "exceljs";
import {
  agrupar, analizar, costoTotal, costoUnitEnProyecto, nid, normalizar, ofertaValida,
  type Moneda, type Oferta, type Partida, type Proyecto,
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
        ofertas: [],
        elegida: "",
      };
      const provTxt = texto(leer(row, "proveedor"));
      const costo = numero(leer(row, "costo"));
      if (provTxt.trim() || costo > 0) {
        const { proveedor, notas } = separarProveedor(provTxt);
        const o: Oferta = {
          id: nid(),
          proveedor,
          unidad: texto(leer(row, "unidadCompra")).trim() || pa.unidad,
          cantidad: cols.cantidadCompra ? numero(leer(row, "cantidadCompra")) : pa.cantidad,
          costo,
          moneda,
          entrega: texto(leer(row, "entrega")).trim(),
          notas,
          archivoId: "",
        };
        pa.ofertas.push(o);
        pa.elegida = o.id;
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
  const ws = wb.addWorksheet("Cotización", { views: [{ state: "frozen", ySplit: 4 }] });

  const fmt = p.moneda === "USD" ? '"US$"#,##0.00' : '"$"#,##0.00';
  ws.columns = [
    { width: 18 }, { width: 14 }, { width: 60 }, { width: 8 }, { width: 10 }, { width: 14 }, { width: 15 },
    { width: 10 }, { width: 10 }, { width: 14 }, { width: 15 }, { width: 30 }, { width: 15 }, { width: 9 },
    { width: 16 }, { width: 30 },
  ];
  ws.mergeCells("A1:F1");
  ws.getCell("A1").value = `AVANTRIK | ${p.nombre}`;
  ws.getCell("A1").font = { bold: true, size: 14 };
  ws.getCell("A2").value = [p.cliente && `Cliente: ${p.cliente}`, p.folio && `Cot. ${p.folio}`, "Precios sin IVA", p.tipoCambio ? `TC USD ${p.tipoCambio}` : ""]
    .filter(Boolean)
    .join(" · ");

  const enc = [
    "Sistema", "Sección", "Concepto", "Unidad", "Cantidad", "Precio unitario", "Subtotal precio", "Unidad compra",
    "Cantidad compra", "Costo unitario", "Subtotal costo", "Proveedor", "Utilidad", "Margen", "Entrega", "Notas",
  ];
  const filaEnc = ws.getRow(4);
  filaEnc.values = enc;
  filaEnc.font = { bold: true, color: { argb: "FFFFFFFF" } };
  filaEnc.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }));

  let r = 5;
  const subtotales: number[] = [];
  for (const g of agrupar(p.partidas)) {
    const inicio = r;
    for (const pa of g.partidas) {
      const a = analizar(pa, p);
      const o = a.oferta;
      const cu = o ? costoUnitEnProyecto(o, p) : null;
      const row = ws.getRow(r);
      const venta = pa.venta * pa.cantidad;
      const costo = o && cu !== null ? cu * o.cantidad : null;
      row.values = [
        pa.sistema, pa.seccion, pa.descripcion, pa.unidad, pa.cantidad, pa.venta,
        { formula: `E${r}*F${r}`, result: venta },
        o?.unidad || "", o ? o.cantidad : null, cu,
        costo === null ? null : { formula: `I${r}*J${r}`, result: costo },
        o ? [o.proveedor, o.notas].filter(Boolean).join(" – ") : "",
        costo === null ? null : { formula: `G${r}-K${r}`, result: venta - costo },
        costo === null || !venta ? null : { formula: `IF(G${r}=0,"",M${r}/G${r})`, result: (venta - costo) / venta },
        o?.entrega || "",
        pa.notas,
      ];
      row.getCell(3).alignment = { wrapText: true, vertical: "top" };
      r++;
    }
    const tot = ws.getRow(r);
    const tg = { v: 0, c: 0 };
    g.partidas.forEach((pa) => {
      const a = analizar(pa, p);
      tg.v += a.venta;
      tg.c += a.costo || 0;
    });
    tot.values = [
      g.sistema, "", `SUBTOTAL ${g.sistema}`.trim(), "", "", "",
      { formula: `SUM(G${inicio}:G${r - 1})`, result: tg.v }, "", "", "",
      { formula: `SUM(K${inicio}:K${r - 1})`, result: tg.c }, "",
      { formula: `SUM(M${inicio}:M${r - 1})`, result: tg.v - tg.c },
      { formula: `IF(G${r}=0,"",M${r}/G${r})`, result: tg.v ? (tg.v - tg.c) / tg.v : 0 },
    ];
    tot.font = { bold: true };
    tot.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }));
    subtotales.push(r);
    r += 2;
  }
  const total = ws.getRow(r);
  const suma = (col: string) => subtotales.map((s) => `${col}${s}`).join(",");
  total.values = [
    "TOTAL GENERAL", "", "", "", "", "", { formula: `SUM(${suma("G")})` }, "", "", "", { formula: `SUM(${suma("K")})` }, "",
    { formula: `SUM(${suma("M")})` }, { formula: `IF(G${r}=0,"",M${r}/G${r})` },
  ];
  total.font = { bold: true, size: 12 };

  for (const col of ["F", "G", "J", "K", "M"]) ws.getColumn(col).numFmt = fmt;
  ws.getColumn("N").numFmt = "0.0%";

  /* Hoja 2: todas las opciones de proveedor */
  const ws2 = wb.addWorksheet("Opciones de proveedores", { views: [{ state: "frozen", ySplit: 1 }] });
  ws2.columns = [
    { header: "Sistema", width: 18 }, { header: "Concepto", width: 55 }, { header: "Elegida", width: 8 },
    { header: "Proveedor", width: 28 }, { header: "Unidad compra", width: 10 }, { header: "Cantidad compra", width: 10 },
    { header: "Costo unitario", width: 14 }, { header: "Moneda", width: 8 }, { header: `Subtotal (${p.moneda})`, width: 15 },
    { header: "Margen", width: 9 }, { header: "Entrega", width: 16 }, { header: "Notas", width: 35 },
  ];
  ws2.getRow(1).font = { bold: true };
  for (const pa of p.partidas) {
    const venta = pa.venta * pa.cantidad;
    for (const o of pa.ofertas.filter(ofertaValida)) {
      const c = costoTotal(o, p);
      ws2.addRow([
        pa.sistema, pa.descripcion, o.id === pa.elegida ? "✔" : "", o.proveedor, o.unidad, o.cantidad, o.costo, o.moneda,
        c, c !== null && venta ? (venta - c) / venta : null, o.entrega, o.notas,
      ]);
    }
  }
  ws2.getColumn(7).numFmt = "#,##0.00";
  ws2.getColumn(9).numFmt = fmt;
  ws2.getColumn(10).numFmt = "0.0%";

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
