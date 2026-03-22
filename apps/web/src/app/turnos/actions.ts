"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function crearTurno(formData: FormData) {
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
  const { error } = await supabase.from("turnos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/turnos");
}
