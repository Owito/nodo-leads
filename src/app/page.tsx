"use client";

import Link from "next/link";
import { useState } from "react";
import type { FlujoPaso } from "@/lib/types";

interface Respuesta {
  ok: boolean;
  mensaje?: string;
  error?: string;
  clasificacion?: { score: number; tipo: string; motivo: string; via: string };
  lead?: { id: string; nombre: string; tipo: string; score: number; motivo: string };
  flujo?: FlujoPaso[];
}

const TIPO_COLOR: Record<string, string> = {
  Caliente: "text-hot border-hot",
  Tibio: "text-lime border-lime",
  Frío: "text-violet border-violet",
};
const TIPO_EMOJI: Record<string, string> = { Caliente: "🔥", Tibio: "🌤️", Frío: "🧊" };
const ESTADO_ICON: Record<string, string> = { ok: "✓", simulado: "◌", error: "✕" };
const ESTADO_COLOR: Record<string, string> = {
  ok: "text-lime",
  simulado: "text-mute",
  error: "text-hot",
};

export default function Home() {
  const [form, setForm] = useState({ nombre: "", correo: "", empresa: "", mensaje: "" });
  const [cargando, setCargando] = useState(false);
  const [res, setRes] = useState<Respuesta | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setRes(null);
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await r.json()) as Respuesta;
      setRes(data);
      if (data.ok) setForm({ nombre: "", correo: "", empresa: "", mensaje: "" });
    } catch {
      setRes({ ok: false, error: "No se pudo conectar. Intenta de nuevo." });
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink bg-grid">
      {/* NAV */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-lime font-mono text-lg font-bold text-ink">
            ◉
          </span>
          <span className="font-mono text-sm font-bold tracking-[0.35em] text-white">NODO</span>
        </div>
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 rounded-md border border-edge px-3 py-1.5 text-sm text-mute transition hover:border-lime hover:text-lime"
        >
          <span className="dot-live inline-block h-2 w-2 rounded-full bg-lime" />
          Panel en vivo
        </Link>
      </nav>

      {/* HERO + FORM */}
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-5 pb-16 pt-8 md:grid-cols-2 md:gap-14 md:pt-16">
        <div>
          <span className="inline-block rounded-full border border-edge bg-panel px-3 py-1 font-mono text-xs text-lime">
            AUTOMATIZACIÓN IA · PYMES
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Tus leads,
            <br />
            <span className="text-lime">atendidos solos.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-mute">
            Un lead que no recibe respuesta en minutos, se enfría. NODO construye el sistema
            que trabaja <em className="text-white not-italic">después</em> de que alguien deja
            sus datos: los capta, los <span className="text-white">clasifica con IA</span>, te
            escribe y avisa a tu equipo — todo solo.
          </p>

          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            {["Clasifica con IA", "Correo automático", "Registra en BD", "Avisa al equipo"].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-lg border border-edge bg-panel/60 px-3 py-1.5 text-mute"
                >
                  {t}
                </span>
              ),
            )}
          </div>

          <p className="mt-8 max-w-md rounded-xl border border-edge bg-panel/40 p-4 text-sm text-mute">
            <span className="font-mono text-lime">↳ meta:</span> esta misma página{" "}
            <span className="text-white">es</span> la máquina funcionando. Llena el formulario y
            observa el flujo ejecutarse en vivo a la derecha, luego míralo caer en el{" "}
            <Link href="/dashboard" className="text-lime underline underline-offset-2">
              panel en tiempo real
            </Link>
            .
          </p>
        </div>

        {/* PANEL DERECHO: formulario o resultado del flujo */}
        <div className="md:sticky md:top-8">
          {!res?.ok ? (
            <form
              onSubmit={enviar}
              className="rounded-2xl border border-edge bg-panel p-6 shadow-brut sm:p-7"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Hablemos de tu negocio</h2>
                <span className="font-mono text-xs text-mute">30 seg</span>
              </div>

              <div className="space-y-4">
                <Campo
                  label="Nombre *"
                  value={form.nombre}
                  onChange={set("nombre")}
                  placeholder="Ana Ramírez"
                  required
                />
                <Campo
                  label="Correo *"
                  type="email"
                  value={form.correo}
                  onChange={set("correo")}
                  placeholder="ana@miempresa.com"
                  required
                />
                <Campo
                  label="Empresa"
                  value={form.empresa}
                  onChange={set("empresa")}
                  placeholder="Mi PYME S.A.S."
                />
                <div>
                  <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-mute">
                    ¿Qué te gustaría automatizar?
                  </label>
                  <textarea
                    value={form.mensaje}
                    onChange={set("mensaje")}
                    rows={3}
                    placeholder="Ej: recibimos 40 cotizaciones al día por WhatsApp y se nos enfrían…"
                    className="w-full resize-none rounded-lg border border-edge bg-panel2 px-3.5 py-2.5 text-sm text-white placeholder:text-mute/60 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime"
                  />
                </div>
              </div>

              {res && !res.ok && (
                <p className="mt-4 rounded-lg border border-hot/40 bg-hot/10 px-3 py-2 text-sm text-hot">
                  {res.error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-lime px-4 py-3 font-bold text-ink transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando ? (
                  <>
                    <Spinner /> Procesando el flujo…
                  </>
                ) : (
                  <>Activar la máquina →</>
                )}
              </button>
              <p className="mt-3 text-center font-mono text-[11px] text-mute">
                Sin spam. Tus datos alimentan el demo del flujo.
              </p>
            </form>
          ) : (
            <ResultadoFlujo res={res} onReset={() => setRes(null)} />
          )}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="border-t border-edge bg-panel/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            El flujo, paso a paso <span className="text-mute">— y de verdad se ejecuta</span>
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Captura", "El formulario dispara un webhook. Se normalizan y validan los datos al instante."],
              ["02", "Clasifica con IA", "Claude analiza el mensaje y asigna tipo (caliente/tibio/frío) y un score 0–100."],
              ["03", "Registra + escribe", "El lead se guarda en la base de datos y se le envía un correo de bienvenida personalizado."],
              ["04", "Avisa al equipo", "Notificación instantánea a Telegram para que nadie pierda una oportunidad."],
            ].map(([n, t, d]) => (
              <div
                key={n}
                className="rounded-xl border border-edge bg-panel p-5 transition hover:border-lime/50"
              >
                <div className="font-mono text-sm text-lime">{n}</div>
                <div className="mt-2 font-bold text-white">{t}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-mute">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-mute">
            ⏱ Ahorra 15–20 min de trabajo manual por lead y garantiza respuesta inmediata 24/7.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-mute">
        <div className="flex flex-col items-start justify-between gap-3 border-t border-edge pt-6 sm:flex-row sm:items-center">
          <span className="font-mono tracking-[0.35em] text-white">◉ NODO</span>
          <span>
            Proyecto 4 · The Vibecoders League 2.0 — la máquina de leads que trabaja sola.
          </span>
        </div>
      </footer>
    </main>
  );
}

function Campo(props: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-mute">
        {props.label}
      </label>
      <input
        type={props.type || "text"}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        required={props.required}
        className="w-full rounded-lg border border-edge bg-panel2 px-3.5 py-2.5 text-sm text-white placeholder:text-mute/60 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime"
      />
    </div>
  );
}

