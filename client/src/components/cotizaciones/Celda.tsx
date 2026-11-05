import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { dinero, type Moneda } from "@/lib/cotizaciones";

/**
 * Celda tipo hoja de cálculo: se ve como texto, se edita al enfocarla y se
 * confirma al salir (blur) o con Enter. Escape descarta el cambio.
 */
export function Celda({
  valor, onCambio, tipo = "texto", moneda = "MXN", placeholder, list, className, multilinea, atenuado, ariaLabel, soloLectura, dataId,
}: {
  valor: string | number;
  onCambio?: (v: string) => void;
  tipo?: "texto" | "numero" | "dinero" | "fecha";
  moneda?: Moneda;
  placeholder?: string;
  list?: string;
  className?: string;
  multilinea?: boolean;
  atenuado?: boolean;
  ariaLabel?: string;
  soloLectura?: boolean;
  dataId?: string;
}) {
  const [foco, setFoco] = useState(false);
  const [borrador, setBorrador] = useState("");
  const crudo = typeof valor === "number" ? (valor ? String(valor) : "") : valor;
  const mostrado =
    tipo === "dinero" && typeof valor === "number" && valor
      ? dinero(valor, moneda)
      : tipo === "numero" && typeof valor === "number" && valor
        ? valor.toLocaleString("es-MX", { maximumFractionDigits: 4 })
        : crudo;

  const base = cn(
    "w-full rounded-sm bg-transparent px-1.5 py-1 text-sm outline-none transition-colors",
    soloLectura ? "cursor-default" : "hover:bg-secondary/70 focus:bg-background focus:ring-2 focus:ring-accent",
    (tipo === "numero" || tipo === "dinero") && "text-right tabular-nums",
    atenuado && "italic text-muted-foreground",
    className,
  );

  if (tipo === "fecha") {
    return (
      <input
        type="date"
        value={crudo}
        readOnly={soloLectura}
        aria-label={ariaLabel || placeholder}
        onChange={(e) => onCambio?.(e.target.value)}
        className={base}
      />
    );
  }

  const props = {
    value: foco ? borrador : mostrado,
    placeholder,
    readOnly: soloLectura,
    "data-celda": dataId,
    "aria-label": ariaLabel || placeholder,
    onFocus: () => {
      if (soloLectura) return;
      setBorrador(crudo);
      setFoco(true);
    },
    onBlur: () => {
      if (!foco) return;
      setFoco(false);
      if (borrador !== crudo) onCambio?.(borrador);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setBorrador(e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !(multilinea && e.shiftKey)) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      } else if (e.key === "Escape") {
        setBorrador(crudo);
        setTimeout(() => (e.target as HTMLElement).blur());
      }
    },
  };
  if (multilinea) return <AreaAutoAlto {...props} className={cn(base, "block resize-none leading-snug")} />;
  return <input {...props} list={list} inputMode={tipo === "texto" ? undefined : "decimal"} className={base} />;
}

/** Textarea que crece en alto con su texto (field-sizing también ensancharía la columna). */
export function AreaAutoAlto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { "data-celda"?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} />;
}

export function SelectNativo({
  value, onChange, children, className, ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  // <select> nativo a propósito: el Select de Radix se resetea cuando la opción aparece después.
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn("h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent", className)}
    >
      {children}
    </select>
  );
}
