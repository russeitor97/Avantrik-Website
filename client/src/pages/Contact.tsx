import { Layout } from "@/components/layout/Layout";
import { ContactForm } from "@/components/contact-form";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  return (
    <Layout>
      <div className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4 text-center">
           <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Contacto</h1>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             ¿Listo para optimizar su instalación? Póngase en contacto con nuestro equipo de ingeniería para una consulta o cotización.
           </p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Info Side */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-6">Ponte en Contacto</h2>
              <p className="text-muted-foreground mb-8">
                Complete el formulario para solicitar una auditoría, una cotización o información general. Normalmente respondemos en un día hábil.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Sede Central</h3>
                  <p className="text-muted-foreground">
                    Parque Industrial 123.<br />
                    Sector 4, Ciudad Tecnológica, CP 90210
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Teléfono</h3>
                  <p className="text-muted-foreground">+52 (555) 123-4567</p>
                  <p className="text-xs text-muted-foreground mt-1">Lun-Vie, 8am - 6pm CST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Correo</h3>
                  <p className="text-muted-foreground">soluciones@avantrik.com</p>
                  <p className="text-muted-foreground">soporte@avantrik.com</p>
                </div>
              </div>
            </div>

            <div className="bg-primary text-primary-foreground p-8 rounded-sm mt-8">
                <h3 className="font-heading font-bold text-xl mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" /> Servicio de Emergencia
                </h3>
                <p className="text-primary-foreground/80 text-sm">
                    Para fallas críticas del sistema, nuestro equipo de soporte está disponible 24/7 para clientes con contrato. Por favor, llame a la línea de emergencia dedicada proporcionada en su acuerdo de servicio.
                </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-card border border-border p-8 rounded-sm shadow-lg">
            <h2 className="text-2xl font-heading font-bold mb-6">Enviar Mensaje</h2>
            <ContactForm />
          </div>

        </div>
      </section>
    </Layout>
  );
}
