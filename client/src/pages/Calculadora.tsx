import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useMemo, useState } from "react";
import { Calculator, TrendingDown, Zap, Thermometer, Snowflake, ArrowRight, CheckCircle, Building2, Factory, Hotel, Briefcase, HelpCircle, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
import { useHref, useLang, type Lang } from "@/lib/i18n";

// ── EmailJS config (template dedicado de leads de Calculadora) ──
const EMAILJS_SERVICE_ID = "service_wjgwyix";
const EMAILJS_TEMPLATE_ID = "template_qixz56c";
const EMAILJS_PUBLIC_KEY = "UL19pglSyFo2jCc8s";
// ─────────────────────────────────────────────────────────────────

/* ─── Helpers ───
   Los importes siguen en pesos: las tarifas CFE y la operación son mexicanas.
   Solo cambia el formato de separadores según el idioma. */
const makeFmt = (lang: Lang) => (n: number) =>
  n.toLocaleString(lang === "en" ? "en-US" : "es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const makeFmtNum = (lang: Lang) => (n: number) =>
  n.toLocaleString(lang === "en" ? "en-US" : "es-MX", { maximumFractionDigits: 0 });

/** Siempre en español: viaja en el correo que lee el equipo de Avantrik. */
const yesNo = (v: string) =>
  (({ no: "No", parcial: "Parcial", si: "Sí" }) as Record<string, string>)[v] || "No especificado";

/* ─── Supuestos técnicos ───
   Los números son la especificación oficial (Excel) y NO cambian con el
   idioma; solo se traduce la etiqueta que ve el visitante. La etiqueta en
   español se reutiliza en el correo interno. */
const CONTROL_LEVELS = [
  { value: "manual", label: { es: "Manual / sin control automático", en: "Manual / no automatic control" }, low: 0.15, high: 0.25, msg: { es: "Alto potencial de ahorro mediante horarios, arranques escalonados, variadores y control centralizado.", en: "High savings potential through scheduling, staged starts, variable speed drives and centralized control." } },
  { value: "parcial", label: { es: "Control parcial o por horarios básicos", en: "Partial control or basic scheduling" }, low: 0.08, high: 0.18, msg: { es: "Existe oportunidad de optimizar horarios, secuencias, ajustes de temperatura y monitoreo.", en: "There is room to optimize schedules, sequences, temperature setpoints and monitoring." } },
  { value: "automatico", label: { es: "Sistema automático existente sin optimización", en: "Existing automatic system, not optimized" }, low: 0.05, high: 0.12, msg: { es: "El ahorro puede venir de revisar tendencias, alarmas, secuencias y ajustes operativos.", en: "Savings can come from reviewing trends, alarms, sequences and operating setpoints." } },
  { value: "optimizado", label: { es: "Sistema bien controlado", en: "Well-controlled system" }, low: 0.03, high: 0.08, msg: { es: "El potencial principal está en ajustes finos, medición y verificación continua.", en: "The main potential lies in fine tuning, metering and continuous verification." } },
];

const BUILDING_TYPES = [
  { value: "industrial", label: { es: "Planta industrial", en: "Industrial plant" }, icon: Factory, low: 0.25, high: 0.45, suggested: 0.35 },
  { value: "plaza", label: { es: "Plaza comercial", en: "Shopping center" }, icon: Building2, low: 0.35, high: 0.55, suggested: 0.45 },
  { value: "hotel", label: { es: "Hotel", en: "Hotel" }, icon: Hotel, low: 0.30, high: 0.50, suggested: 0.40 },
  { value: "oficinas", label: { es: "Oficinas", en: "Offices" }, icon: Briefcase, low: 0.30, high: 0.45, suggested: 0.38 },
  { value: "otro", label: { es: "Otro", en: "Other" }, icon: Building2, low: 0.25, high: 0.40, suggested: 0.33 },
];

const SYSTEM_CONDITIONS = [
  { value: "eficiente", label: { es: "Eficiente", en: "Efficient" }, kwPerTon: 0.75 },
  { value: "promedio", label: { es: "Promedio (no conozco el dato)", en: "Average (I don't know the figure)" }, kwPerTon: 1.0 },
  { value: "ineficiente", label: { es: "Ineficiente / con oportunidad de mejora", en: "Inefficient / room for improvement" }, kwPerTon: 1.3 },
];

const PLANT_CONDITIONS = [
  { value: "sin_secuencia", label: { es: "Sin secuencia clara de chillers", en: "No clear chiller sequencing" }, low: 0.05, high: 0.15 },
  { value: "bombas", label: { es: "Bombas sin variador de velocidad", en: "Pumps without variable speed drives" }, low: 0.10, high: 0.25 },
  { value: "baja_dt", label: { es: "Baja diferencia de temperatura en agua helada", en: "Low chilled water temperature difference" }, low: 0.08, high: 0.20 },
  { value: "ajustes", label: { es: "Ajustes de temperatura y horarios no optimizados", en: "Temperature setpoints and schedules not optimized" }, low: 0.03, high: 0.10 },
  { value: "no_sabe", label: { es: "No conozco la condición", en: "I don't know the condition" }, low: 0.05, high: 0.12 },
];

/* ═══════════════════ Textos ═══════════════════ */
const T = {
  es: {
    metaTitle: "Calculadora de Ahorro Energético HVAC en Querétaro | Avantrik",
    metaDescription:
      "Calcula cuánto puedes ahorrar en energía eléctrica con automatización de aire acondicionado, almacenamiento térmico y optimización de planta de agua helada.",
    heroBadge: "Herramienta gratuita",
    heroTitle: "Calculadora de Ahorro Energético HVAC",
    heroSubtitle:
      "Estima cuánto puede ahorrar tu empresa en energía eléctrica. Selecciona una calculadora, ingresa los datos de tu instalación y obtén un estimado preliminar en menos de 2 minutos.",
    tabs: { automation: "Automatización A/C", storage: "Almacenamiento Térmico", plant: "Planta de Agua Helada" },
    sections: {
      automation: {
        title: "Ahorro por Automatización del Aire Acondicionado",
        body: "Estima ahorros por horarios inteligentes, control automático, arranques escalonados, variadores de velocidad y mejores ajustes de operación.",
      },
      storage: {
        title: "Reducción de Demanda con Almacenamiento Térmico",
        body: "Estima cuánto enfriamiento podrías mover a otro horario y cuánto podrías reducir tu demanda eléctrica pico.",
      },
      plant: {
        title: "Optimización de Planta de Agua Helada",
        body: "Estima el ahorro por mejorar operación de chillers, bombas, temperaturas, horarios y secuencias de control.",
      },
    },
    lead: {
      title: "Ver resultados completos",
      subtitle: "Ingresa tus datos para recibir tu estimación detallada y que un ingeniero te contacte.",
      name: "Nombre", namePlaceholder: "Tu nombre",
      company: "Empresa", companyPlaceholder: "Nombre de tu empresa",
      email: "Correo", emailPlaceholder: "correo@empresa.com",
      phone: "Teléfono", phonePlaceholder: "+52 000-000-0000",
      city: "Ciudad", cityPlaceholder: "Ej. Querétaro, Monterrey, CDMX...",
      sending: "Enviando...",
      submit: "Ver mi estimación y solicitar diagnóstico",
      successTitle: "¡Listo!",
      successBody: "En breve un ingeniero de Avantrik te contactará con tu diagnóstico personalizado.",
      errorTitle: "Error al enviar",
      errorBody: "Hubo un problema al enviar tus datos. Intenta de nuevo o escríbenos a info@avantrik.com",
      errors: {
        name: "Ingresa tu nombre",
        company: "Ingresa el nombre de tu empresa",
        email: "Correo electrónico inválido",
        phone: "Ingresa un teléfono válido",
        city: "Ingresa tu ciudad",
      },
    },
    common: {
      preliminary: "Estimación preliminar",
      monthlySavings: "Ahorro mensual estimado",
      annualSavings: "Ahorro anual estimado",
      savingsFactor: "Factor de ahorro estimado",
      simplePayback: "Retorno simple estimado",
      months: "meses",
      to: "a",
      investment: "Inversión estimada para implementación (MXN, opcional)",
      calculate: "Calcular ahorro estimado",
      received: "¡Datos recibidos!",
      selectPlaceholder: "Selecciona",
      notSpecified: "No especificado",
    },
    calc1: {
      formTitle: "Datos de tu instalación",
      buildingType: "Tipo de inmueble",
      buildingPlaceholder: "Selecciona el tipo",
      monthlyCost: "Gasto mensual de energía eléctrica (MXN)",
      monthlyCostHelp: "Monto total de tu recibo de luz mensual.",
      hvacPercent: "% del gasto asociado al aire acondicionado",
      typicalRange: (label: string, low: number, high: number, suggested: number) =>
        `Rango típico para ${label}: ${low}% a ${high}%. Valor sugerido: ${suggested}%.`,
      hoursDay: "Horas de operación al día",
      daysWeek: "Días de operación por semana",
      controlLevel: "¿Cómo se controla hoy tu aire acondicionado?",
      controlPlaceholder: "Selecciona el nivel de control",
      vfd: "¿Cuenta con variadores de velocidad en ventiladores o bombas?",
      vfdOptions: { no: "No", parcial: "Parcial", si: "Sí, en la mayoría" },
      hvacMonthly: "Gasto mensual en climatización",
      emptyState: "Completa los datos de tu instalación para ver tu estimación de ahorro.",
      receivedBody: "Un ingeniero de Avantrik te contactará pronto para agendar tu diagnóstico HVAC personalizado.",
      disclaimer:
        "Los resultados son estimaciones preliminares basadas en supuestos generales de operación. El ahorro real debe validarse mediante diagnóstico energético, revisión de recibos eléctricos, mediciones en sitio y análisis operativo del sistema HVAC.",
    },
    calc2: {
      formTitle: "Datos de tu sistema de enfriamiento",
      monthlyCost: "Gasto mensual total de energía eléctrica (MXN)",
      peakDemand: "Demanda máxima registrada (kW)",
      peakDemandHelp: "Puedes encontrar este dato en tu recibo eléctrico de CFE.",
      demandCharge: "Cargo aproximado por demanda (MXN/kW-mes)",
      capacity: "Capacidad instalada de enfriamiento (toneladas de refrigeración)",
      capacityHelp: "1 TR = tonelada de refrigeración ≈ 3.517 kW térmicos.",
      shiftPercent: "% de carga que se busca mover a otro horario",
      dischargeHours: "Horas de enfriamiento a cubrir con almacenamiento",
      systemCondition: "Condición del sistema de enfriamiento actual",
      calculate: "Calcular reducción de demanda",
      shiftedLoad: "Carga de enfriamiento desplazada",
      storageCapacity: "Capacidad de almacenamiento",
      demandReduction: "Reducción estimada de demanda",
      demandSavings: "Ahorro mensual por demanda",
      totalMonthly: "Ahorro mensual total estimado",
      note: "Almacenamiento parcial recomendado. Permite reducir la demanda pico sin reemplazar los chillers existentes.",
      emptyState: "Completa los datos para estimar la reducción de demanda con almacenamiento térmico.",
      receivedBody: "Un ingeniero te contactará para evaluar tu proyecto TES.",
      disclaimer:
        "El almacenamiento térmico debe validarse con perfil horario de carga, recibos eléctricos, horarios tarifarios, operación real de chillers, espacio disponible, hidráulica y costo de implementación. Este resultado solo sirve como pre-diagnóstico comercial.",
      tonHr: "ton-hr",
    },
    calc3: {
      formTitle: "Datos de tu planta de agua helada",
      operatingTons: "Capacidad promedio de enfriamiento en operación (TR)",
      operatingTonsHelp: "Toneladas promedio de operación, no la capacidad instalada.",
      hoursYear: "Horas de operación al año",
      kwPerTon: "Consumo actual estimado del sistema (kW por tonelada)",
      kwPerTonHelp: "Si no conoces este dato, usa 1.10 como referencia.",
      energyCost: "Costo promedio de energía (MXN/kWh)",
      currentDT: "ΔT actual del agua helada (°F)",
      designDT: "ΔT de diseño (°F)",
      pumpsVFD: "¿Las bombas tienen variador?",
      trends: "¿Hay medición o tendencias?",
      trendsOptions: { no: "No", parcial: "Parcial", si: "Sí, completo" },
      vfdOptions: { no: "No", parcial: "Parcial", si: "Sí" },
      mainCondition: "Condición principal observada",
      conditionPlaceholder: "Selecciona la condición",
      annualConsumption: "Consumo anual estimado",
      annualCost: "Costo anual de operación",
      lowDTWarning: "⚠ Posible baja diferencia de temperatura: el sistema mueve más agua de la necesaria.",
      recommendation: "Recomendación: realizar retro-commissioning y validación de setpoints, tendencias y alarmas.",
      emptyState: "Completa los datos de tu planta para estimar el potencial de optimización.",
      receivedBody: "Un ingeniero te contactará para agendar tu revisión de planta.",
      disclaimer:
        "Este cálculo no sustituye un estudio de ingeniería. Para confirmar ahorros se requiere revisar tendencias, temperaturas de suministro y retorno, flujo, operación de bombas, secuencia de chillers, recibos eléctricos y condiciones reales de carga.",
    },
    cta: {
      title: "¿Quieres un diagnóstico real?",
      body: "Las calculadoras dan estimados preliminares. Para confirmar tus ahorros, nuestros ingenieros realizan mediciones en sitio, revisan recibos y analizan la operación real de tu sistema.",
      button: "Solicitar diagnóstico HVAC",
    },
  },
  en: {
    metaTitle: "HVAC Energy Savings Calculator in Querétaro | Avantrik",
    metaDescription:
      "Estimate how much you can save on electricity through HVAC automation, thermal energy storage and chilled water plant optimization.",
    heroBadge: "Free tool",
    heroTitle: "HVAC Energy Savings Calculator",
    heroSubtitle:
      "Estimate how much your company could save on electricity. Pick a calculator, enter your facility data and get a preliminary estimate in under 2 minutes.",
    tabs: { automation: "HVAC Automation", storage: "Thermal Storage", plant: "Chilled Water Plant" },
    sections: {
      automation: {
        title: "Savings from HVAC Automation",
        body: "Estimate savings from smart scheduling, automatic control, staged starts, variable speed drives and better operating setpoints.",
      },
      storage: {
        title: "Demand Reduction with Thermal Energy Storage",
        body: "Estimate how much cooling you could shift to off-peak hours and how far you could cut your peak electrical demand.",
      },
      plant: {
        title: "Chilled Water Plant Optimization",
        body: "Estimate savings from improving chiller and pump operation, temperatures, schedules and control sequences.",
      },
    },
    lead: {
      title: "See full results",
      subtitle: "Enter your details to get your detailed estimate and have an engineer contact you.",
      name: "Name", namePlaceholder: "Your name",
      company: "Company", companyPlaceholder: "Your company name",
      email: "Email", emailPlaceholder: "you@company.com",
      phone: "Phone", phonePlaceholder: "+52 000-000-0000",
      city: "City", cityPlaceholder: "e.g. Querétaro, Monterrey, Mexico City...",
      sending: "Sending...",
      submit: "See my estimate and request a diagnosis",
      successTitle: "All set!",
      successBody: "An Avantrik engineer will contact you shortly with your personalized diagnosis.",
      errorTitle: "Could not send",
      errorBody: "There was a problem sending your details. Please try again or email us at info@avantrik.com",
      errors: {
        name: "Enter your name",
        company: "Enter your company name",
        email: "Invalid email address",
        phone: "Enter a valid phone number",
        city: "Enter your city",
      },
    },
    common: {
      preliminary: "Preliminary estimate",
      monthlySavings: "Estimated monthly savings",
      annualSavings: "Estimated annual savings",
      savingsFactor: "Estimated savings factor",
      simplePayback: "Estimated simple payback",
      months: "months",
      to: "to",
      investment: "Estimated implementation investment (MXN, optional)",
      calculate: "Calculate estimated savings",
      received: "Details received!",
      selectPlaceholder: "Select",
      notSpecified: "Not specified",
    },
    calc1: {
      formTitle: "Your facility data",
      buildingType: "Building type",
      buildingPlaceholder: "Select the type",
      monthlyCost: "Monthly electricity spend (MXN)",
      monthlyCostHelp: "Total amount on your monthly electricity bill.",
      hvacPercent: "% of spend attributed to air conditioning",
      typicalRange: (label: string, low: number, high: number, suggested: number) =>
        `Typical range for ${label}: ${low}% to ${high}%. Suggested value: ${suggested}%.`,
      hoursDay: "Operating hours per day",
      daysWeek: "Operating days per week",
      controlLevel: "How is your air conditioning controlled today?",
      controlPlaceholder: "Select the control level",
      vfd: "Do you have variable speed drives on fans or pumps?",
      vfdOptions: { no: "No", parcial: "Partial", si: "Yes, on most" },
      hvacMonthly: "Monthly HVAC spend",
      emptyState: "Fill in your facility data to see your savings estimate.",
      receivedBody: "An Avantrik engineer will contact you soon to schedule your personalized HVAC diagnosis.",
      disclaimer:
        "Results are preliminary estimates based on general operating assumptions. Actual savings must be validated through an energy audit, review of electricity bills, on-site measurements and operational analysis of the HVAC system.",
    },
    calc2: {
      formTitle: "Your cooling system data",
      monthlyCost: "Total monthly electricity spend (MXN)",
      peakDemand: "Recorded peak demand (kW)",
      peakDemandHelp: "You can find this figure on your CFE electricity bill.",
      demandCharge: "Approximate demand charge (MXN/kW-month)",
      capacity: "Installed cooling capacity (refrigeration tons)",
      capacityHelp: "1 RT = refrigeration ton ≈ 3.517 kW thermal.",
      shiftPercent: "% of load you want to shift to another time of day",
      dischargeHours: "Cooling hours to cover with storage",
      systemCondition: "Condition of your current cooling system",
      calculate: "Calculate demand reduction",
      shiftedLoad: "Shifted cooling load",
      storageCapacity: "Storage capacity",
      demandReduction: "Estimated demand reduction",
      demandSavings: "Monthly savings from demand",
      totalMonthly: "Estimated total monthly savings",
      note: "Partial storage recommended. It reduces peak demand without replacing your existing chillers.",
      emptyState: "Fill in the data to estimate demand reduction with thermal energy storage.",
      receivedBody: "An engineer will contact you to evaluate your TES project.",
      disclaimer:
        "Thermal storage must be validated with an hourly load profile, electricity bills, tariff schedules, actual chiller operation, available space, hydraulics and implementation cost. This result serves only as a commercial pre-assessment.",
      tonHr: "ton-hr",
    },
    calc3: {
      formTitle: "Your chilled water plant data",
      operatingTons: "Average operating cooling capacity (RT)",
      operatingTonsHelp: "Average operating tons, not installed capacity.",
      hoursYear: "Operating hours per year",
      kwPerTon: "Estimated current system consumption (kW per ton)",
      kwPerTonHelp: "If you don't know this figure, use 1.10 as a reference.",
      energyCost: "Average energy cost (MXN/kWh)",
      currentDT: "Current chilled water ΔT (°F)",
      designDT: "Design ΔT (°F)",
      pumpsVFD: "Do the pumps have variable speed drives?",
      trends: "Is there metering or trending?",
      trendsOptions: { no: "No", parcial: "Partial", si: "Yes, complete" },
      vfdOptions: { no: "No", parcial: "Partial", si: "Yes" },
      mainCondition: "Main observed condition",
      conditionPlaceholder: "Select the condition",
      annualConsumption: "Estimated annual consumption",
      annualCost: "Annual operating cost",
      lowDTWarning: "⚠ Possible low temperature difference: the system is moving more water than needed.",
      recommendation: "Recommendation: perform retro-commissioning and validate setpoints, trends and alarms.",
      emptyState: "Fill in your plant data to estimate the optimization potential.",
      receivedBody: "An engineer will contact you to schedule your plant review.",
      disclaimer:
        "This calculation does not replace an engineering study. Confirming savings requires reviewing trends, supply and return temperatures, flow, pump operation, chiller sequencing, electricity bills and actual load conditions.",
    },
    cta: {
      title: "Want a real diagnosis?",
      body: "The calculators give preliminary estimates. To confirm your savings, our engineers take on-site measurements, review bills and analyze how your system actually runs.",
      button: "Request an HVAC diagnosis",
    },
  },
};

/* ─── Datos técnicos + resultados que cada calculadora envía por correo ─── */
type LeadPayload = {
  calculatorType: string;   // "Automatización A/C", "Almacenamiento Térmico", "Planta Agua Helada"
  calculationData: string;  // resumen de los datos técnicos capturados (siempre en español)
  monthlySavings: string;
  annualSavings: string;
  roi: string;
  investment: string;
};

/* ─── Lead capture form component ─── */
function LeadForm({ payload, onComplete }: {
  payload: LeadPayload;
  onComplete: () => void;
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const lang = useLang();
  const t = T[lang].lead;

  const leadSchema = useMemo(
    () =>
      z.object({
        nombre: z.string().min(2, t.errors.name),
        empresa: z.string().min(2, t.errors.company),
        correo: z.string().email(t.errors.email),
        telefono: z.string().min(10, t.errors.phone),
        ciudad: z.string().min(2, t.errors.city),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: { nombre: "", empresa: "", correo: "", telefono: "", ciudad: "" },
  });

  async function onSubmit(values: z.infer<typeof leadSchema>) {
    setSending(true);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: values.nombre,
          company: values.empresa,
          from_email: values.correo,
          phone: values.telefono,
          city: values.ciudad,
          calculator_type: payload.calculatorType,
          calculation_data: payload.calculationData,
          monthly_savings: payload.monthlySavings,
          annual_savings: payload.annualSavings,
          roi: payload.roi,
          investment: payload.investment,
          reply_to: values.correo,
        },
        EMAILJS_PUBLIC_KEY,
      );

      toast({
        title: t.successTitle,
        description: t.successBody,
      });
      onComplete();
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
    <div className="bg-primary text-primary-foreground p-8 rounded-sm shadow-lg">
      <h3 className="font-heading font-bold text-2xl mb-2">{t.title}</h3>
      <p className="text-primary-foreground/70 text-sm mb-6">
        {t.subtitle}
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">{t.name}</FormLabel>
                <FormControl><Input placeholder={t.namePlaceholder} {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="empresa" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">{t.company}</FormLabel>
                <FormControl><Input placeholder={t.companyPlaceholder} {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="correo" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">{t.email}</FormLabel>
                <FormControl><Input placeholder={t.emailPlaceholder} {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="telefono" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">{t.phone}</FormLabel>
                <FormControl><Input placeholder={t.phonePlaceholder} {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="ciudad" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary-foreground/80 text-sm">{t.city}</FormLabel>
              <FormControl><Input placeholder={t.cityPlaceholder} {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" disabled={sending} className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90">
            <Send className="w-4 h-4 mr-2" /> {sending ? t.sending : t.submit}
          </Button>
        </form>
      </Form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CALCULADORA 1 — Ahorro por Automatización A/C
   ═══════════════════════════════════════════════════ */
function CalcAutomatizacion() {
  const lang = useLang();
  const c = T[lang].common;
  const t = T[lang].calc1;
  const fmt = makeFmt(lang);

  const [buildingType, setBuildingType] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [hvacPercent, setHvacPercent] = useState<number[]>([35]);
  const [hoursDay, setHoursDay] = useState("");
  const [daysWeek, setDaysWeek] = useState("");
  const [controlLevel, setControlLevel] = useState("");
  const [hasVFD, setHasVFD] = useState("");
  const [investment, setInvestment] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const building = BUILDING_TYPES.find(b => b.value === buildingType);
  const control = CONTROL_LEVELS.find(c => c.value === controlLevel);

  // Auto-suggest HVAC % when building type changes
  const handleBuildingChange = (val: string) => {
    setBuildingType(val);
    const b = BUILDING_TYPES.find(bt => bt.value === val);
    if (b) setHvacPercent([Math.round(b.suggested * 100)]);
  };

  const canCalculate = buildingType && monthlyCost && controlLevel && hoursDay && daysWeek;

  const calculate = () => {
    if (!canCalculate) return;
    setShowResults(true);
  };

  // Results
  const cost = parseFloat(monthlyCost.replace(/,/g, "")) || 0;
  const hvacShare = hvacPercent[0] / 100;
  const hvacCost = cost * hvacShare;
  const savingsLow = control ? hvacCost * control.low : 0;
  const savingsHigh = control ? hvacCost * control.high : 0;
  const annualLow = savingsLow * 12;
  const annualHigh = savingsHigh * 12;
  const inv = parseFloat(investment.replace(/,/g, "")) || 0;
  const roiLow = inv > 0 ? inv / savingsHigh : 0;
  const roiHigh = inv > 0 ? inv / savingsLow : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border p-6 rounded-sm shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
              <Calculator className="w-5 h-5 text-accent" /> {t.formTitle}
            </h3>

            {/* Tipo de inmueble */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.buildingType}</Label>
              <Select value={buildingType} onValueChange={handleBuildingChange}>
                <SelectTrigger className="bg-background"><SelectValue placeholder={t.buildingPlaceholder} /></SelectTrigger>
                <SelectContent>
                  {BUILDING_TYPES.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gasto mensual */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.monthlyCost}</Label>
              <Input
                type="text"
                placeholder="800,000"
                value={monthlyCost}
                onChange={e => setMonthlyCost(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">{t.monthlyCostHelp}</p>
            </div>

            {/* % HVAC */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">{t.hvacPercent}</Label>
                <span className="text-accent font-bold text-lg">{hvacPercent[0]}%</span>
              </div>
              <Slider
                value={hvacPercent}
                onValueChange={setHvacPercent}
                min={10}
                max={70}
                step={1}
                className="py-2"
              />
              {building && (
                <p className="text-xs text-muted-foreground">
                  {t.typicalRange(
                    building.label[lang].toLowerCase(),
                    Math.round(building.low * 100),
                    Math.round(building.high * 100),
                    Math.round(building.suggested * 100),
                  )}
                </p>
              )}
            </div>

            {/* Horas y días */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.hoursDay}</Label>
                <Input type="number" placeholder="14" value={hoursDay} onChange={e => setHoursDay(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.daysWeek}</Label>
                <Input type="number" placeholder="6" value={daysWeek} onChange={e => setDaysWeek(e.target.value)} className="bg-background" />
              </div>
            </div>

            {/* Nivel de control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.controlLevel}</Label>
              <Select value={controlLevel} onValueChange={setControlLevel}>
                <SelectTrigger className="bg-background"><SelectValue placeholder={t.controlPlaceholder} /></SelectTrigger>
                <SelectContent>
                  {CONTROL_LEVELS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variadores */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.vfd}</Label>
              <Select value={hasVFD} onValueChange={setHasVFD}>
                <SelectTrigger className="bg-background"><SelectValue placeholder={c.selectPlaceholder} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">{t.vfdOptions.no}</SelectItem>
                  <SelectItem value="parcial">{t.vfdOptions.parcial}</SelectItem>
                  <SelectItem value="si">{t.vfdOptions.si}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inversión */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{c.investment}</Label>
              <Input
                type="text"
                placeholder="1,200,000"
                value={investment}
                onChange={e => setInvestment(e.target.value)}
                className="bg-background"
              />
            </div>

            <Button
              onClick={calculate}
              disabled={!canCalculate}
              className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90 h-12 text-base"
            >
              <TrendingDown className="w-5 h-5 mr-2" /> {c.calculate}
            </Button>
          </div>
        </div>

        {/* Results sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {showResults ? (
            <>
              {/* Preview results (always shown) */}
              <div className="bg-secondary border border-border p-6 rounded-sm shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-primary">{c.preliminary}</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{t.hvacMonthly}</span>
                    <span className="font-bold text-foreground">{fmt(hvacCost)}</span>
                  </div>

                  {control && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">{c.savingsFactor}</span>
                      <span className="font-bold text-foreground">{(control.low * 100).toFixed(0)}% — {(control.high * 100).toFixed(0)}%</span>
                    </div>
                  )}

                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">{c.monthlySavings}</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(savingsLow)} — {fmt(savingsHigh)}</p>
                  </div>

                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">{c.annualSavings}</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(annualLow)} — {fmt(annualHigh)}</p>
                  </div>

                  {inv > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">{c.simplePayback}</span>
                      <span className="font-bold text-foreground">{roiLow.toFixed(0)} {c.to} {roiHigh.toFixed(0)} {c.months}</span>
                    </div>
                  )}
                </div>

                {control && (
                  <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                    <div className="flex gap-2">
                      <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{control.msg[lang]}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead capture */}
              {!leadCaptured ? (
                <LeadForm
                  payload={{
                    calculatorType: "Automatización A/C",
                    calculationData: [
                      `Tipo de inmueble: ${building?.label.es ?? "N/D"}`,
                      `Gasto mensual de energía: ${fmt(cost)}`,
                      `% asociado a A/C: ${hvacPercent[0]}%`,
                      `Gasto en climatización: ${fmt(hvacCost)}`,
                      `Operación: ${hoursDay} h/día, ${daysWeek} días/semana`,
                      `Nivel de control actual: ${control?.label.es ?? "N/D"}`,
                      `Variadores de velocidad: ${yesNo(hasVFD)}`,
                    ].join("\n"),
                    monthlySavings: `${fmt(savingsLow)} — ${fmt(savingsHigh)}`,
                    annualSavings: `${fmt(annualLow)} — ${fmt(annualHigh)}`,
                    roi: inv > 0 ? `${roiLow.toFixed(0)} a ${roiHigh.toFixed(0)} meses` : "No especificado",
                    investment: inv > 0 ? fmt(inv) : "No especificado",
                  }}
                  onComplete={() => setLeadCaptured(true)}
                />
              ) : (
                <div className="bg-accent/10 border border-accent/30 p-6 rounded-sm text-center">
                  <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                  <h4 className="font-heading font-bold text-lg mb-2">{c.received}</h4>
                  <p className="text-sm text-muted-foreground">{t.receivedBody}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary/50 border border-border p-8 rounded-sm text-center space-y-4">
              <Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">{t.emptyState}</p>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        {t.disclaimer}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CALCULADORA 2 — Almacenamiento Térmico (TES)
   ═══════════════════════════════════════════════════ */
function CalcAlmacenamiento() {
  const lang = useLang();
  const c = T[lang].common;
  const t = T[lang].calc2;
  const fmt = makeFmt(lang);
  const fmtNum = makeFmtNum(lang);

  const [monthlyCost, setMonthlyCost] = useState("");
  const [peakDemand, setPeakDemand] = useState("");
  const [demandCharge, setDemandCharge] = useState("");
  const [coolingCapacity, setCoolingCapacity] = useState("");
  const [shiftPercent, setShiftPercent] = useState<number[]>([40]);
  const [dischargeHours, setDischargeHours] = useState("6");
  const [systemCondition, setSystemCondition] = useState("promedio");
  const [investment, setInvestment] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const condition = SYSTEM_CONDITIONS.find(c => c.value === systemCondition);
  const canCalculate = monthlyCost && peakDemand && coolingCapacity && demandCharge;

  const calculate = () => {
    if (!canCalculate) return;
    setShowResults(true);
  };

  const capacity = parseFloat(coolingCapacity.replace(/,/g, "")) || 0;
  const shift = shiftPercent[0] / 100;
  const hours = parseFloat(dischargeHours) || 6;
  const kwPerTon = condition?.kwPerTon || 1.0;
  const peak = parseFloat(peakDemand.replace(/,/g, "")) || 0;
  const charge = parseFloat(demandCharge.replace(/,/g, "")) || 0;
  const monthlyEnergyCost = parseFloat(monthlyCost.replace(/,/g, "")) || 0;

  const shiftedTons = capacity * shift;
  const storageCapacity = shiftedTons * hours;
  const demandReduction = shiftedTons * kwPerTon;
  const demandSavings = demandReduction * charge;
  // Excel '02 Almacenamiento'!E11: ahorro total = ahorro por demanda + 2% a 5% del gasto eléctrico mensual (mejor horario de operación)
  const totalSavingsLow = demandSavings + 0.02 * monthlyEnergyCost;
  const totalSavingsHigh = demandSavings + 0.05 * monthlyEnergyCost;
  const annualLow = totalSavingsLow * 12;
  const annualHigh = totalSavingsHigh * 12;
  const inv = parseFloat(investment.replace(/,/g, "")) || 0;
  const roiLow = inv > 0 ? inv / totalSavingsHigh : 0;
  const roiHigh = inv > 0 ? inv / totalSavingsLow : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border p-6 rounded-sm shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-accent" /> {t.formTitle}
            </h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.monthlyCost}</Label>
              <Input type="text" placeholder="1,200,000" value={monthlyCost} onChange={e => setMonthlyCost(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.peakDemand}</Label>
              <Input type="text" placeholder="1,200" value={peakDemand} onChange={e => setPeakDemand(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">{t.peakDemandHelp}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.demandCharge}</Label>
              <Input type="text" placeholder="500" value={demandCharge} onChange={e => setDemandCharge(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.capacity}</Label>
              <Input type="text" placeholder="800" value={coolingCapacity} onChange={e => setCoolingCapacity(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">{t.capacityHelp}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">{t.shiftPercent}</Label>
                <span className="text-accent font-bold text-lg">{shiftPercent[0]}%</span>
              </div>
              <Slider value={shiftPercent} onValueChange={setShiftPercent} min={20} max={60} step={5} className="py-2" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.dischargeHours}</Label>
              <Input type="number" placeholder="6" value={dischargeHours} onChange={e => setDischargeHours(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.systemCondition}</Label>
              <Select value={systemCondition} onValueChange={setSystemCondition}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SYSTEM_CONDITIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{c.investment}</Label>
              <Input type="text" placeholder="9,500,000" value={investment} onChange={e => setInvestment(e.target.value)} className="bg-background" />
            </div>

            <Button onClick={calculate} disabled={!canCalculate} className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90 h-12 text-base">
              <TrendingDown className="w-5 h-5 mr-2" /> {t.calculate}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {showResults ? (
            <>
              <div className="bg-secondary border border-border p-6 rounded-sm shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-primary">{c.preliminary}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{t.shiftedLoad}</span>
                    <span className="font-bold">{fmtNum(shiftedTons)} TR</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{t.storageCapacity}</span>
                    <span className="font-bold">{fmtNum(storageCapacity)} {t.tonHr}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{t.demandReduction}</span>
                    <span className="font-bold">{fmtNum(demandReduction)} kW</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{t.demandSavings}</span>
                    <span className="font-bold">{fmt(demandSavings)}</span>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">{t.totalMonthly}</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(totalSavingsLow)} — {fmt(totalSavingsHigh)}</p>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">{c.annualSavings}</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(annualLow)} — {fmt(annualHigh)}</p>
                  </div>
                  {inv > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">{c.simplePayback}</span>
                      <span className="font-bold">{roiLow.toFixed(0)} {c.to} {roiHigh.toFixed(0)} {c.months}</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                  <p className="text-sm text-muted-foreground">{t.note}</p>
                </div>
              </div>
              {!leadCaptured ? (
                <LeadForm
                  payload={{
                    calculatorType: "Almacenamiento Térmico",
                    calculationData: [
                      `Gasto mensual de energía: ${fmt(parseFloat(monthlyCost.replace(/,/g, "")) || 0)}`,
                      `Demanda máxima: ${fmtNum(peak)} kW`,
                      `Cargo por demanda: ${fmt(charge)}/kW-mes`,
                      `Capacidad instalada: ${fmtNum(capacity)} TR`,
                      `% de carga a desplazar: ${shiftPercent[0]}%`,
                      `Horas de descarga: ${hours}`,
                      `Condición del sistema: ${condition?.label.es ?? "N/D"}`,
                      `Carga desplazada: ${fmtNum(shiftedTons)} TR`,
                      `Reducción de demanda: ${fmtNum(demandReduction)} kW`,
                    ].join("\n"),
                    monthlySavings: `${fmt(totalSavingsLow)} — ${fmt(totalSavingsHigh)}`,
                    annualSavings: `${fmt(annualLow)} — ${fmt(annualHigh)}`,
                    roi: inv > 0 ? `${roiLow.toFixed(0)} a ${roiHigh.toFixed(0)} meses` : "No especificado",
                    investment: inv > 0 ? fmt(inv) : "No especificado",
                  }}
                  onComplete={() => setLeadCaptured(true)}
                />
              ) : (
                <div className="bg-accent/10 border border-accent/30 p-6 rounded-sm text-center">
                  <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                  <h4 className="font-heading font-bold text-lg mb-2">{c.received}</h4>
                  <p className="text-sm text-muted-foreground">{t.receivedBody}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary/50 border border-border p-8 rounded-sm text-center space-y-4">
              <Snowflake className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">{t.emptyState}</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        {t.disclaimer}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CALCULADORA 3 — Optimización Planta Agua Helada
   ═══════════════════════════════════════════════════ */
function CalcPlanta() {
  const lang = useLang();
  const c = T[lang].common;
  const t = T[lang].calc3;
  const fmt = makeFmt(lang);
  const fmtNum = makeFmtNum(lang);

  const [operatingTons, setOperatingTons] = useState("");
  const [hoursYear, setHoursYear] = useState("4000");
  const [kwPerTon, setKwPerTon] = useState("");
  const [energyCost, setEnergyCost] = useState("");
  const [currentDT, setCurrentDT] = useState("");
  const [designDT, setDesignDT] = useState("10");
  const [hasVFD, setHasVFD] = useState("");
  const [hasTrends, setHasTrends] = useState("");
  const [mainCondition, setMainCondition] = useState("");
  const [investment, setInvestment] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  const condition = PLANT_CONDITIONS.find(c => c.value === mainCondition);
  const canCalculate = operatingTons && kwPerTon && energyCost && mainCondition;

  const calculate = () => {
    if (!canCalculate) return;
    setShowResults(true);
  };

  const tons = parseFloat(operatingTons.replace(/,/g, "")) || 0;
  const hours = parseFloat(hoursYear) || 4000;
  const kw = parseFloat(kwPerTon) || 1.1;
  const cost = parseFloat(energyCost) || 2.2;
  const dt = parseFloat(currentDT) || 0;
  const ddt = parseFloat(designDT) || 10;

  const annualConsumption = tons * hours * kw;
  const annualCost = annualConsumption * cost;
  const savingsLow = condition ? annualCost * condition.low : 0;
  const savingsHigh = condition ? annualCost * condition.high : 0;
  const monthlyLow = savingsLow / 12;
  const monthlyHigh = savingsHigh / 12;
  const inv = parseFloat(investment.replace(/,/g, "")) || 0;
  const roiLow = inv > 0 ? inv / monthlyHigh : 0;
  const roiHigh = inv > 0 ? inv / monthlyLow : 0;
  const lowDT = dt > 0 && dt < ddt;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border border-border p-6 rounded-sm shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-accent" /> {t.formTitle}
            </h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.operatingTons}</Label>
              <Input type="text" placeholder="600" value={operatingTons} onChange={e => setOperatingTons(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">{t.operatingTonsHelp}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.hoursYear}</Label>
              <Input type="number" placeholder="4000" value={hoursYear} onChange={e => setHoursYear(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.kwPerTon}</Label>
              <Input type="text" placeholder="1.10" value={kwPerTon} onChange={e => setKwPerTon(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">{t.kwPerTonHelp}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.energyCost}</Label>
              <Input type="text" placeholder="2.20" value={energyCost} onChange={e => setEnergyCost(e.target.value)} className="bg-background" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.currentDT}</Label>
                <Input type="text" placeholder="6" value={currentDT} onChange={e => setCurrentDT(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.designDT}</Label>
                <Input type="text" placeholder="10" value={designDT} onChange={e => setDesignDT(e.target.value)} className="bg-background" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.pumpsVFD}</Label>
                <Select value={hasVFD} onValueChange={setHasVFD}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder={c.selectPlaceholder} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">{t.vfdOptions.no}</SelectItem>
                    <SelectItem value="parcial">{t.vfdOptions.parcial}</SelectItem>
                    <SelectItem value="si">{t.vfdOptions.si}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t.trends}</Label>
                <Select value={hasTrends} onValueChange={setHasTrends}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder={c.selectPlaceholder} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">{t.trendsOptions.no}</SelectItem>
                    <SelectItem value="parcial">{t.trendsOptions.parcial}</SelectItem>
                    <SelectItem value="si">{t.trendsOptions.si}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.mainCondition}</Label>
              <Select value={mainCondition} onValueChange={setMainCondition}>
                <SelectTrigger className="bg-background"><SelectValue placeholder={t.conditionPlaceholder} /></SelectTrigger>
                <SelectContent>
                  {PLANT_CONDITIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label[lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{c.investment}</Label>
              <Input type="text" placeholder="1,800,000" value={investment} onChange={e => setInvestment(e.target.value)} className="bg-background" />
            </div>

            <Button onClick={calculate} disabled={!canCalculate} className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90 h-12 text-base">
              <TrendingDown className="w-5 h-5 mr-2" /> {c.calculate}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {showResults ? (
            <>
              <div className="bg-secondary border border-border p-6 rounded-sm shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-primary">{c.preliminary}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{t.annualConsumption}</span>
                    <span className="font-bold">{fmtNum(annualConsumption)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">{t.annualCost}</span>
                    <span className="font-bold">{fmt(annualCost)}</span>
                  </div>
                  {condition && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">{c.savingsFactor}</span>
                      <span className="font-bold">{(condition.low * 100).toFixed(0)}% — {(condition.high * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">{c.monthlySavings}</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(monthlyLow)} — {fmt(monthlyHigh)}</p>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">{c.annualSavings}</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(savingsLow)} — {fmt(savingsHigh)}</p>
                  </div>
                  {inv > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">{c.simplePayback}</span>
                      <span className="font-bold">{roiLow.toFixed(0)} {c.to} {roiHigh.toFixed(0)} {c.months}</span>
                    </div>
                  )}
                </div>
                {lowDT && (
                  <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-sm">
                    <p className="text-sm font-medium text-destructive">{t.lowDTWarning}</p>
                  </div>
                )}
                <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                  <p className="text-sm text-muted-foreground">{t.recommendation}</p>
                </div>
              </div>
              {!leadCaptured ? (
                <LeadForm
                  payload={{
                    calculatorType: "Planta Agua Helada",
                    calculationData: [
                      `Capacidad en operación: ${fmtNum(tons)} TR`,
                      `Horas de operación al año: ${hours}`,
                      `Consumo actual: ${kw} kW/TR`,
                      `Costo de energía: ${cost} MXN/kWh`,
                      `ΔT actual: ${currentDT || "N/D"} °F / ΔT diseño: ${designDT} °F`,
                      `Bombas con variador: ${yesNo(hasVFD)}`,
                      `Medición/tendencias: ${yesNo(hasTrends)}`,
                      `Condición principal: ${condition?.label.es ?? "N/D"}`,
                      `Consumo anual estimado: ${fmtNum(annualConsumption)} kWh`,
                      `Costo anual de operación: ${fmt(annualCost)}`,
                      `Alerta baja ΔT: ${lowDT ? "Sí" : "No"}`,
                    ].join("\n"),
                    monthlySavings: `${fmt(monthlyLow)} — ${fmt(monthlyHigh)}`,
                    annualSavings: `${fmt(savingsLow)} — ${fmt(savingsHigh)}`,
                    roi: inv > 0 ? `${roiLow.toFixed(0)} a ${roiHigh.toFixed(0)} meses` : "No especificado",
                    investment: inv > 0 ? fmt(inv) : "No especificado",
                  }}
                  onComplete={() => setLeadCaptured(true)}
                />
              ) : (
                <div className="bg-accent/10 border border-accent/30 p-6 rounded-sm text-center">
                  <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                  <h4 className="font-heading font-bold text-lg mb-2">{c.received}</h4>
                  <p className="text-sm text-muted-foreground">{t.receivedBody}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary/50 border border-border p-8 rounded-sm text-center space-y-4">
              <Thermometer className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">{t.emptyState}</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        {t.disclaimer}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PÁGINA PRINCIPAL DE CALCULADORAS
   ═══════════════════════════════════════════════════ */
export default function Calculadora() {
  const lang = useLang();
  const href = useHref();
  const t = T[lang];

  return (
    <Layout>
      <Seo page="calculator" title={t.metaTitle} description={t.metaDescription} />

      {/* Hero */}
      <section className="relative bg-ink-gradient text-primary-foreground py-20 overflow-hidden">
        <TechBackdrop />
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-accent font-bold tracking-widest uppercase text-sm">{t.heroBadge}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              {t.heroTitle}
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-2xl">
              {t.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Calculators */}
      <section className="py-12 container mx-auto px-4">
        <Tabs defaultValue="automatizacion" className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto gap-2 bg-secondary/50 p-2 rounded-sm">
            <TabsTrigger value="automatizacion" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold uppercase tracking-wide text-xs py-3 rounded-sm">
              <Zap className="w-4 h-4 mr-2" /> {t.tabs.automation}
            </TabsTrigger>
            <TabsTrigger value="almacenamiento" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold uppercase tracking-wide text-xs py-3 rounded-sm">
              <Snowflake className="w-4 h-4 mr-2" /> {t.tabs.storage}
            </TabsTrigger>
            <TabsTrigger value="planta" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold uppercase tracking-wide text-xs py-3 rounded-sm">
              <Thermometer className="w-4 h-4 mr-2" /> {t.tabs.plant}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automatizacion">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{t.sections.automation.title}</h2>
              <p className="text-muted-foreground">{t.sections.automation.body}</p>
            </div>
            <CalcAutomatizacion />
          </TabsContent>

          <TabsContent value="almacenamiento">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{t.sections.storage.title}</h2>
              <p className="text-muted-foreground">{t.sections.storage.body}</p>
            </div>
            <CalcAlmacenamiento />
          </TabsContent>

          <TabsContent value="planta">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">{t.sections.plant.title}</h2>
              <p className="text-muted-foreground">{t.sections.plant.body}</p>
            </div>
            <CalcPlanta />
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary/50 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">{t.cta.title}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            {t.cta.body}
          </p>
          <Button asChild size="lg" className="bg-accent text-accent-foreground font-bold uppercase tracking-wide h-14 px-8 hover:bg-accent/90">
            <Link href={href("contact")}>
              {t.cta.button} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
