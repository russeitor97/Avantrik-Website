import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  image: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export function HeroSection({
  image,
  title,
  subtitle,
  ctaText = "Our Services",
  ctaLink = "/services",
  secondaryCtaText = "Contact Us",
  secondaryCtaLink = "/contact"
}: HeroSectionProps) {
  return (
    <div className="relative w-full h-[85vh] min-h-[600px] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-3xl animate-in slide-in-from-left-10 duration-700 fade-in">
          <div className="inline-block px-3 py-1 mb-6 border-l-4 border-accent bg-primary/20 backdrop-blur-sm">
            <p className="text-accent font-bold tracking-widest uppercase text-xs">
              Excelencia en Ingeniería Industrial
            </p>

          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-xl leading-relaxed">
            {subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={ctaLink}>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base h-14 px-8 rounded-sm uppercase tracking-wide">
                {ctaText} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            <Link href={secondaryCtaLink}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold text-base h-14 px-8 rounded-sm uppercase tracking-wide">
                {secondaryCtaText}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
  );
}
