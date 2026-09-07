/**
 * Cliente minimo de Twilio para mandar WhatsApp.
 *
 * Es un fetch a la API REST en vez del SDK: lo unico que necesitamos es un POST
 * con autenticacion basica, y el SDK son varios megas de dependencia para eso.
 *
 * Soporta las dos formas de mandar:
 *
 * - `cuerpo`: texto libre. Solo funciona dentro de la ventana de 24 h que abre el
 *   paciente al escribirnos, y en el sandbox despues de mandar el "join". Es lo
 *   que usamos para probar antes de que Meta apruebe las plantillas.
 * - `contentSid` + `variables`: plantilla aprobada. Es lo unico que sirve para
 *   mensajes que inicia el negocio en produccion.
 */

const API = "https://api.twilio.com/2010-04-01";

export type ConfigTwilio = {
  accountSid: string;
  authToken: string;
  from: string;
  /** Si esta definido, TODO mensaje va a este numero en vez de al destinatario real. */
  numeroDePrueba: string | null;
};

/** Devuelve null si falta configuracion, para poder informarlo en vez de explotar. */
export function configuracionTwilio(): ConfigTwilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken || !from) return null;

  // Un numero de prueba mal cargado es peor que no tenerlo: si lo ignoraramos en
  // silencio, los mensajes se irian a los pacientes reales creyendo que estamos
  // probando. Preferimos que no salga nada. Pasa, por ejemplo, cuando se baja la
  // variable con `vercel env pull` y viene como "[SENSITIVE]".
  const crudoDePrueba = process.env.RECORDATORIOS_NUMERO_PRUEBA?.trim();
  if (crudoDePrueba && !/^\+\d{8,15}$/.test(crudoDePrueba)) {
    throw new Error(
      `RECORDATORIOS_NUMERO_PRUEBA no es un número válido en formato internacional. ` +
        `Mientras esté mal cargada no se envía nada, para no escribirle a pacientes reales.`
    );
  }

  return {
    accountSid,
    authToken,
    from,
    numeroDePrueba: crudoDePrueba || null,
  };
}

export type MensajeWhatsapp = {
  /** Destinatario real, en E.164. Puede ser reemplazado por el numero de prueba. */
  para: string;
  cuerpo: string;
  contentSid?: string;
  variables?: Record<string, string>;
};

export type EnvioResultado = {
  sid: string;
  /** A donde se mando de verdad: puede diferir de `para` si hay numero de prueba. */
  destinoReal: string;
  fueDesviado: boolean;
};

function comoWhatsapp(numero: string): string {
  return numero.startsWith("whatsapp:") ? numero : `whatsapp:${numero}`;
}

export async function enviarWhatsapp(
  config: ConfigTwilio,
  mensaje: MensajeWhatsapp
): Promise<EnvioResultado> {
  const destinoReal = config.numeroDePrueba ?? mensaje.para;

  const params = new URLSearchParams({
    From: comoWhatsapp(config.from),
    To: comoWhatsapp(destinoReal),
  });

  if (mensaje.contentSid) {
    params.set("ContentSid", mensaje.contentSid);
    if (mensaje.variables) {
      params.set("ContentVariables", JSON.stringify(mensaje.variables));
    }
  } else {
    params.set("Body", mensaje.cuerpo);
  }

  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

  const res = await fetch(`${API}/Accounts/${config.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = (await res.json()) as { sid?: string; message?: string; code?: number };

  if (!res.ok) {
    // El mensaje de Twilio es especifico y util (numero no habilitado, fuera de la
    // ventana, plantilla no aprobada): lo propagamos tal cual.
    throw new Error(`Twilio ${data.code ?? res.status}: ${data.message ?? "error desconocido"}`);
  }

  return {
    sid: data.sid ?? "",
    destinoReal,
    fueDesviado: destinoReal !== mensaje.para,
  };
}
