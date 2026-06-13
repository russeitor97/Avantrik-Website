import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";

// ── EmailJS config ──────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_wjgwyix";
const EMAILJS_TEMPLATE_ID = "template_mwz95cv";
const EMAILJS_PUBLIC_KEY = "UL19pglSyFo2jCc8s";
// ────────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  company: z.string().min(2, "El nombre de la empresa es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().min(10, "Se requiere un número de teléfono válido"),
  service: z.string().min(1, "Por favor seleccione un servicio"),
  message: z
    .string()
    .min(10, "Por favor proporcione más detalles sobre su proyecto"),
});

export function ContactForm() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSending(true);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: values.name,
          company: values.company,
          from_email: values.email,
          phone: values.phone,
          service: values.service,
          message: values.message,
          reply_to: values.email,
        },
        EMAILJS_PUBLIC_KEY,
      );

      toast({
        title: "¡Solicitud enviada!",
        description:
          "Gracias por contactar a Avantrik. Te responderemos en menos de 24 horas.",
      });
      form.reset();
    } catch (error) {
      console.error("EmailJS error:", error);
      toast({
        title: "Error al enviar",
        description:
          "Hubo un problema al enviar tu mensaje. Por favor intenta de nuevo o escríbenos directamente a info@avantrik.com",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
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
                <FormLabel className="text-foreground/80">
                  Nombre Completo
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Juan Pérez"
                    {...field}
                    className="bg-background border-input"
                  />
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
                <FormLabel className="text-foreground/80">
                  Nombre de la Empresa
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Industrias S.A. de C.V."
                    {...field}
                    className="bg-background border-input"
                  />
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
                <FormLabel className="text-foreground/80">
                  Correo de Trabajo
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="juan@empresa.com"
                    {...field}
                    className="bg-background border-input"
                  />
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
                <FormLabel className="text-foreground/80">
                  Número de Teléfono
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="+52 (55) 0000-0000"
                    {...field}
                    className="bg-background border-input"
                  />
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
              <FormLabel className="text-foreground/80">
                Servicio de Interés
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="Seleccione un servicio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Auditoría Energética">
                    Auditoría Energética
                  </SelectItem>
                  <SelectItem value="HVAC Industrial">
                    HVAC Industrial
                  </SelectItem>
                  <SelectItem value="Ingeniería Eléctrica">
                    Ingeniería Eléctrica
                  </SelectItem>
                  <SelectItem value="Sistemas Geotérmicos">
                    Sistemas Geotérmicos
                  </SelectItem>
                  <SelectItem value="Calculadora de Ahorro HVAC">
                    Calculadora de Ahorro HVAC
                  </SelectItem>
                  <SelectItem value="Consultoría General">
                    Consultoría General
                  </SelectItem>
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
              <FormLabel className="text-foreground/80">
                Detalles del Proyecto
              </FormLabel>
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

        <Button
          type="submit"
          size="lg"
          disabled={sending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wide"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Enviar Solicitud
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
