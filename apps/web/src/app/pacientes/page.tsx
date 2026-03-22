import { createClient } from "@supabase/supabase-js";
import PacientesClient from "./PacientesClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PacientesPage() {
  const [{ data: pacientes }, { data: consultorios }] = await Promise.all([
    supabase.from("pacientes").select("*, consultorios(id, nombre)").order("nombre"),
    supabase.from("consultorios").select("id, nombre").order("nombre"),
  ]);

  return (
    <PacientesClient
      pacientes={pacientes ?? []}
      consultorios={consultorios ?? []}
    />
  );
}
