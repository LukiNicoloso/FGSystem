import { createClient } from "@/lib/supabase/server";
import { configuracionTwilio, enviarWhatsapp } from "@/lib/twilio";
import { interpretarRespuesta, ACUSE } from "@/lib/respuesta-turno";
import { firmaValida, urlPublica, camposDelForm } from "@/lib/twilio-firma";
import {
  formatearFechaTurno,
  formatearHoraTurno,
  fechaEnArgentina,
  TELEFONO_AVISOS_FG,
} from "@/lib/recordatorios";

/**
 * Webhook de Twilio: acá llega lo que responde el paciente.
 *
 * Queda fuera de la autenticacion de proxy.ts porque Twilio no manda cookies, asi
 * que se protege verificando la firma X-Twilio-Signature. Sin eso, cualquiera que
 * conozca la URL podria confirmar o cancelar turnos ajenos.
 *
 * Responde siempre 200 con TwiML vacio: si devolvemos un error, Twilio reintenta
 * y el paciente recibiria el acuse varias veces.
 */

export const dynamic = "force-dynamic";

const TWIML_VACIO = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function respuestaVacia() {
  return new Response(TWIML_VACIO, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: Request) {
  // Sin credenciales no hay con que verificar la firma, asi que no se procesa nada.
  // Devolvemos 503 y no 200: un 200 a un request sin firmar da a entender que el
  // endpoint lo acepto, cuando en realidad no esta operativo en este entorno.
  const config = configuracionTwilio();
  if (!config) {
    console.error("[webhook] Twilio no está configurado, no se procesa el mensaje");
    return new Response("Webhook no configurado", { status: 503 });
  }

  const campos = await camposDelForm(request);
  const firma = request.headers.get("x-twilio-signature") ?? "";
  if (!firmaValida(urlPublica(request), campos, firma, config.authToken)) {
    console.error("[webhook] firma inválida, se descarta el mensaje");
    return new Response("Firma inválida", { status: 403 });
  }

  const desde = (campos.From ?? "").replace("whatsapp:", "").trim();
  const respuesta = interpretarRespuesta({
    buttonPayload: campos.ButtonPayload,
    body: campos.Body,
  });

  const supabase = await createClient();

  // De quien es este numero. Si el desvio de pruebas esta activo todas las
  // respuestas llegan desde el mismo numero, asi que no se puede resolver el
  // paciente por ahi: en ese caso tomamos el ultimo turno con recordatorio enviado.
  const desviando = Boolean(config.numeroDePrueba);
  const hoy = fechaEnArgentina(new Date());

  let consulta = supabase
    .from("turnos")
    .select(
      "id, fecha, hora, estado, pacientes!inner(nombre, celular_e164), " +
        "consultorios(nombre, telefono_avisos)"
    )
    .eq("estado", "pendiente")
    .eq("recordatorio_enviado", true)
    .gte("fecha", hoy)
    .order("fecha", { ascending: true })
    .limit(1);

  if (!desviando) consulta = consulta.eq("pacientes.celular_e164", desde);

  const { data: turnos, error } = await consulta;
  if (error) {
    console.error("[webhook] no se pudo buscar el turno:", error.message);
    return respuestaVacia();
  }

  type TurnoDeRespuesta = {
    id: string;
    fecha: string;
    hora: string;
    pacientes: { nombre: string; celular_e164: string | null } | null;
    consultorios: { nombre: string; telefono_avisos: string | null } | null;
  };
  const turno = turnos?.[0] as unknown as TurnoDeRespuesta | undefined;

  if (!turno) {
    console.log(`[webhook] respuesta "${respuesta}" de ${desde} sin turno pendiente asociado`);
    return respuestaVacia();
  }

  const paciente = turno.pacientes?.nombre ?? "El paciente";

  // Una respuesta que no entendemos no toca el turno: solo le repreguntamos.
  if (respuesta !== "no entendida") {
    const { error: updateError } = await supabase
      .from("turnos")
      .update({
        estado: respuesta === "si" ? "confirmado" : "cancelado",
        respuesta_paciente: respuesta,
        respuesta_at: new Date().toISOString(),
      })
      .eq("id", turno.id);
    if (updateError) {
      console.error("[webhook] no se pudo actualizar el turno:", updateError.message);
      return respuestaVacia();
    }
    console.log(`[webhook] turno ${turno.id} -> ${respuesta} (${paciente})`);
  }

  // El acuse va dentro de la ventana de 24 h que abrio el paciente al responder,
  // asi que es texto libre y no necesita plantilla aprobada.
  try {
    await enviarWhatsapp(config, { para: desde, cuerpo: ACUSE[respuesta] });
  } catch (err) {
    console.error("[webhook] no se pudo mandar el acuse:", err instanceof Error ? err.message : err);
  }

  if (respuesta === "no") {
    // El celular guardado es el que se muestra; "desde" es el respaldo para el modo
    // de prueba, donde las respuestas no vienen del numero del paciente.
    await avisarRechazo(config, turno, paciente, turno.pacientes?.celular_e164 ?? desde);
  }

  return respuestaVacia();
}

async function avisarRechazo(
  config: NonNullable<ReturnType<typeof configuracionTwilio>>,
  turno: {
    fecha: string;
    hora: string;
    consultorios: { nombre: string; telefono_avisos: string | null } | null;
  },
  paciente: string,
  celular: string
) {
  const consultorio = turno.consultorios?.nombre ?? "sin consultorio";
  const fecha = formatearFechaTurno(turno.fecha);
  const hora = formatearHoraTurno(turno.hora);

  // Dos plantillas conviven a proposito. La v3 suma el celular del paciente, que
  // WhatsApp convierte en un link para contactarlo sin buscarlo por el nombre, pero
  // hasta que Meta la apruebe su SID no existe. Mientras tanto sigue saliendo la v2,
  // que tiene cuatro variables: mandarle cinco la romperia en silencio.
  const sidV3 = process.env.TWILIO_CONTENT_SID_AVISO_RECHAZO_V3;
  const contentSid = sidV3 ?? process.env.TWILIO_CONTENT_SID_AVISO_RECHAZO;
  const variables: Record<string, string> = sidV3
    ? { "1": paciente, "2": fecha, "3": hora, "4": consultorio, "5": celular }
    : { "1": paciente, "2": fecha, "3": hora, "4": consultorio };

  // FG se entera siempre; el consultorio se suma si cargo un numero. Si son el
  // mismo, se manda una sola vez.
  const destinos = new Set([TELEFONO_AVISOS_FG]);
  const delConsultorio = turno.consultorios?.telefono_avisos?.trim();
  if (delConsultorio) destinos.add(delConsultorio);

  for (const destino of destinos) {
    try {
      await enviarWhatsapp(config, {
        para: destino,
        // El texto plano solo se usa dentro de la ventana de 24 h, asi que no
        // depende de ninguna aprobacion y siempre lleva el celular.
        cuerpo: `${paciente} rechazó su turno del ${fecha} a las ${hora} en ${consultorio}. Para reprogramar, escribile al ${celular}.`,
        contentSid,
        variables: contentSid ? variables : undefined,
      });
    } catch (err) {
      console.error(
        `[webhook] no se pudo avisar el rechazo a ${destino}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}
