"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function crearPlantilla(formData: FormData) {
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
  const { error } = await supabase.from("plantillas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
}
