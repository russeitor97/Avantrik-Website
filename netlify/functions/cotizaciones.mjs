import { getStore } from "@netlify/blobs";
import { emailDeSesion } from "../lib/portal-token.mjs";

/**
 * API de Cotizaciones de proyecto (portal interno). Todo requiere sesión.
 *
 * Un proyecto = nuestra cotización al cliente (partidas con precio de venta)
 * + para cada partida, las ofertas de varios proveedores. El margen se
 * calcula en el cliente.
 *
 *  - GET    /api/cotizaciones                         → listar proyectos
 *  - POST   /api/cotizaciones                         → crear
 *  - GET    /api/cotizaciones/:id                     → uno
 *  - PUT    /api/cotizaciones/:id                     → guardar (con control de versión → 409)
 *  - DELETE /api/cotizaciones/:id                     → eliminar (y sus archivos)
 *  - POST   /api/cotizaciones/:id/archivos            → subir PDF/imagen (cuerpo binario)
 *  - GET    /api/cotizaciones/:id/archivos/:archivoId → descargar
 *  - DELETE /api/cotizaciones/:id/archivos/:archivoId → quitar
 *
 * Blobs: store "cotizaciones" (clave "proy/<id>") y "cotizaciones-adjuntos"
 * (clave "<id>/<archivoId>"). La lista de archivos del proyecto solo la
 * modifican los endpoints de archivos; el PUT la conserva tal cual.
 */

const MAX_ARCHIVO = 4 * 1024 * 1024; // las funciones aceptan ~6 MB de cuerpo
const TIPOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ID = /^[\w-]{1,48}$/;

const txt = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10000) / 10000 : 0;
};
const moneda = (v) => (v === "USD" ? "USD" : "MXN");
const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const idOk = (v) => (ID.test(String(v || "")) ? String(v) : nuevoId());

function limpiarProyecto(b) {
  const partidas = Array.isArray(b?.partidas) ? b.partidas.slice(0, 1500) : [];
  return {
    nombre: txt(b?.nombre, 160),
    cliente: txt(b?.cliente, 160),
    folio: txt(b?.folio, 80),
    moneda: moneda(b?.moneda),
    tipoCambio: num(b?.tipoCambio),
    margenObjetivo: num(b?.margenObjetivo ?? 20),
    estatus: b?.estatus === "Comprado" ? "Comprado" : "Cotizando",
    notas: txt(b?.notas, 4000),
    partidas: partidas.map((p) => {
      const ofertas = Array.isArray(p?.ofertas) ? p.ofertas.slice(0, 30) : [];
      // Oferta = lado de COMPRA del renglón (puede ir en otra unidad/cantidad que la venta)
      const limpias = ofertas.map((o) => ({
        id: idOk(o?.id),
        proveedor: txt(o?.proveedor, 200),
        unidad: txt(o?.unidad, 30),
        cantidad: num(o?.cantidad),
        costo: num(o?.costo),
        moneda: moneda(o?.moneda),
        entrega: txt(o?.entrega, 120),
        notas: txt(o?.notas, 600),
        archivoId: ID.test(String(o?.archivoId || "")) ? String(o.archivoId) : "",
      }));
      const elegida = limpias.some((o) => o.id === p?.elegida) ? String(p.elegida) : "";
      return {
        id: idOk(p?.id),
        sistema: txt(p?.sistema, 120),
        seccion: txt(p?.seccion, 120),
        descripcion: txt(p?.descripcion, 800),
        unidad: txt(p?.unidad, 30),
        cantidad: num(p?.cantidad),
        venta: num(p?.venta),
        notas: txt(p?.notas, 1000),
        ofertas: limpias,
        elegida,
      };
    }),
  };
}

