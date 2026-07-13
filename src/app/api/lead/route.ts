import { NextResponse } from "next/server";
import { clasificarLead } from "@/lib/classify";
import { enviarBienvenida } from "@/lib/email";
import { notificarTelegram } from "@/lib/telegram";
import { guardarLead } from "@/lib/store";
import type { FlujoPaso, Lead, LeadInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limpiar(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function nuevoId(): string {
  return `ld_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * "La máquina de leads que trabaja sola": un solo POST dispara el flujo
 * completo. Devuelve la traza de cada acción para mostrarla en la UI.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  // 1) Normalizar + validar
  const entrada: LeadInput = {
    nombre: limpiar(body.nombre),
    correo: limpiar(body.correo).toLowerCase(),
    empresa: limpiar(body.empresa) || undefined,
    mensaje: limpiar(body.mensaje) || undefined,
  };

  if (!entrada.nombre || !EMAIL_RE.test(entrada.correo)) {
    return NextResponse.json(
      { ok: false, error: "Necesitamos un nombre y un correo válido." },
      { status: 400 },
    );
  }

  const pasos: FlujoPaso[] = [];
  pasos.push({ paso: "Validación", estado: "ok", detalle: "Nombre y correo válidos" });

  // 2) Clasificar con IA (con fallback por reglas)
  const clasif = await clasificarLead(entrada);
  pasos.push({
    paso: "Clasificación IA",
    estado: "ok",
    detalle: `${clasif.tipo} · ${clasif.score}/100 · vía ${clasif.via}`,
  });

  const lead: Lead = {
    ...entrada,
    id: nuevoId(),
    fecha: new Date().toISOString(),
    origen: "Landing NODO",
    score: clasif.score,
    tipo: clasif.tipo,
    motivo: clasif.motivo,
    via: clasif.via,
  };

  // 3) Guardar
  try {
    await guardarLead(lead);
    pasos.push({ paso: "Registro en BD", estado: "ok", detalle: "Lead almacenado" });
  } catch (e) {
    pasos.push({ paso: "Registro en BD", estado: "error", detalle: (e as Error).message });
  }

  // 4) + 5) Correo y Telegram en paralelo (acciones encadenadas del flujo)
  const [correo, telegram] = await Promise.all([
    enviarBienvenida(lead),
    notificarTelegram(lead),
  ]);
  pasos.push({ paso: "Correo de bienvenida", estado: correo.estado, detalle: correo.detalle });
  pasos.push({ paso: "Aviso al equipo (Telegram)", estado: telegram.estado, detalle: telegram.detalle });

  return NextResponse.json({
    ok: true,
    mensaje: "¡Gracias! Tu solicitud entró al sistema y ya está siendo atendida.",
    clasificacion: clasif,
    lead: {
      id: lead.id,
      nombre: lead.nombre,
      tipo: lead.tipo,
      score: lead.score,
      motivo: lead.motivo,
    },
    flujo: pasos,
  });
}
