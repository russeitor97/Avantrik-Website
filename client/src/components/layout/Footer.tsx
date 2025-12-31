import { Link } from "wouter";
import { Activity, Mail, MapPin, Phone } from "lucide-react";

import logo from "@assets/Logo_Avantrik_sin_texto_1767166358111.png";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-16 pb-8 border-t-4 border-accent">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Avantrik Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="font-heading font-bold text-2xl tracking-tight">
                AVANTRIK
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Engineering excellence for industrial efficiency. We provide advanced technical solutions for HVAC, Electrical, and Geothermal systems.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">Services</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/services/energy-audits"><a className="hover:text-accent transition-colors">Energy Audits</a></Link></li>
              <li><Link href="/services/industrial-hvac"><a className="hover:text-accent transition-colors">Industrial HVAC</a></Link></li>
              <li><Link href="/services/electrical-engineering"><a className="hover:text-accent transition-colors">Electrical Engineering</a></Link></li>
              <li><Link href="/services/geothermal-systems"><a className="hover:text-accent transition-colors">Geothermal Systems</a></Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/"><a className="hover:text-accent transition-colors">Home</a></Link></li>
              <li><Link href="/about"><a className="hover:text-accent transition-colors">About Us</a></Link></li>
              <li><Link href="/contact"><a className="hover:text-accent transition-colors">Contact</a></Link></li>
              <li><a href="#" className="hover:text-accent transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-6 text-white">Contact Us</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0" />
                <span>123 Industrial Park Dr.<br />Sector 4, Tech City</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <span>solutions@avantrik.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Avantrik Engineering. All rights reserved.</p>
          <p>Designed for Performance.</p>
        </div>
      </div>
    </footer>
  );
}
