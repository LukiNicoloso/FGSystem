"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { subirFotoCloudinary } from "@/lib/cloudinary";

function toFotoUrl(urls: string[]): string | null {
  if (urls.length === 0) return null;
  return urls.length === 1 ? urls[0] : JSON.stringify(urls);
}

export async function crearPlantilla(formData: FormData) {
  const supabase = await createClient();
  const fotos = formData.getAll("foto") as File[];
  const validas = fotos.filter(f => f && f.size > 0);
  const urls = validas.length > 0 ? await Promise.all(validas.map(f => subirFotoCloudinary(f))) : [];
  const foto_url = toFotoUrl(urls);

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

  // Fotos existentes que el usuario decidió conservar
  const remainingStr = formData.get("remaining_fotos") as string | null;
  const remaining: string[] = remainingStr ? JSON.parse(remainingStr) : [];

  // Nuevas fotos subidas
  const fotos = formData.getAll("foto") as File[];
  const nuevas = fotos.filter(f => f && f.size > 0);
  const nuevasUrls = nuevas.length > 0 ? await Promise.all(nuevas.map(f => subirFotoCloudinary(f))) : [];

  const allUrls = [...remaining, ...nuevasUrls];

  const { error } = await supabase.from("plantillas").update({
    paciente_id: formData.get("paciente_id"),
    estado: "entregada",
    notas: formData.get("notas") || null,
    fecha_entrega: formData.get("fecha_entrega") || null,
    foto_url: toFotoUrl(allUrls),
  }).eq("id", id);
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
