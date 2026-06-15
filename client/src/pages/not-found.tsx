import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, Mail } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";

export default function NotFound() {
  return (
    <Layout>
      <Helmet>
        <title>Página no encontrada | Avantrik</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="relative bg-ink-gradient text-primary-foreground min-h-[80vh] flex items-center overflow-hidden">
        <TechBackdrop />
        <div className="container mx-auto px-4 relative z-10 text-center pt-24">
          <p className="text-7xl md:text-9xl font-heading font-bold text-accent leading-none">
            404
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mt-4 mb-4">
            Página no encontrada
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto mb-10">
            La página que buscas no existe o fue movida. Verifica la dirección o
            regresa al inicio para seguir explorando nuestras soluciones de
            ingeniería.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wide h-14 px-8"
              >
                <Home className="w-5 h-5 mr-2" /> Volver al inicio
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-bold uppercase tracking-wide h-14 px-8"
              >
                <Mail className="w-5 h-5 mr-2" /> Contáctanos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
