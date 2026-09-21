import { formatearFechaTurno, formatearHoraTurno } from "@/lib/recordatorios";

/**
 * El resumen que se manda a FG cuando algun turno de mañana quedo sin avisar.
 *
 * Un turno que no recibe recordatorio es un paciente que no sabe que tiene turno,
 * y hasta ahora eso solo se veia entrando al sistema. Peor: los que se saltean
 * antes de intentar el envio — consultorio con el recordatorio apagado, celular no
 * normalizado — no dejaban ningun rastro visible.
 *
 * Si no hubo fallos no se manda nada. Un mensaje diario que casi siempre dice
 * "todo bien" se deja de leer, y el dia que importe va a pasar desapercibido.
 */

/** Tope del cuerpo de un mensaje de WhatsApp. */
const LIMITE_CUERPO = 1024;

/**
 * Las variables de plantilla no admiten saltos de linea ni tabulaciones, asi que
 * el detalle va en una sola linea separada por este caracter.
 */
const SEPARADOR = " · ";

export type FalloDeAviso = {
  paciente: string;
  celular: string | null;
  hora: string;
  consultorio: string | null;
  motivo: string;
};

export type MensajeResumen = {
  total: string;
  fecha: string;
  cantidadFallos: string;
  detalle: string;
};

/** Una linea del detalle. El celular va en E.164 para que WhatsApp lo haga tocable. */
function linea(f: FalloDeAviso): string {
  const donde = [formatearHoraTurno(f.hora), f.consultorio].filter(Boolean).join(", ");
  const tel = f.celular ? ` ${f.celular}` : " sin celular";
  return `${f.paciente}${tel} (${donde}) ${f.motivo}`;
}

/**
 * Arma los mensajes del resumen. Devuelve varios cuando el detalle no entra en
 * uno: se pidio que no se pierda ningun paciente, asi que se parte en vez de
 * truncar.
 */
export function armarResumenDeFallos(
  fecha: string,
  totalTurnos: number,
  fallos: FalloDeAviso[]
): MensajeResumen[] {
  if (fallos.length === 0) return [];

  const fechaLarga = formatearFechaTurno(fecha);
  const lineas = fallos.map(linea);

  // Cuanto espacio queda para el detalle una vez puesto el resto del mensaje.
  const fijo =
    "Aviso de FGSystem: de los  turnos del , no se pudo avisar a . Detalle: . " +
    "Conviene contactarlos por teléfono para confirmar la asistencia.";
  const margen =
    LIMITE_CUERPO -
    fijo.length -
    String(totalTurnos).length -
    fechaLarga.length -
    String(fallos.length).length;

  const grupos: string[][] = [];
  let actual: string[] = [];
  let largo = 0;
  for (const l of lineas) {
    const suma = (actual.length ? SEPARADOR.length : 0) + l.length;
    // Una linea sola mas larga que el margen igual va: partirla por la mitad seria
    // peor que mandar un mensaje un poco largo.
    if (actual.length && largo + suma > margen) {
      grupos.push(actual);
      actual = [l];
      largo = l.length;
    } else {
      actual.push(l);
      largo += suma;
    }
  }
  if (actual.length) grupos.push(actual);

  return grupos.map((g) => ({
    total: String(totalTurnos),
    fecha: fechaLarga,
    cantidadFallos: String(fallos.length),
    detalle: g.join(SEPARADOR),
  }));
}

/** Las variables {{1}}..{{4}} en el orden que espera la plantilla. */
export function variablesDelResumen(m: MensajeResumen): Record<string, string> {
  return { "1": m.total, "2": m.fecha, "3": m.cantidadFallos, "4": m.detalle };
}

/** El mismo texto, para el log y para cuando no hay plantilla configurada. */
export function textoDelResumen(m: MensajeResumen): string {
  return (
    `Aviso de FGSystem: de los ${m.total} turnos del ${m.fecha}, ` +
    `no se pudo avisar a ${m.cantidadFallos}. Detalle: ${m.detalle}. ` +
    `Conviene contactarlos por teléfono para confirmar la asistencia.`
  );
}
