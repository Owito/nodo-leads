import type { Clasificacion, LeadInput, LeadTipo } from "./types";

/**
 * Clasificador de leads.
 *  - Con ANTHROPIC_API_KEY -> usa la API de Claude (structured outputs).
 *  - Sin clave (o si la IA falla) -> fallback determinista por reglas, para que
 *    el flujo SIEMPRE termine y se ejecute "de principio a fin".
 */

const MODELO = process.env.CLASSIFIER_MODEL || "claude-haiku-4-5";

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer" },
    tipo: { type: "string", enum: ["Caliente", "Tibio", "Frío"] },
    motivo: { type: "string" },
  },
  required: ["score", "tipo", "motivo"],
} as const;

const SISTEMA = `Eres analista de calificación de leads B2B para NODO, una agencia que
implementa automatizaciones con IA para PYMEs. Analiza el lead entrante y responde
SOLO con el objeto JSON pedido.

Criterios:
- "Caliente" (score 75-100): urgencia, presupuesto, número de empleados/procesos,
  intención de compra clara ("cotizar", "implementar ya", "precio", "cuánto cuesta",
  "contratar"), o describe un dolor concreto a automatizar.
- "Tibio" (score 40-74): interés genuino y contexto de negocio, pero sin urgencia ni
  intención de compra explícita.
- "Frío" (score 0-39): mensaje vago, genérico, de una línea, sin contexto, o parece
  solo estar explorando.`;

const PALABRAS_CALIENTE = [
  "cotiz", "precio", "cuánto", "cuanto", "presupuesto", "contratar", "implementar",
  "urgente", "ya", "comprar", "demo", "reunión", "reunion", "empresa", "empleados",
  "factura", "ventas", "automatizar",
];
const PALABRAS_TIBIO = ["interes", "interés", "quiero saber", "info", "cómo", "como", "proceso"];

/** Fallback por reglas — sin red, siempre disponible. */
export function clasificarPorReglas(lead: LeadInput): Clasificacion {
  const texto = `${lead.mensaje ?? ""} ${lead.empresa ?? ""}`.toLowerCase();
  const largo = (lead.mensaje ?? "").trim().length;

  let score = 20;
  if (lead.empresa && lead.empresa.trim().length > 1) score += 15;
  if (largo > 40) score += 15;
  if (largo > 120) score += 10;
  for (const p of PALABRAS_CALIENTE) if (texto.includes(p)) score += 12;
  for (const p of PALABRAS_TIBIO) if (texto.includes(p)) score += 6;
  score = Math.max(0, Math.min(100, score));

  let tipo: LeadTipo = "Frío";
  if (score >= 75) tipo = "Caliente";
  else if (score >= 40) tipo = "Tibio";

  const motivo =
    tipo === "Caliente"
      ? "Señales de intención y contexto de negocio claros."
      : tipo === "Tibio"
        ? "Interés con algo de contexto, sin urgencia explícita."
        : "Mensaje breve o genérico, sin contexto de negocio.";

  return { score, tipo, motivo, via: "reglas" };
}

export async function clasificarLead(lead: LeadInput): Promise<Clasificacion> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return clasificarPorReglas(lead);
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();

    // output_config (structured outputs) puede no estar tipado en esta versión
    // del SDK, por eso construimos los parámetros como objeto suelto.
    const params = {
      model: MODELO,
      max_tokens: 400,
      system: SISTEMA,
      output_config: { format: { type: "json_schema", schema: ESQUEMA } },
      messages: [
        {
          role: "user",
          content: `Nombre: ${lead.nombre}
Empresa: ${lead.empresa || "No indicada"}
Mensaje: "${lead.mensaje || "(sin mensaje)"}"

Clasifica este lead y responde solo con el JSON.`,
        },
      ],
    };

    const response = (await client.messages.create(
      params as unknown as Parameters<typeof client.messages.create>[0],
    )) as unknown as {
      stop_reason: string | null;
      content: Array<{ type: string; text?: string }>;
    };

    if (response.stop_reason === "refusal") {
      return clasificarPorReglas(lead);
    }

    const bloque = response.content.find((b) => b.type === "text");
    const raw = bloque?.text ?? "";
    const data = JSON.parse(raw) as { score: number; tipo: LeadTipo; motivo: string };

    const score = Math.max(0, Math.min(100, Math.round(data.score)));
    const tipo: LeadTipo = ["Caliente", "Tibio", "Frío"].includes(data.tipo)
      ? data.tipo
      : score >= 75
        ? "Caliente"
        : score >= 40
          ? "Tibio"
          : "Frío";

    return { score, tipo, motivo: data.motivo || "Clasificado por IA.", via: "ia" };
  } catch {
    // Cualquier error de red/parse -> el flujo continúa con reglas.
    return clasificarPorReglas(lead);
  }
}
