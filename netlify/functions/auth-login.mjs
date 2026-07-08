import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * POST /api/login  { email, password }
 *
 * Valida contra las variables de entorno de Netlify (nunca en el código):
 *  - PORTAL_USERS:  "correo:contraseña,correo:contraseña,..."
 *  - PORTAL_SECRET: cadena aleatoria larga para firmar los tokens
 *
 * Devuelve { token, email, exp }. El token es HMAC-SHA256 firmado y expira
 * a los 30 días. Las funciones protegidas lo verifican en cada petición.
 */

const TOKEN_DAYS = 30;

function parseUsers() {
  const raw = process.env.PORTAL_USERS || "";
  const map = new Map();
  for (const pair of raw.split(",")) {
    const idx = pair.indexOf(":");
    if (idx > 0) {
      map.set(pair.slice(0, idx).trim().toLowerCase(), pair.slice(idx + 1).trim());
    }
  }
  return map;
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }

  const secret = process.env.PORTAL_SECRET;
  if (!secret || !process.env.PORTAL_USERS) {
    return Response.json(
      { error: "El portal no está configurado (faltan variables de entorno)" },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!email || !password) {
    return Response.json({ error: "Falta correo o contraseña" }, { status: 400 });
  }

  const users = parseUsers();
  const expected = users.get(email);
  if (!expected || !safeEqual(password, expected)) {
    return Response.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  }

  const exp = Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${email}|${exp}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${sign(payload, secret)}`;

  return Response.json({ token, email, exp });
};

export const config = {
  path: "/api/login",
};
