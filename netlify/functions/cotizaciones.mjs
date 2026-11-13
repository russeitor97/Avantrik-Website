import { getStore } from "@netlify/blobs";
import { emailDeSesion } from "../lib/portal-token.mjs";

/**
 * API de Cotizaciones (portal interno). Todo requiere sesión del portal.
 *
 *  - GET    /api/cotizaciones               → listar todas (sin archivos)
 *  - POST   /api/cotizaciones               → crear (asigna folio COT-AAAA-NNN)
 *  - PUT    /api/cotizaciones/:id           → actualizar
 *  - DELETE /api/cotizaciones/:id           → eliminar (y su archivo)
 *  - GET    /api/cotizaciones/:id/adjunto   → descargar el PDF/imagen del proveedor
 *  - PUT    /api/cotizaciones/:id/adjunto   → subir/reemplazar (cuerpo binario)
 *  - DELETE /api/cotizaciones/:id/adjunto   → quitar archivo
 *
 * Datos en Netlify Blobs: store "cotizaciones" (claves "cot/<id>" y
 * "meta/folio-<año>") y store "cotizaciones-adjuntos" (clave = id).
 */

const MAX_ADJUNTO = 4 * 1024 * 1024; // las funciones aceptan ~6 MB de cuerpo
const TIPOS_ADJUNTO = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ESTATUS = ["Solicitada", "Recibida", "Aprobada", "Rechazada"];
const MAX_PARTIDAS = 300;

const txt = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10000) / 10000 : 0;
};
const fechaISO = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : "");

/** Normaliza lo que manda el cliente: solo campos conocidos y con tope de tamaño. */
function limpiar(body) {
  const partidas = Array.isArray(body?.partidas) ? body.partidas.slice(0, MAX_PARTIDAS) : [];
  return {
    proyecto: txt(body?.proyecto, 120),
    cliente: txt(body?.cliente, 160),
    proveedor: txt(body?.proveedor, 160),
    contacto: txt(body?.contacto, 160),
    telefono: txt(body?.telefono, 60),
    correo: txt(body?.correo, 160),
    folioProveedor: txt(body?.folioProveedor, 80),
    fecha: fechaISO(body?.fecha),
    vigencia: fechaISO(body?.vigencia),
    moneda: body?.moneda === "USD" ? "USD" : "MXN",
    entrega: txt(body?.entrega, 160),
    condicionesPago: txt(body?.condicionesPago, 160),
    estatus: ESTATUS.includes(body?.estatus) ? body.estatus : "Recibida",
    iva: body?.iva !== false,
    notas: txt(body?.notas, 4000),
    partidas: partidas
      .map((p) => ({
        descripcion: txt(p?.descripcion, 400),
        marca: txt(p?.marca, 160),
        cantidad: num(p?.cantidad),
        unidad: txt(p?.unidad, 30),
        precio: num(p?.precio),
      }))
      .filter((p) => p.descripcion || p.marca || p.precio),
  };
}

async function siguienteFolio(store) {
  const anio = new Date().getFullYear();
  const key = `meta/folio-${anio}`;
  const actual = (await store.get(key, { type: "json" }).catch(() => null))?.n || 0;
  const n = actual + 1;
  await store.setJSON(key, { n });
  return `COT-${anio}-${String(n).padStart(3, "0")}`;
}

