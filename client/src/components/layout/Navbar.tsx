import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import logo from "@assets/Logo_Avantrik_sin_texto_1767166358111.png";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
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

  // Light text while transparent over the dark hero; dark text once the glass bar appears.
  const onLight = isScrolled || mobileMenuOpen;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300",
        onLight
          ? "bg-background/80 backdrop-blur-xl border-border py-3 shadow-sm"
          : "bg-transparent border-transparent py-5",
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/">
          <a className="group flex items-center gap-3">
            <img
              src={logo}
              alt="Avantrik Logo"
              className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span
                className={cn(
                  "font-heading text-2xl font-bold leading-none tracking-tight transition-colors",
                  onLight ? "text-primary" : "text-white",
                )}
              >
                AVANTRIK
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-widest transition-colors",
                  onLight ? "text-muted-foreground" : "text-white/60",
                )}
              >
                Soluciones de Ingeniería
              </span>
            </div>
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const active = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <a
                  className={cn(
                    "group relative text-sm font-medium uppercase tracking-wide transition-colors",
                    active
                      ? "text-accent"
                      : onLight
                        ? "text-foreground hover:text-accent"
                        : "text-white/85 hover:text-white",
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
              className="rounded-sm bg-accent font-bold uppercase tracking-wider text-accent-foreground transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
            >
              Cotizar
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className={cn(
            "p-2 lg:hidden transition-colors",
            onLight ? "text-foreground" : "text-white",
          )}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full flex flex-col gap-2 border-b border-border bg-background p-4 shadow-lg lg:hidden animate-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "border-b border-border/50 py-2 text-lg font-medium",
                  location === link.href ? "text-accent" : "text-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Link href="/contact">
            <Button
              className="mt-2 w-full rounded-sm bg-accent font-bold uppercase text-accent-foreground"
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
