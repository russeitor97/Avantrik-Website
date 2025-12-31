import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Activity, BarChart3, Settings, TrendingUp } from "lucide-react";
import energyImage from "@assets/generated_images/digital_energy_audit_tablet_in_factory_setting.png";

export default function EnergyAudits() {
  return (
    <Layout>
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${energyImage})` }}>
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Energy Audits</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Data-driven analysis to identify waste, reduce costs, and optimize consumption patterns.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Precision Energy Analysis</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our energy audits go beyond simple meter readings. We use advanced monitoring equipment and software analytics to map your facility's entire energy profile. We identify exactly where, when, and how energy is being wasted.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <BarChart3 className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Consumption Profiling</h3>
                    <p className="text-sm text-muted-foreground">Detailed load profiling to understand peak demand and base load inefficiencies.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Settings className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Equipment Efficiency</h3>
                    <p className="text-sm text-muted-foreground">Performance analysis of motors, compressors, and thermal systems.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">What We Deliver</h3>
            <ul className="space-y-4">
              {[
                "Comprehensive ISO 50001 aligned report",
                "ROI analysis for recommended improvements",
                "Thermal imaging of electrical panels and building envelope",
                "Power quality analysis (harmonics, voltage sags)",
                "Tariff structure optimization strategy"
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
              <h3 className="font-heading font-bold text-2xl mb-4">Start Your Audit</h3>
              <p className="text-muted-foreground mb-6">Stop paying for energy you don't use. Contact us to schedule a preliminary assessment.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Request Quote
                </Button>
              </Link>
              
              <div className="border-t border-border pt-6 mt-6">
                <h4 className="font-bold text-sm uppercase mb-2">Why Avantrik?</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                   <li>• Certified Energy Managers (CEM)</li>
                   <li>• Industrial-grade equipment</li>
                   <li>• Actionable, ROI-focused reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
