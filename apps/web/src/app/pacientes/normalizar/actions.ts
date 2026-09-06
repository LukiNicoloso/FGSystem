"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { normalizarCelular } from "@/lib/telefono";

/**
 * Completa celular_e164 en los pacientes que todavia no lo tienen.
 *
 * Recalcula la normalizacion en el servidor en vez de confiar en lo que manda el
 * navegador: la pantalla es una vista previa, no la fuente de la verdad. Los que
 * no se pueden normalizar se dejan como estan para corregirlos a mano.
 */
export async function normalizarCelularesPendientes(): Promise<{
  actualizados: number;
  omitidos: number;
}> {
  const supabase = await createClient();

  const { data: pacientes, error } = await supabase
    .from("pacientes")
    .select("id, celular")
    .is("celular_e164", null);
  if (error) throw new Error(error.message);

  let actualizados = 0;
  let omitidos = 0;

  for (const p of pacientes ?? []) {
    const r = normalizarCelular(p.celular as string);
    if (!r.ok) {
      omitidos++;
      continue;
    }
    const { error: updateError } = await supabase
      .from("pacientes")
      .update({ celular_e164: r.e164 })
      .eq("id", p.id);
    if (updateError) throw new Error(updateError.message);
    actualizados++;
  }

  revalidatePath("/pacientes");
  revalidatePath("/pacientes/normalizar");
  return { actualizados, omitidos };
}
