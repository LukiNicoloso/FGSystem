"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarEstadoContacto(
  plantillaId: string,
  estado: "contactado" | "agendado" | "no_interesado"
) {
  const supabase = await createClient();
  const hoy = new Date().toISOString().split("T")[0];
  const update: Record<string, unknown> = { estado_contacto: estado };
  if (estado === "contactado") {
    update.fecha_contactado = hoy;
  }
  if (estado === "agendado") {
    update.fecha_agendado = hoy;
  }
  const { error } = await supabase.from("plantillas").update(update).eq("id", plantillaId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/pacientes");
}
