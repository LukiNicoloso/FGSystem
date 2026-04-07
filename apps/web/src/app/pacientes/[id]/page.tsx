import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import HistorialActions from "./HistorialActions";
import FotoViewer from "./FotoViewer";
import PlantillaCardActions from "./PlantillaCardActions";

function diasParaRenovacion(fechaRenovacion: string | null, fechaEntrega: string | null, fechaCreacion: string): { dias: number; fecha: string } {
  let renovacion: Date;
  if (fechaRenovacion) {
    renovacion = new Date(fechaRenovacion + "T00:00:00");
  } else {
    const base = fechaEntrega ? new Date(fechaEntrega + "T00:00:00") : new Date(fechaCreacion);
    renovacion = new Date(base);
    renovacion.setMonth(renovacion.getMonth() + 10);
  }
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((renovacion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return { dias, fecha: renovacion.toLocaleDateString("es-AR") };
}

type Plantilla = {
  id: string;
  paciente_id: string;
  created_at: string;
  estado: string;
  es_renovacion: boolean;
  fecha_entrega: string | null;
  fecha_renovacion: string | null;
  fecha_contactado: string | null;
  fecha_agendado: string | null;
  estado_contacto: string | null;
  notas: string | null;
  foto_url: string | null;
};

type ActivityItem =
  | { tipo: "alta"; key: string; fecha: Date; plantilla: Plantilla }
  | { tipo: "alta_renovacion"; key: string; fecha: Date; plantilla: Plantilla }
  | { tipo: "contacto"; key: string; fecha: Date; plantilla: Plantilla };

export default async function HistorialPacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: paciente }, { data: plantillas }, { data: todosPacientes }] = await Promise.all([
    supabase.from("pacientes").select("*, consultorios(nombre)").eq("id", id).single(),
    supabase.from("plantillas").select("*").eq("paciente_id", id).order("created_at", { ascending: false }),
    supabase.from("pacientes").select("id, nombre").order("nombre"),
  ]);

  if (!paciente) notFound();

  const consultorio = (paciente.consultorios as { nombre: string } | null)?.nombre;
  const lista = (plantillas ?? []) as Plantilla[];

  const activities: ActivityItem[] = [];
  for (const p of lista) {
    activities.push({
      tipo: p.es_renovacion ? "alta_renovacion" : "alta",
      key: `alta-${p.id}`,
      fecha: new Date(p.created_at),
      plantilla: p,
    });
    if (p.estado_contacto && (p.fecha_contactado || p.fecha_agendado)) {
      const fechaContacto = p.fecha_contactado ?? p.fecha_agendado!;
      activities.push({
        tipo: "contacto",
        key: `contacto-${p.id}`,
        fecha: new Date(fechaContacto + "T00:00:00"),
        plantilla: p,
      });
    }
  }

  const typeWeight: Record<string, number> = { alta_renovacion: 3, contacto: 2, alta: 1 };
  activities.sort((a, b) => {
    const sameDay =
      a.fecha.getFullYear() === b.fecha.getFullYear() &&
      a.fecha.getMonth() === b.fecha.getMonth() &&
      a.fecha.getDate() === b.fecha.getDate();
    if (sameDay) return (typeWeight[b.tipo] ?? 0) - (typeWeight[a.tipo] ?? 0);
    return b.fecha.getTime() - a.fecha.getTime();
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/pacientes" className="text-sm text-blue-600 hover:underline">
          ← Volver a pacientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{paciente.nombre}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Historial de actividades</p>
      </div>

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

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{lista.length}</p>
          <p className="text-xs text-gray-500 mt-1">Plantillas realizadas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">
            {lista.filter((p) => p.es_renovacion).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Renovaciones</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">
            {lista.filter((p) => p.estado === "entregada").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Entregadas</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Actividades</h2>
        <HistorialActions pacienteId={id} pacientes={todosPacientes ?? []} />
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
          <p className="text-3xl mb-2">👟</p>
          <p className="text-sm">Este paciente no tiene actividades registradas.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-4">
            {activities.map((item) => {
              if (item.tipo === "alta" || item.tipo === "alta_renovacion") {
                const p = item.plantilla;
                const esRenov = item.tipo === "alta_renovacion";
                const renov = diasParaRenovacion(p.fecha_renovacion, p.fecha_entrega, p.created_at);

                return (
                  <div key={item.key} className="relative flex gap-4">
                    <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 bg-white ${esRenov ? "border-purple-300" : "border-blue-300"}`}>
                      {esRenov ? "♻️" : "📋"}
                    </div>
                    <div className={`flex-1 bg-white rounded-xl border p-4 mb-1 ${esRenov ? "border-purple-200" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className={`text-sm font-semibold ${esRenov ? "text-purple-700" : "text-blue-700"}`}>
                            {esRenov ? "Renovación de plantilla" : "Alta de plantilla"}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.fecha.toLocaleDateString("es-AR")}
                          </p>
                        </div>
                        <PlantillaCardActions
                          plantilla={p}
                          pacientes={todosPacientes ?? []}
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400 mb-0.5">Entrega</p>
                          <p className="font-medium text-gray-700">
                            {p.fecha_entrega ? new Date(p.fecha_entrega + "T00:00:00").toLocaleDateString("es-AR") : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-0.5">Renovación</p>
                          <p className="font-medium text-gray-700">{renov.fecha}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-0.5">Tiempo restante</p>
                          {renov.dias < 0 ? (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Vencida hace {Math.abs(renov.dias)}d
                            </span>
                          ) : renov.dias <= 30 ? (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              {renov.dias} días
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {renov.dias} días
                            </span>
                          )}
                        </div>
                        {p.foto_url && (
                          <div>
                            <p className="text-gray-400 mb-0.5">Foto pisada</p>
                            <FotoViewer url={p.foto_url} />
                          </div>
                        )}
                      </div>

                      {p.notas && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-0.5">Notas</p>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{p.notas}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              const p = item.plantilla;
              const resultado = p.estado_contacto;
              const resultadoConfig =
                resultado === "agendado" ? { label: "Agendado ✓", className: "bg-green-100 text-green-700" } :
                resultado === "no_interesado" ? { label: "No interesado ✗", className: "bg-red-100 text-red-700" } :
                { label: "Contactado", className: "bg-blue-100 text-blue-700" };

              return (
                <div key={item.key} className="relative flex gap-4">
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 bg-white border-yellow-300">
                    📞
                  </div>
                  <div className="flex-1 bg-white rounded-xl border border-yellow-200 p-4 mb-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-yellow-700">Contacto por renovación</span>
                        <p className="text-xs text-gray-400 mt-0.5">{item.fecha.toLocaleDateString("es-AR")}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultadoConfig.className}`}>
                        {resultadoConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
