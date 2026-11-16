/**
 * Visor 3D de una pieza: se gira arrastrando y se acerca con la rueda o
 * pellizcando. Usa el mismo modelo, material y luz que las fotos del catálogo
 * (client/src/lib/ductos3d), así que se ve igual que la imagen.
 *
 * Se carga bajo demanda (React.lazy) para que three.js no pese en el resto del sitio.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { construir, crearEscena, crearMateriales, encuadrar, iluminar, prepararRenderer } from "@/lib/ductos3d/estudio";

export default function Visor3D({ slug, onError }: { slug: string; onError: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cont = ref.current;
    if (!cont) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      onError(); // navegador sin WebGL: se queda la foto
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff);
    prepararRenderer(renderer);
    renderer.setSize(cont.clientWidth, cont.clientHeight);
    renderer.domElement.style.display = "block";
    cont.appendChild(renderer.domElement);

    const scene = crearEscena(renderer);
    const mats = crearMateriales(512);
    const pieza = construir(slug, mats);
    pieza.rotation.y = pieza.userData.giro;
    scene.add(pieza);
    iluminar(scene, pieza);

    // Arranca en el mismo ángulo que la foto.
    const camara = new THREE.PerspectiveCamera(26, cont.clientWidth / cont.clientHeight, 0.05, 200);
    const { mira } = encuadrar(camara, pieza, { plano: pieza.userData.plano });
    const distancia = camara.position.distanceTo(mira);

    const controles = new OrbitControls(camara, renderer.domElement);
    controles.target.copy(mira);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enablePan = false;
    controles.minDistance = distancia * 0.45;
    controles.maxDistance = distancia * 1.8;
    controles.maxPolarAngle = Math.PI * 0.49; // no bajar del piso
    controles.update();

    // Solo se vuelve a dibujar cuando la cámara se mueve.
    let pendiente = 2; // dos pasadas iniciales: la sombra suave necesita una previa
    let raf = 0;
    const cuadro = () => {
      if (controles.update()) pendiente = Math.max(pendiente, 1);
      if (pendiente > 0) {
        renderer.render(scene, camara);
        pendiente--;
      }
      raf = requestAnimationFrame(cuadro);
    };
    cuadro();

    const ro = new ResizeObserver(() => {
      const w = cont.clientWidth;
      const h = cont.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
      pendiente = 2;
    });
    ro.observe(cont);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controles.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
        }
      });
      mats.galva.map?.dispose();
      mats.galva.roughnessMap?.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [slug, onError]);

  return <div ref={ref} className="h-full w-full cursor-grab active:cursor-grabbing" />;
}
