import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  image: string;
  className?: string;
}

export function ServiceCard({ title, description, icon: Icon, href, image, className }: ServiceCardProps) {
  return (
    <Link href={href}>
      <a className={cn("block group h-full", className)}>
        <Card className="h-full border-none shadow-lg overflow-hidden flex flex-col bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-sm">
          <div className="relative h-48 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${image})` }}
            />
            <div className="absolute inset-0 bg-primary/60 group-hover:bg-primary/40 transition-colors duration-300" />
            <div className="absolute bottom-4 left-4 bg-accent text-accent-foreground p-3 rounded-sm shadow-md">
              <Icon className="w-6 h-6" />
            </div>
          </div>
          
          <CardHeader className="pt-6">
            <CardTitle className="font-heading text-xl uppercase font-bold text-foreground group-hover:text-accent transition-colors">
              {title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-grow">
            <CardDescription className="text-muted-foreground leading-relaxed">
              {description}
            </CardDescription>
          </CardContent>
          
          <CardFooter className="pb-6 pt-0">
            <span className="text-sm font-bold text-primary flex items-center group-hover:text-accent transition-colors uppercase">
              MÁS INFORMACIÓN <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}
