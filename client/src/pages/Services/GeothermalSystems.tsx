import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, Cpu, Sprout, ArrowDownCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import geothermalImage from "@assets/generated_images/industrial_geothermal_system_visualization.png";

export default function GeothermalSystems() {
  return (
    <Layout>
      <Helmet>
        <title>Sistemas Geotérmicos Industriales | Avantrik</title>
        <meta name="description" content="Soluciones de energía geotérmica para calefacción y refrigeración industrial. Ahorro de costos y sostenibilidad ambiental." />
      </Helmet>
      <div className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${geothermalImage})` }}>
          <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
        </div>
        <div className="container mx-auto px-4 relative z-10 pt-20">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-4">Sistemas Geotérmicos Industriales</h1>
            <p className="text-xl text-gray-200 max-w-2xl">Sistemas geotérmicos industriales para calefacción y refrigeración de edificios y plantas,
              enfocados en eficiencia energética, reducción de costos operativos y sostenibilidad a largo plazo.</p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-heading font-bold text-foreground">Sistemas Geotérmicos de Alta Eficiencia para la Industria</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              La tecnología geotérmica aprovecha la temperatura constante de la tierra para proporcionar calefacción y refrigeración altamente eficientes. Para grandes edificios industriales y comerciales, esto se traduce en reducciones masivas en los costos operativos y la huella de carbono durante el ciclo de vida del sistema.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <ArrowDownCircle className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Bombas de Calor de Fuente Terrestre</h3>
                    <p className="text-sm text-muted-foreground">Sistemas de intercambio de alta eficiencia utilizando campos de bucle vertical u horizontal.</p>
                </div>
                <div className="bg-secondary/50 p-6 rounded-sm border border-border">
                    <Sprout className="w-10 h-10 text-accent mb-4" />
                    <h3 className="font-heading font-bold text-xl mb-2">Retorno de Inversión Sostenible</h3>
                    <p className="text-sm text-muted-foreground">Análisis de ahorros a largo plazo y evaluación de elegibilidad para créditos de carbono.</p>
                </div>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground pt-8">¿Por qué Geotermia?</h3>
            <ul className="space-y-4">
              {[
                "Reducción de hasta el 70% en costos de calefacción/refrigeración",
                "Los sistemas duran de 25 a 50 años con mantenimiento mínimo",
                "Operación silenciosa y sin unidades condensadoras exteriores",
                "Rendimiento constante independientemente de los climas extremos",
                "Reducción de las emisiones de carbono de la instalación"
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
              <h3 className="font-heading font-bold text-2xl mb-4">Estudio de Viabilidad</h3>
              <p className="text-muted-foreground mb-6">¿Es su sitio adecuado para la geotermia? Realizamos pruebas geológicas y de conductividad térmica.</p>
              
              <Link href="/contact">
                <Button className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide mb-4">
                  Solicitar Evaluación
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
