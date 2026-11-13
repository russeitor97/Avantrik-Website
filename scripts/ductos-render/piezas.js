/**
 * Catálogo de piezas. Cada función devuelve { galva: [geometrías], lona: [geometrías] }
 * en metros, apoyada como se exhibiría en una mesa (la escena la centra y la baja al piso).
 * El nombre de cada entrada es el nombre del archivo: codo-90 → codo-90.webp
 */
import * as THREE from "three";
import { V, X, Y, Z, seccion, lamina, brida, arco, pittsburgh, quiebres, barrenos, ruta, panel, cinta } from "./geometria.js";

const W = 0.6; // ancho de referencia
const H = 0.4; // alto de referencia
const Q = 0.011; // profundidad del quiebre en X

/** Geometrías que no son lámina clara: pliegues, cierres y barrenos (material más oscuro). */
const LINEAS = [];

/** Tramo recto entre dos secciones, con bridas y cierre Pittsburgh. */
function tramo(s0, s1, { bridas = [true, true], quiebre = Q, cierre = true } = {}) {
  const g = [lamina([s0, s1], { quiebre })];
  if (quiebre) LINEAS.push(...quiebres(s0, s1, quiebre));
  if (cierre) LINEAS.push(pittsburgh([s0, s1]));
  if (bridas[0]) { g.push(brida(s0, { haciaAtras: true })); LINEAS.push(...barrenos(s0)); }
  if (bridas[1]) { g.push(brida(s1)); LINEAS.push(...barrenos(s1)); }
  return g;
}

/** Recorrido de varias secciones (codos, desviaciones) con bridas en los extremos. */
function recorrido(secs, { bridas = [true, true], cierre = true } = {}) {
  const g = [lamina(secs)];
  const fin = secs[secs.length - 1];
  if (cierre) LINEAS.push(pittsburgh(secs));
  if (bridas[0]) { g.push(brida(secs[0], { haciaAtras: true })); LINEAS.push(...barrenos(secs[0])); }
  if (bridas[1]) { g.push(brida(fin)); LINEAS.push(...barrenos(fin)); }
  return g;
}

/** Arma una pieza y recoge sus líneas (pliegues, cierres, barrenos). */
export function armar(nombre) {
  LINEAS.length = 0;
  const def = PIEZAS[nombre]();
  return { ...def, linea: [...LINEAS, ...(def.linea || [])] };
}

const sx = (x, w = W, h = H, y = 0, z = 0) => seccion(V(x, y, z), Z.clone().negate(), Y, w, h); // avanza en +X

