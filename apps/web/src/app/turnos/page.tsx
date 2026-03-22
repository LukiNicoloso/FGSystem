import { createClient } from "@supabase/supabase-js";
import TurnosClient from "./TurnosClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function TurnosPage() {
  const [{ data: turnos }, { data: pacientes }, { data: consultorios }] = await Promise.all([
    supabase
      .from("turnos")
      .select("*, pacientes(id, nombre), consultorios(id, nombre)")
      .order("fecha", { ascending: false })
      .order("hora", { ascending: true }),
    supabase.from("pacientes").select("id, nombre").order("nombre"),
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
