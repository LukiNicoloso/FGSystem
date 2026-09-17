import { createClient } from "@/lib/supabase/server";
import SeguimientoGrid from "./SeguimientoGrid";
import TurnosDelDia from "./TurnosDelDia";
import ResumenDelMes from "./ResumenDelMes";
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

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/** "2026-09" -> "Septiembre 2026". Mismo formato que el calendario de turnos. */
function etiquetaDeMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

/** Corre un mes hacia adelante o atras sobre "YYYY-MM". */
function correrMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createClient();
  const { mes: mesParam } = await searchParams;

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

  // Altas del mes: created_at es timestamptz, asi que el corte va con el offset
  // argentino para que una plantilla cargada a las 22:00 del 31 no caiga en el mes
  // siguiente.
  const mesActual = hoy.slice(0, 7);
  // Se ignora un ?mes= con formato invalido en vez de romper la pantalla.
  const mesSeleccionado = /^\d{4}-\d{2}$/.test(mesParam ?? "") ? mesParam! : mesActual;
  const esMesActual = mesSeleccionado === mesActual;

  const inicioDeMes = `${mesSeleccionado}-01T00:00:00-03:00`;
  const finDeMes = `${correrMes(mesSeleccionado, 1)}-01T00:00:00-03:00`;
  const { data: altas } = await supabase
    .from("plantillas")
    .select("id, es_renovacion, pacientes(consultorios(nombre))")
    .gte("created_at", inicioDeMes)
    .lt("created_at", finDeMes);

  const conteo = new Map<string, number>();
  for (const a of (altas ?? []) as unknown as {
    es_renovacion: boolean | null;
    pacientes: { consultorios: { nombre: string } | null } | null;
  }[]) {
    const nombre = a.pacientes?.consultorios?.nombre?.trim() || "Sin consultorio";
    conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
  }
  const porConsultorio = [...conteo.entries()]
    .map(([nombre, altas]) => ({ nombre, altas }))
    .sort((a, b) => b.altas - a.altas || a.nombre.localeCompare(b.nombre));

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

  const turnos = (turnosHoy ?? []) as unknown as Parameters<typeof TurnosDelDia>[0]["turnos"];
  const turnosSinConfirmar = turnos.filter((t) => t.estado === "pendiente").length;
  // Vencida = su fecha de renovacion ya paso; las proximas a vencer no cuentan acá.
  const renovacionesVencidas = porContactar.filter(
    (p) => (p.fecha_renovacion as string | null) !== null && (p.fecha_renovacion as string) <= hoy
  ).length;

  const renovacionesDelMes = (altas ?? []).filter(
    (a) => (a as { es_renovacion?: boolean | null }).es_renovacion
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cómo viene el mes, los turnos de hoy y las renovaciones pendientes</p>
      </div>

      <ResumenDelMes
        mes={etiquetaDeMes(mesSeleccionado)}
        mesAnterior={correrMes(mesSeleccionado, -1)}
        mesSiguiente={esMesActual ? null : correrMes(mesSeleccionado, 1)}
        esMesActual={esMesActual}
        altasDelMes={(altas ?? []).length}
        renovacionesDelMes={renovacionesDelMes}
        porConsultorio={porConsultorio}
        turnosSinConfirmar={turnosSinConfirmar}
        renovacionesVencidas={renovacionesVencidas}
      />

      <TurnosDelDia turnos={turnos} hoy={hoy} />

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Renovaciones</h2>
      <SeguimientoGrid plantillas={porContactar as Parameters<typeof SeguimientoGrid>[0]["plantillas"]} hoy={hoy} />
    </div>
  );
}
