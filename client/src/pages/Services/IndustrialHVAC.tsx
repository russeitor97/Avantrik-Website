import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Wind, Thermometer, Fan, Gauge } from "lucide-react";
import hvacImage from "@assets/generated_images/large_scale_industrial_hvac_systems_on_rooftop.png";

export default function IndustrialHVAC() {
  return (
    <Layout>
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${hvacImage})` }}>
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Industrial HVAC</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Heavy-duty climate control and ventilation engineering for large-scale facilities.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Critical Climate Control</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Industrial environments require robust HVAC solutions that go beyond comfort. We design, install, and optimize systems that maintain critical process temperatures, ensure air quality, and operate with maximum energy efficiency under heavy loads.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Fan className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Ventilation & Filtration</h3>
                    <p className="text-sm text-muted-foreground">High-capacity air handling for factories with dust, fumes, or chemical byproducts.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Thermometer className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Process Cooling</h3>
                    <p className="text-sm text-muted-foreground">Chillers and cooling towers integrated directly with manufacturing lines.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">Our Capabilities</h3>
            <ul className="space-y-4">
              {[
                "Large-scale chiller plant design and installation",
                "Variable Refrigerant Flow (VRF) systems",
                "Clean room HVAC solutions",
                "Heat recovery ventilation systems",
                "Smart BMS (Building Management System) integration"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-accent shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card shadow-lg border border-border p-8 rounded-sm sticky top-24">
              <h3 className="font-heading font-bold text-2xl mb-4">System Upgrade?</h3>
              <p className="text-muted-foreground mb-6">Modern HVAC systems can reduce energy costs by up to 40%. Let's evaluate your current setup.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Consult an Engineer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