export const PIEZAS = {
  "ducto-recto": () => ({ galva: tramo(sx(-0.61), sx(0.61)) }),

  "codo-90": () => {
    const R = 0.15 + W / 2; // radio de garganta 15 cm
    return { galva: recorrido(arco({ centro: V(0, 0, 0), radio: R, a: X, b: Z, alto: Y, w: W, h: H })), giro: Math.PI + 0.2 };
  },

  "codo-45": () => {
    const R = 0.2 + W / 2;
    return { galva: recorrido(arco({ centro: V(0, 0, 0), radio: R, a: X, b: Z, alto: Y, w: W, h: H, hasta: Math.PI / 4, pasos: 16 })), giro: Math.PI * 0.75 };
  },

  "reduccion-concentrica": () => ({
    galva: tramo(sx(-0.3, 0.7, 0.45), sx(0.3, 0.4, 0.25), { quiebre: 0 }),
  }),

  "reduccion-excentrica": () => ({
    // cara inferior a paño: el fondo queda recto
    galva: tramo(sx(-0.3, 0.7, 0.45, 0.225), sx(0.3, 0.4, 0.25, 0.125), { quiebre: 0 }),
  }),

  desviacion: () => {
    // el ducto se desplaza de lado y sigue en la misma dirección
    const L = 0.95, D = 0.4, N = 28;
    const pts = [], tan = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      pts.push(V(L * t, 0, (D / 2) * (1 - Math.cos(Math.PI * t))));
      tan.push(V(L, 0, (D / 2) * Math.PI * Math.sin(Math.PI * t)));
    }
    return { galva: recorrido(ruta(pts, tan, W, H)), giro: -0.15 };
  },

  tee: () => {
    const g = tramo(sx(-0.5), sx(0.5), { quiebre: 0 });
    const r0 = seccion(V(0, 0, W / 2 - 0.01), X, Y, 0.4, 0.3);
    const r1 = seccion(V(0, 0, W / 2 + 0.3), X, Y, 0.4, 0.3);
    g.push(...tramo(r0, r1, { bridas: [false, true], quiebre: 0, cierre: false }));
    return { galva: g };
  },

  cruz: () => {
    const g = tramo(sx(-0.5), sx(0.5), { quiebre: 0 });
    for (const d of [1, -1]) {
      const u = d > 0 ? X : X.clone().negate();
      const r0 = seccion(V(0, 0, d * (W / 2 - 0.01)), u, Y, 0.4, 0.3);
      const r1 = seccion(V(0, 0, d * (W / 2 + 0.3)), u, Y, 0.4, 0.3);
      g.push(...tramo(r0, r1, { bridas: [false, true], quiebre: 0, cierre: false }));
    }
    return { galva: g };
  },

  "yee-pantalon": () => {
    // una entrada que se abre en dos ramales a 45°
    const g = [];
    const w2 = W / 2, R = 0.42, A = Math.PI / 4, N = 16;
    for (const d of [1, -1]) {
      const pts = [], tan = [];
      for (let i = 0; i <= N; i++) {
        const f = (A * i) / N;
        pts.push(V(R * Math.sin(f), 0, d * (w2 / 2 + R * (1 - Math.cos(f)))));
        tan.push(V(Math.cos(f), 0, d * Math.sin(f)));
      }
      g.push(...recorrido(ruta(pts, tan, w2, H), { bridas: [false, true], cierre: d > 0 }));
    }
    g.push(...tramo(sx(-0.28), sx(0), { bridas: [true, false], quiebre: 0 }));
    return { galva: g, giro: -0.88 };
  },

  injerto: () => {
    // zapata: ramal con entrada a 45° que se monta sobre el costado de un ducto
    const base = seccion(V(-0.075, 0, 0), X, Z.clone().negate(), 0.5, 0.25);
    const cuello = seccion(V(0, 0.16, 0), X, Z.clone().negate(), 0.35, 0.25);
    const boca = seccion(V(0, 0.36, 0), X, Z.clone().negate(), 0.35, 0.25);
    const g = [lamina([base, cuello]), ...tramo(cuello, boca, { bridas: [false, true], quiebre: 0 })];
    g.push(brida(base, { f: 0.035, ceja: 0, t: 0.002 }));
    return { galva: g };
  },

  casquillo: () => {
    const base = seccion(V(0, 0, 0), X, Z.clone().negate(), 0.35, 0.25);
    const boca = seccion(V(0, 0.18, 0), X, Z.clone().negate(), 0.35, 0.25);
    const g = tramo(base, boca, { bridas: [false, true], quiebre: 0 });
    g.push(brida(base, { f: 0.035, ceja: 0, t: 0.002 }));
    return { galva: g };
  },

  tapa: () => {
    // charola que cierra el extremo de un ducto
    const s0 = sx(-0.025);
    const s1 = sx(0.025);
    const g = [lamina([s0, s1]), brida(s1), panel(s0, -Q)];
    LINEAS.push(...barrenos(s1));
    for (let k = 0; k < 4; k++) LINEAS.push(cinta(s0[k].clone().lerp(s0.c, 0.04), s0.c.clone().addScaledVector(s0.n, -Q), s0.n.clone().negate()));
    return { galva: g, giro: -2.0 };
  },

  plenum: () => {
    // caja para difusor: boca inferior con brida y cuello lateral
    const b0 = seccion(V(0, 0, 0), X, Z.clone().negate(), 0.6, 0.6);
    const b1 = seccion(V(0, 0.32, 0), X, Z.clone().negate(), 0.6, 0.6);
    const g = [lamina([b0, b1]), brida(b0, { haciaAtras: true })];
    LINEAS.push(pittsburgh([b0, b1]));
    g.push(panel(b1, Q * 0.7));
    for (let k = 0; k < 4; k++) LINEAS.push(cinta(b1[k].clone().lerp(b1.c, 0.04), b1.c.clone().addScaledVector(b1.n, Q * 0.7), b1.n));
    const c0 = seccion(V(0.29, 0.17, 0), Z.clone().negate(), Y, 0.35, 0.2);
    const c1 = seccion(V(0.48, 0.17, 0), Z.clone().negate(), Y, 0.35, 0.2);
    g.push(...tramo(c0, c1, { bridas: [false, true], quiebre: 0, cierre: false }));
    return { galva: g };
  },

  "cuello-lona": () => {
    // conexión flexible: lámina + lona + lámina, corta la vibración del equipo
    const a = sx(-0.14), b = sx(-0.06), m = sx(0, W + 0.02, H + 0.02), c = sx(0.06), d = sx(0.14);
    return {
      galva: [lamina([a, b]), lamina([c, d]), brida(a, { haciaAtras: true }), brida(d)],
      lona: [lamina([b, m, c])],
    };
  },

  "cuello-ganso": () => {
    // descarga a intemperie: sube y regresa 180° para que no entre lluvia
    const R = 0.16 + H / 2;
    const pie0 = seccion(V(0, 0, 0), X, Z.clone().negate(), W, H);
    const pie1 = seccion(V(0, 0.45, 0), X, Z.clone().negate(), W, H);
    const vuelta = arco({ centro: V(0, 0.45, R), radio: R, a: Z.clone().negate(), b: Y, alto: X, w: W, h: H, hasta: Math.PI, pasos: 36, radialEsAncho: false })
      .map((s) => seccion(s.c, X, s.v, W, H));
    const g = [...tramo(pie0, pie1, { bridas: [true, false], quiebre: 0 }), lamina(vuelta)];
    LINEAS.push(pittsburgh(vuelta));
    return { galva: g, giro: -0.45 };
  },

  perfiles: () => {
    // zeta (S) y grapa (drive): los dos perfiles con que se unen los tramos
    const L = 0.42, t = 0.0018, a = 0.032;
    const placa = (ancho, x, y) => new THREE.BoxGeometry(L, t, ancho).translate(0, y, x).toNonIndexed();
    const g = [];
    // zeta: tres capas
    g.push(placa(a, 0, 0), placa(a, 0.002, 0.004), placa(a, 0, 0.008));
    g.push(new THREE.BoxGeometry(L, 0.004 + t, t).translate(0, 0.002, a / 2 + 0.001).toNonIndexed());
    g.push(new THREE.BoxGeometry(L, 0.004 + t, t).translate(0, 0.006, -a / 2).toNonIndexed());
    // grapa: placa con las dos orillas dobladas hacia abajo
    const z0 = 0.11;
    g.push(placa(a, z0, 0.006), placa(0.011, z0 - 0.0095, 0.0015), placa(0.011, z0 + 0.0095, 0.0015));
    g.push(new THREE.BoxGeometry(L, 0.0045 + t, t).translate(0, 0.00375, z0 - a / 2).toNonIndexed());
    g.push(new THREE.BoxGeometry(L, 0.0045 + t, t).translate(0, 0.00375, z0 + a / 2).toNonIndexed());
    return { galva: g, plano: true, giro: -0.75 };
  },
};

/**
 * Acomodo de la foto de familia (hero): [pieza, x, z, giro extra].
 * Tres filas, las piezas grandes atrás. El giro se suma al de la pieza.
 */
export const FAMILIA = [
  ["ducto-recto", -2.9, -1.6, 0.2],
  ["codo-90", -1.2, -1.7, 0],
  ["tee", 0.5, -1.6, -0.2],
  ["desviacion", 2.15, -1.55, 0.1],
  ["cuello-ganso", 3.6, -1.45, 0.15],

  ["reduccion-concentrica", -3.45, -0.05, 0.3],
  ["yee-pantalon", -2.1, 0.0, 0],
  ["cruz", -0.55, 0.15, 0.25],
  ["plenum", 1.15, 0.1, -0.1],
  ["reduccion-excentrica", 2.6, 0.05, -0.2],

  ["codo-45", -2.9, 1.4, 0.2],
  ["injerto", -1.6, 1.45, 0.2],
  ["casquillo", -0.4, 1.5, -0.1],
  ["tapa", 0.75, 1.5, 0.5],
  ["perfiles", 1.8, 1.6, 0.3],
  ["cuello-lona", 3.0, 1.45, -0.35],
];
