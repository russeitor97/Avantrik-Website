/**
 * Estudio de producto: fondo liso, luz suave, sombra de contacto y lámina
 * galvanizada. Misma cámara 3/4 para todas las piezas.
 *
 *   escena.html?pieza=codo-90&w=1200&h=900     → una pieza sobre blanco
 *   escena.html?familia=1&w=2400&h=1100        → todo el catálogo junto
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { armar, FAMILIA } from "./piezas.js";

const q = new URLSearchParams(location.search);
const ANCHO = Number(q.get("w") || 1200);
const ALTO = Number(q.get("h") || 900);
const familia = q.has("familia");
const FONDO = familia ? 0x091525 : 0xffffff; // la foto de familia va sobre el azul oscuro del sitio

/* ───────── textura de galvanizado: "flor" de cristales de zinc ───────── */
function azar(semilla) {
  let s = semilla;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function texturaFlor(tam = 1024, celdas = 30) {
  const r = azar(7);
  // un sitio por celda de una rejilla (Voronoi rápido y que repite sin costura)
  const sitios = [];
  for (let j = 0; j < celdas; j++)
    for (let i = 0; i < celdas; i++) sitios.push({ x: (i + r()) / celdas, y: (j + r()) / celdas, tono: r(), brillo: r() });
  const color = document.createElement("canvas");
  const rugo = document.createElement("canvas");
  color.width = color.height = rugo.width = rugo.height = tam;
  const cc = color.getContext("2d");
  const rc = rugo.getContext("2d");
  const ci = cc.createImageData(tam, tam);
  const ri = rc.createImageData(tam, tam);
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      const fx = x / tam, fy = y / tam;
      const gi = Math.floor(fx * celdas), gj = Math.floor(fy * celdas);
      let d1 = 9, d2 = 9, cerca = null;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const ii = (gi + di + celdas) % celdas, jj = (gj + dj + celdas) % celdas;
          const s = sitios[jj * celdas + ii];
          let dx = Math.abs(s.x - fx), dy = Math.abs(s.y - fy);
          if (dx > 0.5) dx = 1 - dx;
          if (dy > 0.5) dy = 1 - dy;
          const d = dx * dx + dy * dy;
          if (d < d1) { d2 = d1; d1 = d; cerca = s; } else if (d < d2) d2 = d;
        }
      const borde = Math.min(1, (Math.sqrt(d2) - Math.sqrt(d1)) * celdas * 3); // 0 en la frontera del cristal
      const grano = (r() - 0.5) * 0.02;
      const c = 0.955 + cerca.tono * 0.045 - (1 - borde) * 0.012 + grano * 0.5; // color casi parejo
      const ru = 0.72 + cerca.brillo * 0.28; // cada cristal refleja distinto
      const k = (y * tam + x) * 4;
      ci.data[k] = ci.data[k + 1] = ci.data[k + 2] = Math.max(0, Math.min(255, c * 255));
      ci.data[k + 3] = 255;
      ri.data[k] = ri.data[k + 1] = ri.data[k + 2] = ru * 255;
      ri.data[k + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0);
  rc.putImageData(ri, 0, 0);
  const tx = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tx(color, true), roughnessMap: tx(rugo, false) };
}

/** Estudio fotográfico: carpa clara con cajas de luz arriba y a los lados. */
function estudio() {
  const e = new THREE.Scene();
  const carpa = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshBasicMaterial({ color: 0x6a6f75, side: THREE.BackSide }));
  carpa.position.y = 5;
  e.add(carpa);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: 0xd5d8db }));
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = -0.95;
  e.add(piso);
  const caja = (w, h, x, y, z, brillo, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(brillo, brillo, brillo), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    e.add(m);
  };
  caja(13, 11, 0, 9.5, 0, 4.6, Math.PI / 2); // cenital
  caja(7, 8, -8, 4, 3, 4.2, 0, Math.PI / 2.4); // lateral izquierda
  caja(7, 8, 8.5, 3.5, 2, 3.0, 0, -Math.PI / 2.3); // relleno derecha
  caja(12, 7, 0, 3.5, 9.5, 2.6); // frontal
  caja(2.5, 9, 4, 5, -9.5, 3); // tira trasera: da el filo brillante
  return e;
}

/* ───────── render ───────── */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(2); // supermuestreo: el navegador lo reduce al tamaño final
renderer.setSize(ANCHO, ALTO);
renderer.setClearColor(FONDO);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(estudio(), 0.04).texture;
scene.environmentIntensity = 1.0;

