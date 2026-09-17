import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verificacion de la firma con la que Twilio acompaña cada request entrante.
 *
 * Sin esto, cualquiera que conozca la URL podria confirmar turnos ajenos o marcar
 * recordatorios como fallidos. Lo usan el webhook de respuestas y el de estados de
 * entrega, por eso vive aca y no dentro de una ruta.
 *
 * Twilio firma la URL publica completa mas los campos del form ordenados
 * alfabeticamente, con HMAC-SHA1 y el auth token como clave.
 */

export function firmaValida(
  url: string,
  campos: Record<string, string>,
  firma: string,
  token: string
): boolean {
  const base =
    url +
    Object.keys(campos)
      .sort()
      .map((k) => k + campos[k])
      .join("");
  const esperada = createHmac("sha1", token).update(Buffer.from(base, "utf8")).digest("base64");
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Twilio firma la URL publica; detras del proxy de Vercel hay que reconstruirla a
 * partir de los headers, porque request.url trae el host interno.
 */
export function urlPublica(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return `https://${host}${new URL(request.url).pathname}`;
}

/** Los campos del form como diccionario plano, que es lo que se firma. */
export async function camposDelForm(request: Request): Promise<Record<string, string>> {
  const form = await request.formData();
  const campos: Record<string, string> = {};
  for (const [k, v] of form.entries()) campos[k] = String(v);
  return campos;
}