function ResultadoFlujo({ res, onReset }: { res: Respuesta; onReset: () => void }) {
  const tipo = res.lead?.tipo || "Tibio";
  return (
    <div className="animate-pop rounded-2xl border border-edge bg-panel p-6 shadow-brutlime sm:p-7">
      <div className="flex items-center gap-2 font-mono text-xs text-lime">
        <span className="dot-live inline-block h-2 w-2 rounded-full bg-lime" />
        FLUJO EJECUTADO
      </div>

      <h2 className="mt-3 text-2xl font-extrabold text-white">
        ¡Listo, {res.lead?.nombre?.split(" ")[0] || "gracias"}! 🎉
      </h2>
      <p className="mt-1.5 text-sm text-mute">{res.mensaje}</p>

      {/* Veredicto IA */}
      <div className={`mt-5 rounded-xl border bg-panel2 p-4 ${TIPO_COLOR[tipo] ?? "text-lime border-lime"}`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider opacity-80">
            Clasificación IA
          </span>
          <span className="font-mono text-xs opacity-70">
            vía {res.clasificacion?.via}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl">{TIPO_EMOJI[tipo]}</span>
          <span className="text-2xl font-extrabold">Lead {tipo}</span>
          <span className="ml-auto font-mono text-xl font-bold">{res.lead?.score}/100</span>
        </div>
        <p className="mt-1 text-sm text-mute">{res.lead?.motivo}</p>
      </div>

      {/* Traza de acciones */}
      <ul className="mt-5 space-y-2">
        {res.flujo?.map((p, i) => (
          <li
            key={p.paso}
            className="animate-slidein flex items-start gap-3 rounded-lg border border-edge bg-panel2/60 px-3.5 py-2.5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className={`mt-0.5 font-mono text-sm font-bold ${ESTADO_COLOR[p.estado]}`}>
              {ESTADO_ICON[p.estado]}
            </span>
            <div>
              <div className="text-sm font-semibold text-white">{p.paso}</div>
              <div className="font-mono text-xs text-mute">{p.detalle}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-semibold text-white transition hover:border-lime hover:text-lime"
        >
          Enviar otro
        </button>
        <Link
          href="/dashboard"
          className="flex-1 rounded-lg bg-lime px-4 py-2.5 text-center text-sm font-bold text-ink transition hover:brightness-105"
        >
          Ver en el panel →
        </Link>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
  );
}
