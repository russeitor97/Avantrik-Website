import Anthropic from "@anthropic-ai/sdk";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * POST /.netlify/functions/diagnostico  { prompt }
 *
 * Genera hallazgos técnicos para la app de Reportes de Servicio usando la
 * API de Claude. Requiere sesión del portal (Bearer token) y la variable de
 * entorno ANTHROPIC_API_KEY en Netlify; sin la key responde 501 con un
 * mensaje claro para que la app lo muestre (la función es opcional).
 *
 * Modelo configurable con DIAGNOSTICO_MODEL (default: claude-haiku-4-5,
 * el más económico — la salida es un JSON corto de 2-4 hallazgos).
 */

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

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }
  if (!tokenValido(req)) {
    return Response.json(
      { error: "Sesión inválida o expirada — vuelve a iniciar sesión en /portal" },
      { status: 401 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Diagnóstico IA no configurado (falta ANTHROPIC_API_KEY en Netlify)" },
      { status: 501 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  const prompt = String(body?.prompt || "").slice(0, 20_000);
  if (!prompt) {
    return Response.json({ error: "Falta el prompt" }, { status: 400 });
  }

  const client = new Anthropic();
  try {
    const msg = await client.messages.create({
      model: process.env.DIAGNOSTICO_MODEL || "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const result = msg.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
    return Response.json({ result });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return Response.json({ error: `Error de la IA: ${err.message}` }, { status: 502 });
    }
    return Response.json({ error: "No se pudo conectar con el servicio de IA" }, { status: 502 });
  }
};
