import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Mail } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useCopy, useHref, useLang } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";

const T = {
  es: {
    title: "Página no encontrada | Avantrik",
    heading: "Página no encontrada",
    body: "La página que buscas no existe o fue movida. Verifica la dirección o regresa al inicio para seguir explorando nuestras soluciones de ingeniería.",
    home: "Volver al inicio",
    contact: "Contáctanos",
  },
  en: {
    title: "Page not found | Avantrik",
    heading: "Page not found",
    body: "The page you're looking for doesn't exist or has been moved. Check the address or head back home to keep exploring our engineering solutions.",
    home: "Back to home",
    contact: "Contact us",
  },
};

export default function NotFound() {
  const t = useCopy(T);
  const href = useHref();
  const lang = useLang();

  useSeo({
    lang: lang === "en" ? "en" : "es-MX",
    title: t.title,
    robots: "noindex",
  });

  return (
    <Layout>
      <section className="relative bg-ink-gradient text-primary-foreground min-h-[80vh] flex items-center overflow-hidden">
        <TechBackdrop />
        <div className="container mx-auto px-4 relative z-10 text-center pt-24">
          <p className="text-7xl md:text-9xl font-heading font-bold text-accent leading-none">
            404
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mt-4 mb-4">
            {t.heading}
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto mb-10">
            {t.body}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={href("home")}>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wide h-14 px-8"
              >
                <Home className="w-5 h-5 mr-2" /> {t.home}
              </Button>
            </Link>
            <Link href={href("contact")}>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-bold uppercase tracking-wide h-14 px-8"
              >
                <Mail className="w-5 h-5 mr-2" /> {t.contact}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
