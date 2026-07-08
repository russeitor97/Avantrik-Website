import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { Reveal } from "@/components/motion/Reveal";
import { Camera, CheckCircle, Loader2, Send } from "lucide-react";

/** Comprime la foto igual que la app original: máx 1280px, JPEG 0.72. */
function resizeImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let w = img.width;
        let h = img.height;
        if (w > maxDim && w >= h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return rej(new Error("Canvas no disponible"));
        ctx.drawImage(img, 0, 0, w, h);
        res(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => rej(new Error("No se pudo procesar la imagen"));
      img.src = String(e.target?.result || "");
    };
    reader.onerror = () => rej(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

type Stage = "form" | "procesando" | "preview" | "enviando" | "saved";

export default function SubirTicket() {
  const [nombre, setNombre] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setStage("procesando");
    try {
      const dataUrl = await resizeImage(file);
      setImgDataUrl(dataUrl);
      setStage("preview");
    } catch (err) {
      setError(`No se pudo procesar la foto (${err instanceof Error ? err.message : "error"}). Intenta de nuevo.`);
      setStage("form");
    }
  }

  async function onEnviar() {
    if (!nombre.trim() || !imgDataUrl) {
      setError("Falta tu nombre o la foto del ticket.");
      return;
    }
    setError("");
    setStage("enviando");
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responsable: nombre.trim(), proyecto: proyecto.trim(), imagen: imgDataUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Error del servidor");
      }
      setStage("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar. Revisa tu conexión.");
      setStage("preview");
    }
  }

  function otroTicket() {
    setImgDataUrl(null);
    setError("");
    setStage("form");
  }

  return (
    <Layout>
      <Helmet>
        <title>Subir ticket | Avantrik</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="relative flex min-h-[92vh] items-start overflow-hidden bg-ink-gradient py-28 text-primary-foreground md:items-center md:py-24">
        <TechBackdrop />

        <div className="container relative z-10 mx-auto px-4">
          <Reveal className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center">
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-accent" />
                <span className="text-xs font-bold uppercase tracking-widest text-accent">Avantrik</span>
                <span className="h-px w-8 bg-accent" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-white">Registro de Compras</h1>
              <p className="mt-2 text-sm text-primary-foreground/60">
                Sube la foto del ticket → Administración la procesa y confirma
              </p>
            </div>

            <div className="rounded-sm border border-accent/20 bg-primary/40 p-7 shadow-2xl backdrop-blur-sm">
              {stage === "saved" ? (
                <div className="py-6 text-center">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <CheckCircle className="h-7 w-7" />
                  </span>
                  <h2 className="font-heading text-xl font-bold text-white">Ticket recibido</h2>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-primary-foreground/60">
                    Ya quedó en la cola para que Administración lo revise y lo registre en Compras.
                  </p>
                  <Button
                    onClick={otroTicket}
                    className="mt-6 h-11 w-full rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
                  >
                    Subir otro ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {error && (
                    <div className="rounded-sm border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="tNombre" className="text-sm text-primary-foreground/80">Tu nombre</Label>
                    <Input
                      id="tNombre"
                      placeholder="Ej. Jorge Martínez"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tProyecto" className="text-sm text-primary-foreground/80"># de PO / Proyecto</Label>
                    <Input
                      id="tProyecto"
                      placeholder="Ej. PO-018"
                      value={proyecto}
                      onChange={(e) => setProyecto(e.target.value)}
                      className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                    />
                  </div>

                  {stage === "form" && (
                    <label className="block cursor-pointer rounded-sm border-2 border-dashed border-accent/50 bg-accent/5 px-4 py-8 text-center transition-colors hover:bg-accent/10">
                      <Camera className="mx-auto mb-2 h-8 w-8 text-accent" />
                      <span className="block font-heading font-bold text-white">Tomar foto del ticket</span>
                      <span className="mt-1 block text-xs text-primary-foreground/50">
                        o sube una imagen desde tu galería
                      </span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
                    </label>
                  )}

                  {stage === "procesando" && (
                    <div className="py-8 text-center">
                      <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-accent" />
                      <p className="text-sm text-primary-foreground/60">Preparando la foto…</p>
                    </div>
                  )}

                  {(stage === "preview" || stage === "enviando") && imgDataUrl && (
                    <>
                      <img
                        src={imgDataUrl}
                        alt="Vista previa del ticket"
                        className="max-h-52 w-full rounded-sm border border-white/15 bg-black/20 object-contain"
                      />
                      <Button
                        onClick={onEnviar}
                        disabled={stage === "enviando"}
                        className="h-12 w-full rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
                      >
                        {stage === "enviando" ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" /> Enviar ticket</>
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={otroTicket}
                        className="mx-auto block text-xs text-primary-foreground/50 underline underline-offset-2 hover:text-white"
                      >
                        Cambiar foto
                      </button>
                    </>
                  )}

                  {stage === "form" && (
                    <p className="text-center text-xs leading-relaxed text-primary-foreground/40">
                      No necesitas cuenta. Solo sube la foto — Administración se encarga de registrarla.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
