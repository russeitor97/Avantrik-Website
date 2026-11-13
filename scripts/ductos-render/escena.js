/**
 * Página que dibuja UNA imagen del catálogo; la abre render.mjs en Chrome headless.
 *
 *   escena.html?pieza=codo-90&w=1200&h=900     → una pieza sobre blanco
 *   escena.html?familia=1&w=2400&h=1100        → todo el catálogo junto
 *
 * El estudio (material, luces, cámara) está en client/src/lib/ductos3d/estudio.js,
 * el mismo que usa el visor 3D de la página.
 */
import * as THREE from "three";
import { prepararRenderer, crearEscena, crearMateriales, construir, iluminar, encuadrar } from "/lib/estudio.js";
import { FAMILIA } from "/lib/piezas.js";

const q = new URLSearchParams(location.search);
const ANCHO = Number(q.get("w") || 1200);
const ALTO = Number(q.get("h") || 900);
const familia = q.has("familia");
const FONDO = familia ? 0x091525 : 0xffffff; // la foto de familia va sobre el azul oscuro del sitio

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(2); // supermuestreo: el navegador lo reduce al tamaño final
renderer.setSize(ANCHO, ALTO);
renderer.setClearColor(FONDO);
prepararRenderer(renderer);
document.body.appendChild(renderer.domElement);

const scene = crearEscena(renderer);
const mats = crearMateriales(1024);

const raiz = new THREE.Group();
scene.add(raiz);
if (familia) {
  for (const [nombre, x, z, giro] of FAMILIA) {
    const g = construir(nombre, mats);
    g.rotation.y = g.userData.giro + giro;
    g.position.set(x, 0, z);
    raiz.add(g);
  }
} else {
  const g = construir(q.get("pieza") || "ducto-recto", mats);
  g.rotation.y = g.userData.giro;
  raiz.add(g);
}

iluminar(scene, raiz, { familia });
const camara = new THREE.PerspectiveCamera(familia ? 24 : 26, ANCHO / ALTO, 0.05, 200);
encuadrar(camara, raiz, { familia, plano: !familia && raiz.children[0].userData.plano });

renderer.render(scene, camara);
renderer.render(scene, camara); // segunda pasada: la sombra VSM ya está difuminada
window.__listo = true;
