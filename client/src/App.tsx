import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useLang } from "@/lib/i18n";
import { lazy, Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Home se carga de inmediato (landing). El resto de páginas se cargan bajo
// demanda (code-splitting) para reducir el bundle inicial. Las RUTAS no cambian.
import Home from "@/pages/Home";

const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Calculadora = lazy(() => import("@/pages/Calculadora"));
const EnergyAudits = lazy(() => import("@/pages/Services/EnergyAudits"));
const IndustrialHVAC = lazy(() => import("@/pages/Services/IndustrialHVAC"));
const ElectricalEngineering = lazy(
  () => import("@/pages/Services/ElectricalEngineering"),
);
const GeothermalSystems = lazy(
  () => import("@/pages/Services/GeothermalSystems"),
);
const Ductos = lazy(() => import("@/pages/Ductos"));
// Portal interno (noindex, fuera del sitemap)
const Privacy = lazy(() => import("@/pages/Privacy"));
const Portal = lazy(() => import("@/pages/Portal"));
const PortalCompras = lazy(() => import("@/pages/PortalCompras"));
const NotFound = lazy(() => import("@/pages/not-found"));

/** Loader mínimo de marca mientras se descarga el chunk de una página. */
function PageLoader() {
  const lang = useLang();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-[loader-slide_1s_ease-in-out_infinite] rounded-full bg-accent" />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {lang === "en" ? "Loading" : "Cargando"}
        </span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Core pages */}
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/calculadora-ahorro" component={Calculadora} />

        {/* SEO URLs (OFICIALES, en español) */}
        <Route path="/auditoria-energetica" component={EnergyAudits} />
        <Route path="/hvac-industrial" component={IndustrialHVAC} />
        <Route path="/ingenieria-electrica" component={ElectricalEngineering} />
        <Route path="/geotermia" component={GeothermalSystems} />
        <Route path="/ductos-lamina-galvanizada" component={Ductos} />
        <Route path="/aviso-de-privacidad" component={Privacy} />

        {/* Versión en inglés — mismos componentes, el idioma sale de la URL
            (ver lib/i18n.ts). Los slugs están en inglés a propósito: son URLs
            propias e indexables, no una traducción al vuelo. */}
        <Route path="/en" component={Home} />
        <Route path="/en/about" component={About} />
        <Route path="/en/contact" component={Contact} />
        <Route path="/en/savings-calculator" component={Calculadora} />
        <Route path="/en/energy-audits" component={EnergyAudits} />
        <Route path="/en/industrial-hvac" component={IndustrialHVAC} />
        <Route path="/en/electrical-engineering" component={ElectricalEngineering} />
        <Route path="/en/geothermal-systems" component={GeothermalSystems} />
        <Route path="/en/sheet-metal-ducts" component={Ductos} />
        <Route path="/en/privacy-policy" component={Privacy} />

        {/* Portal interno (privado, noindex) */}
        <Route path="/portal" component={Portal} />
        <Route path="/portal/compras" component={PortalCompras} />

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
