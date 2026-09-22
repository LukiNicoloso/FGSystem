"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { faltantesParaRecordatorio, FIRMA_POR_DEFECTO } from "@/lib/recordatorios";
import { parsearPesos } from "@/lib/precios";

function texto(formData: FormData, campo: string): string | null {
  const valor = (formData.get(campo) as string | null)?.trim();
  return valor ? valor : null;
}

export async function crearConsultorio(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("consultorios").insert({
    nombre: formData.get("nombre"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/consultorios");
}

/**
 * Guarda la ficha completa: datos del consultorio y configuracion del recordatorio.
 */
export async function guardarConfiguracionConsultorio(id: string, formData: FormData) {
  const supabase = await createClient();

  const nombre = texto(formData, "nombre");
  if (!nombre) throw new Error("El nombre no puede quedar vacío");

  const direccion = texto(formData, "direccion");
  // Vacio es un precio sin cargar, no un precio de cero: al alta le queda el monto
  // en blanco para completar a mano en vez de sugerirle $0.
  const precioTexto = texto(formData, "precio_por_par");
  const precio_por_par = precioTexto === null ? null : parsearPesos(precioTexto);
  if (precioTexto !== null && precio_por_par === null) {
    throw new Error("El precio por par tiene que ser un número. Ej: 100000");
  }
  const recordatorio_firma = texto(formData, "recordatorio_firma") ?? FIRMA_POR_DEFECTO;
  const telefono_avisos = texto(formData, "telefono_avisos");
  const recordatorio_estudio_activo = formData.get("recordatorio_estudio_activo") === "true";
  const recordatorio_entrega_activo = formData.get("recordatorio_entrega_activo") === "true";

  // Sin direccion la plantilla se enviaria incompleta, asi que no dejamos prender
  // ningun recordatorio. El formulario ya lo impide; esto cubre el resto.
  if (recordatorio_estudio_activo || recordatorio_entrega_activo) {
    const faltan = faltantesParaRecordatorio({ direccion });
    if (faltan.length > 0) {
      throw new Error(
        `Para activar los recordatorios falta cargar ${faltan.join(" y ")}.`
      );
    }
  }

  const { error } = await supabase
    .from("consultorios")
    .update({
      nombre,
      direccion,
      precio_por_par,
      recordatorio_estudio_activo,
      recordatorio_entrega_activo,
      recordatorio_firma,
      telefono_avisos,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/consultorios");
  revalidatePath(`/consultorios/${id}`);
}

export async function eliminarConsultorio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("consultorios").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/consultorios");
}
