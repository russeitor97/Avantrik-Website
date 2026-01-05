import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { CheckCircle, Users, Award, Briefcase } from "lucide-react";
import heroImage from "@assets/generated_images/modern_industrial_engineering_facility_with_technical_atmosphere.png";

export default function About() {
  return (
    <Layout>    <Helmet>
          <title>Sobre Avantrik | Ingeniería Industrial y Energética en México</title>

          <meta
            name="description"
            content="Conoce Avantrik: empresa mexicana de ingeniería especializada en HVAC industrial, ingeniería eléctrica y eficiencia energética para industrias y edificios."
          />

          <link
            rel="canonical"
            href="https://www.avantrik.com/about"
          />
        </Helmet>

       <div className="relative h-[40vh] min-h-[300px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-primary/90 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Sobre Avantrik</h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">Excelencia en Ingeniería desde 2005</p>
        </div>
      </div>

      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-accent font-bold tracking-widest uppercase mb-2 text-sm">Nuestra Misión</h2>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-8">
                Empoderar a las industrias con infraestructura técnica eficiente, sostenible y resiliente.
            </h3>
            
            <div className="prose prose-lg text-muted-foreground mb-12">
                <p>
                    Avantrik es una empresa de ingeniería que ofrece soluciones técnicas a clientes residenciales, industriales, comerciales y corporativos. Nuestra experiencia está diseñada para adaptarse a la complejidad y escala de cualquier entorno, garantizando siempre los más altos estándares de calidad.
                </p>
                <p>
                    Nuestro enfoque es profundamente técnico. Creemos que la verdadera eficiencia proviene de una comprensión rigurosa de la física, la termodinámica y los sistemas eléctricos, no solo de la instalación de equipos nuevos. Analizamos, planificamos y ejecutamos con precisión en cada proyecto.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="text-center p-6 border border-border rounded-sm bg-secondary/20">
                    <Users className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h4 className="font-heading font-bold text-xl mb-2">Equipo Experto</h4>
                    <p className="text-sm">Ingenieros certificados en disciplinas mecánicas, eléctricas y energéticas.</p>
                </div>
                <div className="text-center p-6 border border-border rounded-sm bg-secondary/20">
                    <Award className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h4 className="font-heading font-bold text-xl mb-2">Calidad Primero</h4>
                    <p className="text-sm">Procesos certificados ISO 9001 que aseguran una entrega consistente y de alto estándar.</p>
                </div>
                <div className="text-center p-6 border border-border rounded-sm bg-secondary/20">
                    <Briefcase className="w-12 h-12 text-accent mx-auto mb-4" />
                    <h4 className="font-heading font-bold text-xl mb-2">Enfoque B2B</h4>
                    <p className="text-sm">Dedicados exclusivamente a las necesidades de socios industriales y comerciales.</p>
                </div>
            </div>
        </div>
      </section>
    </Layout>
  );
}
