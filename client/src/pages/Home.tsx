import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/ui/hero-section";
import { ServiceCard } from "@/components/ui/service-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, Wind, Cpu, Activity, ArrowRight, CheckCircle } from "lucide-react";

import heroImage from "@assets/generated_images/modern_industrial_engineering_facility_with_technical_atmosphere.png";
import energyImage from "@assets/generated_images/digital_energy_audit_tablet_in_factory_setting.png";
import hvacImage from "@assets/generated_images/large_scale_industrial_hvac_systems_on_rooftop.png";
import electricalImage from "@assets/generated_images/professional_industrial_electrical_control_panel.png";
import geothermalImage from "@assets/generated_images/industrial_geothermal_system_visualization.png";

export default function Home() {
  const services = [
    {
      title: "Energy Audits",
      description: "Comprehensive analysis of your facility's energy consumption with data-driven optimization strategies.",
      icon: Activity,
      href: "/services/energy-audits",
      image: energyImage
    },
    {
      title: "Industrial HVAC",
      description: "High-performance climate control systems designed for complex industrial environments and manufacturing plants.",
      icon: Wind,
      href: "/services/industrial-hvac",
      image: hvacImage
    },
    {
      title: "Electrical Engineering",
      description: "Advanced low and medium voltage electrical infrastructure planning, installation, and modernization.",
      icon: Zap,
      href: "/services/electrical-engineering",
      image: electricalImage
    },
    {
      title: "Geothermal Systems",
      description: "Sustainable heating and cooling solutions harnessing underground thermal energy for long-term efficiency.",
      icon: Cpu, // Using Cpu as a placeholder for complex tech/system
      href: "/services/geothermal-systems",
      image: geothermalImage
    }
  ];

  return (
    <Layout>
      <HeroSection 
        image={heroImage}
        title="ENGINEERING THE FUTURE OF INDUSTRY"
        subtitle="Avantrik delivers high-precision technical solutions for industrial infrastructure, energy efficiency, and systems optimization."
        ctaText="Request an Audit"
        ctaLink="/contact"
      />

      {/* Intro Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
              <h2 className="text-accent font-bold tracking-widest uppercase mb-2 text-sm">Who We Are</h2>
              <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
                Technical Precision for<br/>Complex Environments
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Avantrik is an engineering firm dedicated to optimizing industrial and commercial infrastructure. We don't just fix systems; we re-engineer them for maximum efficiency and reliability.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {["Operational Cost Reduction", "System Optimization", "Energy Efficiency", "Applied Engineering"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <span className="font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold uppercase tracking-wide">
                  More About Us
                </Button>
              </Link>
            </div>
            <div className="w-full md:w-1/2 relative h-[400px] bg-secondary/30 rounded-lg overflow-hidden border border-border">
                {/* Abstract visualization or secondary image could go here */}
                <div className="absolute inset-0 bg-primary/5 pattern-grid-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8 bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-sm max-w-xs">
                        <div className="text-5xl font-heading font-bold text-accent mb-2">35%</div>
                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Average Energy Savings for Clients</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-accent font-bold tracking-widest uppercase mb-2 text-sm">Our Expertise</h2>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Specialized Engineering Solutions
            </h3>
            <p className="text-muted-foreground">
              We focus exclusively on business and industrial environments, delivering tailored solutions that drive performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">Ready to Optimize Your Infrastructure?</h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Schedule a consultation with our engineering team to identify efficiency gaps and modernization opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-14 px-8 uppercase tracking-wide">
                Start a Project
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-bold h-14 px-8 uppercase tracking-wide">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
