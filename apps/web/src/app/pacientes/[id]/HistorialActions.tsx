"use client";

import { useState } from "react";
import PlantillaForm from "@/app/plantillas/PlantillaForm";

interface Paciente { id: string; nombre: string }

interface Props {
  pacienteId: string;
  pacientes: Paciente[];
}

export default function HistorialActions({ pacienteId, pacientes }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Nueva plantilla
      </button>

      {showForm && (
        <PlantillaForm
          pacientes={pacientes}
          pacienteIdDefault={pacienteId}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
