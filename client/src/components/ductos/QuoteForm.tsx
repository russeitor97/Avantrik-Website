/**
 * Solicitud de cotización de ductería.
 *
 * Reutiliza la plantilla de EmailJS que ya usa el formulario de contacto
 * (`template_mwz95cv`) en lugar de pedir una nueva: los campos propios de
 * ductería se arman dentro de `message`, así que funciona sin configurar nada
 * más. Si algún día se crea una plantilla dedicada, solo cambia TEMPLATE_ID.
 *
 * Dimensiones, cantidad y calibre son opcionales a propósito: el cliente debe
 * poder pedir cotización aunque todavía no tenga el proyecto definido.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useEffect, useMemo, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import emailjs from "@emailjs/browser";
import { useLang } from "@/lib/i18n";
import { quoteOptions } from "@/lib/ductos";

const EMAILJS_SERVICE_ID = "service_wjgwyix";
const EMAILJS_TEMPLATE_ID = "template_mwz95cv";
const EMAILJS_PUBLIC_KEY = "UL19pglSyFo2jCc8s";

const T = {
  es: {
    piece: "Pieza que necesita",
    piecePlaceholder: "Seleccione una pieza",
    pieceOther: "Otra pieza / no estoy seguro",
    name: "Nombre completo",
    namePlaceholder: "Juan Pérez",
    company: "Empresa",
    companyPlaceholder: "Industrias S.A. de C.V.",
    email: "Correo de trabajo",
    emailPlaceholder: "juan@empresa.com",
    phone: "Teléfono",
    phonePlaceholder: "+52 (442) 000-0000",
    dimensions: "Dimensiones",
    dimensionsPlaceholder: '60 × 40 cm, tramos de 1.22 m',
    quantity: "Cantidad",
    quantityPlaceholder: "25 tramos",
    gauge: "Calibre",
    gaugePlaceholder: "Cal. 22",
    optional: "Opcional — si aún no lo sabe, déjelo en blanco.",
    message: "Descripción del proyecto",
    messagePlaceholder:
      "Cuéntenos del proyecto: tipo de instalación, ubicación, fechas estimadas o cualquier detalle que ayude a cotizar.",
    plans: "¿Tiene planos?",
    plansBody:
      "Envíelos por correo a info@avantrik.com citando el nombre de su empresa y los sumamos a la cotización.",
    sending: "Enviando...",
    submit: "Solicitar cotización",
    successTitle: "Solicitud enviada",
    successBody:
      "Gracias. Revisaremos su solicitud y le responderemos en menos de 24 horas hábiles.",
    errorTitle: "No se pudo enviar",
    errorBody:
      "Hubo un problema al enviar su solicitud. Inténtelo de nuevo o escríbanos directamente a info@avantrik.com",
    errors: {
      name: "El nombre es obligatorio",
      company: "El nombre de la empresa es obligatorio",
      email: "Correo electrónico inválido",
      phone: "Se requiere un número de teléfono válido",
      piece: "Seleccione la pieza que necesita",
      message: "Describa brevemente su proyecto",
    },
    labels: {
      piece: "Pieza",
      dimensions: "Dimensiones",
      quantity: "Cantidad",
      gauge: "Calibre",
      notSpecified: "No especificado",
      project: "Proyecto",
    },
  },
  en: {
    piece: "Part you need",
    piecePlaceholder: "Select a part",
    pieceOther: "Another part / not sure yet",
    name: "Full name",
    namePlaceholder: "John Smith",
    company: "Company",
    companyPlaceholder: "Acme Manufacturing",
    email: "Work email",
    emailPlaceholder: "john@company.com",
    phone: "Phone",
    phonePlaceholder: "+52 (442) 000-0000",
    dimensions: "Dimensions",
    dimensionsPlaceholder: '24 × 16 in, 1.22 m sections',
    quantity: "Quantity",
    quantityPlaceholder: "25 sections",
    gauge: "Gauge",
    gaugePlaceholder: "22 ga",
    optional: "Optional — leave blank if you don't know yet.",
    message: "Project description",
    messagePlaceholder:
      "Tell us about the project: type of installation, location, estimated dates or any detail that helps us quote.",
    plans: "Have drawings?",
    plansBody:
      "Email them to info@avantrik.com quoting your company name and we'll add them to the quote.",
    sending: "Sending...",
    submit: "Request a quote",
    successTitle: "Request sent",
    successBody:
      "Thank you. We'll review your request and reply within 24 business hours.",
    errorTitle: "Could not send",
    errorBody:
      "There was a problem sending your request. Please try again or email us directly at info@avantrik.com",
    errors: {
      name: "Name is required",
      company: "Company name is required",
      email: "Invalid email address",
      phone: "A valid phone number is required",
      piece: "Select the part you need",
      message: "Briefly describe your project",
    },
    labels: {
      piece: "Part",
      dimensions: "Dimensions",
      quantity: "Quantity",
      gauge: "Gauge",
      notSpecified: "Not specified",
      project: "Project",
    },
  },
};

const OTHER = "__other__";

function makeSchema(e: (typeof T)["es"]["errors"]) {
  return z.object({
    name: z.string().min(2, e.name),
    company: z.string().min(2, e.company),
    email: z.string().email(e.email),
    phone: z.string().min(10, e.phone),
    piece: z.string().min(1, e.piece),
    dimensions: z.string(),
    quantity: z.string(),
    gauge: z.string(),
    message: z.string().min(10, e.message),
  });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

interface Props {
  /** Pieza preseleccionada al llegar desde una tarjeta del catálogo. */
  preselected?: string;
}

