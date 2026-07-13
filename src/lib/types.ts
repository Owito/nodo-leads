export type LeadTipo = "Caliente" | "Tibio" | "Frío";

/** Datos crudos que llegan del formulario. */
export interface LeadInput {
  nombre: string;
  correo: string;
  empresa?: string;
  mensaje?: string;
}

/** Resultado de la clasificación por IA (o fallback por reglas). */
export interface Clasificacion {
  score: number; // 0-100
  tipo: LeadTipo;
  motivo: string;
  via: "ia" | "reglas"; // cómo se clasificó (transparencia)
}

/** Lead ya normalizado, clasificado y persistido. */
export interface Lead extends LeadInput {
  id: string;
  fecha: string; // ISO
  origen: string;
  score: number;
  tipo: LeadTipo;
  motivo: string;
  via: "ia" | "reglas";
}

/** Traza de las acciones ejecutadas por el flujo, para mostrar en la respuesta. */
export interface FlujoPaso {
  paso: string;
  estado: "ok" | "simulado" | "error";
  detalle: string;
}
