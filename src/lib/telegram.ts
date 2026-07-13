import type { Lead } from "./types";

/**
 * Notificación instantánea al equipo por Telegram. Con TELEGRAM_BOT_TOKEN +
 * TELEGRAM_CHAT_ID envía de verdad; sin ellos, simula y registra en logs.
 */

const EMOJI: Record<Lead["tipo"], string> = {
  Caliente: "🔥",
  Tibio: "🌤️",
  Frío: "🧊",
};

function mensaje(lead: Lead): string {
  return [
    `${EMOJI[lead.tipo]} *Nuevo lead — ${lead.tipo}* (${lead.score}/100)`,
    ``,
    `👤 *Nombre:* ${lead.nombre}`,
    `📧 *Correo:* ${lead.correo}`,
    `🏢 *Empresa:* ${lead.empresa || "—"}`,
    `💬 *Mensaje:* ${lead.mensaje || "—"}`,
    ``,
    `🎯 *Motivo IA:* ${lead.motivo}`,
    `📍 *Origen:* ${lead.origen}`,
  ].join("\n");
}

export async function notificarTelegram(
  lead: Lead,
): Promise<{ estado: "ok" | "simulado" | "error"; detalle: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(`[telegram:simulado] ${lead.tipo} ${lead.nombre}`);
    return { estado: "simulado", detalle: "Telegram simulado (faltan token/chat id)" };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensaje(lead),
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { estado: "error", detalle: `Telegram HTTP ${res.status}: ${t.slice(0, 120)}` };
    }
    return { estado: "ok", detalle: "Notificación enviada a Telegram" };
  } catch (e) {
    return { estado: "error", detalle: `Error Telegram: ${(e as Error).message}` };
  }
}
