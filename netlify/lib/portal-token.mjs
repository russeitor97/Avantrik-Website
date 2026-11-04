import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifica el token del Portal Avantrik (emitido por /api/login).
 * Formato: base64url("email|exp") + "." + HMAC-SHA256(payload, PORTAL_SECRET).
 * Devuelve el correo de la sesión, o null si el token no es válido/expiró.
 *
 * Vive fuera de netlify/functions para que Netlify no lo publique como
 * función; esbuild lo empaqueta dentro de cada función que lo importa.
 */
export function emailDeSesion(req) {
  const secret = process.env.PORTAL_SECRET;
  if (!secret) return null;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  let payload;
  try {
    payload = Buffer.from(token.slice(0, dot), "base64url").toString();
  } catch {
    return null;
  }
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [email, exp] = payload.split("|");
  if (!(Date.now() < Number(exp || 0))) return null;
  return email || null;
}
