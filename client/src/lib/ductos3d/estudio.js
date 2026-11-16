/**
 * Estudio de producto compartido por el visor 3D del sitio (Visor3D.tsx) y por
 * el script que genera las imágenes (scripts/ductos-render). Así la pieza que
 * se gira en la página se ve igual que su foto.
 *
 * JavaScript plano (sin TypeScript) a propósito: el script de renders lo carga
 * directo en Chrome sin compilar. Los tipos están en estudio.d.ts.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { armar } from "./piezas.js";

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
function entornoEstudio() {
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


/** Ajustes de color y sombra del renderer. */
export function prepararRenderer(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
}

/** Escena vacía con el reflejo del estudio (lo que hace ver metálica la lámina). */
export function crearEscena(renderer) {
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(entornoEstudio(), 0.04).texture;
  scene.environmentIntensity = 1.0;
  pmrem.dispose();
  return scene;
}

/** Lámina galvanizada, pliegues/cierres y lona. `tamTextura`: 1024 en renders, 512 en el sitio. */
export function crearMateriales(tamTextura = 1024) {
  const flor = texturaFlor(tamTextura);
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
  return { galva, linea, lona };
}

/** Malla de una pieza del catálogo, centrada y apoyada en el piso (y = 0). */
export function construir(nombre, mats) {
  const def = armar(nombre);
  const grupo = new THREE.Group();
  const malla = (geos, mat) => {
    if (!geos?.length) return;
    const limpias = geos.map((g) => {
      const n = g.index ? g.toNonIndexed() : g;
      if (!n.attributes.uv) n.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(n.attributes.position.count * 2).fill(0), 2));
      if (!n.attributes.normal) n.computeVertexNormals();
      for (const k of Object.keys(n.attributes)) if (!["position", "normal", "uv"].includes(k)) n.deleteAttribute(k);
      return n;
    });
    const m = new THREE.Mesh(mergeGeometries(limpias), mat);
    m.castShadow = m.receiveShadow = true;
    grupo.add(m);
  };
  malla(def.galva, mats.galva);
  malla(def.lona, mats.lona);
  malla(def.linea, mats.linea);
  const caja = new THREE.Box3().setFromObject(grupo);
  const c = caja.getCenter(new THREE.Vector3());
  grupo.children.forEach((m) => m.geometry.translate(-c.x, -caja.min.y, -c.z));
  grupo.userData.plano = !!def.plano;
  grupo.userData.giro = def.giro || 0;
  return grupo;
}

/** Piso que solo recibe sombra (el fondo queda del color exacto) + luz principal y de relleno. */
export function iluminar(scene, objeto, { familia = false } = {}) {
  const caja = new THREE.Box3().setFromObject(objeto);
  const centro = caja.getCenter(new THREE.Vector3());
  const radio = caja.getSize(new THREE.Vector3()).length() / 2;

  const piso = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: familia ? 0.55 : 0.2 }));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);

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
}

/**
 * Cámara 3/4, igual para todas las piezas: la coloca para que el objeto llene
 * el cuadro y devuelve el punto al que mira (el centro de giro del visor).
 */
export function encuadrar(camara, objeto, { familia = false, plano = false } = {}) {
  const caja = new THREE.Box3().setFromObject(objeto);
  const centro = caja.getCenter(new THREE.Vector3());
  const tam = caja.getSize(new THREE.Vector3());
  const radio = tam.length() / 2;
  const dir = familia ? new THREE.Vector3(0.22, 0.46, 1) : plano ? new THREE.Vector3(0.55, 0.75, 1) : new THREE.Vector3(0.95, 0.55, 1.15);
  dir.normalize();
  const vFov = (camara.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camara.aspect);
  const dist = (radio * (familia ? 0.86 : 1.12)) / Math.sin(Math.min(vFov, hFov) / 2);
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
  return { mira, radio };
}
