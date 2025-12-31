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
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Teléfono</h3>
                  <p className="text-muted-foreground">(+52) 442-271-8460</p>
                  <p className="text-muted-foreground">(+52) 442-739-4819</p>
                  <p className="text-muted-foreground">(+52) 442-219-6915</p>
                  <p className="text-muted-foreground">(+52) 614-105-9868</p>
                  <p className="text-xs text-muted-foreground mt-1">Lun-Vie, 8am - 9pm CST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Correo</h3>
                  <p className="text-muted-foreground">info@avantrik.com</p>
                </div>
              </div>
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
