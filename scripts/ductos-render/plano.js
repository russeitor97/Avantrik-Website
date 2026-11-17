/**
 * Fondo "plano técnico": una instalación de HVAC dibujada en alambre, como una
 * vista 3D de AutoCAD. Red de ductos con codos, tees, bajadas a difusores, una
 * manejadora y tubería de agua helada con bridas y válvulas.
 * Líneas blancas sobre fondo transparente; el sitio les baja la opacidad.
 *
 *   node scripts/ductos-render/render.mjs plano   → client/public/fondos/plano.webp
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { V, X, Y, Z, seccion, lamina, brida, ruta } from "/lib/geometria.js";

const q = new URLSearchParams(location.search);
const ANCHO = Number(q.get("w") || 2400);
const ALTO = Number(q.get("h") || 1200);

const piezas = []; // geometrías de superficie → se convierten a aristas
const lineas = []; // segmentos sueltos [a, b]

/* ───────── ductos ───────── */

/** Ducto horizontal por una polilínea de esquinas a 90°, con codos de radio y bridas cada tramo. */
function ductoH(esquinas, w, h, r = w * 0.9, tramo = 1.5) {
  const pts = [];
  const tan = [];
  const add = (p, t) => { pts.push(p); tan.push(t); };
  for (let i = 0; i < esquinas.length - 1; i++) {
    const A = esquinas[i];
    const B = esquinas[i + 1];
    const d = B.clone().sub(A).normalize();
    const ini = i === 0 ? A.clone() : A.clone().addScaledVector(d, r);
    const fin = i === esquinas.length - 2 ? B.clone() : B.clone().addScaledVector(d, -r);
    // tramo recto con secciones intermedias (bridas)
    const L = ini.distanceTo(fin);
    const n = Math.max(1, Math.round(L / tramo));
    for (let k = 0; k <= n; k++) add(ini.clone().lerp(fin, k / n), d);
    // codo hacia el siguiente tramo
    if (i < esquinas.length - 2) {
      const C = esquinas[i + 2];
      const d2 = C.clone().sub(B).normalize();
      const centro = fin.clone().addScaledVector(d2, r);
      for (let k = 1; k < 12; k++) {
        const th = (k / 12) * (Math.PI / 2);
        add(centro.clone().addScaledVector(d2, -r * Math.cos(th)).addScaledVector(d, r * Math.sin(th)), d.clone().multiplyScalar(Math.cos(th)).addScaledVector(d2, Math.sin(th)));
      }
    }
  }
  const secs = ruta(pts, tan, w, h);
  piezas.push(lamina(secs));
  // bridas solo en las juntas de tramo recto
  secs.forEach((s, i) => {
    const recto = i === 0 || i === secs.length - 1 || tan[i].equals(tan[i - 1]) && tan[i].equals(tan[i + 1] || tan[i]);
    if (recto) piezas.push(brida(s, { f: 0.035, ceja: 0.015 }));
  });
  return secs;
}

/** Bajada vertical desde un ducto hasta un difusor cuadrado con su plenum. */
function bajada(x, z, yTop, yBot, w = 0.35) {
  const s0 = seccion(V(x, yTop, z), X, Z, w, w);
  const s1 = seccion(V(x, yBot + 0.35, z), X, Z, w, w);
  piezas.push(lamina([s0, s1]), brida(s1, { f: 0.03 }));
  // plenum (caja) y difusor
  const p0 = seccion(V(x, yBot + 0.35, z), X, Z, 0.7, 0.7);
  const p1 = seccion(V(x, yBot, z), X, Z, 0.7, 0.7);
  piezas.push(lamina([p0, p1]));
  const dif = new THREE.BoxGeometry(0.75, 0.04, 0.75).translate(x, yBot - 0.02, z);
  piezas.push(dif);
  for (const k of [0.12, 0.22]) {
    const c = new THREE.BoxGeometry(0.75 - 2 * k, 0.001, 0.75 - 2 * k).translate(x, yBot - 0.041, z);
    piezas.push(c);
  }
}

/* ───────── tubería ───────── */

function tubo(a, b, r) {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r, r, d.length(), 14, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize()));
  g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
  piezas.push(g);
}

function bridaTubo(p, dir, r) {
  const g = new THREE.CylinderGeometry(r * 1.9, r * 1.9, 0.04, 14);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, dir));
  g.translate(...p.toArray());
  piezas.push(g);
}

function codoTubo(centro, r, a, b, rt) {
  // cuarto de toro en el plano a-b alrededor de `centro`
  const g = new THREE.TorusGeometry(r, rt, 10, 10, Math.PI / 2);
  const n = new THREE.Vector3().crossVectors(a, b);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(a, b, n));
  g.translate(...centro.toArray());
  piezas.push(g);
}

function valvula(p, dir, r) {
  // cuerpo, bonete y volante de una válvula de compuerta
  const cuerpo = new THREE.CylinderGeometry(r * 1.6, r * 1.6, r * 3, 12);
  cuerpo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, dir));
  cuerpo.translate(...p.toArray());
  const vastago = new THREE.CylinderGeometry(r * 0.25, r * 0.25, r * 4, 8).translate(p.x, p.y + r * 2.5, p.z);
  const volante = new THREE.TorusGeometry(r * 1.4, r * 0.15, 6, 18).rotateX(Math.PI / 2).translate(p.x, p.y + r * 4.5, p.z);
  piezas.push(cuerpo, vastago, volante);
  bridaTubo(p.clone().addScaledVector(dir, -r * 1.6), dir, r);
  bridaTubo(p.clone().addScaledVector(dir, r * 1.6), dir, r);
}

