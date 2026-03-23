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
  const [esRenovacion, setEsRenovacion] = useState(false);

  function abrirNueva() { setEsRenovacion(false); setShowForm(true); }
  function abrirRenovacion() { setEsRenovacion(true); setShowForm(true); }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={abrirRenovacion}
          className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          🔄 Registrar renovación
        </button>
        <button
          onClick={abrirNueva}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva plantilla
        </button>
      </div>

      {showForm && (
        <PlantillaForm
          pacientes={pacientes}
          pacienteIdDefault={pacienteId}
          esRenovacionDefault={esRenovacion}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
