import { createClient } from "@/lib/supabase/server";
import TurnosClient from "./TurnosClient";

export default async function TurnosPage() {
  const supabase = await createClient();

  const [{ data: turnos }, { data: pacientes }, { data: consultorios }] = await Promise.all([
    supabase
      .from("turnos")
      .select("*, pacientes(id, nombre), consultorios(id, nombre)")
      .order("fecha", { ascending: false })
      .order("hora", { ascending: true }),
    supabase.from("pacientes").select("id, nombre, dni").order("nombre"),
    supabase.from("consultorios").select("id, nombre").order("nombre"),
  ]);

  return (
    <TurnosClient
      turnos={turnos ?? []}
      pacientes={pacientes ?? []}
      consultorios={consultorios ?? []}
    />
  );
}
