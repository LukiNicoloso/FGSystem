import { createClient } from "@/lib/supabase/server";
import SeguimientoGrid from "./SeguimientoGrid";
import TurnosDelDia from "./TurnosDelDia";
import { fechaEnArgentina } from "@/lib/recordatorios";

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
  // En hora argentina: con la fecha UTC, despues de las 21:00 locales el sistema ya
  // consideraba que era el dia siguiente y mostraba los turnos equivocados.
  const hoy = fechaEnArgentina(ahora);
  const limite = new Date(hoy + "T00:00:00Z");
  limite.setUTCDate(limite.getUTCDate() + DIAS_AVISO);
  const limiteStr = limite.toISOString().split("T")[0];

  const { data: turnosHoy } = await supabase
    .from("turnos")
    .select(
      "id, hora, tipo, estado, respuesta_paciente, recordatorio_enviado, " +
        "pacientes(id, nombre), consultorios(nombre)"
    )
    .eq("fecha", hoy)
    .order("hora", { ascending: true });

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
        <p className="text-sm text-gray-500 mt-0.5">Turnos de hoy y renovaciones pendientes</p>
      </div>

      <TurnosDelDia
        turnos={(turnosHoy ?? []) as unknown as Parameters<typeof TurnosDelDia>[0]["turnos"]}
        hoy={hoy}
      />

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Renovaciones</h2>
      <SeguimientoGrid plantillas={porContactar as Parameters<typeof SeguimientoGrid>[0]["plantillas"]} hoy={hoy} />
    </div>
  );
}
