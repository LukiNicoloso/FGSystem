"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { subirFotoCloudinary } from "@/lib/cloudinary";
import { normalizarCelular, FORMATO_ESPERADO } from "@/lib/telefono";
import { paresYMontoDeForm } from "@/lib/precios";

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
    // El cobro se carga en el mismo alta: antes habia que crear el paciente y
    // despues entrar a editar su plantilla para poder poner el monto.
    ...paresYMontoDeForm(formData),
  });
  if (plantillaError) throw new Error(plantillaError.message);

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
}

/**
 * Alta minima desde la pantalla de Turnos: nombre, DNI y celular, sin plantilla.
 *
 * El alta completa crea ademas la primera plantilla con su monto y quien atendio.
 * Aca eso sobra: se esta agendando un turno para alguien que todavia no existe en
 * el sistema, y frenar a cargar precios en ese momento es la friccion que se
 * queria sacar. La plantilla se carga despues, cuando haya algo que cobrar.
 *
 * Devuelve el paciente para poder seleccionarlo en el turno sin recargar.
 */
export async function crearPacienteRapido(
  formData: FormData
): Promise<{ id: string; nombre: string; dni: string | null; consultorio_id: string | null }> {
  const supabase = await createClient();

  const nombre = ((formData.get("nombre") as string | null) ?? "").trim();
  if (!nombre) throw new Error("El nombre no puede quedar vacío");

  const { celular, celular_e164 } = celularValidado(formData);

  const { data, error } = await supabase
    .from("pacientes")
    .insert({
      nombre,
      dni: (formData.get("dni") as string | null)?.trim() || null,
      celular,
      celular_e164,
    })
    .select("id, nombre, dni, consultorio_id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/pacientes");
  revalidatePath("/turnos");
  return data;
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
