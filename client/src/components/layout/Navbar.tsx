import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import logo from "@assets/Logo_Avantrik_sin_texto_1767166358111.png";

const WHATSAPP_URL = "https://walink.co/e1h4ub";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Nosotros", href: "/about" },
    { name: "Auditorías", href: "/auditoria-energetica" },
    { name: "HVAC Industrial", href: "/hvac-industrial" },
    { name: "Ing. Eléctrica", href: "/ingenieria-electrica" },
    { name: "Geotermia", href: "/geotermia" },
    { name: "Calculadora", href: "/calculadora-ahorro" },
    { name: "Contacto", href: "/contact" },
  ];

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

        <div className="container relative mx-auto flex items-center justify-between px-4">
          <Link href="/">
            <a className={cn("group flex items-center gap-3", textGlow)}>
              <img
                src={logo}
                alt="Avantrik Logo"
                className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold leading-none tracking-tight text-white">
                  AVANTRIK
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/60">
                  Soluciones de Ingeniería
                </span>
              </div>
            </a>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => {
              const active = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <a
                    className={cn(
                      "group relative text-sm font-medium uppercase tracking-wide transition-colors",
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
                  </a>
                </Link>
              );
            })}
            <Link href="/contact">
              <Button
                size="sm"
                className="rounded-full border border-white/20 bg-accent/90 font-bold uppercase tracking-wider text-accent-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-accent"
              >
                Cotizar
              </Button>
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-0.5 hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </a>
          </div>

          {/* Mobile right side */}
          <div className="flex items-center gap-2 lg:hidden">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </a>
            <button
              className={cn("p-2 text-white", textGlow)}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu — full-width dark glass panel */}
      {mobileMenuOpen && (
        <div className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-white/10 bg-ink/85 p-4 shadow-[0_20px_40px_-16px_rgba(2,6,23,0.6)] backdrop-blur-2xl backdrop-saturate-150 lg:hidden animate-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "border-b border-white/10 py-2 text-lg font-medium",
                  location === link.href ? "text-accent" : "text-white/90",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Link href="/contact">
            <Button
              className="mt-2 w-full rounded-full bg-accent font-bold uppercase text-accent-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solicitar Auditoría
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