export default async (req, context) => {
  const email = emailDeSesion(req);
  if (!email) {
    return Response.json({ error: "Sesión inválida o expirada" }, { status: 401 });
  }

  const store = getStore({ name: "cotizaciones", consistency: "strong" });
  const archivos = getStore({ name: "cotizaciones-adjuntos", consistency: "strong" });
  const id = context.params?.id ? String(context.params.id) : "";
  const esAdjunto = new URL(req.url).pathname.endsWith("/adjunto");

  if (id && !/^[\w-]{1,64}$/.test(id)) {
    return Response.json({ error: "Id inválido" }, { status: 400 });
  }

  /* ───────────── Archivo adjunto ───────────── */
  if (id && esAdjunto) {
    const cot = await store.get(`cot/${id}`, { type: "json" }).catch(() => null);
    if (!cot) return Response.json({ error: "La cotización no existe" }, { status: 404 });

    if (req.method === "GET") {
      const r = await archivos.getWithMetadata(id, { type: "arrayBuffer" }).catch(() => null);
      if (!r) return Response.json({ error: "Sin archivo" }, { status: 404 });
      return new Response(r.data, {
        headers: {
          "Content-Type": String(r.metadata?.tipo || "application/octet-stream"),
          "Cache-Control": "private, no-store",
        },
      });
    }

    if (req.method === "PUT") {
      const tipo = (req.headers.get("content-type") || "").split(";")[0].trim();
      if (!TIPOS_ADJUNTO.includes(tipo)) {
        return Response.json({ error: "Solo PDF o imagen (JPG, PNG, WebP)" }, { status: 400 });
      }
      const buf = await req.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_ADJUNTO) {
        return Response.json({ error: "El archivo pesa más de 4 MB" }, { status: 413 });
      }
      let nombre = "cotizacion";
      try {
        nombre = txt(decodeURIComponent(req.headers.get("x-file-name") || ""), 160) || nombre;
      } catch {
        /* nombre por defecto */
      }
      await archivos.set(id, buf, { metadata: { tipo, nombre } });
      const adjunto = { nombre, tipo, tamano: buf.byteLength };
      await store.setJSON(`cot/${id}`, { ...cot, adjunto, actualizado: Date.now(), actualizadoPor: email });
      return Response.json({ adjunto });
    }

    if (req.method === "DELETE") {
      await archivos.delete(id);
      await store.setJSON(`cot/${id}`, { ...cot, adjunto: null, actualizado: Date.now(), actualizadoPor: email });
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }

  /* ───────────── Cotizaciones ───────────── */
  if (req.method === "GET" && !id) {
    const { blobs } = await store.list({ prefix: "cot/" });
    const items = await Promise.all(
      blobs.map((b) => store.get(b.key, { type: "json" }).catch(() => null)),
    );
    return Response.json({ items: items.filter(Boolean) });
  }

  if (req.method === "POST" && !id) {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "JSON inválido" }, { status: 400 });
    }
    const datos = limpiar(body);
    if (!datos.proveedor && !datos.proyecto) {
      return Response.json({ error: "Captura al menos el proyecto o el proveedor" }, { status: 400 });
    }
    const nuevoId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ahora = Date.now();
    const cot = {
      ...datos,
      id: nuevoId,
      folio: await siguienteFolio(store),
      adjunto: null,
      creadoPor: email,
      actualizadoPor: email,
      creado: ahora,
      actualizado: ahora,
    };
    await store.setJSON(`cot/${nuevoId}`, cot);
    return Response.json({ item: cot }, { status: 201 });
  }

  if (req.method === "PUT" && id) {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "JSON inválido" }, { status: 400 });
    }
    const existente = await store.get(`cot/${id}`, { type: "json" }).catch(() => null);
    if (!existente) return Response.json({ error: "La cotización ya no existe" }, { status: 404 });
    const datos = limpiar(body);
    if (!datos.proveedor && !datos.proyecto) {
      return Response.json({ error: "Captura al menos el proyecto o el proveedor" }, { status: 400 });
    }
    // id, folio, adjunto y autoría no se pueden cambiar desde el cliente
    const cot = {
      ...existente,
      ...datos,
      id: existente.id,
      folio: existente.folio,
      adjunto: existente.adjunto ?? null,
      actualizadoPor: email,
      actualizado: Date.now(),
    };
    await store.setJSON(`cot/${id}`, cot);
    return Response.json({ item: cot });
  }

  if (req.method === "DELETE" && id) {
    await store.delete(`cot/${id}`);
    await archivos.delete(id).catch(() => {});
    return new Response(null, { status: 204 });
  }

  return Response.json({ error: "Método no permitido" }, { status: 405 });
};

export const config = {
  path: ["/api/cotizaciones", "/api/cotizaciones/:id", "/api/cotizaciones/:id/adjunto"],
};
