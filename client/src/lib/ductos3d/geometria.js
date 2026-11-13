/**
 * Geometría de ductería rectangular de lámina.
 *
 * Todo se arma con una sola idea: un ducto es una sucesión de SECCIONES
 * rectangulares (4 esquinas en el espacio) unidas por lámina. Un tramo recto
 * son 2 secciones; un codo, muchas secciones girando sobre un arco; una
 * reducción, 2 secciones de distinto tamaño. Unidades: metros.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const X = V(1, 0, 0);
export const Y = V(0, 1, 0);
export const Z = V(0, 0, 1);

/** Sección rectangular: centro c, ejes u (ancho w) y v (alto h). u × v = sentido de avance. */
export function seccion(c, u, v, w, h) {
  const p = (a, b) => c.clone().addScaledVector(u, (a * w) / 2).addScaledVector(v, (b * h) / 2);
  const s = [p(-1, -1), p(1, -1), p(1, 1), p(-1, 1)];
  s.c = c.clone();
  s.u = u.clone().normalize();
  s.v = v.clone().normalize();
  s.n = new THREE.Vector3().crossVectors(s.u, s.v).normalize();
  s.w = w;
  s.h = h;
  return s;
}

const UV = 1 / 0.38; // la textura de galvanizado cubre 38 cm

/**
 * Une secciones con lámina. Cada una de las 4 caras es una tira propia: así
 * la normal es suave a lo largo del recorrido (codos) y viva en las aristas.
 * `quiebre`: en tramos rectos, pliegue en X de cada cara (cross-break), que
 * es lo que da rigidez a la lámina real y lo que más "se ve a ducto".
 */
export function lamina(secciones, { quiebre = 0 } = {}) {
  const caras = [];
  for (let k = 0; k < 4; k++) {
    const k2 = (k + 1) % 4;
    const pos = [];
    const uv = [];
    const idx = [];
    if (quiebre && secciones.length === 2) {
      const [A, B, C, D] = [secciones[0][k], secciones[0][k2], secciones[1][k2], secciones[1][k]];
      const centro = new THREE.Vector3().add(A).add(B).add(C).add(D).multiplyScalar(0.25);
      const normal = new THREE.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A)).normalize();
      const M = centro.clone().addScaledVector(normal, quiebre);
      const ancho = A.distanceTo(B);
      const largo = A.distanceTo(D);
      const tri = (p, q, r, tp, tq, tr) => {
        pos.push(...p.toArray(), ...q.toArray(), ...r.toArray());
        uv.push(...tp, ...tq, ...tr);
      };
      const tA = [0, 0], tB = [ancho * UV, 0], tC = [ancho * UV, largo * UV], tD = [0, largo * UV], tM = [(ancho * UV) / 2, (largo * UV) / 2];
      tri(A, B, M, tA, tB, tM);
      tri(B, C, M, tB, tC, tM);
      tri(C, D, M, tC, tD, tM);
      tri(D, A, M, tD, tA, tM);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals(); // sin índice → normales planas por triángulo
      caras.push(g);
      continue;
    }
    let largo = 0;
    secciones.forEach((s, i) => {
      if (i > 0) {
        const a = secciones[i - 1][k].clone().add(secciones[i - 1][k2]).multiplyScalar(0.5);
        const b = s[k].clone().add(s[k2]).multiplyScalar(0.5);
        largo += a.distanceTo(b);
      }
      const ancho = s[k].distanceTo(s[k2]);
      pos.push(...s[k].toArray(), ...s[k2].toArray());
      uv.push(0, largo * UV, ancho * UV, largo * UV);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    caras.push(g.toNonIndexed());
  }
  return mergeGeometries(caras);
}

/** Marco plano (brida) alrededor de una sección: ancho f, espesor t, con ceja de retorno. */
export function brida(s, { f = 0.03, t = 0.003, ceja = 0.012, haciaAtras = false } = {}) {
  const { w, h } = s;
  const forma = new THREE.Shape();
  forma.moveTo(-w / 2 - f, -h / 2 - f);
  forma.lineTo(w / 2 + f, -h / 2 - f);
  forma.lineTo(w / 2 + f, h / 2 + f);
  forma.lineTo(-w / 2 - f, h / 2 + f);
  forma.closePath();
  const hueco = new THREE.Path();
  hueco.moveTo(-w / 2, -h / 2);
  hueco.lineTo(-w / 2, h / 2);
  hueco.lineTo(w / 2, h / 2);
  hueco.lineTo(w / 2, -h / 2);
  hueco.closePath();
  forma.holes.push(hueco);
  const cara = new THREE.ExtrudeGeometry(forma, { depth: t, bevelEnabled: false });
  cara.translate(0, 0, -t / 2);
  const uvs = cara.attributes.uv; // ExtrudeGeometry da UV en metros: a la escala de la textura
  for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) * UV, uvs.getY(i) * UV);
  // ceja: pestaña perimetral doblada 90° hacia el ducto
  const dir = haciaAtras ? 1 : -1;
  const c0 = seccion(V(0, 0, 0), X, Y, w + 2 * f, h + 2 * f);
  const c1 = seccion(V(0, 0, dir * ceja), X, Y, w + 2 * f, h + 2 * f);
  const borde = lamina(dir > 0 ? [c0, c1] : [c1, c0]);
  const g = mergeGeometries([cara.toNonIndexed(), borde]);
  const m = new THREE.Matrix4().makeBasis(s.u, s.v, s.n).setPosition(s.c);
  g.applyMatrix4(m);
  return g;
}

