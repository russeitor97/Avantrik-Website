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
import { useMemo, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";
import { useLang } from "@/lib/i18n";

// ── EmailJS config ──────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_wjgwyix";
const EMAILJS_TEMPLATE_ID = "template_mwz95cv";
const EMAILJS_PUBLIC_KEY = "UL19pglSyFo2jCc8s";
// ────────────────────────────────────────────────────────────

/**
 * Los VALORES del selector se quedan en español a propósito: son los que
 * viajan en el correo al equipo, que siempre lo lee en español. Solo cambia
 * la etiqueta que ve el visitante.
 */
const SERVICES: { value: string; es: string; en: string }[] = [
  { value: "Auditoría Energética", es: "Auditoría Energética", en: "Energy Audit" },
  { value: "HVAC Industrial", es: "HVAC Industrial", en: "Industrial HVAC" },
  { value: "Ingeniería Eléctrica", es: "Ingeniería Eléctrica", en: "Electrical Engineering" },
  { value: "Sistemas Geotérmicos", es: "Sistemas Geotérmicos", en: "Geothermal Systems" },
  { value: "Calculadora de Ahorro HVAC", es: "Calculadora de Ahorro HVAC", en: "HVAC Savings Calculator" },
  { value: "Consultoría General", es: "Consultoría General", en: "General Consulting" },
];

const T = {
  es: {
    name: "Nombre Completo",
    namePlaceholder: "Juan Pérez",
    company: "Nombre de la Empresa",
    companyPlaceholder: "Industrias S.A. de C.V.",
    email: "Correo de Trabajo",
    emailPlaceholder: "juan@empresa.com",
    phone: "Número de Teléfono",
    phonePlaceholder: "+52 (442) 000-0000",
    service: "Servicio de Interés",
    servicePlaceholder: "Seleccione un servicio",
    message: "Detalles del Proyecto",
    messagePlaceholder: "Describa los requisitos de su proyecto o retos específicos...",
    sending: "Enviando...",
    submit: "Enviar Solicitud",
    successTitle: "¡Solicitud enviada!",
    successBody: "Gracias por contactar a Avantrik. Te responderemos en menos de 24 horas.",
    errorTitle: "Error al enviar",
    errorBody:
      "Hubo un problema al enviar tu mensaje. Por favor intenta de nuevo o escríbenos directamente a info@avantrik.com",
    errors: {
      name: "El nombre es obligatorio",
      company: "El nombre de la empresa es obligatorio",
      email: "Correo electrónico inválido",
      phone: "Se requiere un número de teléfono válido",
      service: "Por favor seleccione un servicio",
      message: "Por favor proporcione más detalles sobre su proyecto",
    },
  },
  en: {
    name: "Full Name",
    namePlaceholder: "John Smith",
    company: "Company Name",
    companyPlaceholder: "Acme Manufacturing",
    email: "Work Email",
    emailPlaceholder: "john@company.com",
    phone: "Phone Number",
    phonePlaceholder: "+52 (442) 000-0000",
    service: "Service of Interest",
    servicePlaceholder: "Select a service",
    message: "Project Details",
    messagePlaceholder: "Describe your project requirements or specific challenges...",
    sending: "Sending...",
    submit: "Send Request",
    successTitle: "Request sent!",
    successBody: "Thanks for contacting Avantrik. We'll get back to you within 24 hours.",
    errorTitle: "Could not send",
    errorBody:
      "There was a problem sending your message. Please try again or email us directly at info@avantrik.com",
    errors: {
      name: "Name is required",
      company: "Company name is required",
      email: "Invalid email address",
      phone: "A valid phone number is required",
      service: "Please select a service",
      message: "Please provide more details about your project",
    },
  },
};

function makeSchema(e: (typeof T)["es"]["errors"]) {
  return z.object({
    name: z.string().min(2, e.name),
    company: z.string().min(2, e.company),
    email: z.string().email(e.email),
    phone: z.string().min(10, e.phone),
    service: z.string().min(1, e.service),
    message: z.string().min(10, e.message),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export function ContactForm() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const lang = useLang();
  const t = T[lang];

  const formSchema = useMemo(() => makeSchema(t.errors), [t]);

  const form = useForm<FormValues>({
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

  async function onSubmit(values: FormValues) {
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
        title: t.successTitle,
        description: t.successBody,
      });
      form.reset();
    } catch (error) {
      console.error("EmailJS error:", error);
      toast({
        title: t.errorTitle,
        description: t.errorBody,
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
                  {t.name}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.namePlaceholder}
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
                  {t.company}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.companyPlaceholder}
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
                  {t.email}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.emailPlaceholder}
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
                  {t.phone}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.phonePlaceholder}
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
                {t.service}
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder={t.servicePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SERVICES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s[lang]}
                    </SelectItem>
                  ))}
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
                {t.message}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.messagePlaceholder}
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
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.sending}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> {t.submit}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
