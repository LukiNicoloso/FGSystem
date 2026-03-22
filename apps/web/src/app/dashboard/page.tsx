import { createClient } from "@/lib/supabase/server";

const estadoBadge: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-700",
  confirmado: "bg-green-100 text-green-700",
  cancelado: "bg-red-100 text-red-700",
  completado: "bg-gray-100 text-gray-700",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().split("T")[0];
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).toISOString();

  const [
    { count: pacientesMes },
    { data: pacientesPorConsultorio },
    { count: estudiosporHacer },
    { count: plantillasEnTaller },
    { count: plantillasPorEntregar },
    { data: proximosTurnos },
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
    supabase
      .from("turnos")
      .select("*, pacientes(nombre), consultorios(nombre)")
      .in("estado", ["pendiente", "confirmado"])
      .gte("fecha", hoy)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true })
      .limit(8),
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
      colorTexto: "text-blue-700",
      iconBg: "bg-blue-100",
    },
    {
      titulo: "Centro con más pacientes",
      valor: centroTop ? centroTop[0] : "—",
      subtitulo: centroTop ? `${centroTop[1]} paciente${centroTop[1] !== 1 ? "s" : ""}` : undefined,
      icon: "🏥",
      colorTexto: "text-purple-700",
      iconBg: "bg-purple-100",
    },
    {
      titulo: "Estudios por realizar",
      valor: estudiosporHacer ?? 0,
      icon: "📅",
      colorTexto: "text-yellow-700",
      iconBg: "bg-yellow-100",
    },
    {
      titulo: "Plantillas en taller",
      valor: plantillasEnTaller ?? 0,
      icon: "🔧",
      colorTexto: "text-orange-700",
      iconBg: "bg-orange-100",
    },
    {
      titulo: "Plantillas por entregar",
      valor: plantillasPorEntregar ?? 0,
      icon: "📦",
      colorTexto: "text-green-700",
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
          <div key={card.titulo} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
            <div className={`${card.iconBg} rounded-xl p-3 text-2xl`}>{card.icon}</div>
            <div>
              <p className="text-sm text-gray-500">{card.titulo}</p>
              <p className={`text-3xl font-bold mt-1 ${card.colorTexto}`}>{card.valor}</p>
              {card.subtitulo && <p className="text-xs text-gray-400 mt-0.5">{card.subtitulo}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Próximos turnos */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos turnos</h2>
        {!proximosTurnos || proximosTurnos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">No hay turnos próximos.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Hora</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Consultorio</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proximosTurnos.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {(t.pacientes as { nombre: string } | null)?.nombre ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(t.fecha + "T00:00:00").toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{t.hora.slice(0, 5)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {(t.consultorios as { nombre: string } | null)?.nombre ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[t.estado] ?? "bg-gray-100 text-gray-600"}`}>
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
