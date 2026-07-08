import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * API del Registro de Compras (misma lógica que la app original, con backend real):
 *
 *  - POST   /api/compras       → subir ticket (PÚBLICO: empleados con el link)
 *  - GET    /api/compras       → listar todo (requiere sesión)
 *  - PUT    /api/compras/:id   → confirmar compra (requiere sesión)
 *  - DELETE /api/compras/:id   → descartar/eliminar (requiere sesión)
 *
 * Datos en Netlify Blobs (store "compras"). Igual que el original: al
 * confirmar, la foto se descarta y queda solo el registro contable.
 */

const MAX_IMG_CHARS = 2_600_000; // ~1.9 MB binario; la foto llega comprimida a 1280px

function tokenValido(req) {
  const secret = process.env.PORTAL_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  let payload;
  try {
    payload = Buffer.from(token.slice(0, dot), "base64url").toString();
  } catch {
    return false;
  }
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const exp = Number(payload.split("|")[1] || 0);
  return Date.now() < exp;
}

export default async (req, context) => {
  const store = getStore("compras");
  const id = context.params?.id;

  /* ── Subir ticket (público, para empleados con el link) ── */
  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "JSON inválido" }, { status: 400 });
    }
    const responsable = String(body?.responsable || "").trim();
    const proyecto = String(body?.proyecto || "").trim();
    const imagen = String(body?.imagen || "");

    if (!responsable || !imagen) {
      return Response.json({ error: "Falta tu nombre o la foto del ticket" }, { status: 400 });
    }
    if (!imagen.startsWith("data:image/") || imagen.length > MAX_IMG_CHARS) {
      return Response.json({ error: "La imagen no es válida o es demasiado grande" }, { status: 400 });
    }

    const nuevoId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.setJSON(nuevoId, {
      estado: "pendiente",
      responsable,
      proyecto,
      imagen,
      creado: Date.now(),
    });
    return Response.json({ id: nuevoId }, { status: 201 });
  }

  /* ── Todo lo demás requiere sesión del portal ── */
  if (!tokenValido(req)) {
    return Response.json({ error: "Sesión inválida o expirada" }, { status: 401 });
  }

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const items = await Promise.all(
      blobs.map(async (b) => {
        const v = await store.get(b.key, { type: "json" }).catch(() => null);
        return v ? { ...v, key: b.key } : null;
      }),
    );
    return Response.json({ items: items.filter(Boolean) });
  }

  if (req.method === "PUT" && id) {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "JSON inválido" }, { status: 400 });
    }
    const existente = await store.get(id, { type: "json" }).catch(() => null);
    if (!existente) {
      return Response.json({ error: "El ticket ya no existe" }, { status: 404 });
    }
    if (!body?.fecha || !body?.concepto || body?.monto == null) {
      return Response.json({ error: "Falta fecha, monto o concepto" }, { status: 400 });
    }
    // Registro confirmado — mismo esquema que la app original (la foto se descarta)
    await store.setJSON(id, {
      estado: "confirmada",
      fecha: String(body.fecha),
      concepto: String(body.concepto),
      monto: Number(body.monto) || 0,
      proyecto: String(body.proyecto ?? existente.proyecto ?? ""),
      justificacion: String(body.justificacion || ""),
      responsable: String(existente.responsable || ""),
      fechaPago: String(body.fechaPago || body.fecha),
      estatus: "Pagada",
      factura: String(body.factura || ""),
      creado: existente.creado || Date.now(),
      procesado: Date.now(),
    });
    return Response.json({ ok: true });
  }

  if (req.method === "DELETE" && id) {
    await store.delete(id);
    return new Response(null, { status: 204 });
  }

  return Response.json({ error: "Método no permitido" }, { status: 405 });
};

export const config = {
  path: ["/api/compras", "/api/compras/:id"],
};
