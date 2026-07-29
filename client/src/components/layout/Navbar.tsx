import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X, MessageCircle, LogIn, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHref, useLang, useLangSwitch, type PageKey } from "@/lib/i18n";

import logo from "@assets/Logo_Avantrik_sin_texto_1767166358111.png";

const WHATSAPP_URL = "https://walink.co/e1h4ub";

/**
 * Etiquetas deliberadamente cortas: son 8 enlaces más el botón de cotizar y
 * tres iconos, y con nombres largos la barra se desborda (o se parte en dos
 * líneas y el logo se encima con el primer enlace).
 */
const NAV: { page: PageKey; es: string; en: string }[] = [
  { page: "home", es: "Inicio", en: "Home" },
  { page: "about", es: "Nosotros", en: "About" },
  { page: "audits", es: "Auditorías", en: "Audits" },
  { page: "hvac", es: "HVAC", en: "HVAC" },
  { page: "electrical", es: "Eléctrica", en: "Electrical" },
  { page: "geothermal", es: "Geotermia", en: "Geothermal" },
  { page: "calculator", es: "Calculadora", en: "Calculator" },
  { page: "contact", es: "Contacto", en: "Contact" },
];

const T = {
  es: {
    tagline: "Soluciones de Ingeniería",
    quote: "Cotizar",
    signIn: "Iniciar sesión",
    requestAudit: "Solicitar Auditoría",
    whatsapp: "Contactar por WhatsApp",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    switchLang: "View in English",
  },
  en: {
    tagline: "Engineering Solutions",
    quote: "Get a Quote",
    signIn: "Sign in",
    requestAudit: "Request an Audit",
    whatsapp: "Contact us on WhatsApp",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchLang: "Ver en español",
  },
};

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const lang = useLang();
  const href = useHref();
  const langSwitch = useLangSwitch();
  const t = T[lang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(doc.scrollTop / max, 1) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = NAV.map((item) => ({
    name: item[lang],
    href: href(item.page),
  }));

  // Subtle dark glow keeps white text legible over any background while the
  // glass stays very transparent.
  const textGlow = "[text-shadow:0_1px_12px_rgba(2,6,23,0.55)]";

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      {/* Full-width liquid-glass bar — square, very transparent */}
      <div
        className={cn(
          "relative border-b border-white/10 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300",
          isScrolled
            ? "bg-ink/30 py-3 shadow-[0_10px_30px_-12px_rgba(2,6,23,0.45)]"
            : "bg-ink/15 py-5",
        )}
      >
        {/* specular edge-light along the top */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent"
          aria-hidden="true"
        />
        {/* soft sheen */}
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"
          aria-hidden="true"
        />
        {/* reading progress bar */}
        <span
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-accent"
          style={{ width: `${progress * 100}%` }}
          aria-hidden="true"
        />

        <div className="container relative mx-auto flex items-center justify-between px-4">
          <Link href={href("home")} className={cn("group flex items-center gap-3", textGlow)}>
            <img
              src={logo}
              alt="Avantrik Logo"
              className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-heading text-2xl font-bold leading-none tracking-tight text-white">
                AVANTRIK
              </span>
              <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-white/60">
                {t.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-5 xl:flex">
            {navLinks.map((link) => {
              const active = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    // nowrap: si una etiqueta se parte en dos líneas, la barra
                    // crece y el logo se encima con el primer enlace.
                    "group relative whitespace-nowrap text-sm font-medium uppercase tracking-wide transition-colors",
                    textGlow,
                    active ? "text-accent" : "text-white/85 hover:text-white",
                  )}
                >
                  {link.name}
                  <span
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-0.5 bg-accent transition-all duration-300",
                      active ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </Link>
              );
            })}
            {/* asChild: el Button presta sus estilos al <a> del Link en vez de
                renderizar un <button> dentro de un <a> (HTML inválido). */}
            <Button
              asChild
              size="sm"
              className="rounded-full border border-white/20 bg-accent/90 font-bold uppercase tracking-wider text-accent-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-accent"
            >
              <Link href={href("contact")}>{t.quote}</Link>
            </Button>
            <Link
              href={langSwitch.href}
              aria-label={t.switchLang}
              title={t.switchLang}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 text-xs font-bold uppercase tracking-wider text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              <Languages className="h-[15px] w-[15px]" />
              {langSwitch.label}
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.whatsapp}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </a>
            <Link
              href="/portal"
              aria-label={t.signIn}
              title={t.signIn}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              <LogIn className="h-[16px] w-[16px]" />
            </Link>
          </div>

          {/* Mobile right side */}
          <div className="flex items-center gap-2 xl:hidden">
            <Link
              href={langSwitch.href}
              aria-label={t.switchLang}
              className="inline-flex h-9 items-center rounded-full border border-white/25 bg-white/10 px-2.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              {langSwitch.label}
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.whatsapp}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </a>
            <button
              className={cn("p-2 text-white", textGlow)}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu — full-width dark glass panel */}
      {mobileMenuOpen && (
        <div className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-white/10 bg-ink/85 p-4 shadow-[0_20px_40px_-16px_rgba(2,6,23,0.6)] backdrop-blur-2xl backdrop-saturate-150 xl:hidden animate-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "border-b border-white/10 py-2 text-lg font-medium",
                location === link.href ? "text-accent" : "text-white/90",
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/portal"
            className="flex items-center gap-2 py-2 text-lg font-medium text-white/90"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LogIn className="h-4 w-4 text-accent" /> {t.signIn}
          </Link>
          <Button
            asChild
            className="mt-2 w-full rounded-full bg-accent font-bold uppercase text-accent-foreground"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Link href={href("contact")}>{t.requestAudit}</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
