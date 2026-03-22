"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function subirFoto(supabase: Awaited<ReturnType<typeof createClient>>, foto: File): Promise<string | null> {
  if (!foto || foto.size === 0) return null;
  const ext = foto.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("Plantillas").upload(path, foto);
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("Plantillas").getPublicUrl(path);
  return data.publicUrl;
}

export async function crearPlantilla(formData: FormData) {
  const supabase = await createClient();
  const foto = formData.get("foto") as File | null;
  const foto_url = foto && foto.size > 0 ? await subirFoto(supabase, foto) : null;

  const renovacion = new Date();
  renovacion.setMonth(renovacion.getMonth() + 10);
  const fecha_renovacion = renovacion.toISOString().split("T")[0];

  const { error } = await supabase.from("plantillas").insert({
    paciente_id: formData.get("paciente_id"),
    estado: "entregada",
    notas: formData.get("notas") || null,
    fecha_entrega: formData.get("fecha_entrega") || null,
    fecha_renovacion,
    foto_url,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
}

export async function editarPlantilla(id: string, formData: FormData) {
  const supabase = await createClient();
  const foto = formData.get("foto") as File | null;
  const foto_url = foto && foto.size > 0 ? await subirFoto(supabase, foto) : undefined;

  const update: Record<string, unknown> = {
    paciente_id: formData.get("paciente_id"),
    estado: "entregada",
    notas: formData.get("notas") || null,
    fecha_entrega: formData.get("fecha_entrega") || null,
  };
  if (foto_url !== undefined) update.foto_url = foto_url;

  const { error } = await supabase.from("plantillas").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
}

export async function eliminarPlantilla(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("plantillas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
}
