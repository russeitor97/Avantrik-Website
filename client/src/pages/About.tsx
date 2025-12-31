import { Layout } from "@/components/layout/Layout";
import { CheckCircle, Users, Award, Briefcase } from "lucide-react";
import heroImage from "@assets/generated_images/modern_industrial_engineering_facility_with_technical_atmosphere.png";

export default function About() {
  return (
    <Layout>
       <div className="relative h-[40vh] min-h-[300px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-primary/90 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">About Avantrik</h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">Engineering Excellence Since 2005</p>
        </div>
      </div>

      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-accent font-bold tracking-widest uppercase mb-2 text-sm">Our Mission</h2>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-8">
                To empower industries with efficient, sustainable, and resilient technical infrastructure.
            </h3>
            
            <div className="prose prose-lg text-muted-foreground mb-12">
                <p>
                    Avantrik is an engineering company that provides technical solutions to industrial, commercial, and corporate clients. We do not serve residential markets because our expertise is tailored to the complexity and scale of high-demand business environments.
                </p>
                <p>
                    Our approach is deeply technical. We believe that true efficiency comes from a rigorous understanding of physics, thermodynamics, and electrical systems—not just from installing new equipment. We analyze, we plan, and we execute with precision.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 border border-border rounded-sm bg-secondary/20">
                    <Users className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h4 className="font-heading font-bold text-xl mb-2">Expert Team</h4>
                    <p className="text-sm">Certified engineers across mechanical, electrical, and energy disciplines.</p>
                </div>
                <div className="text-center p-6 border border-border rounded-sm bg-secondary/20">
                    <Award className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h4 className="font-heading font-bold text-xl mb-2">Quality First</h4>
                    <p className="text-sm">ISO 9001 certified processes ensuring consistent, high-standard delivery.</p>
                </div>
                <div className="text-center p-6 border border-border rounded-sm bg-secondary/20">
                    <Briefcase className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h4 className="font-heading font-bold text-xl mb-2">B2B Focus</h4>
                    <p className="text-sm">Exclusively dedicated to the needs of industrial and commercial partners.</p>
                </div>
            </div>
        </div>
      </section>
    </Layout>
  );
}
