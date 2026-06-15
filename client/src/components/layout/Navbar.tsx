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
  // glass itself stays very transparent.
  const textGlow = "[text-shadow:0_1px_12px_rgba(2,6,23,0.55)]";

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Floating liquid-glass capsule — rounded + very transparent */}
        <div
          className={cn(
            "relative mt-3 flex items-center justify-between gap-4 rounded-full border border-white/15 px-4 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 md:px-5",
            isScrolled
              ? "bg-ink/30 py-2 shadow-[0_14px_40px_-14px_rgba(2,6,23,0.5)]"
              : "bg-ink/15 py-2.5",
          )}
        >
          {/* top highlight, clipped to the rounded shape */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 to-transparent"
            aria-hidden="true"
          />

          <Link href="/">
            <a className={cn("group relative flex items-center gap-2.5", textGlow)}>
              <img
                src={logo}
                alt="Avantrik Logo"
                className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-heading text-xl font-bold leading-none tracking-tight text-white">
                AVANTRIK
              </span>
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
                      "group relative text-[13px] font-medium uppercase tracking-wide transition-colors",
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

      {/* Mobile Menu — dark glass panel */}
      {mobileMenuOpen && (
        <div className="container mx-auto px-4 lg:hidden">
          <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-ink/85 p-4 shadow-[0_20px_40px_-16px_rgba(2,6,23,0.6)] backdrop-blur-2xl backdrop-saturate-150 animate-in slide-in-from-top-4">
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
        </div>
      )}
    </nav>
  );
}
