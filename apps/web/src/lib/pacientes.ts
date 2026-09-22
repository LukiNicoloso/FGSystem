import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Los pacientes como los necesita el alta de plantillas: ademas del nombre, el
 * precio del consultorio al que pertenecen, para poder sugerir el monto del alta
 * sin que haya que elegir el consultorio a mano.
 */
export type PacienteParaAlta = {
  id: string;
  nombre: string;
  /** El precio de un par en su consultorio. null si no tiene consultorio o precio. */
  precio_por_par: number | null;
};

type Fila = {
  id: string;
  nombre: string;
  consultorios: { precio_por_par: number | null } | null;
};

/** Se usa desde las dos pantallas que abren el formulario de plantillas. */
export async function pacientesParaAlta(
  supabase: SupabaseClient
): Promise<PacienteParaAlta[]> {
  const { data } = await supabase
    .from("pacientes")
    .select("id, nombre, consultorios(precio_por_par)")
    .order("nombre");

  return ((data ?? []) as unknown as Fila[]).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio_por_par: p.consultorios?.precio_por_par ?? null,
  }));
}
