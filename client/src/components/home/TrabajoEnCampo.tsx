import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { GaleriaFotos } from "@/components/proyectos/GaleriaFotos";
import { GALERIA_INICIO } from "@/lib/proyectos";
import { useHref, useLang } from "@/lib/i18n";

const T = {
  es: {
    eyebrow: "Trabajo en campo",
    title: "Así trabajamos",
    body: "Fotos reales de instalaciones y mantenimientos de HVAC, agua helada y bombeo hechos por nuestro equipo.",
    mas: "Ver más trabajos de HVAC",
  },
  en: {
    eyebrow: "Field work",
    title: "How we work",
    body: "Real photos of HVAC, chilled water and pumping installations and maintenance done by our team.",
    mas: "See more HVAC work",
  },
};

/** Galería de fotos reales de obra en el inicio. */
export function TrabajoEnCampo() {
  const t = T[useLang()];
  const href = useHref();
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">{t.eyebrow}</p>
            <h2 className="text-3xl font-heading font-bold text-foreground md:text-4xl">{t.title}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{t.body}</p>
          </div>
          <Link href={href("hvac")} className="inline-flex shrink-0 items-center gap-2 font-semibold text-primary hover:text-accent">
            {t.mas} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <GaleriaFotos fotos={GALERIA_INICIO} />
      </div>
    </section>
  );
}
