"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { subirFotoCloudinary } from "@/lib/cloudinary";
import { normalizarCelular, FORMATO_ESPERADO } from "@/lib/telefono";

/**
 * El celular se valida al guardar para no arrastrar numeros que despues no se
 * puedan cruzar con las respuestas de WhatsApp. Guardamos los dos formatos: el que
 * escribio la usuaria y el normalizado, que es con el que trabaja Twilio.
 */
function celularValidado(formData: FormData): { celular: string; celular_e164: string } {
  const celular = ((formData.get("celular") as string | null) ?? "").trim();
  const r = normalizarCelular(celular);
  if (!r.ok) {
    throw new Error(`El celular no es válido (${r.motivo}). ${FORMATO_ESPERADO}`);
  }
  return { celular, celular_e164: r.e164 };
}

export async function crearPaciente(formData: FormData) {
  const supabase = await createClient();
  const deporte = formData.get("deporte") === "on";

  const { celular, celular_e164 } = celularValidado(formData);

  const { data: paciente, error } = await supabase.from("pacientes").insert({
    nombre: formData.get("nombre"),
    dni: formData.get("dni") || null,
    celular,
    celular_e164,
    consultorio_id: formData.get("consultorio_id") || null,
    edad: formData.get("edad") ? Number(formData.get("edad")) : null,
    deporte,
    deporte_descripcion: deporte ? (formData.get("deporte_descripcion") || null) : null,
    diabetico: formData.get("diabetico") === "on",
    sexo: formData.get("sexo") || null,
  }).select("id").single();
  if (error) throw new Error(error.message);

  // Crear plantilla inicial
  const fechaEntrega = formData.get("fecha_entrega") as string | null;
  const foto = formData.get("foto_pisada") as File | null;

  const fotos = formData.getAll("foto_pisada") as File[];
  const fotosValidas = fotos.filter(f => f && f.size > 0);
  let foto_url: string | null = null;
  if (fotosValidas.length > 0) {
    const urls = await Promise.all(fotosValidas.map(f => subirFotoCloudinary(f)));
    foto_url = JSON.stringify(urls);
  }

  const baseRenovacion = fechaEntrega ? new Date(fechaEntrega + "T00:00:00") : new Date();
  baseRenovacion.setMonth(baseRenovacion.getMonth() + 10);
  const fecha_renovacion = baseRenovacion.toISOString().split("T")[0];

  const { error: plantillaError } = await supabase.from("plantillas").insert({
    paciente_id: paciente.id,
    estado: fechaEntrega ? "entregada" : "en_taller",
    fecha_entrega: fechaEntrega || null,
    fecha_renovacion,
    foto_url,
    es_renovacion: false,
  });
  if (plantillaError) throw new Error(plantillaError.message);

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
}

export async function editarPaciente(id: string, formData: FormData) {
  const supabase = await createClient();
  const deporte = formData.get("deporte") === "on";
  const { celular, celular_e164 } = celularValidado(formData);
  const { error } = await supabase
    .from("pacientes")
    .update({
      nombre: formData.get("nombre"),
      dni: formData.get("dni") || null,
      celular,
      celular_e164,
      consultorio_id: formData.get("consultorio_id") || null,
      edad: formData.get("edad") ? Number(formData.get("edad")) : null,
      deporte,
      deporte_descripcion: deporte ? (formData.get("deporte_descripcion") || null) : null,
      diabetico: formData.get("diabetico") === "on",
      sexo: formData.get("sexo") || null,
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
