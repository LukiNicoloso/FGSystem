/**
 * Armado de los recordatorios de turno que se mandan por WhatsApp.
 *
 * Hay dos tipos de turno y cada uno tiene su mensaje: el estudio de pisada y la
 * entrega de las plantillas. El de entrega ademas le pide al paciente que traiga
 * su calzado habitual, porque las plantillas se prueban en el momento.
 *
 * Los cuerpos replican exactamente las plantillas aprobadas por Meta y no se
 * editan desde la app a proposito: una plantilla aprobada solo se puede editar una
 * vez cada 24 h y diez veces cada 30 dias, y cada edicion vuelve a revision. Lo que
 * cambia por consultorio son las variables, no el texto.
 *
 *   {{1}} paciente   {{2}} fecha   {{3}} hora   {{4}} direccion   {{5}} firma
 *
 * Hay una tercera plantilla para las entregas por franja: en Kinest el paciente no
 * tiene hora, pasa cuando puede dentro de una ventana. Ahi {{3}} no es una hora
 * sino el rango entero ("entre las 08:30 y las 11:00").
 *
 * Este archivo es la unica fuente de los mensajes: lo usan las vistas previas de la
 * ficha del consultorio y, mas adelante, el envio real.
 */

export type TipoTurno = "estudio" | "entrega";

export const TIPOS_TURNO: {
  value: TipoTurno;
  label: string;
  descripcion: string;
}[] = [
  {
    value: "estudio",
    label: "Estudio de pisada",
    descripcion: "La primera visita, donde se estudia la pisada.",
  },
  {
    value: "entrega",
    label: "Entrega de plantillas",
    descripcion: "La visita donde se entregan y prueban las plantillas.",
  },
];

export const TIPO_TURNO_POR_DEFECTO: TipoTurno = "estudio";

/**
 * ContentSid de la plantilla aprobada de cada tipo. El texto real vive en Twilio
 * (definido en twilio/plantillas.json); acá solo mandamos las variables.
 */
export function contentSidDe(tipo: TipoTurno, conFranja = false): string | undefined {
  if (conFranja) return process.env.TWILIO_CONTENT_SID_RECORDATORIO_ENTREGA_FRANJA;
  return tipo === "entrega"
    ? process.env.TWILIO_CONTENT_SID_RECORDATORIO_ENTREGA
    : process.env.TWILIO_CONTENT_SID_RECORDATORIO_ESTUDIO;
}

/**
 * Si la plantilla de franja ya esta aprobada y cargada.
 *
 * Mientras no lo este, un turno con ventana sale como un turno normal con la hora
 * de comienzo: es lo que viene pasando hasta hoy. La alternativa —mandar el texto
 * del rango por la plantilla comun— lo dejaria con la frase rota, y no mandar nada
 * dejaria al paciente sin aviso, que es peor que un aviso impreciso.
 */
export function hayPlantillaDeFranja(): boolean {
  return Boolean(process.env.TWILIO_CONTENT_SID_RECORDATORIO_ENTREGA_FRANJA);
}

/** Las variables {{1}}..{{5}} de la plantilla, en el orden que espera Twilio. */
export function variablesDeRecordatorio(v: VariablesRecordatorio): Record<string, string> {
  return { "1": v.paciente, "2": v.fecha, "3": v.hora, "4": v.direccion, "5": v.firma };
}

export function etiquetaTipoTurno(tipo: string): string {
  return TIPOS_TURNO.find((t) => t.value === tipo)?.label ?? tipo;
}

/**
 * Con lo que se firman los recordatorios salvo que el consultorio cargue otra cosa.
 * Vive aca y no como default de la columna para no tener el mismo valor escrito en
 * dos lugares que despues se desincronizan.
 */
export const FIRMA_POR_DEFECTO = "Fuskás Motion";

/**
 * Numero de FG, que recibe el aviso de todo rechazo sin importar el consultorio ni
 * el tipo de turno. El telefono_avisos de cada consultorio se suma a este, no lo
 * reemplaza.
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

const CONFIRMACION = "¿Podría ayudarnos confirmando su asistencia? Responda SI o NO.";

/**
 * Meta rechaza las plantillas que empiezan o terminan con una variable, asi que la
 * firma va al principio ("le escribimos de X") y el mensaje cierra con texto fijo.
 * De paso se lee mejor: el paciente sabe quien le escribe en la primera linea, que
 * importa cuando el mensaje llega de un numero que no tiene agendado.
 */
export function armarRecordatorio(
  tipo: TipoTurno,
  v: VariablesRecordatorio,
  conFranja = false
): string {
  // Con franja, v.hora no es una hora sino el rango ya escrito, asi que la frase
  // cambia entera: no lleva "a las" adelante.
  const cuerpo = conFranja
    ? `Le recordamos que puede pasar a retirar sus plantillas el ${v.fecha}, ${v.hora}, en ${v.direccion}.`
    : tipo === "entrega"
      ? `Le recordamos su turno para la entrega de sus plantillas el ${v.fecha} a las ${v.hora} en ${v.direccion}.`
      : `Le recordamos su turno el ${v.fecha} a las ${v.hora} en ${v.direccion}.`;

  const lineas = [`Hola ${v.paciente}, le escribimos de ${v.firma}.`, "", cuerpo];

  if (tipo === "entrega") {
    lineas.push("", "Por favor traiga el calzado que usa habitualmente, así las probamos en el momento.");
  }

  lineas.push("", CONFIRMACION, "", "¡Muchas gracias!");
  return lineas.join("\n");
}

/**
 * Argentina no aplica horario de verano: siempre UTC-3. Sin esto, usar la fecha
 * UTC hace que despues de las 21:00 hora local el sistema ya crea que es el dia
 * siguiente.
 */
export function fechaEnArgentina(base: Date = new Date()): string {
  return new Date(base.getTime() - 3 * 60 * 60 * 1000).toISOString().split("T")[0];
}

/** El dia siguiente en hora argentina: los turnos que hay que recordar hoy. */
export function fechaDeManana(base: Date = new Date()): string {
  const d = new Date(fechaEnArgentina(base) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * "2026-09-08" -> "martes 8 de septiembre"
 *
 * Sin quitar la coma queda "su turno el martes, 8 de septiembre", que en medio de
 * la frase se lee mal.
 */
export function formatearFechaTurno(fecha: string): string {
  return new Date(fecha + "T00:00:00")
    .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    .replace(",", "");
}

/** "15:30:00" -> "15:30" */
export function formatearHoraTurno(hora: string): string {
  return hora.slice(0, 5);
}

/**
 * Un consultorio solo puede tener recordatorios prendidos si tiene cargados los
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
