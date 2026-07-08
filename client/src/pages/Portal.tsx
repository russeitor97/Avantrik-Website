import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { Reveal } from "@/components/motion/Reveal";
import { getSession, saveSession, clearSession } from "@/lib/portal-auth";
import { Lock, LogOut, Receipt, ArrowRight, Loader2, LayoutGrid } from "lucide-react";

export default function Portal() {
  const [session, setSession] = useState(getSession());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo iniciar sesión");
      saveSession(data);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setSending(false);
    }
  }

  function onLogout() {
    clearSession();
    setSession(null);
    setEmail("");
    setPassword("");
  }

  return (
    <Layout>
      <Helmet>
        <title>Portal | Avantrik</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink-gradient py-24 text-primary-foreground">
        <TechBackdrop />

        <div className="container relative z-10 mx-auto px-4">
          {!session ? (
            /* ─────────────── LOGIN ─────────────── */
            <Reveal className="mx-auto w-full max-w-md">
              <div className="rounded-sm border border-accent/20 bg-primary/40 p-8 shadow-2xl backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-sm bg-accent text-accent-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                  <div>
                    <h1 className="font-heading text-2xl font-bold text-white">Portal Avantrik</h1>
                    <p className="text-sm text-primary-foreground/60">Acceso exclusivo del equipo</p>
                  </div>
                </div>

                <form onSubmit={onLogin} className="space-y-4">
                  {error && (
                    <div className="rounded-sm border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-red-300">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="pEmail" className="text-sm text-primary-foreground/80">Correo</Label>
                    <Input
                      id="pEmail"
                      type="email"
                      autoComplete="username"
                      placeholder="tu@avantrik.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pPass" className="text-sm text-primary-foreground/80">Contraseña</Label>
                    <Input
                      id="pPass"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={sending || !email || !password}
                    className="h-12 w-full rounded-sm bg-accent font-bold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
                  >
                    {sending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando…</>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </div>
            </Reveal>
          ) : (
            /* ─────────────── APPS ─────────────── */
            <div className="mx-auto w-full max-w-4xl">
              <Reveal>
                <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="h-px w-8 bg-accent" />
                      <span className="text-xs font-bold uppercase tracking-widest text-accent">
                        Portal interno
                      </span>
                    </div>
                    <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
                      Aplicaciones
                    </h1>
                    <p className="mt-1 text-sm text-primary-foreground/60">{session.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={onLogout}
                    className="rounded-sm border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </Button>
                </div>
              </Reveal>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Reveal delay={0.05}>
                  <Link href="/portal/compras" className="group block h-full">
                      <div className="flex h-full flex-col rounded-sm border border-accent/25 bg-primary/40 p-7 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/60">
                        <div className="mb-5 flex items-center justify-between">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-accent text-accent-foreground">
                            <Receipt className="h-6 w-6" />
                          </span>
                          <ArrowRight className="h-5 w-5 text-white/40 transition-all group-hover:translate-x-1 group-hover:text-accent" />
                        </div>
                        <h2 className="font-heading text-xl font-bold uppercase text-white">
                          Registro de Compras
                        </h2>
                        <p className="mt-2 flex-grow text-sm leading-relaxed text-primary-foreground/60">
                          Revisa los tickets que sube el equipo, captura los datos y copia el CSV directo a la hoja de Compras.
                        </p>
                      </div>
                  </Link>
                </Reveal>

                <Reveal delay={0.12}>
                  <div className="flex h-full flex-col rounded-sm border border-dashed border-white/20 bg-primary/20 p-7">
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-white/20 text-white/50">
                      <LayoutGrid className="h-6 w-6" />
                    </span>
                    <h2 className="font-heading text-xl font-bold uppercase text-white/50">
                      Próximamente
                    </h2>
                    <p className="mt-2 flex-grow text-sm leading-relaxed text-primary-foreground/40">
                      Aquí irán apareciendo las siguientes herramientas internas de Avantrik.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
