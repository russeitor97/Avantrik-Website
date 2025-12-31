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
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Ingeniería Eléctrica</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Infraestructura de energía confiable para operaciones industriales de misión crítica.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Potenciando la Industria</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nos especializamos en sistemas eléctricos de Baja y Media Tensión. Desde tableros principales hasta redes de distribución, aseguramos que su instalación tenga energía estable, segura y eficiente. Nuestros ingenieros diseñan sistemas que minimizan el tiempo de inactividad y soportan pesadas cargas industriales.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Zap className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Tableros y Distribución</h3>
                    <p className="text-sm text-muted-foreground">Instalación y mantenimiento de tableros de baja/media tensión y transformadores.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <ShieldCheck className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Protección y Seguridad</h3>
                    <p className="text-sm text-muted-foreground">Análisis de arco eléctrico, sistemas de tierras y protección contra sobretensiones.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">Servicios Técnicos</h3>
            <ul className="space-y-4">
              {[
                "Análisis de carga eléctrica y planeación de capacidad",
                "Diseño de tableros de control y automatización industrial",
                "Sistemas de energía de emergencia (Generadores/UPS)",
                "Bancos de capacitores para corrección de factor de potencia",
                "Retrofit de iluminación LED para naves industriales"
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
              <h3 className="font-heading font-bold text-2xl mb-4">Auditoría de Seguridad Eléctrica</h3>
              <p className="text-muted-foreground mb-6">Asegúrese de que su infraestructura eléctrica cumpla con las normas de seguridad y estándares operativos vigentes.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Programar Inspección
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
