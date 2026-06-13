import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Calculator, TrendingDown, Zap, Thermometer, Snowflake, ArrowRight, CheckCircle, Building2, Factory, Hotel, Briefcase, HelpCircle, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";

// ── EmailJS config (mismas credenciales/template que ContactForm) ──
const EMAILJS_SERVICE_ID = "service_wjgwyix";
const EMAILJS_TEMPLATE_ID = "template_mwz95cv";
const EMAILJS_PUBLIC_KEY = "UL19pglSyFo2jCc8s";
// ───────────────────────────────────────────────────────────────────

/* ─── Helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

const fmtNum = (n: number) =>
  n.toLocaleString("es-MX", { maximumFractionDigits: 0 });

/* ─── Supuestos técnicos ─── */
const CONTROL_LEVELS = [
  { value: "manual", label: "Manual / sin control automático", low: 0.15, high: 0.25, msg: "Alto potencial de ahorro mediante horarios, arranques escalonados, variadores y control centralizado." },
  { value: "parcial", label: "Control parcial o por horarios básicos", low: 0.08, high: 0.18, msg: "Existe oportunidad de optimizar horarios, secuencias, ajustes de temperatura y monitoreo." },
  { value: "automatico", label: "Sistema automático existente sin optimización", low: 0.05, high: 0.12, msg: "El ahorro puede venir de revisar tendencias, alarmas, secuencias y ajustes operativos." },
  { value: "optimizado", label: "Sistema bien controlado", low: 0.03, high: 0.08, msg: "El potencial principal está en ajustes finos, medición y verificación continua." },
];

const BUILDING_TYPES = [
  { value: "industrial", label: "Planta industrial", icon: Factory, low: 0.25, high: 0.45, suggested: 0.35 },
  { value: "plaza", label: "Plaza comercial", icon: Building2, low: 0.35, high: 0.55, suggested: 0.45 },
  { value: "hotel", label: "Hotel", icon: Hotel, low: 0.30, high: 0.50, suggested: 0.40 },
  { value: "oficinas", label: "Oficinas", icon: Briefcase, low: 0.30, high: 0.45, suggested: 0.38 },
  { value: "otro", label: "Otro", icon: Building2, low: 0.25, high: 0.40, suggested: 0.33 },
];

const SYSTEM_CONDITIONS = [
  { value: "eficiente", label: "Eficiente", kwPerTon: 0.75 },
  { value: "promedio", label: "Promedio (no conozco el dato)", kwPerTon: 1.0 },
  { value: "ineficiente", label: "Ineficiente / con oportunidad de mejora", kwPerTon: 1.3 },
];

const PLANT_CONDITIONS = [
  { value: "sin_secuencia", label: "Sin secuencia clara de chillers", low: 0.05, high: 0.15 },
  { value: "bombas", label: "Bombas sin variador de velocidad", low: 0.10, high: 0.25 },
  { value: "baja_dt", label: "Baja diferencia de temperatura en agua helada", low: 0.08, high: 0.20 },
  { value: "ajustes", label: "Ajustes de temperatura y horarios no optimizados", low: 0.03, high: 0.10 },
  { value: "no_sabe", label: "No conozco la condición", low: 0.05, high: 0.12 },
];

/* ─── Lead capture schema ─── */
const leadSchema = z.object({
  nombre: z.string().min(2, "Ingresa tu nombre"),
  empresa: z.string().min(2, "Ingresa el nombre de tu empresa"),
  correo: z.string().email("Correo electrónico inválido"),
  telefono: z.string().min(10, "Ingresa un teléfono válido"),
  ciudad: z.string().min(2, "Ingresa tu ciudad"),
});

