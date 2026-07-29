import { Link } from "wouter";
import { Mail, Phone, Linkedin, ArrowUpRight, MapPin } from "lucide-react";
import { useHref, useLang, type PageKey } from "@/lib/i18n";

import logo from "@assets/Logo_Avantrik_sin_texto_1767166358111.png";

const serviceLinks: { page: PageKey; es: string; en: string }[] = [
  { page: "audits", es: "Auditorías Energéticas", en: "Energy Audits" },
  { page: "hvac", es: "HVAC", en: "HVAC" },
  { page: "electrical", es: "Ingeniería Eléctrica", en: "Electrical Engineering" },
  { page: "geothermal", es: "Sistemas Geotérmicos", en: "Geothermal Systems" },
];

const companyLinks: { page: PageKey; es: string; en: string }[] = [
  { page: "home", es: "Inicio", en: "Home" },
  { page: "about", es: "Nosotros", en: "About" },
  { page: "contact", es: "Contacto", en: "Contact" },
];

const T = {
  es: {
    blurb:
      "Excelencia en ingeniería para la eficiencia. Proporcionamos soluciones técnicas avanzadas para sistemas residenciales e industriales en HVAC, Electricidad y Geotermia, con base en Querétaro.",
    services: "Servicios",
    company: "Compañía",
    privacy: "Aviso de Privacidad",
    contact: "Contacto",
    area: "Querétaro y el Bajío · Proyectos en todo México",
    rights: "Todos los derechos reservados.",
    tagline: "Diseñado para el Rendimiento.",
  },
  en: {
    blurb:
      "Engineering excellence for efficiency. We deliver advanced technical solutions for industrial and commercial systems across HVAC, electrical and geothermal, based in Querétaro, Mexico.",
    services: "Services",
    company: "Company",
    privacy: "Privacy Notice",
    contact: "Contact",
    area: "Querétaro and the Bajío region · Projects across Mexico",
    rights: "All rights reserved.",
    tagline: "Engineered for Performance.",
  },
};

export function Footer() {
  const lang = useLang();
  const href = useHref();
  const t = T[lang];

  return (
    <footer className="relative overflow-hidden border-t-4 border-accent bg-ink-gradient pt-16 pb-8 text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-40" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Avantrik Logo" className="h-8 w-8 object-contain" />
              <span className="font-heading text-2xl font-bold tracking-tight">AVANTRIK</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/60">
              {t.blurb}
            </p>
            <div className="flex gap-4">
              <a
                href="https://mx.linkedin.com/company/avantrik"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/15 text-primary-foreground/70 transition-colors hover:border-accent hover:text-accent"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="mb-6 font-heading text-lg font-bold text-white">{t.services}</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              {serviceLinks.map((l) => (
                <li key={l.page}>
                  <Link
                    href={href(l.page)}
                    className="group inline-flex items-center gap-1 transition-colors hover:text-accent"
                  >
                    {l[lang]}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compañía */}
          <div>
            <h3 className="mb-6 font-heading text-lg font-bold text-white">{t.company}</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/60">
              {companyLinks.map((l) => (
                <li key={l.page}>
                  <Link href={href(l.page)} className="transition-colors hover:text-accent">
                    {l[lang]}
                  </Link>
                </li>
              ))}
              <li>
                <a href="#" className="transition-colors hover:text-accent">{t.privacy}</a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="mb-6 font-heading text-lg font-bold text-white">{t.contact}</h3>
            <ul className="space-y-4 text-sm text-primary-foreground/60">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                <div className="flex flex-col">
                  <span>(+52) 442-271-8460</span>
                  <span>(+52) 442-739-4819</span>
                  <span>(+52) 442-219-6915</span>
                  <span>(+52) 614-105-9868</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-accent" />
                <span>info@avantrik.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-accent" />
                <span>{t.area}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-primary-foreground/50 md:flex-row">
          <p>&copy; {new Date().getFullYear()} Avantrik Engineering. {t.rights}</p>
          <p>{t.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
