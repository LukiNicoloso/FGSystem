import { createClient } from "@/lib/supabase/server";
import { configuracionTwilio } from "@/lib/twilio";
import { firmaValida, urlPublica, camposDelForm } from "@/lib/twilio-firma";

/**
 * Estados de entrega que reporta Twilio sobre cada recordatorio.
 *
 * Twilio acepta un mensaje y recien despues WhatsApp lo entrega o lo rechaza, de
 * forma asincronica. Sin esto, un mensaje que nunca llego quedaba marcado como
 * enviado y nadie se enteraba: el sistema creia haber avisado al paciente.
 *
 * Nos avisa por cada cambio de estado (queued, sent, delivered, read, undelivered,
 * failed) sobre el MessageSid que guardamos al enviar.
 */

export const dynamic = "force-dynamic";

/** Estados en los que el mensaje no llego y no va a llegar. */
const FALLIDOS = new Set(["undelivered", "failed"]);

export async function POST(request: Request) {
  const config = configuracionTwilio();
  if (!config) {
    console.error("[estado] Twilio no está configurado, no se procesa el aviso");
    return new Response("Webhook no configurado", { status: 503 });
  }

  const campos = await camposDelForm(request);
  const firma = request.headers.get("x-twilio-signature") ?? "";
  if (!firmaValida(urlPublica(request), campos, firma, config.authToken)) {
    console.error("[estado] firma inválida, se descarta el aviso");
    return new Response("Firma inválida", { status: 403 });
  }

  const sid = campos.MessageSid || campos.SmsSid;
  const estado = campos.MessageStatus || campos.SmsStatus;
  if (!sid || !estado) return new Response("", { status: 204 });

  const supabase = await createClient();
  const fallo = FALLIDOS.has(estado);

  // Si el mensaje no llego, el turno vuelve a figurar como no avisado: es la
  // verdad, y hace que aparezca en la pantalla como "no se pudo avisar" en vez de
  // dar por hecho que el paciente esta al tanto.
  const cambios: Record<string, unknown> = {
    recordatorio_estado: estado,
    recordatorio_error: fallo ? campos.ErrorCode || "sin código" : null,
  };
  if (fallo) {
    cambios.recordatorio_enviado = false;
    cambios.recordatorio_enviado_at = null;
  }

  const { data, error } = await supabase
    .from("turnos")
    .update(cambios)
    .eq("recordatorio_sid", sid)
    .select("id");

  if (error) {
    console.error("[estado] no se pudo actualizar el turno:", error.message);
    return new Response("", { status: 204 });
  }

  if (!data?.length) {
    // Pasa con los acuses y los avisos de rechazo, que no corresponden a ningun
    // turno. No es un problema.
    console.log(`[estado] ${estado} de ${sid}: sin turno asociado`);
  } else if (fallo) {
    console.error(
      `[estado] el recordatorio del turno ${data[0].id} no se entregó ` +
        `(${estado}, código ${campos.ErrorCode || "-"})`
    );
  }

  return new Response("", { status: 204 });
}
