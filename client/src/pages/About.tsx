import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Users, Award, Briefcase } from "lucide-react";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

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

       <div className="relative flex h-[44vh] min-h-[340px] items-center overflow-hidden bg-ink-gradient">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto px-4 pt-24 text-center">
            <h1 className="mb-4 text-4xl font-heading font-bold text-white md:text-5xl">Sobre Avantrik</h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-300">Excelencia en Ingeniería desde 2005</p>
        </div>
      </div>

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
            <Reveal>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">Nuestra Misión</h2>
              <h3 className="mb-8 text-3xl font-heading font-bold text-foreground md:text-4xl">
                  Empoderar a las industrias con infraestructura técnica eficiente, sostenible y resiliente.
              </h3>

              <div className="prose prose-lg mb-12 text-muted-foreground">
                  <p>
                      Avantrik es una empresa de ingeniería que ofrece soluciones técnicas a clientes residenciales, industriales, comerciales y corporativos. Nuestra experiencia está diseñada para adaptarse a la complejidad y escala de cualquier entorno, garantizando siempre los más altos estándares de calidad.
                  </p>
                  <p>
                      Nuestro enfoque es profundamente técnico. Creemos que la verdadera eficiencia proviene de una comprensión rigurosa de la física, la termodinámica y los sistemas eléctricos, no solo de la instalación de equipos nuevos. Analizamos, planificamos y ejecutamos con precisión en cada proyecto.
                  </p>
              </div>
            </Reveal>

            <Stagger className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                <StaggerItem>
                  <div className="h-full rounded-sm border border-border bg-secondary/20 p-6 text-center transition-all hover:-translate-y-1 hover:border-accent/40">
                    <Users className="mx-auto mb-4 h-12 w-12 text-accent" />
                    <h4 className="mb-2 font-heading text-xl font-bold">Equipo Experto</h4>
                    <p className="text-sm text-muted-foreground">Ingenieros certificados en disciplinas mecánicas, eléctricas y energéticas.</p>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="h-full rounded-sm border border-border bg-secondary/20 p-6 text-center transition-all hover:-translate-y-1 hover:border-accent/40">
                    <Award className="mx-auto mb-4 h-12 w-12 text-accent" />
                    <h4 className="mb-2 font-heading text-xl font-bold">Calidad Primero</h4>
                    <p className="text-sm text-muted-foreground">Procesos certificados ISO 9001 que aseguran una entrega consistente y de alto estándar.</p>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="h-full rounded-sm border border-border bg-secondary/20 p-6 text-center transition-all hover:-translate-y-1 hover:border-accent/40">
                    <Briefcase className="mx-auto mb-4 h-12 w-12 text-accent" />
                    <h4 className="mb-2 font-heading text-xl font-bold">Enfoque B2B</h4>
                    <p className="text-sm text-muted-foreground">Dedicados exclusivamente a las necesidades de socios industriales y comerciales.</p>
                  </div>
                </StaggerItem>
            </Stagger>
        </div>
      </section>
    </Layout>
  );
}