/** Tubería horizontal por esquinas a 90°, con codos, bridas y válvulas. */
function tuberia(esquinas, r, rc = r * 3.5, valvulasEn = []) {
  for (let i = 0; i < esquinas.length - 1; i++) {
    const A = esquinas[i];
    const B = esquinas[i + 1];
    const d = B.clone().sub(A).normalize();
    const ini = i === 0 ? A.clone() : A.clone().addScaledVector(d, rc);
    const fin = i === esquinas.length - 2 ? B.clone() : B.clone().addScaledVector(d, -rc);
    tubo(ini, fin, r);
    const L = ini.distanceTo(fin);
    for (let k = 1; k * 2 < L; k++) bridaTubo(ini.clone().addScaledVector(d, k * 2), d, r);
    if (i < esquinas.length - 2) {
      const d2 = esquinas[i + 2].clone().sub(B).normalize();
      codoTubo(fin.clone().addScaledVector(d2, rc), rc, d2.clone().negate(), d, r);
    }
  }
  for (const [i, t] of valvulasEn) {
    const A = esquinas[i];
    const B = esquinas[i + 1];
    valvula(A.clone().lerp(B, t), B.clone().sub(A).normalize(), r);
  }
}

/* ───────── manejadora ───────── */

function manejadora(c, L = 3.4, a = 1.6, h = 1.7) {
  piezas.push(new THREE.BoxGeometry(L, h, a).translate(c.x, c.y + h / 2, c.z));
  // paneles y puertas
  for (const x of [-L / 2 + 0.9, -L / 2 + 1.8, -L / 2 + 2.6]) lineas.push([V(c.x + x, c.y, c.z + a / 2), V(c.x + x, c.y + h, c.z + a / 2)]);
  for (const [x0, x1] of [[-L / 2 + 0.15, -L / 2 + 0.8], [-L / 2 + 1.0, -L / 2 + 1.7]]) {
    const z = c.z + a / 2 + 0.001;
    const y0 = c.y + 0.15, y1 = c.y + h - 0.15;
    lineas.push([V(c.x + x0, y0, z), V(c.x + x1, y0, z)], [V(c.x + x1, y0, z), V(c.x + x1, y1, z)], [V(c.x + x1, y1, z), V(c.x + x0, y1, z)], [V(c.x + x0, y1, z), V(c.x + x0, y0, z)]);
    lineas.push([V(c.x + x1 - 0.08, c.y + h / 2 - 0.12, z), V(c.x + x1 - 0.08, c.y + h / 2 + 0.12, z)]); // manija
  }
  // base
  piezas.push(new THREE.BoxGeometry(L + 0.1, 0.15, a + 0.1).translate(c.x, c.y - 0.075, c.z));
}

/* ───────── la instalación ───────── */

const Hd = 2.6; // altura de los ductos
// manejadora y su descarga
manejadora(V(-6.2, 0, -1.2));
const tronco = ductoH([V(-4.5, Hd, -1.2), V(-1.5, Hd, -1.2), V(-1.5, Hd, 2.5), V(6.5, Hd, 2.5), V(6.5, Hd, -3)], 0.9, 0.55);
// cuello de la manejadora hacia el ducto
piezas.push(lamina([seccion(V(-4.6, 1.2, -1.2), Z.clone().negate(), Y, 0.9, 0.55), seccion(V(-4.5, Hd, -1.2), Z.clone().negate(), Y, 0.9, 0.55)]));
// ramales con bajadas a difusores
const ramal = (x, z0, z1, w = 0.5) => {
  ductoH([V(x, Hd, z0), V(x, Hd, z1)], w, 0.35);
  bajada(x, z1 + Math.sign(z1 - z0) * 0.05, Hd - 0.18, 0.9);
};
ramal(0.6, 2.5 - 0.45, -1.4);
ramal(3.2, 2.5 - 0.45, -1.6);
ramal(1.9, 2.5 + 0.45, 5.4);
ramal(4.5, 2.5 + 0.45, 5.6);
ductoH([V(6.5 - 0.45, Hd, -1), V(9, Hd, -1)], 0.5, 0.35);
bajada(9.05, -1, Hd - 0.18, 0.9);
// retorno paralelo, más alto
ductoH([V(-4.5, Hd + 1.2, 0.3), V(-2.6, Hd + 1.2, 0.3), V(-2.6, Hd + 1.2, 7.5), V(8.5, Hd + 1.2, 7.5)], 0.8, 0.45);
// agua helada: alimentación y retorno al serpentín de la manejadora
const rT = 0.07;
tuberia([V(-6.8, 0.45, 0.4), V(-6.8, 0.45, 4.2), V(2.5, 0.45, 4.2), V(2.5, 0.45, 9)], rT, rT * 3.5, [[1, 0.25], [2, 0.5]]);
tuberia([V(-5.9, 0.75, 0.4), V(-5.9, 0.75, 3.6), V(3.3, 0.75, 3.6), V(3.3, 0.75, 9)], rT, rT * 3.5, [[1, 0.32], [2, 0.42]]);
void tronco;

/* ───────── dibujo ───────── */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(2);
renderer.setSize(ANCHO, ALTO);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();

const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
const limpias = piezas.map((g) => {
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (k !== "position") n.deleteAttribute(k);
  return n;
});
scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(mergeGeometries(limpias), 8), mat));
const ls = new THREE.BufferGeometry().setFromPoints(lineas.flat());
scene.add(new THREE.LineSegments(ls, mat));

const camara = new THREE.PerspectiveCamera(30, ANCHO / ALTO, 0.1, 200);
camara.position.set(-1.2, 12.5, 19);
camara.lookAt(1.0, 0.6, 2.6);
renderer.render(scene, camara);
window.__listo = true;
