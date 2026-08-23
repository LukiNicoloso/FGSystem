import { createClient } from "@/lib/supabase/server";
import SeguimientoGrid from "./SeguimientoGrid";

export const dynamic = "force-dynamic";

const DIAS_AVISO = 15;

type PlantillaRecencia = {
  id: string;
  paciente_id: string;
  fecha_entrega: string | null;
  created_at: string;
};

// Que tan actual es una plantilla: vale la fecha de entrega y, si todavia no se
// entrego, la fecha en que se cargo.
function fechaDeReferencia(p: PlantillaRecencia) {
  return p.fecha_entrega ?? p.created_at.slice(0, 10);
}

function esMasReciente(a: PlantillaRecencia, b: PlantillaRecencia) {
  const fa = fechaDeReferencia(a);
  const fb = fechaDeReferencia(b);
  if (fa !== fb) return fa > fb;
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
      .select("id, paciente_id, fecha_entrega, created_at")
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
