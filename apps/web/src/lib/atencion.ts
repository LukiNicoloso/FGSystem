/**
 * Quien atendio cada alta.
 *
 * Sirve para separar cuanto gana cada uno por mes. Vive en la plantilla y no en el
 * paciente porque la plata se cuenta por alta: un mismo paciente puede tener el
 * estudio hecho por una persona y la renovacion por otra.
 */

export const QUIENES = [
  { value: "noe", label: "Noe" },
  { value: "nico", label: "Nico" },
] as const;

export type Quien = (typeof QUIENES)[number]["value"];

/** La mayoria de las altas las atiende Noe, asi que arranca elegida. */
export const QUIEN_POR_DEFECTO: Quien = "noe";

export function esQuien(v: unknown): v is Quien {
  return QUIENES.some((q) => q.value === v);
}

export function etiquetaDeQuien(v: string | null | undefined): string {
  return QUIENES.find((q) => q.value === v)?.label ?? "Sin asignar";
}

/** Las opciones del filtro del panel, con "todos" adelante. */
export const FILTROS = [{ value: "todos", label: "Todos" }, ...QUIENES] as const;
export type FiltroQuien = (typeof FILTROS)[number]["value"];

/** El panel arranca mostrando lo de Noe, que es lo que se queria mirar. */
export const FILTRO_POR_DEFECTO: FiltroQuien = "noe";

export function esFiltro(v: unknown): v is FiltroQuien {
  return FILTROS.some((f) => f.value === v);
}