/* ─── Lead capture form component ─── */
function LeadForm({ calculadora, resultados, onComplete }: {
  calculadora: string;
  resultados: { ahorroMensualBajo: number; ahorroMensualAlto: number };
  onComplete: () => void;
}) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: { nombre: "", empresa: "", correo: "", telefono: "", ciudad: "" },
  });

  async function onSubmit(values: z.infer<typeof leadSchema>) {
    setSending(true);

    // El ahorro viene del prop `resultados` (rango bajo–alto), no del formulario.
    const ahorroMensual = `${fmt(resultados.ahorroMensualBajo)} – ${fmt(resultados.ahorroMensualAlto)}`;
    const ahorroAnual = `${fmt(resultados.ahorroMensualBajo * 12)} – ${fmt(resultados.ahorroMensualAlto * 12)}`;

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
          calculadora,
          ahorroMensual,
          ahorroAnual,
          reply_to: values.correo,
        },
        EMAILJS_PUBLIC_KEY,
      );

      toast({
        title: "¡Listo!",
        description: "En breve un ingeniero de Avantrik te contactará con tu diagnóstico personalizado.",
      });
      onComplete();
    } catch (error) {
      console.error("EmailJS error:", error);
      toast({
        title: "Error al enviar",
        description:
          "Hubo un problema al enviar tus datos. Intenta de nuevo o escríbenos a info@avantrik.com",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-primary text-primary-foreground p-8 rounded-sm shadow-lg">
      <h3 className="font-heading font-bold text-2xl mb-2">Ver resultados completos</h3>
      <p className="text-primary-foreground/70 text-sm mb-6">
        Ingresa tus datos para recibir tu estimación detallada y que un ingeniero te contacte.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">Nombre</FormLabel>
                <FormControl><Input placeholder="Tu nombre" {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="empresa" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">Empresa</FormLabel>
                <FormControl><Input placeholder="Nombre de tu empresa" {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="correo" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">Correo</FormLabel>
                <FormControl><Input placeholder="correo@empresa.com" {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="telefono" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary-foreground/80 text-sm">Teléfono</FormLabel>
                <FormControl><Input placeholder="+52 000-000-0000" {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="ciudad" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary-foreground/80 text-sm">Ciudad</FormLabel>
              <FormControl><Input placeholder="Ej. Querétaro, Monterrey, CDMX..." {...field} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" disabled={sending} className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90">
            <Send className="w-4 h-4 mr-2" /> {sending ? "Enviando..." : "Ver mi estimación y solicitar diagnóstico"}
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
              <Calculator className="w-5 h-5 text-accent" /> Datos de tu instalación
            </h3>

            {/* Tipo de inmueble */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de inmueble</Label>
              <Select value={buildingType} onValueChange={handleBuildingChange}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona el tipo" /></SelectTrigger>
                <SelectContent>
                  {BUILDING_TYPES.map(b => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gasto mensual */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gasto mensual de energía eléctrica (MXN)</Label>
              <Input
                type="text"
                placeholder="Ej. 800,000"
                value={monthlyCost}
                onChange={e => setMonthlyCost(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Monto total de tu recibo de luz mensual.</p>
            </div>

            {/* % HVAC */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">% del gasto asociado al aire acondicionado</Label>
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
                  Rango típico para {building.label.toLowerCase()}: {Math.round(building.low * 100)}% a {Math.round(building.high * 100)}%.
                  Valor sugerido: {Math.round(building.suggested * 100)}%.
                </p>
              )}
            </div>

            {/* Horas y días */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Horas de operación al día</Label>
                <Input type="number" placeholder="Ej. 14" value={hoursDay} onChange={e => setHoursDay(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Días de operación por semana</Label>
                <Input type="number" placeholder="Ej. 6" value={daysWeek} onChange={e => setDaysWeek(e.target.value)} className="bg-background" />
              </div>
            </div>

            {/* Nivel de control */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Cómo se controla hoy tu aire acondicionado?</Label>
              <Select value={controlLevel} onValueChange={setControlLevel}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona el nivel de control" /></SelectTrigger>
                <SelectContent>
                  {CONTROL_LEVELS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variadores */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">¿Cuenta con variadores de velocidad en ventiladores o bombas?</Label>
              <Select value={hasVFD} onValueChange={setHasVFD}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="si">Sí, en la mayoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inversión */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Inversión estimada para implementación (MXN, opcional)</Label>
              <Input
                type="text"
                placeholder="Ej. 1,200,000"
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
              <TrendingDown className="w-5 h-5 mr-2" /> Calcular ahorro estimado
            </Button>
          </div>
        </div>

        {/* Results sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {showResults ? (
            <>
              {/* Preview results (always shown) */}
              <div className="bg-secondary border border-border p-6 rounded-sm shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-primary">Estimación preliminar</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Gasto mensual en climatización</span>
                    <span className="font-bold text-foreground">{fmt(hvacCost)}</span>
                  </div>

                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Ahorro mensual estimado</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(savingsLow)} — {fmt(savingsHigh)}</p>
                  </div>

                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Ahorro anual estimado</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(annualLow)} — {fmt(annualHigh)}</p>
                  </div>

                  {inv > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Retorno simple estimado</span>
                      <span className="font-bold text-foreground">{roiLow.toFixed(0)} a {roiHigh.toFixed(0)} meses</span>
                    </div>
                  )}
                </div>

                {control && (
                  <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                    <div className="flex gap-2">
                      <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{control.msg}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Lead capture */}
              {!leadCaptured ? (
                <LeadForm
                  calculadora="Ahorro por automatización del aire acondicionado"
                  resultados={{ ahorroMensualBajo: savingsLow, ahorroMensualAlto: savingsHigh }}
                  onComplete={() => setLeadCaptured(true)}
                />
              ) : (
                <div className="bg-accent/10 border border-accent/30 p-6 rounded-sm text-center">
                  <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                  <h4 className="font-heading font-bold text-lg mb-2">¡Datos recibidos!</h4>
                  <p className="text-sm text-muted-foreground">Un ingeniero de Avantrik te contactará pronto para agendar tu diagnóstico HVAC personalizado.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary/50 border border-border p-8 rounded-sm text-center space-y-4">
              <Calculator className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Completa los datos de tu instalación para ver tu estimación de ahorro.</p>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        Los resultados son estimaciones preliminares basadas en supuestos generales de operación. El ahorro real debe validarse mediante diagnóstico energético, revisión de recibos eléctricos, mediciones en sitio y análisis operativo del sistema HVAC.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CALCULADORA 2 — Almacenamiento Térmico (TES)
   ═══════════════════════════════════════════════════ */
function CalcAlmacenamiento() {
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

  const shiftedTons = capacity * shift;
  const storageCapacity = shiftedTons * hours;
  const demandReduction = shiftedTons * kwPerTon;
  const demandSavings = demandReduction * charge;
  const totalSavingsLow = demandSavings * 1.02;
  const totalSavingsHigh = demandSavings * 1.05;
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
              <Snowflake className="w-5 h-5 text-accent" /> Datos de tu sistema de enfriamiento
            </h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Gasto mensual total de energía eléctrica (MXN)</Label>
              <Input type="text" placeholder="Ej. 1,200,000" value={monthlyCost} onChange={e => setMonthlyCost(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Demanda máxima registrada (kW)</Label>
              <Input type="text" placeholder="Ej. 1,200" value={peakDemand} onChange={e => setPeakDemand(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">Puedes encontrar este dato en tu recibo eléctrico de CFE.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Cargo aproximado por demanda (MXN/kW-mes)</Label>
              <Input type="text" placeholder="Ej. 500" value={demandCharge} onChange={e => setDemandCharge(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Capacidad instalada de enfriamiento (toneladas de refrigeración)</Label>
              <Input type="text" placeholder="Ej. 800" value={coolingCapacity} onChange={e => setCoolingCapacity(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">1 TR = tonelada de refrigeración ≈ 3.517 kW térmicos.</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">% de carga que se busca mover a otro horario</Label>
                <span className="text-accent font-bold text-lg">{shiftPercent[0]}%</span>
              </div>
              <Slider value={shiftPercent} onValueChange={setShiftPercent} min={20} max={60} step={5} className="py-2" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Horas de enfriamiento a cubrir con almacenamiento</Label>
              <Input type="number" placeholder="Ej. 6" value={dischargeHours} onChange={e => setDischargeHours(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Condición del sistema de enfriamiento actual</Label>
              <Select value={systemCondition} onValueChange={setSystemCondition}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SYSTEM_CONDITIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Inversión estimada para implementación (MXN, opcional)</Label>
              <Input type="text" placeholder="Ej. 9,500,000" value={investment} onChange={e => setInvestment(e.target.value)} className="bg-background" />
            </div>

            <Button onClick={calculate} disabled={!canCalculate} className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90 h-12 text-base">
              <TrendingDown className="w-5 h-5 mr-2" /> Calcular reducción de demanda
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {showResults ? (
            <>
              <div className="bg-secondary border border-border p-6 rounded-sm shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-primary">Estimación preliminar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Carga de enfriamiento desplazada</span>
                    <span className="font-bold">{fmtNum(shiftedTons)} TR</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Capacidad de almacenamiento</span>
                    <span className="font-bold">{fmtNum(storageCapacity)} ton-hr</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Reducción estimada de demanda</span>
                    <span className="font-bold">{fmtNum(demandReduction)} kW</span>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Ahorro mensual estimado</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(totalSavingsLow)} — {fmt(totalSavingsHigh)}</p>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Ahorro anual estimado</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(annualLow)} — {fmt(annualHigh)}</p>
                  </div>
                  {inv > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Retorno simple estimado</span>
                      <span className="font-bold">{roiLow.toFixed(0)} a {roiHigh.toFixed(0)} meses</span>
                    </div>
                  )}
                </div>
                <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                  <p className="text-sm text-muted-foreground">Almacenamiento parcial recomendado. Permite reducir la demanda pico sin reemplazar los chillers existentes.</p>
                </div>
              </div>
              {!leadCaptured ? (
                <LeadForm calculadora="Reducción de demanda con almacenamiento térmico" resultados={{ ahorroMensualBajo: totalSavingsLow, ahorroMensualAlto: totalSavingsHigh }} onComplete={() => setLeadCaptured(true)} />
              ) : (
                <div className="bg-accent/10 border border-accent/30 p-6 rounded-sm text-center">
                  <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                  <h4 className="font-heading font-bold text-lg mb-2">¡Datos recibidos!</h4>
                  <p className="text-sm text-muted-foreground">Un ingeniero te contactará para evaluar tu proyecto TES.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary/50 border border-border p-8 rounded-sm text-center space-y-4">
              <Snowflake className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Completa los datos para estimar la reducción de demanda con almacenamiento térmico.</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        El almacenamiento térmico debe validarse con perfil horario de carga, recibos eléctricos, horarios tarifarios, operación real de chillers, espacio disponible, hidráulica y costo de implementación. Este resultado solo sirve como pre-diagnóstico comercial.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CALCULADORA 3 — Optimización Planta Agua Helada
   ═══════════════════════════════════════════════════ */
function CalcPlanta() {
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
              <Thermometer className="w-5 h-5 text-accent" /> Datos de tu planta de agua helada
            </h3>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Capacidad promedio de enfriamiento en operación (TR)</Label>
              <Input type="text" placeholder="Ej. 600" value={operatingTons} onChange={e => setOperatingTons(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">Toneladas promedio de operación, no la capacidad instalada.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Horas de operación al año</Label>
              <Input type="number" placeholder="Ej. 4000" value={hoursYear} onChange={e => setHoursYear(e.target.value)} className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Consumo actual estimado del sistema (kW por tonelada)</Label>
              <Input type="text" placeholder="Ej. 1.10" value={kwPerTon} onChange={e => setKwPerTon(e.target.value)} className="bg-background" />
              <p className="text-xs text-muted-foreground">Si no conoces este dato, usa 1.10 como referencia.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Costo promedio de energía (MXN/kWh)</Label>
              <Input type="text" placeholder="Ej. 2.20" value={energyCost} onChange={e => setEnergyCost(e.target.value)} className="bg-background" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">ΔT actual del agua helada (°F)</Label>
                <Input type="text" placeholder="Ej. 6" value={currentDT} onChange={e => setCurrentDT(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">ΔT de diseño (°F)</Label>
                <Input type="text" placeholder="Ej. 10" value={designDT} onChange={e => setDesignDT(e.target.value)} className="bg-background" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">¿Las bombas tienen variador?</Label>
                <Select value={hasVFD} onValueChange={setHasVFD}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="si">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">¿Hay medición o tendencias?</Label>
                <Select value={hasTrends} onValueChange={setHasTrends}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="si">Sí, completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Condición principal observada</Label>
              <Select value={mainCondition} onValueChange={setMainCondition}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Selecciona la condición" /></SelectTrigger>
                <SelectContent>
                  {PLANT_CONDITIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Inversión estimada para implementación (MXN, opcional)</Label>
              <Input type="text" placeholder="Ej. 1,800,000" value={investment} onChange={e => setInvestment(e.target.value)} className="bg-background" />
            </div>

            <Button onClick={calculate} disabled={!canCalculate} className="w-full bg-accent text-accent-foreground font-bold uppercase tracking-wide hover:bg-accent/90 h-12 text-base">
              <TrendingDown className="w-5 h-5 mr-2" /> Calcular ahorro estimado
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {showResults ? (
            <>
              <div className="bg-secondary border border-border p-6 rounded-sm shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-lg text-primary">Estimación preliminar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Consumo anual estimado</span>
                    <span className="font-bold">{fmtNum(annualConsumption)} kWh</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Costo anual de operación</span>
                    <span className="font-bold">{fmt(annualCost)}</span>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Ahorro mensual estimado</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(monthlyLow)} — {fmt(monthlyHigh)}</p>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-sm">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">Ahorro anual estimado</p>
                    <p className="text-2xl font-heading font-bold text-accent">{fmt(savingsLow)} — {fmt(savingsHigh)}</p>
                  </div>
                  {inv > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Retorno simple estimado</span>
                      <span className="font-bold">{roiLow.toFixed(0)} a {roiHigh.toFixed(0)} meses</span>
                    </div>
                  )}
                </div>
                {lowDT && (
                  <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-sm">
                    <p className="text-sm font-medium text-destructive">⚠ Posible baja diferencia de temperatura: el sistema mueve más agua de la necesaria.</p>
                  </div>
                )}
                <div className="bg-primary/5 p-4 rounded-sm border border-primary/10">
                  <p className="text-sm text-muted-foreground">Recomendación: realizar retro-commissioning y validación de setpoints, tendencias y alarmas.</p>
                </div>
              </div>
              {!leadCaptured ? (
                <LeadForm calculadora="Optimización de planta de agua helada" resultados={{ ahorroMensualBajo: monthlyLow, ahorroMensualAlto: monthlyHigh }} onComplete={() => setLeadCaptured(true)} />
              ) : (
                <div className="bg-accent/10 border border-accent/30 p-6 rounded-sm text-center">
                  <CheckCircle className="w-10 h-10 text-accent mx-auto mb-3" />
                  <h4 className="font-heading font-bold text-lg mb-2">¡Datos recibidos!</h4>
                  <p className="text-sm text-muted-foreground">Un ingeniero te contactará para agendar tu revisión de planta.</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-secondary/50 border border-border p-8 rounded-sm text-center space-y-4">
              <Thermometer className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Completa los datos de tu planta para estimar el potencial de optimización.</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        Este cálculo no sustituye un estudio de ingeniería. Para confirmar ahorros se requiere revisar tendencias, temperaturas de suministro y retorno, flujo, operación de bombas, secuencia de chillers, recibos eléctricos y condiciones reales de carga.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PÁGINA PRINCIPAL DE CALCULADORAS
   ═══════════════════════════════════════════════════ */
export default function Calculadora() {
  return (
    <Layout>
      <Helmet>
        <title>Calculadora de Ahorro Energético HVAC | Avantrik México</title>
        <meta name="description" content="Calcula cuánto puedes ahorrar en energía eléctrica con automatización de aire acondicionado, almacenamiento térmico y optimización de planta de agua helada." />
        <link rel="canonical" href="https://www.avantrik.com/calculadora-ahorro" />
      </Helmet>

      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-accent font-bold tracking-widest uppercase text-sm">Herramienta gratuita</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              Calculadora de Ahorro Energético HVAC
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-2xl">
              Estima cuánto puede ahorrar tu empresa en energía eléctrica. Selecciona una calculadora, ingresa los datos de tu instalación y obtén un estimado preliminar en menos de 2 minutos.
            </p>
          </div>
        </div>
      </section>

      {/* Calculators */}
      <section className="py-12 container mx-auto px-4">
        <Tabs defaultValue="automatizacion" className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto gap-2 bg-secondary/50 p-2 rounded-sm">
            <TabsTrigger value="automatizacion" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold uppercase tracking-wide text-xs py-3 rounded-sm">
              <Zap className="w-4 h-4 mr-2" /> Automatización A/C
            </TabsTrigger>
            <TabsTrigger value="almacenamiento" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold uppercase tracking-wide text-xs py-3 rounded-sm">
              <Snowflake className="w-4 h-4 mr-2" /> Almacenamiento Térmico
            </TabsTrigger>
            <TabsTrigger value="planta" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold uppercase tracking-wide text-xs py-3 rounded-sm">
              <Thermometer className="w-4 h-4 mr-2" /> Planta de Agua Helada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automatizacion">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Ahorro por Automatización del Aire Acondicionado</h2>
              <p className="text-muted-foreground">Estima ahorros por horarios inteligentes, control automático, arranques escalonados, variadores de velocidad y mejores ajustes de operación.</p>
            </div>
            <CalcAutomatizacion />
          </TabsContent>

          <TabsContent value="almacenamiento">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Reducción de Demanda con Almacenamiento Térmico</h2>
              <p className="text-muted-foreground">Estima cuánto enfriamiento podrías mover a otro horario y cuánto podrías reducir tu demanda eléctrica pico.</p>
            </div>
            <CalcAlmacenamiento />
          </TabsContent>

          <TabsContent value="planta">
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Optimización de Planta de Agua Helada</h2>
              <p className="text-muted-foreground">Estima el ahorro por mejorar operación de chillers, bombas, temperaturas, horarios y secuencias de control.</p>
            </div>
            <CalcPlanta />
          </TabsContent>
        </Tabs>
      </section>

      {/* CTA */}
      <section className="py-16 bg-secondary/50 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">¿Quieres un diagnóstico real?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Las calculadoras dan estimados preliminares. Para confirmar tus ahorros, nuestros ingenieros realizan mediciones en sitio, revisan recibos y analizan la operación real de tu sistema.
          </p>
          <a href="/contact">
            <Button size="lg" className="bg-accent text-accent-foreground font-bold uppercase tracking-wide h-14 px-8 hover:bg-accent/90">
              Solicitar diagnóstico HVAC <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
}