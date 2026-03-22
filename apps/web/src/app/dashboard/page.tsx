import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString();

  const [
    { count: pacientesMes },
    { data: pacientesPorConsultorio },
    { count: estudiosporHacer },
    { count: plantillasEnTaller },
    { count: plantillasPorEntregar },
  ] = await Promise.all([
    supabase
      .from("pacientes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", inicioMes)
      .lte("created_at", finMes),
    supabase
      .from("pacientes")
      .select("consultorios(nombre)")
      .not("consultorio_id", "is", null),
    supabase
      .from("turnos")
      .select("*", { count: "exact", head: true })
      .in("estado", ["pendiente", "confirmado"]),
    supabase
      .from("plantillas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "en_taller"),
    supabase
      .from("plantillas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "lista_para_entrega"),
  ]);

  // Calcular centro con más pacientes
  const conteo: Record<string, number> = {};
  for (const p of pacientesPorConsultorio ?? []) {
    const nombre = (p.consultorios as { nombre: string } | null)?.nombre;
    if (nombre) conteo[nombre] = (conteo[nombre] ?? 0) + 1;
  }
  const centroTop = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

  const mesNombre = ahora.toLocaleString("es-AR", { month: "long", year: "numeric" });

  const cards = [
    {
      titulo: "Pacientes nuevos en " + mesNombre,
      valor: pacientesMes ?? 0,
      icon: "👤",
      color: "bg-blue-50 text-blue-700",
      iconBg: "bg-blue-100",
    },
    {
      titulo: "Centro con más pacientes",
      valor: centroTop ? centroTop[0] : "—",
      subtitulo: centroTop ? `${centroTop[1]} paciente${centroTop[1] !== 1 ? "s" : ""}` : undefined,
      icon: "🏥",
      color: "bg-purple-50 text-purple-700",
      iconBg: "bg-purple-100",
    },
    {
      titulo: "Estudios por realizar",
      valor: estudiosporHacer ?? 0,
      icon: "📅",
      color: "bg-yellow-50 text-yellow-700",
      iconBg: "bg-yellow-100",
    },
    {
      titulo: "Plantillas en taller",
      valor: plantillasEnTaller ?? 0,
      icon: "🔧",
      color: "bg-orange-50 text-orange-700",
      iconBg: "bg-orange-100",
    },
    {
      titulo: "Plantillas por entregar",
      valor: plantillasPorEntregar ?? 0,
      icon: "📦",
      color: "bg-green-50 text-green-700",
      iconBg: "bg-green-100",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <div
            key={card.titulo}
            className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4"
          >
            <div className={`${card.iconBg} rounded-xl p-3 text-2xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.titulo}</p>
              <p className={`text-3xl font-bold mt-1 ${card.color.split(" ")[1]}`}>
                {card.valor}
              </p>
              {card.subtitulo && (
                <p className="text-xs text-gray-400 mt-0.5">{card.subtitulo}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
