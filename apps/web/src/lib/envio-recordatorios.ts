import { createClient } from "@/lib/supabase/server";
import { configuracionTwilio, enviarWhatsapp } from "@/lib/twilio";
import {
  armarRecordatorio,
  formatearFechaTurno,
  formatearHoraTurno,
  FIRMA_POR_DEFECTO,
  fechaDeManana,
  contentSidDe,
  variablesDeRecordatorio,
  type TipoTurno,
} from "@/lib/recordatorios";

/**
 * Seleccion y envio de los recordatorios del dia siguiente.
 *
 * Se ejecuta una vez por dia desde el cron. Todo lo que no se manda queda
 * explicado en el resultado: un turno que se saltea en silencio es un paciente
 * que no aparece y nadie sabe por que.
 */

export type MotivoSalteo =
  | "sin consultorio"
  | "consultorio sin recordatorio para este tipo"
  | "sin celular utilizable";

export type ResultadoEnvio = {
  fecha: string;
  simulacion: boolean;
  /** false mientras Twilio no este configurado en este entorno. */
  configurado: boolean;
  enviados: {
    turnoId: string;
    paciente: string;
    tipo: string;
    destino: string;
    desviado: boolean;
    mensaje: string;
  }[];
  salteados: { turnoId: string; paciente: string; motivo: MotivoSalteo }[];
  fallidos: { turnoId: string; paciente: string; error: string }[];
};

type TurnoConDatos = {
  id: string;
  fecha: string;
  hora: string;
  tipo: string;
  pacientes: { nombre: string; celular_e164: string | null } | null;
  consultorios: {
    nombre: string;
    direccion: string | null;
    recordatorio_estudio_activo: boolean;
    recordatorio_entrega_activo: boolean;
    recordatorio_firma: string | null;
  } | null;
};

export async function enviarRecordatorios(
  opciones: { simulacion?: boolean; fecha?: string } = {}
): Promise<ResultadoEnvio> {
  const simulacion = opciones.simulacion ?? false;
  // Por defecto los turnos de mañana, que es lo que hace el cron. La fecha
  // explicita sirve para reenviar un dia puntual si el cron fallo, y para probar.
  const fecha = opciones.fecha ?? fechaDeManana();

  // Sin Twilio no se manda nada, pero no es un error: es el estado normal mientras
  // la feature no esta habilitada en el entorno. Devolver 500 todos los dias
  // ensenaria a ignorar los errores del cron, que es justo lo que no queremos.
  const config = configuracionTwilio();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("turnos")
    .select(
      "id, fecha, hora, tipo, " +
        "pacientes(nombre, celular_e164), " +
        "consultorios(nombre, direccion, recordatorio_estudio_activo, recordatorio_entrega_activo, recordatorio_firma)"
    )
    .eq("fecha", fecha)
    .eq("estado", "pendiente")
    .eq("recordatorio_enviado", false)
    .order("hora", { ascending: true });
  if (error) throw new Error(error.message);

  const resultado: ResultadoEnvio = {
    fecha,
    simulacion,
    configurado: Boolean(config),
    enviados: [],
    salteados: [],
    fallidos: [],
  };

  for (const t of (data ?? []) as unknown as TurnoConDatos[]) {
    const paciente = t.pacientes?.nombre ?? "(sin paciente)";
    const consultorio = t.consultorios;

    if (!consultorio) {
      resultado.salteados.push({ turnoId: t.id, paciente, motivo: "sin consultorio" });
      continue;
    }

    const tipo: TipoTurno = t.tipo === "entrega" ? "entrega" : "estudio";
    const activo =
      tipo === "entrega"
        ? consultorio.recordatorio_entrega_activo
        : consultorio.recordatorio_estudio_activo;
    if (!activo) {
      resultado.salteados.push({
        turnoId: t.id,
        paciente,
        motivo: "consultorio sin recordatorio para este tipo",
      });
      continue;
    }

    // Los pacientes cuyo celular no se pudo normalizar quedan afuera a proposito:
    // mandar a un numero dudoso es escribirle a un desconocido.
    const celular = t.pacientes?.celular_e164;
    if (!celular) {
      resultado.salteados.push({ turnoId: t.id, paciente, motivo: "sin celular utilizable" });
      continue;
    }

    const variables = {
      paciente: paciente.trim().split(/\s+/)[0],
      fecha: formatearFechaTurno(t.fecha),
      hora: formatearHoraTurno(t.hora),
      direccion: consultorio.direccion ?? consultorio.nombre,
      firma: consultorio.recordatorio_firma?.trim() || FIRMA_POR_DEFECTO,
    };
    // El cuerpo se arma igual para poder mostrarlo en el resultado, pero lo que
    // viaja es la plantilla con botones: asi la respuesta llega como un id exacto
    // y no como texto libre que haya que interpretar.
    const cuerpo = armarRecordatorio(tipo, variables);
    const contentSid = contentSidDe(tipo);

    if (simulacion || !config) {
      resultado.enviados.push({
        turnoId: t.id,
        paciente,
        tipo,
        destino: config?.numeroDePrueba ?? celular,
        desviado: Boolean(config?.numeroDePrueba),
        mensaje: cuerpo,
      });
      continue;
    }

    try {
      const envio = await enviarWhatsapp(config, {
        para: celular,
        cuerpo,
        contentSid,
        variables: contentSid ? variablesDeRecordatorio(variables) : undefined,
      });

      // Recien marcamos como enviado si Twilio lo acepto: si falla, el proximo dia
      // se reintenta en vez de perderse.
      const { error: marcarError } = await supabase
        .from("turnos")
        .update({ recordatorio_enviado: true, recordatorio_enviado_at: new Date().toISOString() })
        .eq("id", t.id);
      if (marcarError) throw new Error(`enviado pero no se pudo marcar: ${marcarError.message}`);

      resultado.enviados.push({
        turnoId: t.id,
        paciente,
        tipo,
        destino: envio.destinoReal,
        desviado: envio.fueDesviado,
        mensaje: cuerpo,
      });
    } catch (err) {
      resultado.fallidos.push({
        turnoId: t.id,
        paciente,
        error: err instanceof Error ? err.message : "error desconocido",
      });
    }
  }

  return resultado;
}
