/**
 * Armado del recordatorio de turno que se manda por WhatsApp.
 *
 * El cuerpo replica exactamente la plantilla aprobada por Meta. No se edita desde
 * la app a proposito: una plantilla aprobada solo se puede editar una vez cada 24 h
 * y diez veces cada 30 dias, y cada edicion vuelve a revision. Lo que cambia por
 * consultorio son las variables, no el texto.
 *
 *   {{1}} paciente   {{2}} fecha   {{3}} hora   {{4}} direccion   {{5}} firma
 *
 * Esta funcion es la unica fuente del mensaje: la usa la vista previa de la ficha
 * del consultorio y, mas adelante, el envio real.
 */

/**
 * Con lo que se firman los recordatorios salvo que el consultorio cargue otra cosa.
 * Vive aca y no como default de la columna para no tener el mismo valor escrito en
 * dos lugares que despues se desincronizan.
 */
export const FIRMA_POR_DEFECTO = "Fuskás Motion";

/**
 * Numero de FG, que recibe el aviso de todo rechazo sin importar el consultorio.
 * El telefono_avisos de cada consultorio se suma a este, no lo reemplaza.
 *
 * Vive en el codigo, como la firma, porque es identidad de FG y no configuracion
 * por consultorio. Si algun dia hay que cambiarlo sin deployar, pasa a variable de
 * entorno.
 */
export const TELEFONO_AVISOS_FG = "+5491131096959";

export type VariablesRecordatorio = {
  paciente: string;
  fecha: string;
  hora: string;
  direccion: string;
  firma: string;
};

export function armarRecordatorio(v: VariablesRecordatorio): string {
  return [
    `Hola ${v.paciente}, le recordamos su turno el ${v.fecha} a las ${v.hora} en ${v.direccion}.`,
    "",
    "¿Podría ayudarnos confirmando su asistencia? Responda SI o NO.",
    "",
    "Gracias,",
    v.firma,
  ].join("\n");
}

/** "2026-09-08" -> "martes 8 de septiembre" */
export function formatearFechaTurno(fecha: string): string {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** "15:30:00" -> "15:30" */
export function formatearHoraTurno(hora: string): string {
  return hora.slice(0, 5);
}

/**
 * Un consultorio solo puede tener el recordatorio prendido si tiene cargados los
 * datos que la plantilla necesita. Sin esto el paciente recibiria un mensaje que
 * dice "en null". La firma no entra: siempre hay una, la de FIRMA_POR_DEFECTO.
 */
export function faltantesParaRecordatorio(c: {
  direccion?: string | null;
}): string[] {
  const faltan: string[] = [];
  if (!c.direccion?.trim()) faltan.push("la dirección");
  return faltan;
}
