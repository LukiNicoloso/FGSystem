"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearConsultorio(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("consultorios").insert({
    nombre: formData.get("nombre"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/consultorios");
}

export async function editarConsultorio(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultorios")
    .update({ nombre: formData.get("nombre") })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/consultorios");
}

export async function eliminarConsultorio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("consultorios").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/consultorios");
}