export default async (req, context) => {
  const email = emailDeSesion(req);
  if (!email) return Response.json({ error: "Sesión inválida o expirada" }, { status: 401 });

  const store = getStore({ name: "cotizaciones", consistency: "strong" });
  const archivos = getStore({ name: "cotizaciones-adjuntos", consistency: "strong" });
  const id = context.params?.id ? String(context.params.id) : "";
  const archivoId = context.params?.archivoId ? String(context.params.archivoId) : "";
  const esArchivos = new URL(req.url).pathname.includes("/archivos");

  if ((id && !ID.test(id)) || (archivoId && !ID.test(archivoId))) {
    return Response.json({ error: "Id inválido" }, { status: 400 });
  }

  const leer = (pid) => store.get(`proy/${pid}`, { type: "json" }).catch(() => null);

  /* ───────────── Archivos ───────────── */
  if (id && esArchivos) {
    const proy = await leer(id);
    if (!proy) return Response.json({ error: "El proyecto no existe" }, { status: 404 });

    if (req.method === "POST" && !archivoId) {
      const tipo = (req.headers.get("content-type") || "").split(";")[0].trim();
      if (!TIPOS.includes(tipo)) {
        return Response.json({ error: "Solo PDF o imagen (JPG, PNG, WebP)" }, { status: 400 });
      }
      const buf = await req.arrayBuffer();
      if (buf.byteLength === 0 || buf.byteLength > MAX_ARCHIVO) {
        return Response.json({ error: "El archivo pesa más de 4 MB" }, { status: 413 });
      }
      let nombre = "archivo";
      try {
        nombre = txt(decodeURIComponent(req.headers.get("x-file-name") || ""), 160) || nombre;
      } catch {
        /* nombre por defecto */
      }
      const rol = req.headers.get("x-file-rol") === "nuestra" ? "nuestra" : "proveedor";
      const archivo = { id: nuevoId(), nombre, tipo, tamano: buf.byteLength, rol, subido: Date.now(), subidoPor: email };
      await archivos.set(`${id}/${archivo.id}`, buf, { metadata: { tipo, nombre } });
      // Se relee para no pisar un guardado que haya entrado mientras subía el archivo.
      const actual = (await leer(id)) || proy;
      await store.setJSON(`proy/${id}`, { ...actual, archivos: [...(actual.archivos || []), archivo] });
      return Response.json({ archivo }, { status: 201 });
    }

    if (req.method === "GET" && archivoId) {
      const r = await archivos.getWithMetadata(`${id}/${archivoId}`, { type: "arrayBuffer" }).catch(() => null);
      if (!r) return Response.json({ error: "No se encontró el archivo" }, { status: 404 });
      return new Response(r.data, {
        headers: {
          "Content-Type": String(r.metadata?.tipo || "application/octet-stream"),
          "Cache-Control": "private, no-store",
        },
      });
    }

    if (req.method === "DELETE" && archivoId) {
      await archivos.delete(`${id}/${archivoId}`);
      await store.setJSON(`proy/${id}`, {
        ...proy,
        archivos: (proy.archivos || []).filter((a) => a.id !== archivoId),
      });
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }

  /* ───────────── Proyectos ───────────── */
  if (req.method === "GET" && !id) {
    const { blobs } = await store.list({ prefix: "proy/" });
    const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" }).catch(() => null)));
    return Response.json({ items: items.filter(Boolean) });
  }

  if (req.method === "GET" && id) {
    const proy = await leer(id);
    return proy ? Response.json({ item: proy }) : Response.json({ error: "El proyecto no existe" }, { status: 404 });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "JSON inválido" }, { status: 400 });
    const datos = limpiarProyecto(body);
    if (!datos.nombre) return Response.json({ error: "Ponle nombre al proyecto" }, { status: 400 });
    const ahora = Date.now();
    const proy = {
      ...datos,
      id: nuevoId(),
      archivos: [],
      version: 1,
      creadoPor: email,
      actualizadoPor: email,
      creado: ahora,
      actualizado: ahora,
    };
    await store.setJSON(`proy/${proy.id}`, proy);
    return Response.json({ item: proy }, { status: 201 });
  }

  if (req.method === "PUT" && id) {
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: "JSON inválido" }, { status: 400 });
    const existente = await leer(id);
    if (!existente) return Response.json({ error: "El proyecto ya no existe" }, { status: 404 });
    if (Number(body.version) !== Number(existente.version)) {
      return Response.json(
        { error: "Otra persona modificó este proyecto mientras lo editabas.", item: existente },
        { status: 409 },
      );
    }
    const datos = limpiarProyecto(body);
    if (!datos.nombre) return Response.json({ error: "Ponle nombre al proyecto" }, { status: 400 });
    const proy = {
      ...existente,
      ...datos,
      id: existente.id,
      archivos: existente.archivos || [],
      version: (existente.version || 1) + 1,
      actualizadoPor: email,
      actualizado: Date.now(),
    };
    await store.setJSON(`proy/${id}`, proy);
    return Response.json({ item: proy });
  }

  if (req.method === "DELETE" && id) {
    const { blobs } = await archivos.list({ prefix: `${id}/` });
    await Promise.all(blobs.map((b) => archivos.delete(b.key)));
    await store.delete(`proy/${id}`);
    return new Response(null, { status: 204 });
  }

  return Response.json({ error: "Método no permitido" }, { status: 405 });
};

export const config = {
  path: [
    "/api/cotizaciones",
    "/api/cotizaciones/:id",
    "/api/cotizaciones/:id/archivos",
    "/api/cotizaciones/:id/archivos/:archivoId",
  ],
};
