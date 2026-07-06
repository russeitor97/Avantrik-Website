import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { MessageCircle } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  // Al navegar a otra página, volver al inicio (evita quedar a media página).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />

      {/* Floating WhatsApp Button */}
      <a
        href="https://walink.co/e1h4ub"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-[#25D366] p-3 text-white shadow-lg transition-transform duration-200 hover:scale-110"
        aria-label="Contactar por WhatsApp"
      >
        {/* pulso suave */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] motion-safe:animate-[pulse-soft_2.6s_ease-out_infinite]"
          aria-hidden="true"
        />
        <MessageCircle className="relative w-6 h-6" />
      </a>
    </div>
  );
}
