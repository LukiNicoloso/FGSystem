import { createClient } from "@/lib/supabase/server";
import PlantillasClient from "./PlantillasClient";
import { pacientesParaAlta } from "@/lib/pacientes";

export const revalidate = 30;

export default async function PlantillasPage() {
  const supabase = await createClient();

  const [{ data: plantillas }, pacientes] = await Promise.all([
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre)")
      .order("created_at", { ascending: false }),
    pacientesParaAlta(supabase),
  ]);

  return (
    <PlantillasClient
      plantillas={plantillas ?? []}
      pacientes={pacientes}
    />
  );
}