/** Secciones de un arco (codo). centro del arco, radio al eje, ejes del plano (a→b), eje de giro `alto`. */
export function arco({ centro, radio, a, b, alto, w, h, desde = 0, hasta = Math.PI / 2, pasos = 28, radialEsAncho = true }) {
  const out = [];
  for (let i = 0; i <= pasos; i++) {
    const t = desde + ((hasta - desde) * i) / pasos;
    const radial = a.clone().multiplyScalar(Math.cos(t)).addScaledVector(b, Math.sin(t)).normalize();
    const c = centro.clone().addScaledVector(radial, radio);
    // u × v debe apuntar en el sentido de avance (θ creciente)
    out.push(radialEsAncho ? seccion(c, radial, alto, w, h) : seccion(c, alto.clone().negate(), radial, w, h));
  }
  return out;
}

/** Tira fina en una arista longitudinal: el cierre Pittsburgh. */
export function pittsburgh(secciones, k = 2, ancho = 0.014, alza = 0.0016) {
  const k2 = (k + 1) % 4;
  const tira = secciones.map((s) => {
    const dir = s[k2].clone().sub(s[k]).normalize();
    const lado = s[k].clone().sub(s[(k + 3) % 4]).normalize(); // hacia fuera de la cara k
    const normal = new THREE.Vector3().crossVectors(dir, s.n).normalize();
    void lado;
    const c = s[k].clone().addScaledVector(dir, ancho / 2 + 0.002).addScaledVector(normal, alza);
    return seccion(c, dir, normal, ancho, alza * 2);
  });
  return lamina(tira);
}

/** Secciones a lo largo de una ruta horizontal: puntos y tangentes (el ducto no se inclina). */
export function ruta(puntos, tangentes, w, h) {
  return puntos.map((p, i) => {
    const n = tangentes[i].clone().normalize();
    return seccion(p, new THREE.Vector3().crossVectors(Y, n).normalize(), Y, w, h);
  });
}

/** Panel plano que cierra una sección, con quiebre en X (hundido < 0 = hacia atrás). */
export function panel(s, hundido = 0) {
  const M = s.c.clone().addScaledVector(s.n, hundido);
  const uvDe = (p) => {
    const d = p.clone().sub(s.c);
    return [d.dot(s.u) * UV, d.dot(s.v) * UV];
  };
  const pos = [];
  const uv = [];
  for (let k = 0; k < 4; k++) {
    for (const p of [s[k], s[(k + 1) % 4], M]) {
      pos.push(...p.toArray());
      uv.push(...uvDe(p));
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

/** Cinta fina entre dos puntos, sobre una cara de normal `n` (para marcar pliegues). */
export function cinta(p, q, n, ancho = 0.004, alza = 0.0007) {
  const dir = q.clone().sub(p).normalize();
  const lado = new THREE.Vector3().crossVectors(dir, n).normalize().multiplyScalar(ancho / 2);
  const a = p.clone().addScaledVector(n, alza);
  const b = q.clone().addScaledVector(n, alza);
  const pts = [a.clone().sub(lado), a.clone().add(lado), b.clone().add(lado), a.clone().sub(lado), b.clone().add(lado), b.clone().sub(lado)];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts.flatMap((v) => v.toArray()), 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(12).fill(0), 2));
  geo.computeVertexNormals();
  return geo;
}

/** Las dos diagonales (quiebre en X) de cada cara de un tramo recto. */
export function quiebres(s0, s1, hundido) {
  const out = [];
  for (let k = 0; k < 4; k++) {
    const k2 = (k + 1) % 4;
    const [A, B, C, D] = [s0[k], s0[k2], s1[k2], s1[k]];
    const n = new THREE.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A)).normalize();
    const M = new THREE.Vector3().add(A).add(B).add(C).add(D).multiplyScalar(0.25).addScaledVector(n, hundido);
    for (const P of [A, B, C, D]) out.push(cinta(P.clone().lerp(M, 0.04), M, n));
  }
  return out;
}

/** Barrenos de las 4 esquinas de una brida (por ambas caras). */
export function barrenos(s, f = 0.03, r = 0.0055) {
  const out = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    for (const lado of [1, -1]) {
      const c = new THREE.CircleGeometry(r, 20).toNonIndexed();
      if (lado < 0) c.rotateY(Math.PI);
      c.translate((a * (s.w + f)) / 2, (b * (s.h + f)) / 2, lado * 0.0021);
      c.applyMatrix4(new THREE.Matrix4().makeBasis(s.u, s.v, s.n).setPosition(s.c));
      out.push(c);
    }
  }
  return out;
}

export { mergeGeometries, V };
