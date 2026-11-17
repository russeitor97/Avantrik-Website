/**
 * Genera las imágenes del catálogo de ductos (renders 3D) en client/public/ductos/.
 *
 *   node scripts/ductos-render/render.mjs            → todas las piezas + foto de familia
 *   node scripts/ductos-render/render.mjs codo-90    → solo esa pieza
 *
 * Usa el Chrome instalado (CHROME_PATH para otra ruta). No forma parte del sitio:
 * solo produce archivos .webp. Para usar una FOTO real en vez del render, basta
 * con reemplazar el archivo del mismo nombre en client/public/ductos/.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../..");
const salida = path.join(raiz, "client/public/ductos");
const libreria = path.join(raiz, "client/src/lib/ductos3d"); // geometría y estudio compartidos con el sitio
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let base = aqui;
  let ruta = decodeURIComponent(url.pathname);
  if (ruta.startsWith("/three/")) base = path.join(raiz, "node_modules");
  else if (ruta.startsWith("/lib/")) {
    base = libreria;
    ruta = ruta.slice(4);
  }
  const archivo = path.join(base, ruta);
  if (!archivo.startsWith(base) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream" });
  fs.createReadStream(archivo).pipe(res);
});
await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
const origen = `http://127.0.0.1:${servidor.address().port}`;


const pedidas = process.argv.slice(2);
const nombres = pedidas.length ? pedidas.filter((n) => n !== "familia" && n !== "plano") : await listar();
const conFamilia = !pedidas.length || pedidas.includes("familia");
const conPlano = !pedidas.length || pedidas.includes("plano");

async function listar() {
  const src = fs.readFileSync(path.join(libreria, "piezas.js"), "utf8");
  const cuerpo = src.slice(src.indexOf("export const PIEZAS"), src.indexOf("export const FAMILIA"));
  return [...cuerpo.matchAll(/^ {2}"?([a-z0-9-]+)"?: \(\) =>/gm)].map((m) => m[1]);
}

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=metal", "--hide-scrollbars"],
});
fs.mkdirSync(salida, { recursive: true });

async function tomar(consulta, w, h, archivo, pagina0 = "escena.html") {
  const pagina = await navegador.newPage();
  pagina.on("pageerror", (e) => console.error("  error en la escena:", e.message));
  pagina.on("console", (m) => m.type() === "error" && console.error("  consola:", m.text()));
  await pagina.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await pagina.goto(`${origen}/${pagina0}?${consulta}&w=${w}&h=${h}`);
  await pagina.waitForFunction("window.__listo === true", { timeout: 60000 });
  fs.mkdirSync(path.dirname(path.join(salida, archivo)), { recursive: true });
  await pagina.screenshot({ path: path.join(salida, archivo), type: "webp", quality: 88, omitBackground: pagina0 !== "escena.html" });
  await pagina.close();
  console.log("✓", archivo);
}

try {
  for (const n of nombres) await tomar(`pieza=${n}`, 1200, 900, `${n}.webp`);
  if (conFamilia) await tomar("familia=1", 2400, 1100, "catalogo.webp");
  if (conPlano) await tomar("", 2400, 1200, "../fondos/plano.webp", "plano.html"); // fondo de las bandas oscuras
} finally {
  await navegador.close();
  servidor.close();
}
