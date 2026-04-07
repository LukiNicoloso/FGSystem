"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlantillaForm from "@/app/plantillas/PlantillaForm";
import { eliminarPlantilla } from "@/app/plantillas/actions";

interface Paciente { id: string; nombre: string }

interface PlantillaData {
  id: string;
  paciente_id: string;
  estado: string;
  notas: string | null;
  fecha_entrega: string | null;
  fecha_renovacion: string | null;
  foto_url: string | null;
}

interface Props {
  plantilla: PlantillaData;
  pacientes: Paciente[];
}

export default function PlantillaCardActions({ plantilla, pacientes }: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await eliminarPlantilla(plantilla.id);
      router.refresh();
    } catch {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <div className="flex gap-1.5">
        <button
          onClick={() => setShowEdit(true)}
          className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          🗑️ Eliminar
        </button>
      </div>

      {showEdit && (
        <PlantillaForm
          pacientes={pacientes}
          plantilla={plantilla}
          onClose={() => {
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">¿Eliminar plantilla?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
