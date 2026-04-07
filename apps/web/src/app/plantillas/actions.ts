"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { subirFotoCloudinary } from "@/lib/cloudinary";

async function subirFotos(fotos: File[]): Promise<string | null> {
  const validas = fotos.filter(f => f && f.size > 0);
  if (validas.length === 0) return null;
  const urls = await Promise.all(validas.map(f => subirFotoCloudinary(f)));
  return urls.length === 1 ? urls[0] : JSON.stringify(urls);
}

export async function crearPlantilla(formData: FormData) {
  const supabase = await createClient();
  const fotos = formData.getAll("foto") as File[];
  const foto_url = await subirFotos(fotos);

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
  const fotos = formData.getAll("foto") as File[];
  const foto_url = await subirFotos(fotos);

  const update: Record<string, unknown> = {
    paciente_id: formData.get("paciente_id"),
    estado: "entregada",
    notas: formData.get("notas") || null,
    fecha_entrega: formData.get("fecha_entrega") || null,
  };
  if (foto_url !== null) update.foto_url = foto_url;

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
