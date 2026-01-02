import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import EnergyAudits from "@/pages/Services/EnergyAudits";
import IndustrialHVAC from "@/pages/Services/IndustrialHVAC";
import ElectricalEngineering from "@/pages/Services/ElectricalEngineering";
import GeothermalSystems from "@/pages/Services/GeothermalSystems";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/services/energy-audits" component={EnergyAudits} />
      <Route path="/services/industrial-hvac" component={IndustrialHVAC} />
      <Route path="/services/electrical-engineering" component={ElectricalEngineering} />
      <Route path="/services/geothermal-systems" component={GeothermalSystems} />
      <Route component={NotFound} />
    </Switch>
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
