import { createClient } from "@/lib/supabase/server";
import CalendarioTurnos from "./CalendarioTurnos";

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const supabase = await createClient();

  const hoy = new Date();
  const mesStr = mes ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = mesStr.split("-").map(Number);

  const inicioMes = `${year}-${String(month).padStart(2, "0")}-01`;
  const ultimoDia = new Date(year, month, 0).getDate();
  const finMes = `${year}-${String(month).padStart(2, "0")}-${ultimoDia}`;

  const [{ data: turnos }, { data: pacientes }, { data: consultorios }] = await Promise.all([
    supabase
      .from("turnos")
      .select("*, pacientes(id, nombre, dni), consultorios(id, nombre)")
      .gte("fecha", inicioMes)
      .lte("fecha", finMes)
      .order("hora", { ascending: true }),
    supabase.from("pacientes").select("id, nombre, dni").order("nombre"),
    supabase.from("consultorios").select("id, nombre").order("nombre"),
  ]);

  return (
    <CalendarioTurnos
      turnos={turnos ?? []}
      pacientes={pacientes ?? []}
      consultorios={consultorios ?? []}
      mesStr={mesStr}
    />
  );
}
