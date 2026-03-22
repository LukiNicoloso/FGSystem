import { createClient } from "@/lib/supabase/server";
import PlantillasClient from "./PlantillasClient";

export default async function PlantillasPage() {
  const supabase = await createClient();

  const [{ data: plantillas }, { data: pacientes }] = await Promise.all([
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre)")
      .order("created_at", { ascending: false }),
    supabase.from("pacientes").select("id, nombre").order("nombre"),
  ]);

  return (
    <PlantillasClient
      plantillas={plantillas ?? []}
      pacientes={pacientes ?? []}
    />
  );
}
