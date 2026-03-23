"use client";

import { useState } from "react";
import PlantillaForm from "./PlantillaForm";
import { eliminarPlantilla } from "./actions";

interface Paciente { id: string; nombre: string }
interface Plantilla {
  id: string;
  paciente_id: string;
  estado: string;
  notas: string | null;
  fecha_entrega: string | null;
  fecha_renovacion: string | null;
  foto_url: string | null;
  pacientes: Paciente | null;
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  en_taller: { label: "En taller", className: "bg-orange-100 text-orange-700" },
  lista_para_entrega: { label: "Lista para entrega", className: "bg-blue-100 text-blue-700" },
  entregada: { label: "Entregada", className: "bg-green-100 text-green-700" },
  renovacion_pendiente: { label: "Renovación pendiente", className: "bg-purple-100 text-purple-700" },
};

interface Props {
  plantillas: Plantilla[];
  pacientes: Paciente[];
}

export default function PlantillasClient({ plantillas, pacientes }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Plantilla | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  function handleEditar(p: Plantilla) {
    setEditando(p);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditando(null);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    setEliminando(id);
    await eliminarPlantilla(id);
    setEliminando(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{plantillas.length} registradas</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          + Nueva plantilla
        </button>
      </div>

      {plantillas.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">👟</p>
          <p className="text-sm">No hay plantillas registradas aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Paciente</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Entrega</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Renovación</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Notas</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plantillas.map((p) => {
                const config = estadoConfig[p.estado] ?? { label: p.estado, className: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.pacientes?.nombre ?? "—"}</td>
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
                      {p.fecha_renovacion
                        ? new Date(p.fecha_renovacion + "T00:00:00").toLocaleDateString("es-AR")
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{p.notas ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-5 py-3 flex gap-2 justify-end">
                      <button onClick={() => handleEditar(p)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(p.id)} disabled={eliminando === p.id}
                        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors">
                        {eliminando === p.id ? "..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <PlantillaForm
          pacientes={pacientes}
          plantilla={editando ?? undefined}
          onClose={handleClose}
        />
      )}
    </>
  );
}
