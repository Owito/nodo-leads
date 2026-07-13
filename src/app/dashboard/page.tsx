"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Lead } from "@/lib/types";

interface Data {
  ok: boolean;
  modo?: "neon" | "memoria";
  leads: Lead[];
}

const TIPO_COLOR: Record<string, string> = {
  Caliente: "text-hot border-hot/50 bg-hot/10",
  Tibio: "text-lime border-lime/50 bg-lime/10",
  Frío: "text-violet border-violet/50 bg-violet/10",
};
const TIPO_EMOJI: Record<string, string> = { Caliente: "🔥", Tibio: "🌤️", Frío: "🧊" };

export default function Dashboard() {
  const [data, setData] = useState<Data>({ ok: true, leads: [] });
  const [conectado, setConectado] = useState(false);
  const prevIds = useRef<Set<string>>(new Set());
  const [nuevos, setNuevos] = useState<Set<string>>(new Set());

  useEffect(() => {
    let vivo = true;
    async function cargar() {
      try {
        const r = await fetch("/api/leads", { cache: "no-store" });
        const d = (await r.json()) as Data;
        if (!vivo) return;
        setConectado(true);
        const entrantes = new Set<string>();
        for (const l of d.leads) if (!prevIds.current.has(l.id)) entrantes.add(l.id);
        if (prevIds.current.size > 0 && entrantes.size > 0) {
          setNuevos(entrantes);
          setTimeout(() => vivo && setNuevos(new Set()), 2500);
        }
        prevIds.current = new Set(d.leads.map((l) => l.id));
        setData(d);
      } catch {
        if (vivo) setConectado(false);
      }
    }
    cargar();
    const t = setInterval(cargar, 3000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  const leads = data.leads;
  const total = leads.length;
  const calientes = leads.filter((l) => l.tipo === "Caliente").length;
  const tibios = leads.filter((l) => l.tipo === "Tibio").length;
  const promedio = total ? Math.round(leads.reduce((a, l) => a + l.score, 0) / total) : 0;

  return (
    <main className="min-h-screen bg-ink bg-grid">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-lime font-mono text-lg font-bold text-ink">
            ◉
          </span>
          <span className="font-mono text-sm font-bold tracking-[0.35em] text-white">NODO</span>
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs ${
              conectado ? "border-lime/40 text-lime" : "border-hot/40 text-hot"
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                conectado ? "dot-live bg-lime" : "bg-hot"
              }`}
            />
            {conectado ? "EN VIVO" : "reconectando…"}
          </span>
          <Link
            href="/"
            className="rounded-md border border-edge px-3 py-1.5 text-sm text-mute transition hover:border-lime hover:text-lime"
          >
            + Nuevo lead
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Panel de leads</h1>
          <span className="font-mono text-xs text-mute">
            fuente: {data.modo === "neon" ? "Neon Postgres" : "memoria (demo)"} · refresca cada 3s
          </span>
        </div>

        {/* MÉTRICAS */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metrica etiqueta="Total leads" valor={total} />
          <Metrica etiqueta="🔥 Calientes" valor={calientes} acento="text-hot" />
          <Metrica etiqueta="🌤️ Tibios" valor={tibios} acento="text-lime" />
          <Metrica etiqueta="Score prom." valor={`${promedio}`} sufijo="/100" />
        </div>

        {/* LISTA */}
        <div className="mt-8">
          {total === 0 ? (
            <div className="rounded-2xl border border-dashed border-edge bg-panel/40 p-12 text-center">
              <div className="text-4xl">📭</div>
              <p className="mt-3 text-mute">
                Aún no hay leads. Ve a la{" "}
                <Link href="/" className="text-lime underline underline-offset-2">
                  landing
                </Link>{" "}
                y activa la máquina — aparecerá aquí en segundos.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-edge">
              <div className="hidden grid-cols-[1fr_auto_auto] gap-4 bg-panel2 px-5 py-3 font-mono text-xs uppercase tracking-wider text-mute sm:grid">
                <span>Lead</span>
                <span>Clasificación</span>
                <span className="text-right">Cuándo</span>
              </div>
              <ul>
                {leads.map((l) => (
                  <li
                    key={l.id}
                    className={`grid grid-cols-1 gap-3 border-t border-edge px-5 py-4 transition sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4 ${
                      nuevos.has(l.id) ? "animate-pop bg-lime/5" : "bg-panel/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-white">{l.nombre}</span>
                        {l.empresa && (
                          <span className="truncate font-mono text-xs text-mute">· {l.empresa}</span>
                        )}
                      </div>
                      <div className="truncate text-sm text-mute">{l.correo}</div>
                      {l.mensaje && (
                        <div className="mt-0.5 truncate text-xs text-mute/70">“{l.mensaje}”</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                          TIPO_COLOR[l.tipo] ?? "text-mute border-edge"
                        }`}
                      >
                        {TIPO_EMOJI[l.tipo]} {l.tipo}
                      </span>
                      <span className="font-mono text-sm font-bold text-white">{l.score}</span>
                    </div>

                    <div className="text-left font-mono text-xs text-mute sm:text-right">
                      {tiempoRelativo(l.fecha)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Metrica({
  etiqueta,
  valor,
  sufijo,
  acento,
}: {
  etiqueta: string;
  valor: number | string;
  sufijo?: string;
  acento?: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-panel p-4">
      <div className="font-mono text-xs text-mute">{etiqueta}</div>
      <div className={`mt-1 text-3xl font-extrabold ${acento ?? "text-white"}`}>
        {valor}
        {sufijo && <span className="text-base text-mute">{sufijo}</span>}
      </div>
    </div>
  );
}

function tiempoRelativo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return new Date(iso).toLocaleDateString("es-CO");
}
