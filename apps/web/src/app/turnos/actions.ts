"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearTurno(formData: FormData) {
  const supabase = await createClient();
  // Todo turno nace pendiente: lo confirma el paciente respondiendo el recordatorio.
  const { error } = await supabase.from("turnos").insert({
    paciente_id: formData.get("paciente_id"),
    consultorio_id: formData.get("consultorio_id") || null,
    fecha: formData.get("fecha"),
    hora: formData.get("hora"),
    // Solo los turnos por ventana lo traen. Vacio es un turno con hora exacta.
    hora_fin: formData.get("hora_fin") || null,
    tipo: formData.get("tipo") || "estudio",
    estado: "pendiente",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/turnos");
}

export async function editarTurno(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("turnos")
    .update({
      paciente_id: formData.get("paciente_id"),
      consultorio_id: formData.get("consultorio_id") || null,
      fecha: formData.get("fecha"),
      hora: formData.get("hora"),
      // Se escribe siempre, tambien en null: si el turno deja de caer en una
      // franja, tiene que dejar de ser una ventana.
      hora_fin: formData.get("hora_fin") || null,
      tipo: formData.get("tipo") || "estudio",
      estado: formData.get("estado"),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/turnos");
}

export async function eliminarTurno(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("turnos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/turnos");
}
