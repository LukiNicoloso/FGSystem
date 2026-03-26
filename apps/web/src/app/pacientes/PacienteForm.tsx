"use client";

import { useState } from "react";
import { crearPaciente, editarPaciente } from "./actions";

interface Consultorio {
  id: string;
  nombre: string;
}

interface Paciente {
  id: string;
  nombre: string;
  dni: string | null;
  celular: string;
  consultorio_id: string | null;
  diabetico: boolean;
}

interface Props {
  consultorios: Consultorio[];
  paciente?: Paciente;
  onClose: () => void;
}

export default function PacienteForm({ consultorios, paciente, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      if (paciente) {
        await editarPaciente(paciente.id, formData);
      } else {
        await crearPaciente(formData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {paciente ? "Editar paciente" : "Nuevo paciente"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              name="nombre"
              defaultValue={paciente?.nombre}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <input
              name="dni"
              defaultValue={paciente?.dni ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 38123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celular (WhatsApp)
            </label>
            <input
              name="celular"
              defaultValue={paciente?.celular}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 5491123456789"
            />
            <p className="text-xs text-gray-400 mt-1">
              Formato internacional sin + ni espacios: <span className="font-medium text-gray-500">54 + código de área + número</span>
              <br />Ej: CABA → <span className="font-medium text-gray-500">5491112345678</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultorio</label>
            <select
              name="consultorio_id"
              defaultValue={paciente?.consultorio_id ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin consultorio</option>
              {consultorios.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              name="diabetico"
              id="diabetico"
              defaultChecked={paciente?.diabetico ?? false}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="diabetico" className="text-sm text-gray-700">Diabético/a</label>
          </div>

          {!paciente && (
            <>
              <hr className="border-gray-200" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plantilla inicial</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha entrega plantillas</label>
                <input
                  type="date"
                  name="fecha_entrega"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de la pisada</label>
                <input
                  type="file"
                  name="foto_pisada"
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
