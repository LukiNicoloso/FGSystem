/**
 * Normalizacion de celulares argentinos al formato que usa WhatsApp.
 *
 * Twilio identifica a quien responde por su numero en formato internacional
 * (whatsapp:+5491156207854) y nada mas. Sin un formato canonico guardado no hay
 * forma de saber de que paciente es una respuesta, asi que la confirmacion de
 * turnos depende enteramente de esto.
 *
 * La regla argentina: codigo de area + numero suman SIEMPRE 10 digitos. El "15"
 * es un prefijo domestico que va despues del area y no viaja al formato
 * internacional, asi que un numero escrito con 15 tiene 12 digitos. El "9" entre
 * el +54 y el area marca que es movil.
 *
 *   0111556207854  ->  +5491156207854
 *   11 5620-7854   ->  +5491156207854
 *
 * Cuando algo no cierra devolvemos el motivo en vez de adivinar: un numero mal
 * normalizado le manda el recordatorio a un desconocido, que es peor que no
 * mandarlo. Los que fallan se corrigen a mano.
 */

export type ResultadoTelefono =
  | { ok: true; e164: string }
  | { ok: false; motivo: string };

export const FORMATO_ESPERADO =
  "Código de área sin el 0 y número sin el 15. Ejemplos: 11 5620-7854, 351 456-7890.";

/** Unico codigo de area de dos digitos del pais. */
const AREAS_2 = new Set(["11"]);

/** Codigos de area de tres digitos. El resto del pais usa cuatro. */
const AREAS_3 = new Set([
  "220", "221", "223", "230", "236", "237", "249", "260", "261", "263", "264",
  "266", "280", "291", "297", "299", "336", "341", "342", "343", "345", "348",
  "351", "353", "358", "362", "364", "370", "376", "379", "380", "381", "383",
  "385", "387", "388",
]);

/**
 * Cuantos digitos ocupa el codigo de area. Solo hace falta para ubicar el "15" en
 * los numeros escritos en formato domestico: si el numero ya viene con sus 10
 * digitos, el area no se usa para nada. Por eso una lista incompleta degrada a
 * "no se pudo normalizar" y nunca a un numero equivocado.
 */
function largoDelArea(d: string): number | null {
  if (AREAS_2.has(d.slice(0, 2))) return 2;
  if (AREAS_3.has(d.slice(0, 3))) return 3;
  // Los codigos argentinos empiezan en 1, 2 o 3; el resto de los de 4 digitos
  // arrancan en 2 o 3.
  if (/^[23]/.test(d)) return 4;
  return null;
}

export function normalizarCelular(entrada: string | null | undefined): ResultadoTelefono {
  const crudo = (entrada ?? "").trim();
  if (!crudo) return { ok: false, motivo: "Está vacío" };

  let d = crudo.replace(/\D/g, "");
  if (!d) return { ok: false, motivo: "No tiene ningún número" };

  if (d.startsWith("00")) d = d.slice(2);        // prefijo de salida internacional
  if (d.startsWith("54")) d = d.slice(2);        // codigo de pais
  if (d.startsWith("9") && d.length >= 11) d = d.slice(1); // marcador de movil
  d = d.replace(/^0+/, "");                      // prefijo nacional

  // Escrito en formato domestico: area + 15 + numero.
  if (d.length === 12) {
    const largo = largoDelArea(d);
    if (largo === null) {
      return { ok: false, motivo: "No reconozco el código de área" };
    }
    if (d.slice(largo, largo + 2) !== "15") {
      return { ok: false, motivo: "Tiene 12 dígitos pero no encuentro el 15 después del código de área" };
    }
    d = d.slice(0, largo) + d.slice(largo + 2);
  }

  if (d.length !== 10) {
    return {
      ok: false,
      motivo: `Quedan ${d.length} dígitos y tienen que ser 10 (código de área + número)`,
    };
  }

  if (largoDelArea(d) === null) {
    return { ok: false, motivo: "No reconozco el código de área" };
  }

  return { ok: true, e164: "+549" + d };
}

/** Para mostrar: "+5491156207854" -> "+54 9 11 5620-7854" */
export function mostrarE164(e164: string): string {
  const nacional = /^\+549(\d{10})$/.exec(e164)?.[1];
  if (!nacional) return e164;

  // Sin esto el area se come digitos del abonado y queda "+54 9 1156 20-7854".
  const largo = largoDelArea(nacional);
  if (largo === null) return e164;

  const area = nacional.slice(0, largo);
  const resto = nacional.slice(largo);
  const corte = resto.length - 4;
  return `+54 9 ${area} ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
