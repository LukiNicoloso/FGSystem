import { createClient } from "@supabase/supabase-js";
import PlantillasClient from "./PlantillasClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PlantillasPage() {
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
