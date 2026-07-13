import type { Lead } from "./types";

/**
 * Correo de bienvenida. Con RESEND_API_KEY envía de verdad; sin ella, simula
 * y registra en logs (el flujo no se detiene).
 */

function plantilla(lead: Lead): string {
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#0a0a0f;font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#e8e8f0;padding:32px">
  <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#13131c;border:1px solid #2a2a3d;border-radius:14px">
    <tr><td style="padding:28px 28px 8px">
      <div style="font-family:ui-monospace,monospace;color:#c6f24e;letter-spacing:.3em;font-size:12px">NODO</div>
      <h1 style="margin:12px 0 0;font-size:24px;line-height:1.2">¡Hola ${lead.nombre}! 👋</h1>
    </td></tr>
    <tr><td style="padding:8px 28px 4px;color:#c9c9dc;font-size:15px;line-height:1.6">
      Gracias por escribirnos. Recibimos tu mensaje y <strong>nuestro sistema ya lo procesó
      automáticamente</strong>: en menos de un minuto un humano del equipo lo tiene enfrente,
      priorizado y listo para responderte.
    </td></tr>
    <tr><td style="padding:16px 28px 4px">
      <div style="background:#1b1b28;border:1px solid #2a2a3d;border-radius:10px;padding:16px;font-size:14px;color:#c9c9dc">
        <div style="color:#8c8ca6;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Tu mensaje</div>
        ${lead.mensaje ? escapeHtml(lead.mensaje) : "<em>Sin mensaje</em>"}
      </div>
    </td></tr>
    <tr><td style="padding:20px 28px 28px;color:#8c8ca6;font-size:13px;line-height:1.6">
      Esto que acabas de vivir —captura, clasificación con IA, registro y aviso al equipo,
      todo solo— es exactamente lo que construimos para PYMEs. Te contactamos pronto.<br><br>
      — El equipo de <span style="color:#c6f24e">NODO</span>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function enviarBienvenida(
  lead: Lead,
): Promise<{ estado: "ok" | "simulado" | "error"; detalle: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:simulado] Bienvenida -> ${lead.correo}`);
    return { estado: "simulado", detalle: `Correo simulado a ${lead.correo} (sin RESEND_API_KEY)` };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.MAIL_FROM || "NODO <onboarding@resend.dev>";
    const { error } = await resend.emails.send({
      from,
      to: lead.correo,
      subject: `¡Bienvenido a NODO, ${lead.nombre}! 🤖`,
      html: plantilla(lead),
    });
    if (error) return { estado: "error", detalle: `Resend: ${error.message}` };
    return { estado: "ok", detalle: `Correo enviado a ${lead.correo}` };
  } catch (e) {
    return { estado: "error", detalle: `Error de correo: ${(e as Error).message}` };
  }
}
