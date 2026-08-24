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

  const paciente_id = formData.get("paciente_id") as string;
  const es_renovacion = formData.get("es_renovacion") === "true";

  const { data: nueva, error } = await supabase.from("plantillas").insert({
    paciente_id,
    estado: "entregada",
    notas: formData.get("notas") || null,
    fecha_entrega: formData.get("fecha_entrega") || null,
    fecha_renovacion,
    foto_url,
    es_renovacion,
  }).select("id").single();
  if (error) throw new Error(error.message);

  // La renovacion reemplaza a las plantillas anteriores: su fecha_renovacion quedo
  // obsoleta, asi que salen de seguimiento y la vigente pasa a ser la que acabamos
  // de crear. Solo cerramos las que seguian abiertas, sin pisar contactos ya hechos.
  if (es_renovacion && nueva) {
    // El .select() nos devuelve las filas que realmente se actualizaron: sin el,
    // una politica de RLS que filtre el update lo deja en cero sin devolver error
    // y el cierre falla en silencio.
    const { data: cerradas, error: cierreError } = await supabase
      .from("plantillas")
      .update({ estado_contacto: "renovado" })
      .eq("paciente_id", paciente_id)
      .neq("id", nueva.id)
      .or("estado_contacto.is.null,estado_contacto.eq.pendiente")
      .select("id");

    // Si esto falla no cortamos el alta: la plantilla nueva ya quedo guardada y el
    // seguimiento igual filtra por la ultima plantilla de cada paciente.
    if (cierreError) {
      console.error(`[renovacion ${nueva.id}] fallo el cierre de plantillas anteriores:`, cierreError.message);
    } else {
      console.log(`[renovacion ${nueva.id}] plantillas anteriores cerradas: ${cerradas?.length ?? 0}`);
    }
  }

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
