import type { Lead } from "./types";

/**
 * Almacenamiento de leads con degradación elegante:
 *  - Si hay DATABASE_URL -> Neon (Postgres serverless), datos reales persistentes.
 *  - Si no -> memoria del proceso (suficiente para el demo en vivo).
 *
 * El driver de Neon se importa de forma dinámica para que el bundle no falle
 * cuando no hay base de datos configurada.
 */

const memoria: Lead[] = [];
let tablaLista = false;

function tieneDB(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function modoAlmacenamiento(): "neon" | "memoria" {
  return tieneDB() ? "neon" : "memoria";
}

async function sql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL as string);
}

async function asegurarTabla(): Promise<void> {
  if (tablaLista) return;
  const db = await sql();
  await db`
    CREATE TABLE IF NOT EXISTS leads (
      id       TEXT PRIMARY KEY,
      fecha    TIMESTAMPTZ NOT NULL DEFAULT now(),
      nombre   TEXT NOT NULL,
      correo   TEXT NOT NULL,
      empresa  TEXT,
      mensaje  TEXT,
      origen   TEXT NOT NULL,
      score    INTEGER NOT NULL,
      tipo     TEXT NOT NULL,
      motivo   TEXT NOT NULL,
      via      TEXT NOT NULL
    )
  `;
  tablaLista = true;
}

export async function guardarLead(lead: Lead): Promise<void> {
  if (!tieneDB()) {
    memoria.unshift(lead);
    if (memoria.length > 200) memoria.pop();
    return;
  }
  await asegurarTabla();
  const db = await sql();
  await db`
    INSERT INTO leads (id, fecha, nombre, correo, empresa, mensaje, origen, score, tipo, motivo, via)
    VALUES (${lead.id}, ${lead.fecha}, ${lead.nombre}, ${lead.correo}, ${lead.empresa ?? null},
            ${lead.mensaje ?? null}, ${lead.origen}, ${lead.score}, ${lead.tipo}, ${lead.motivo}, ${lead.via})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function listarLeads(limite = 50): Promise<Lead[]> {
  if (!tieneDB()) return memoria.slice(0, limite);
  await asegurarTabla();
  const db = await sql();
  const filas = (await db`
    SELECT id, fecha, nombre, correo, empresa, mensaje, origen, score, tipo, motivo, via
    FROM leads ORDER BY fecha DESC LIMIT ${limite}
  `) as Record<string, unknown>[];
  return filas.map((f) => ({
    id: String(f.id),
    fecha: new Date(f.fecha as string).toISOString(),
    nombre: String(f.nombre),
    correo: String(f.correo),
    empresa: (f.empresa as string) ?? undefined,
    mensaje: (f.mensaje as string) ?? undefined,
    origen: String(f.origen),
    score: Number(f.score),
    tipo: f.tipo as Lead["tipo"],
    motivo: String(f.motivo),
    via: f.via as Lead["via"],
  }));
}
