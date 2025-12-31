import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Cpu, Sprout, ArrowDownCircle } from "lucide-react";
import geothermalImage from "@assets/generated_images/industrial_geothermal_system_visualization.png";

export default function GeothermalSystems() {
  return (
    <Layout>
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${geothermalImage})` }}>
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Geothermal Systems</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Sustainable thermal energy solutions for forward-thinking industrial facilities.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Earth-Powered Efficiency</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Geothermal technology leverages the constant temperature of the earth to provide highly efficient heating and cooling. For large industrial and commercial buildings, this translates to massive reductions in operational costs and carbon footprint over the system's lifecycle.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <ArrowDownCircle className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Ground Source Heat Pumps</h3>
                    <p className="text-sm text-muted-foreground">High-efficiency exchange systems utilizing vertical or horizontal loop fields.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Sprout className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Sustainability ROI</h3>
                    <p className="text-sm text-muted-foreground">Long-term savings analysis and carbon credit eligibility assessment.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">Why Geothermal?</h3>
            <ul className="space-y-4">
              {[
                "Up to 70% reduction in heating/cooling costs",
                "Systems last 25-50 years with minimal maintenance",
                "Silent operation and no outdoor condenser units",
                "Consistent performance regardless of weather extremes",
                "Reduced facility carbon emissions"
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
              <h3 className="font-heading font-bold text-2xl mb-4">Feasibility Study</h3>
              <p className="text-muted-foreground mb-6">Is your site suitable for geothermal? We conduct geological and thermal conductivity tests.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Request Assessment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
