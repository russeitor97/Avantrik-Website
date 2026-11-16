import type * as THREE from "three";

export interface Materiales {
  galva: THREE.MeshStandardMaterial;
  linea: THREE.MeshStandardMaterial;
  lona: THREE.MeshStandardMaterial;
}

export function prepararRenderer(renderer: THREE.WebGLRenderer): void;
export function crearEscena(renderer: THREE.WebGLRenderer): THREE.Scene;
export function crearMateriales(tamTextura?: number): Materiales;
export function construir(nombre: string, mats: Materiales): THREE.Group;
export function iluminar(scene: THREE.Scene, objeto: THREE.Object3D, op?: { familia?: boolean }): void;
export function encuadrar(
  camara: THREE.PerspectiveCamera,
  objeto: THREE.Object3D,
  op?: { familia?: boolean; plano?: boolean },
): { mira: THREE.Vector3; radio: number };
