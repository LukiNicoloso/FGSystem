"use client";

import { useState } from "react";
import ConsultorioForm from "./ConsultorioForm";
import { eliminarConsultorio } from "./actions";

interface Consultorio {
  id: string;
  nombre: string;
  created_at: string;
}

interface Props {
  consultorios: Consultorio[];
}

export default function ConsultoriosClient({ consultorios }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Consultorio | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  function handleEditar(c: Consultorio) {
    setEditando(c);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditando(null);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este consultorio? Los pacientes y turnos asociados perderán la referencia.")) return;
    setEliminando(id);
    await eliminarConsultorio(id);
    setEliminando(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultorios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{consultorios.length} registrados</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          + Nuevo consultorio
        </button>
      </div>

      {consultorios.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏥</p>
          <p className="text-sm">No hay consultorios registrados aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha de alta</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {consultorios.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {new Date(c.created_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-5 py-3 flex gap-2 justify-end">
                    <button onClick={() => handleEditar(c)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => handleEliminar(c.id)} disabled={eliminando === c.id}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors">
                      {eliminando === c.id ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ConsultorioForm
          consultorio={editando ?? undefined}
          onClose={handleClose}
        />
      )}
    </>
  );
}
