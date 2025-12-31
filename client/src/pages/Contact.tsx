import { Layout } from "@/components/layout/Layout";
import { ContactForm } from "@/components/contact-form";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  return (
    <Layout>
      <div className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4 text-center">
           <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Contact Us</h1>
           <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             Ready to optimize your facility? Get in touch with our engineering team for a consultation or quote.
           </p>
        </div>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Contact Info Side */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form to request an audit, a quote, or general information. We typically respond within one business day.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Headquarters</h3>
                  <p className="text-muted-foreground">
                    123 Industrial Park Dr.<br />
                    Sector 4, Tech City, ST 90210
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Phone</h3>
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                  <p className="text-xs text-muted-foreground mt-1">Mon-Fri, 8am - 6pm EST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center rounded-sm shrink-0">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Email</h3>
                  <p className="text-muted-foreground">solutions@avantrik.com</p>
                  <p className="text-muted-foreground">support@avantrik.com</p>
                </div>
              </div>
            </div>

            <div className="bg-primary text-primary-foreground p-8 rounded-sm mt-8">
                <h3 className="font-heading font-bold text-xl mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" /> Emergency Service
                </h3>
                <p className="text-primary-foreground/80 text-sm">
                    For critical system failures, our support team is available 24/7 for contract clients. Please call the dedicated emergency line provided in your service agreement.
                </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-card border border-border p-8 rounded-sm shadow-lg">
            <h2 className="text-2xl font-heading font-bold mb-6">Send a Message</h2>
            <ContactForm />
          </div>

        </div>
      </section>
    </Layout>
  );
}
