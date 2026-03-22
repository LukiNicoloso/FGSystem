"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function crearPaciente(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const celular = formData.get("celular") as string;
  const consultorio_id = formData.get("consultorio_id") as string | null;

  const { error } = await supabase.from("pacientes").insert({
    nombre,
    celular,
    consultorio_id: consultorio_id || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/pacientes");
}

export async function editarPaciente(id: string, formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const celular = formData.get("celular") as string;
  const consultorio_id = formData.get("consultorio_id") as string | null;

  const { error } = await supabase
    .from("pacientes")
    .update({ nombre, celular, consultorio_id: consultorio_id || null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/pacientes");
}

export async function eliminarPaciente(id: string) {
  const { error } = await supabase.from("pacientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pacientes");
}
