import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X, Activity } from "lucide-react";
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Nosotros", href: "/about" },
    { name: "Auditorías", href: "/services/energy-audits" },
    { name: "HVAC Industrial", href: "/services/industrial-hvac" },
    { name: "Ing. Eléctrica", href: "/services/electrical-engineering" },
    { name: "Geotermia", href: "/services/geothermal-systems" },
    { name: "Contacto", href: "/contact" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        isScrolled
          ? "bg-white/10 backdrop-blur-md border-white/20 py-4 shadow-lg"
          : "bg-transparent border-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-3 group">
            <img 
              src={logo} 
              alt="Avantrik Logo" 
              className="w-10 h-10 object-contain brightness-110 contrast-125"
            />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-2xl leading-none tracking-tight text-primary dark:text-white">
                AVANTRIK
              </span>
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                Soluciones de Ingeniería
              </span>
            </div>
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "text-sm font-medium transition-colors hover:text-accent uppercase tracking-wide",
                  location === link.href
                    ? "text-accent font-semibold"
                    : isScrolled
                    ? "text-foreground"
                    : "text-foreground/90 hover:text-foreground" // Adjust based on hero contrast, assuming light theme mostly or dark hero
                )}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Link href="/contact">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wider rounded-sm">
              Cotizar
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "text-lg font-medium py-2 border-b border-border/50",
                  location === link.href ? "text-accent" : "text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Link href="/contact">
             <Button className="w-full bg-accent text-accent-foreground font-bold uppercase rounded-sm mt-2" onClick={() => setMobileMenuOpen(false)}>
              Request Audit
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
