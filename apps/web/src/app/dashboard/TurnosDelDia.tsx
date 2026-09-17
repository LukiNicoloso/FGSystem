import Link from "next/link";
import { etiquetaTipoTurno, formatearHoraTurno } from "@/lib/recordatorios";
import { estadoVisualDeTurno } from "@/lib/turnos";

/**
 * Los turnos de hoy y como viene la confirmacion de cada uno.
 *
 * Es la vista de la mañana: los recordatorios salieron ayer a las 18:00, asi que
 * al abrir el sistema lo primero que importa es quien confirmo, quien rechazo y a
 * quien hay que llamar porque no contesto.
 */

export interface TurnoDelDia {
  id: string;
  hora: string;
  tipo: string;
  estado: string;
  respuesta_paciente: string | null;
  recordatorio_enviado: boolean;
  recordatorio_error: string | null;
  pacientes: { id: string; nombre: string } | null;
  consultorios: { nombre: string } | null;
}

interface Props {
  turnos: TurnoDelDia[];
  hoy: string;
}

function Contador({
  valor,
  etiqueta,
  className,
}: {
  valor: number;
  etiqueta: string;
  className: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className={`text-2xl font-bold ${className}`}>{valor}</p>
      <p className="text-xs text-gray-500 mt-0.5">{etiqueta}</p>
    </div>
  );
}

export default function TurnosDelDia({ turnos, hoy }: Props) {
  const confirmados = turnos.filter((t) => t.estado === "confirmado").length;
  const rechazados = turnos.filter(
    (t) => t.estado === "cancelado" && t.respuesta_paciente === "no"
  ).length;
  const sinConfirmar = turnos.filter((t) => t.estado === "pendiente").length;

  const fechaLarga = new Date(hoy + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Turnos de hoy</h2>
        <span className="text-sm text-gray-500 capitalize">{fechaLarga}</span>
      </div>

      {turnos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-sm text-gray-400">No hay turnos agendados para hoy.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Contador valor={confirmados} etiqueta="Confirmados" className="text-green-700" />
            <Contador valor={sinConfirmar} etiqueta="Sin confirmar" className="text-amber-700" />
            <Contador valor={rechazados} etiqueta="Rechazados" className="text-red-700" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Hora</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Consultorio</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Confirmación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turnos.map((t) => {
                  const estado = estadoVisualDeTurno(t);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap tabular-nums">
                        {formatearHoraTurno(t.hora)}
                      </td>
                      <td className="px-5 py-3">
                        {t.pacientes ? (
                          <Link
                            href={`/pacientes/${t.pacientes.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                          >
                            {t.pacientes.nombre}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {t.consultorios?.nombre ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {etiquetaTipoTurno(t.tipo)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${estado.className}`}
                        >
                          {estado.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
