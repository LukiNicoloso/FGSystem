"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearPaciente(formData: FormData) {
  const supabase = await createClient();
  const deporte = formData.get("deporte") === "on";
  const { error } = await supabase.from("pacientes").insert({
    nombre: formData.get("nombre"),
    celular: formData.get("celular"),
    consultorio_id: formData.get("consultorio_id") || null,
    edad: formData.get("edad") ? Number(formData.get("edad")) : null,
    deporte,
    deporte_descripcion: deporte ? (formData.get("deporte_descripcion") || null) : null,
    diabetico: formData.get("diabetico") === "on",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/pacientes");
}

export async function editarPaciente(id: string, formData: FormData) {
  const supabase = await createClient();
  const deporte = formData.get("deporte") === "on";
  const { error } = await supabase
    .from("pacientes")
    .update({
      nombre: formData.get("nombre"),
      celular: formData.get("celular"),
      consultorio_id: formData.get("consultorio_id") || null,
      edad: formData.get("edad") ? Number(formData.get("edad")) : null,
      deporte,
      deporte_descripcion: deporte ? (formData.get("deporte_descripcion") || null) : null,
      diabetico: formData.get("diabetico") === "on",
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pacientes");
}

export async function eliminarPaciente(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pacientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pacientes");
}
