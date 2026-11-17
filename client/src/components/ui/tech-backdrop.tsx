import { cn } from "@/lib/utils";

/**
 * Fondo de las bandas oscuras: retícula fina + un plano técnico en alambre
 * (red de ductos, manejadora y tubería de agua helada), como una vista 3D de
 * AutoCAD. El plano es un render real de scripts/ductos-render/plano.js
 * (`node scripts/ductos-render/render.mjs plano`), no una ilustración.
 * Decorativo: aria-hidden y sin animación.
 */
export function TechBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-tech-grid opacity-50" />
      <img
        src="/fondos/plano.webp"
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.28]"
      />
    </div>
  );
}
