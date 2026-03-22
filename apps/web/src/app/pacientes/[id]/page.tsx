import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import HistorialActions from "./HistorialActions";

const estadoConfig: Record<string, { label: string; className: string }> = {
  en_taller: { label: "En taller", className: "bg-orange-100 text-orange-700" },
  lista_para_entrega: { label: "Lista para entrega", className: "bg-blue-100 text-blue-700" },
  entregada: { label: "Entregada", className: "bg-green-100 text-green-700" },
  renovacion_pendiente: { label: "Renovación pendiente", className: "bg-purple-100 text-purple-700" },
};

function diasParaRenovacion(fechaEntrega: string | null, fechaCreacion: string): { dias: number; fecha: string } {
  const base = fechaEntrega ? new Date(fechaEntrega + "T00:00:00") : new Date(fechaCreacion);
  const renovacion = new Date(base);
  renovacion.setFullYear(renovacion.getFullYear() + 1);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((renovacion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return { dias, fecha: renovacion.toLocaleDateString("es-AR") };
}

export default async function HistorialPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: paciente }, { data: plantillas }, { data: todosPacientes }] = await Promise.all([
    supabase
      .from("pacientes")
      .select("*, consultorios(nombre)")
      .eq("id", id)
      .single(),
    supabase
      .from("plantillas")
      .select("*")
      .eq("paciente_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("pacientes").select("id, nombre").order("nombre"),
  ]);

  if (!paciente) notFound();

  const consultorio = (paciente.consultorios as { nombre: string } | null)?.nombre;

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <Link href="/pacientes" className="text-sm text-blue-600 hover:underline">
          ← Volver a pacientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{paciente.nombre}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Historial de plantillas</p>
      </div>

      {/* Info del paciente */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs mb-0.5">DNI</p>
          <p className="font-medium text-gray-900">{paciente.dni ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Edad</p>
          <p className="font-medium text-gray-900">{paciente.edad ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Celular</p>
          <p className="font-medium text-gray-900">{paciente.celular}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Consultorio</p>
          <p className="font-medium text-gray-900">{consultorio ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">Condiciones</p>
          <div className="flex gap-1 flex-wrap mt-0.5">
            {paciente.diabetico && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Diabético</span>
            )}
            {paciente.deporte && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {paciente.deporte_descripcion || "Deporte"}
              </span>
            )}
            {!paciente.diabetico && !paciente.deporte && <span className="text-gray-400">—</span>}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{plantillas?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Plantillas realizadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">
            {plantillas?.filter((p) => p.estado === "entregada").length ?? 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Entregadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-orange-700">
            {plantillas?.filter((p) => p.estado === "en_taller" || p.estado === "lista_para_entrega").length ?? 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">En proceso</p>
        </div>
      </div>

      {/* Historial */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Historial completo</h2>
        <HistorialActions pacienteId={id} pacientes={todosPacientes ?? []} />
      </div>
      {!plantillas || plantillas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
          <p className="text-3xl mb-2">👟</p>
          <p className="text-sm">Este paciente no tiene plantillas registradas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha alta</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Entrega</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Renovación</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Tiempo restante</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Notas</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Foto pisada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plantillas.map((p) => {
                const config = estadoConfig[p.estado] ?? { label: p.estado, className: "bg-gray-100 text-gray-600" };
                const renovacion = diasParaRenovacion(p.fecha_entrega, p.created_at);
                const soloEntregada = p.estado === "entregada";

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(p.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.fecha_entrega
                        ? new Date(p.fecha_entrega + "T00:00:00").toLocaleDateString("es-AR")
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {soloEntregada ? renovacion.fecha : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {soloEntregada ? (
                        renovacion.dias < 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Vencida hace {Math.abs(renovacion.dias)} días
                          </span>
                        ) : renovacion.dias <= 30 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            {renovacion.dias} días
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {renovacion.dias} días
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs">
                      {p.notas ? (
                        <span className="block whitespace-pre-wrap text-xs">{p.notas}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.foto_url ? (
                        <a href={p.foto_url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.foto_url} alt="Pisada" className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
