import { HelmetProvider } from "react-helmet-async";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

// Services
import EnergyAudits from "@/pages/Services/EnergyAudits";
import IndustrialHVAC from "@/pages/Services/IndustrialHVAC";
import ElectricalEngineering from "@/pages/Services/ElectricalEngineering";
import GeothermalSystems from "@/pages/Services/GeothermalSystems";

function Router() {
  return (
    <Switch>
      {/* Core pages */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />

      {/* SEO URLs (OFICIALES) */}
      <Route path="/auditoria-energetica" component={EnergyAudits} />
      <Route path="/hvac-industrial" component={IndustrialHVAC} />
      <Route path="/ingenieria-electrica" component={ElectricalEngineering} />
      <Route path="/geotermia" component={GeothermalSystems} />

      {/* URLs antiguas / técnicas (alias temporales) */}
      <Route path="/services/energy-audits" component={EnergyAudits} />
      <Route path="/services/industrial-hvac" component={IndustrialHVAC} />
      <Route path="/services/electrical-engineering" component={ElectricalEngineering} />
      <Route path="/services/geothermal-systems" component={GeothermalSystems} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
