import { createClient } from "@/lib/supabase/server";
import SeguimientoGrid from "./SeguimientoGrid";

export const dynamic = "force-dynamic";

const DIAS_AVISO = 15;

type PlantillaRecencia = {
  id: string;
  paciente_id: string;
  created_at: string;
};

// La plantilla vigente de un paciente es la ultima que se cargo. Ordenamos por
// created_at y no por fecha_entrega a proposito: created_at siempre esta, no se
// puede backdatear y no depende de que la entrega este cargada. Con fecha_entrega
// una renovacion con entrega retroactiva quedaba tapada por la plantilla anterior
// y desaparecia de seguimiento sin dejar rastro.
function esMasReciente(a: PlantillaRecencia, b: PlantillaRecencia) {
  return a.created_at > b.created_at;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().split("T")[0];
  const limite = new Date(ahora);
  limite.setDate(limite.getDate() + DIAS_AVISO);
  const limiteStr = limite.toISOString().split("T")[0];

  const { data: candidatas } = await supabase
    .from("plantillas")
    .select("*, pacientes(id, nombre, celular, consultorios(nombre))")
    .lte("fecha_renovacion", limiteStr)
    .or("estado_contacto.is.null,estado_contacto.eq.pendiente")
    .order("fecha_renovacion", { ascending: true });

  // Un paciente que renovo arrastra la plantilla vieja vencida y la nueva vigente.
  // De cada paciente sigue en seguimiento unicamente su plantilla mas reciente, asi
  // no reclamamos una renovacion que ya se hizo.
  let porContactar = candidatas ?? [];
  const pacienteIds = [...new Set(porContactar.map((p) => p.paciente_id as string))];

  if (pacienteIds.length > 0) {
    const { data: todas } = await supabase
      .from("plantillas")
      .select("id, paciente_id, created_at")
      .in("paciente_id", pacienteIds);

    const ultimaPorPaciente = new Map<string, PlantillaRecencia>();
    for (const p of (todas ?? []) as PlantillaRecencia[]) {
      const actual = ultimaPorPaciente.get(p.paciente_id);
      if (!actual || esMasReciente(p, actual)) ultimaPorPaciente.set(p.paciente_id, p);
    }

    porContactar = porContactar.filter(
      (p) => ultimaPorPaciente.get(p.paciente_id as string)?.id === p.id
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
        <p className="text-sm text-gray-500 mt-0.5">Seguimiento de renovaciones</p>
      </div>
      <SeguimientoGrid plantillas={porContactar as Parameters<typeof SeguimientoGrid>[0]["plantillas"]} hoy={hoy} />
    </div>
  );
}
