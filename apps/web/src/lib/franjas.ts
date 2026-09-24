/**
 * Los turnos que son una ventana en vez de una hora.
 *
 * En Kinest no se da hora: el paciente pasa a retirar sus plantillas cuando puede,
 * dentro de una franja. Por eso un turno de Kinest guarda hora y hora_fin, y el
 * recordatorio le dice el rango en lugar de una hora exacta, que seria mentirle.
 *
 * Las franjas estan escritas aca a proposito. Se evaluo cargarlas por consultorio
 * desde su ficha y se decidio no hacerlo todavia: hoy es el unico consultorio que
 * trabaja asi. Si aparece un segundo, esto pasa a una tabla.
 */

export type Franja = {
  /** Dia de la semana como lo devuelve getUTCDay: 0 domingo … 6 sabado. */
  dia: number;
  /** HH:MM. */
  desde: string;
  hasta: string;
};

/** Se compara por nombre normalizado y no por id, para no clavar un UUID de produccion. */
const CONSULTORIO_CON_FRANJAS = "kinest";

const FRANJAS: Franja[] = [
  { dia: 2, desde: "11:30", hasta: "15:30" }, // martes
  { dia: 6, desde: "08:30", hasta: "11:00" }, // sabado
];

// En plural: los dias que ya terminan en -s son invariables ("los martes"), y
// sabado y domingo si la llevan.
const DIAS_PLURAL = [
  "domingos",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
];

function normalizar(nombre: string | null | undefined): string {
  return (nombre ?? "").trim().toLowerCase();
}

/** true si este consultorio atiende por ventana. */
export function atiendePorFranja(nombreConsultorio: string | null | undefined): boolean {
  return normalizar(nombreConsultorio) === CONSULTORIO_CON_FRANJAS;
}

/**
 * Solo la entrega se maneja por ventana. El estudio de pisada, si alguna vez se
 * hace ahi, sigue con hora exacta.
 */
export function usaFranja(
  nombreConsultorio: string | null | undefined,
  tipo: string | null | undefined
): boolean {
  return atiendePorFranja(nombreConsultorio) && tipo === "entrega";
}

/** Las franjas del consultorio, en orden de dia. Vacio si no trabaja asi. */
export function franjasDe(nombreConsultorio: string | null | undefined): Franja[] {
  return atiendePorFranja(nombreConsultorio) ? FRANJAS : [];
}

/**
 * La franja que corresponde a esa fecha, o null si ese dia no se atiende.
 * La fecha se lee en UTC para que no dependa de la zona horaria del navegador.
 */
export function franjaDe(
  nombreConsultorio: string | null | undefined,
  fecha: string
): Franja | null {
  if (!atiendePorFranja(nombreConsultorio) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const dia = new Date(fecha + "T00:00:00Z").getUTCDay();
  return FRANJAS.find((f) => f.dia === dia) ?? null;
}

/** "sábados de 08:30 a 11:00 y martes de 11:30 a 15:30", para explicarlo en pantalla. */
export function describirFranjas(nombreConsultorio: string | null | undefined): string {
  const fs = franjasDe(nombreConsultorio);
  if (fs.length === 0) return "";
  return fs
    .map((f) => `${DIAS_PLURAL[f.dia]} de ${f.desde} a ${f.hasta}`)
    .join(" y ");
}

/** Lo que se le dice al paciente en el recordatorio, en lugar de la hora. */
export function textoDeFranja(desde: string, hasta: string): string {
  return `entre las ${desde.slice(0, 5)} y las ${hasta.slice(0, 5)}`;
}