const flor = texturaFlor();
const galva = new THREE.MeshStandardMaterial({
  color: 0xdadde0,
  metalness: 1,
  roughness: 0.36,
  map: flor.map,
  roughnessMap: flor.roughnessMap,
  side: THREE.DoubleSide,
});
// El interior del ducto recibe menos luz: se oscurecen las caras traseras de la lámina.
galva.onBeforeCompile = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace(
    "#include <opaque_fragment>",
    "if (!gl_FrontFacing) outgoingLight *= 0.62;\n#include <opaque_fragment>",
  );
};
const linea = new THREE.MeshStandardMaterial({ color: 0x8d9399, metalness: 0.9, roughness: 0.55, side: THREE.DoubleSide });
const lona = new THREE.MeshStandardMaterial({ color: 0x23262a, metalness: 0, roughness: 0.85, side: THREE.DoubleSide });

function construir(nombre) {
  const def = armar(nombre);
  const grupo = new THREE.Group();
  const malla = (geos, mat) => {
    if (!geos?.length) return;
    const limpias = geos.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      if (!n.attributes.uv) n.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((n.attributes.position.count) * 2).fill(0), 2));
      if (!n.attributes.normal) n.computeVertexNormals();
      for (const k of Object.keys(n.attributes)) if (!["position", "normal", "uv"].includes(k)) n.deleteAttribute(k);
      return n;
    });
    const m = new THREE.Mesh(mergeGeometries(limpias), mat);
    m.castShadow = m.receiveShadow = true;
    grupo.add(m);
  };
  malla(def.galva, galva);
  malla(def.lona, lona);
  malla(def.linea, linea);
  // centrar en X/Z y apoyar en el piso
  const caja = new THREE.Box3().setFromObject(grupo);
  const c = caja.getCenter(new THREE.Vector3());
  grupo.children.forEach((m) => m.geometry.translate(-c.x, -caja.min.y, -c.z));
  grupo.userData.plano = !!def.plano;
  grupo.userData.giro = def.giro || 0;
  return grupo;
}

const raiz = new THREE.Group();
scene.add(raiz);
if (familia) {
  for (const [nombre, x, z, giro] of FAMILIA) {
    const g = construir(nombre);
    g.rotation.y = g.userData.giro + giro;
    g.position.set(x, 0, z);
    raiz.add(g);
  }
} else {
  const g = construir(q.get("pieza") || "ducto-recto");
  g.rotation.y = g.userData.giro;
  raiz.add(g);
}

const caja = new THREE.Box3().setFromObject(raiz);
const centro = caja.getCenter(new THREE.Vector3());
const tam = caja.getSize(new THREE.Vector3());
const radio = tam.length() / 2;

/* piso: solo recibe sombra, así el fondo queda del color exacto */
const piso = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: familia ? 0.55 : 0.2 }));
piso.rotation.x = -Math.PI / 2;
piso.receiveShadow = true;
scene.add(piso);

/* luz principal con sombra suave + relleno */
const sol = new THREE.DirectionalLight(0xffffff, 1.1);
sol.position.copy(centro).add(new THREE.Vector3(-0.7, 3.2, 0.9).multiplyScalar(radio * 2));
sol.target.position.copy(centro);
sol.castShadow = true;
sol.shadow.mapSize.set(1536, 1536);
const s = radio * 1.6;
Object.assign(sol.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.1, far: radio * 12 });
sol.shadow.radius = familia ? 10 : 22;
sol.shadow.blurSamples = 25;
sol.shadow.bias = -0.0004;
scene.add(sol, sol.target);
const relleno = new THREE.DirectionalLight(0xffffff, 0.25);
relleno.position.set(3, 1.5, 2);
scene.add(relleno);

/* cámara 3/4, igual para todas */
const fov = familia ? 24 : 26;
const camara = new THREE.PerspectiveCamera(fov, ANCHO / ALTO, 0.05, 200);
const plano = !familia && raiz.children[0].userData.plano;
const dir = familia ? new THREE.Vector3(0.22, 0.46, 1) : plano ? new THREE.Vector3(0.55, 0.75, 1) : new THREE.Vector3(0.95, 0.55, 1.15);
dir.normalize();
const vFov = (fov * Math.PI) / 180;
const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camara.aspect);
const margen = familia ? 0.86 : 1.12;
const dist = (radio * margen) / Math.sin(Math.min(vFov, hFov) / 2);
const mira = centro.clone();
if (familia) mira.y -= tam.y * 0.45;
let d = familia ? dist * 0.62 : dist;
const esquinas = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(i & 1 ? caja.max.x : caja.min.x, i & 2 ? caja.max.y : caja.min.y, i & 4 ? caja.max.z : caja.min.z));
for (let paso = 0; paso < 4; paso++) {
  camara.position.copy(mira).addScaledVector(dir, d);
  camara.lookAt(mira);
  camara.updateMatrixWorld();
  const lleno = Math.max(...esquinas.map((e) => { const p = e.clone().project(camara); return Math.max(Math.abs(p.x), Math.abs(p.y)); }));
  d *= lleno / (familia ? 1.16 : 0.9);
}
camara.position.copy(mira).addScaledVector(dir, d);
camara.lookAt(mira);

renderer.render(scene, camara);
renderer.render(scene, camara); // segunda pasada: la sombra VSM ya está difuminada
window.__listo = true;
