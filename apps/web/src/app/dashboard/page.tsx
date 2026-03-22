import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().split("T")[0];

  const en15dias = new Date(ahora);
  en15dias.setDate(en15dias.getDate() + 15);
  const en15diasStr = en15dias.toISOString().split("T")[0];

  const [
    { data: plantillasProximas },
    { data: plantillasVencidas },
  ] = await Promise.all([
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre)")
      .gte("fecha_renovacion", hoy)
      .lte("fecha_renovacion", en15diasStr)
      .order("fecha_renovacion", { ascending: true }),
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre)")
      .lt("fecha_renovacion", hoy)
      .order("fecha_renovacion", { ascending: true }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general del sistema</p>
      </div>

      {/* Plantillas próximas a vencer */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plantillas próximas a vencer
          <span className="ml-2 text-sm font-normal text-gray-400">(próximos 15 días)</span>
        </h2>
        {!plantillasProximas || plantillasProximas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-400">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm">No hay plantillas por vencer en los próximos 15 días.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Vence</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Días restantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plantillasProximas.map((p) => {
                  const paciente = p.pacientes as { id: string; nombre: string } | null;
                  const dias = Math.round(
                    (new Date(p.fecha_renovacion + "T00:00:00").getTime() - new Date(hoy + "T00:00:00").getTime()) /
                    (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {paciente ? (
                          <Link href={`/pacientes/${paciente.id}`} className="hover:text-blue-600 hover:underline">
                            {paciente.nombre}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {new Date(p.fecha_renovacion + "T00:00:00").toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          {dias === 0 ? "Hoy" : `${dias} día${dias !== 1 ? "s" : ""}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plantillas vencidas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plantillas vencidas</h2>
        {!plantillasVencidas || plantillasVencidas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-10 text-center text-gray-400">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm">No hay plantillas vencidas.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Venció</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Hace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plantillasVencidas.map((p) => {
                  const paciente = p.pacientes as { id: string; nombre: string } | null;
                  const dias = Math.round(
                    (new Date(hoy + "T00:00:00").getTime() - new Date(p.fecha_renovacion + "T00:00:00").getTime()) /
                    (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {paciente ? (
                          <Link href={`/pacientes/${paciente.id}`} className="hover:text-blue-600 hover:underline">
                            {paciente.nombre}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {new Date(p.fecha_renovacion + "T00:00:00").toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Hace {dias} día{dias !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
