import { createClient } from "@/lib/supabase/server";
import PacientesClient from "./PacientesClient";

export const revalidate = 30;

export default async function PacientesPage() {
  const supabase = await createClient();

  const [{ data: pacientes }, { data: consultorios }] = await Promise.all([
    supabase.from("pacientes").select("*, consultorios(id, nombre)").order("nombre"),
    supabase.from("consultorios").select("id, nombre").order("nombre"),
  ]);

  // Sin celular_e164 el paciente no puede recibir recordatorios ni confirmar turnos.
  const sinNormalizar = (pacientes ?? []).filter((p) => !p.celular_e164).length;

  return (
    <PacientesClient
      pacientes={pacientes ?? []}
      consultorios={consultorios ?? []}
      sinNormalizar={sinNormalizar}
    />
  );
}
