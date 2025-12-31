import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Zap, ShieldCheck, Cable, Lightbulb } from "lucide-react";
import electricalImage from "@assets/generated_images/professional_industrial_electrical_control_panel.png";

export default function ElectricalEngineering() {
  return (
    <Layout>
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${electricalImage})` }}>
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Electrical Engineering</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Reliable power infrastructure for mission-critical industrial operations.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Powering Industry</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We specialize in Low and Medium Voltage electrical systems. From main switchboards to distribution networks, we ensure your facility has stable, safe, and efficient power. Our engineers design systems that minimize downtime and handle heavy industrial loads.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Zap className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Switchgear & Distribution</h3>
                    <p className="text-sm text-muted-foreground">Installation and maintenance of LV/MV switchgear and transformers.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <ShieldCheck className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Protection & Safety</h3>
                    <p className="text-sm text-muted-foreground">Arc flash analysis, grounding systems, and surge protection.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">Technical Services</h3>
            <ul className="space-y-4">
              {[
                "Electrical load analysis and capacity planning",
                "Industrial automation and control panel design",
                "Emergency power systems (Generators/UPS)",
                "Power factor correction capacitor banks",
                "LED lighting retrofits for industrial halls"
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
              <h3 className="font-heading font-bold text-2xl mb-4">Electrical Safety Audit</h3>
              <p className="text-muted-foreground mb-6">Ensure your electrical infrastructure meets current safety codes and operational standards.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Schedule Inspection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
