"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearPlantilla(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("plantillas").insert({
    paciente_id: formData.get("paciente_id"),
    estado: formData.get("estado") || "en_taller",
    notas: formData.get("notas") || null,
    fecha_entrega: formData.get("fecha_entrega") || null,
    fecha_renovacion: formData.get("fecha_renovacion") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
}

export async function editarPlantilla(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("plantillas")
    .update({
      paciente_id: formData.get("paciente_id"),
      estado: formData.get("estado"),
      notas: formData.get("notas") || null,
      fecha_entrega: formData.get("fecha_entrega") || null,
      fecha_renovacion: formData.get("fecha_renovacion") || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
}

export async function eliminarPlantilla(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("plantillas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
}