export function QuoteForm({ preselected }: Props) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const lang = useLang();
  const t = T[lang];

  const options = useMemo(() => quoteOptions(lang), [lang]);
  const formSchema = useMemo(() => makeSchema(t.errors), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      piece: "",
      dimensions: "",
      quantity: "",
      gauge: "",
      message: "",
    },
  });

  // Al pulsar "Cotizar" en una tarjeta, la pieza llega ya elegida.
  const { setValue } = form;
  useEffect(() => {
    if (preselected) setValue("piece", preselected);
  }, [preselected, setValue]);

  async function onSubmit(values: FormValues) {
    setSending(true);
    const l = t.labels;
    const none = l.notSpecified;
    const piece = values.piece === OTHER ? t.pieceOther : values.piece;

    const message = [
      `${l.piece}: ${piece}`,
      `${l.dimensions}: ${values.dimensions || none}`,
      `${l.quantity}: ${values.quantity || none}`,
      `${l.gauge}: ${values.gauge || none}`,
      "",
      `${l.project}:`,
      values.message,
    ].join("\n");

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: values.name,
          company: values.company,
          from_email: values.email,
          phone: values.phone,
          service: "Ductería rectangular — Cotización",
          message,
          reply_to: values.email,
        },
        EMAILJS_PUBLIC_KEY,
      );

      toast({ title: t.successTitle, description: t.successBody });
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
        <FormField
          control={form.control}
          name="piece"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">{t.piece}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder={t.piecePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER}>{t.pieceOther}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">{t.name}</FormLabel>
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
                <FormLabel className="text-foreground/80">{t.company}</FormLabel>
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">{t.email}</FormLabel>
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
                <FormLabel className="text-foreground/80">{t.phone}</FormLabel>
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">{t.dimensions}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.dimensionsPlaceholder}
                    {...field}
                    className="bg-background border-input font-mono text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">{t.quantity}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.quantityPlaceholder}
                    {...field}
                    className="bg-background border-input font-mono text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gauge"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80">{t.gauge}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t.gaugePlaceholder}
                    {...field}
                    className="bg-background border-input font-mono text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <p className="-mt-2 text-xs text-muted-foreground">{t.optional}</p>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground/80">{t.message}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.messagePlaceholder}
                  className="min-h-[120px] resize-none bg-background border-input"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                <span className="font-semibold text-foreground/70">{t.plans}</span>{" "}
                {t.plansBody}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          disabled={sending}
          className="w-full bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.sending}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> {t.submit}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
