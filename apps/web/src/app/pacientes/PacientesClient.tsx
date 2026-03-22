"use client";

import { useState } from "react";
import PacienteForm from "./PacienteForm";
import { eliminarPaciente } from "./actions";

interface Consultorio {
  id: string;
  nombre: string;
}

interface Paciente {
  id: string;
  nombre: string;
  celular: string;
  consultorio_id: string | null;
  consultorios: Consultorio | null;
}

interface Props {
  pacientes: Paciente[];
  consultorios: Consultorio[];
}

export default function PacientesClient({ pacientes, consultorios }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  function handleEditar(p: Paciente) {
    setEditando(p);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditando(null);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este paciente?")) return;
    setEliminando(id);
    await eliminarPaciente(id);
    setEliminando(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pacientes.length} registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo paciente
        </button>
      </div>

      {pacientes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm">No hay pacientes registrados aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Celular</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Consultorio</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pacientes.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-5 py-3 text-gray-600">{p.celular}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {p.consultorios?.nombre ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 flex gap-2 justify-end">
                    <button
                      onClick={() => handleEditar(p)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(p.id)}
                      disabled={eliminando === p.id}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {eliminando === p.id ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <PacienteForm
          consultorios={consultorios}
          paciente={editando ?? undefined}
          onClose={handleCloseForm}
        />
      )}
    </>
  );
}
