import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  company: z.string().min(2, "El nombre de la empresa es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().min(10, "Se requiere un número de teléfono válido"),
  service: z.string().min(1, "Por favor seleccione un servicio"),
  message: z.string().min(10, "Por favor proporcione más detalles sobre su proyecto"),
});

export function ContactForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      service: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Solicitud Enviada",
      description: "Gracias por contactar a Avantrik. Responderemos en menos de 24 horas.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">Nombre Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Juan Pérez" {...field} className="bg-background border-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">Nombre de la Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Industrias S.A. de C.V." {...field} className="bg-background border-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">Correo de Trabajo</FormLabel>
                <FormControl>
                  <Input placeholder="juan@empresa.com" {...field} className="bg-background border-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">Número de Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="+52 (55) 0000-0000" {...field} className="bg-background border-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">Servicio de Interés</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="Seleccione un servicio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="energy-audit">Auditoría Energética</SelectItem>
                  <SelectItem value="industrial-hvac">HVAC Industrial</SelectItem>
                  <SelectItem value="electrical">Ingeniería Eléctrica</SelectItem>
                  <SelectItem value="geothermal">Sistemas Geotérmicos</SelectItem>
                  <SelectItem value="consulting">Consultoría General</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">Detalles del Proyecto</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describa los requisitos de su proyecto o retos específicos..." 
                  className="min-h-[120px] bg-background border-input resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wide">
          Enviar Solicitud
        </Button>
      </form>
    </Form>
  );
}
