"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearTurno(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("turnos").insert({
    paciente_id: formData.get("paciente_id"),
    consultorio_id: formData.get("consultorio_id") || null,
    fecha: formData.get("fecha"),
    hora: formData.get("hora"),
    estado: formData.get("estado") || "pendiente",
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
