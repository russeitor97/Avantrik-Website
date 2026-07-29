import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { ContactForm } from "@/components/contact-form";
import { Phone, Mail, Linkedin, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useCopy } from "@/lib/i18n";

const T = {
  es: {
    title: "Contacto | Avantrik Ingeniería Industrial en Querétaro",
    description:
      "Contacta a Avantrik para proyectos de ingeniería industrial, HVAC, auditorías energéticas, BMS y sistemas eléctricos en Querétaro. Atención especializada B2B.",
    h1: "Contacto",
    hero:
      "¿Listo para optimizar su instalación? Póngase en contacto con nuestro equipo de ingeniería para una consulta o cotización.",
    getInTouch: "Ponte en Contacto",
    intro:
      "Complete el formulario para solicitar una auditoría, una cotización o información general. Normalmente respondemos en un día hábil.",
    phone: "Teléfono",
    hours: "Lun-Vie, 8am - 9pm CST",
    email: "Correo",
    serviceArea: "Zona de servicio",
    areaMain: "Querétaro y el Bajío",
    areaNote: "Proyectos en todo México",
    social: "Redes Sociales",
    visitLinkedin: "Visitar LinkedIn",
    sendMessage: "Enviar Mensaje",
  },
  en: {
    title: "Contact | Avantrik Industrial Engineering in Querétaro",
    description:
      "Contact Avantrik for industrial engineering, HVAC, energy audit, BMS and electrical system projects in Querétaro, Mexico. Specialized B2B service.",
    h1: "Contact",
    hero:
      "Ready to optimize your facility? Get in touch with our engineering team for a consultation or quote.",
    getInTouch: "Get in Touch",
    intro:
      "Fill out the form to request an audit, a quote or general information. We typically respond within one business day.",
    phone: "Phone",
    hours: "Mon-Fri, 8am - 9pm CST",
    email: "Email",
    serviceArea: "Service area",
    areaMain: "Querétaro and the Bajío region",
    areaNote: "Projects across Mexico",
    social: "Social Media",
    visitLinkedin: "Visit LinkedIn",
    sendMessage: "Send a Message",
  },
};

export default function Contact() {
  const t = useCopy(T);

  return (
    <Layout>
      <Seo page="contact" title={t.title} description={t.description} />

      <div className="relative flex min-h-[38vh] items-center overflow-hidden bg-ink-gradient py-16">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto px-4 pt-24 text-center">
           <h1 className="mb-4 text-4xl font-heading font-bold text-white md:text-5xl">{t.h1}</h1>
           <p className="mx-auto max-w-2xl text-xl text-gray-300">
             {t.hero}
           </p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Contact Info Side */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-6">{t.getInTouch}</h2>
              <p className="text-muted-foreground mb-8">
                {t.intro}
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t.phone}</h3>
                  <p className="text-muted-foreground">(+52) 442-271-8460</p>
                  <p className="text-muted-foreground">(+52) 442-739-4819</p>
                  <p className="text-muted-foreground">(+52) 442-219-6915</p>
                  <p className="text-muted-foreground">(+52) 614-105-9868</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.hours}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t.email}</h3>
                  <p className="text-muted-foreground">info@avantrik.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t.serviceArea}</h3>
                  <p className="text-muted-foreground">{t.areaMain}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.areaNote}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Linkedin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t.social}</h3>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-2 border-accent text-accent hover:bg-accent hover:text-white flex items-center gap-2"
                  >
                    <a
                      href="https://mx.linkedin.com/company/avantrik"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="w-4 h-4" />
                      {t.visitLinkedin}
                    </a>
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Form Side */}
          <div className="bg-card border border-border p-8 rounded-sm shadow-lg">
            <h2 className="text-2xl font-heading font-bold mb-6">{t.sendMessage}</h2>
            <ContactForm />
          </div>

        </div>
      </section>
    </Layout>
  );
}
