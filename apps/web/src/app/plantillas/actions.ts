"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { subirFotoCloudinary } from "@/lib/cloudinary";

async function subirFoto(foto: File): Promise<string | null> {
  if (!foto || foto.size === 0) return null;
  return subirFotoCloudinary(foto);
}

export async function crearPlantilla(formData: FormData) {
  const supabase = await createClient();
  const foto = formData.get("foto") as File | null;
  const foto_url = foto && foto.size > 0 ? await subirFoto(foto) : null;

  const fechaEntrega = formData.get("fecha_entrega") as string | null;
  const baseRenovacion = fechaEntrega ? new Date(fechaEntrega + "T00:00:00") : new Date();
  baseRenovacion.setMonth(baseRenovacion.getMonth() + 10);
  const fecha_renovacion = baseRenovacion.toISOString().split("T")[0];

  const { error } = await supabase.from("plantillas").insert({
    paciente_id: formData.get("paciente_id"),
    estado: "entregada",
    notas: formData.get("notas") || null,
    fecha_entrega: formData.get("fecha_entrega") || null,
    fecha_renovacion,
    foto_url,
    es_renovacion: formData.get("es_renovacion") === "true",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/plantillas");
  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
}

export async function editarPlantilla(id: string, formData: FormData) {
  const supabase = await createClient();
  const foto = formData.get("foto") as File | null;
  const foto_url = foto && foto.size > 0 ? await subirFoto(foto) : undefined;

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
