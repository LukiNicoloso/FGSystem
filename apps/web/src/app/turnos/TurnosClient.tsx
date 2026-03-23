"use client";

import { useState } from "react";
import TurnoForm from "./TurnoForm";
import { eliminarTurno } from "./actions";

interface Paciente { id: string; nombre: string; dni: string | null }
interface Consultorio { id: string; nombre: string }
interface Turno {
  id: string;
  paciente_id: string;
  consultorio_id: string | null;
  fecha: string;
  hora: string;
  estado: string;
  recordatorio_enviado: boolean;
  pacientes: Paciente | null;
  consultorios: Consultorio | null;
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente confirmación", className: "bg-yellow-100 text-yellow-700" },
  confirmado: { label: "Confirmado", className: "bg-green-100 text-green-700" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700" },
};

interface Props {
  turnos: Turno[];
  pacientes: Paciente[];
  consultorios: Consultorio[];
}

export default function TurnosClient({ turnos, pacientes, consultorios }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Turno | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  function handleEditar(t: Turno) {
    setEditando(t);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditando(null);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este turno?")) return;
    setEliminando(id);
    await eliminarTurno(id);
    setEliminando(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{turnos.length} registrados</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          + Nuevo turno
        </button>
      </div>

      {turnos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">No hay turnos registrados aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Paciente</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Hora</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Consultorio</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {turnos.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{t.pacientes?.nombre ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(t.fecha + "T00:00:00").toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{t.hora.slice(0, 5)}</td>
                  <td className="px-5 py-3 text-gray-600">{t.consultorios?.nombre ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoConfig[t.estado]?.className ?? "bg-gray-100 text-gray-600"}`}>
                      {estadoConfig[t.estado]?.label ?? t.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3 flex gap-2 justify-end">
                    <button onClick={() => handleEditar(t)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleEliminar(t.id)} disabled={eliminando === t.id}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors">
                      {eliminando === t.id ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <TurnoForm
          pacientes={pacientes}
          consultorios={consultorios}
          turno={editando ?? undefined}
          onClose={handleClose}
        />
      )}
    </>
  );
}
