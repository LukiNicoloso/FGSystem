/**
 * Interpretacion de lo que responde el paciente al recordatorio.
 *
 * Cuando toca un boton, Twilio manda el id exacto que definimos en la plantilla
 * ("si" o "no") en ButtonPayload: ahi no hay nada que adivinar. Pero el paciente
 * siempre puede escribir en vez de tocar, sobre todo si el mensaje le llegó hace
 * rato, asi que tambien leemos el texto.
 *
 * Ante la duda no tocamos el turno. Interpretar de mas es peor que no interpretar:
 * un "no se" tomado como confirmacion hace que nadie lo llame.
 */

export type Respuesta = "si" | "no" | "no entendida";

const SI = new Set([
  "si", "s", "sí", "sip", "sii", "ok", "oka", "okey", "dale", "listo", "confirmo",
  "confirmado", "confirmada", "asisto", "voy", "ahi voy", "perfecto", "1",
]);

const NO = new Set([
  "no", "n", "nop", "nope", "no puedo", "no voy", "cancelar", "cancelo",
  "cancela", "no asisto", "imposible", "2",
]);

/** Saca acentos, signos y espacios de mas para poder comparar. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function interpretarRespuesta(entrada: {
  buttonPayload?: string | null;
  body?: string | null;
}): Respuesta {
  // El boton es exacto: si vino, no miramos el texto.
  const boton = entrada.buttonPayload?.trim().toLowerCase();
  if (boton === "si" || boton === "no") return boton;

  const texto = normalizar(entrada.body ?? "");
  if (!texto) return "no entendida";
  if (SI.has(texto)) return "si";
  if (NO.has(texto)) return "no";

  // Una sola palabra suelta dentro de una frase no alcanza: "no se si voy" no es
  // ni un si ni un no.
  return "no entendida";
}

export const ACUSE = {
  si: "Listo, su turno quedó confirmado. ¡Lo esperamos!",
  no: "Gracias por avisar. Ya le avisamos al consultorio para reprogramarlo.",
  "no entendida":
    "No llegamos a entender su respuesta. ¿Podría responder SI para confirmar el turno, o NO si no va a poder venir?",
} as const;
