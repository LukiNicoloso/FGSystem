import { createClient } from "@/lib/supabase/server";
import PacientesClient from "./PacientesClient";

export const revalidate = 30;

export default async function PacientesPage() {
  const supabase = await createClient();

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
