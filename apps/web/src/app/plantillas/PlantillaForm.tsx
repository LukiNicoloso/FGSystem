"use client";

import { useState } from "react";
import { crearPlantilla, editarPlantilla } from "./actions";

interface Paciente { id: string; nombre: string }
interface Plantilla {
  id: string;
  paciente_id: string;
  estado: string;
  notas: string | null;
  fecha_entrega: string | null;
  fecha_renovacion: string | null;
  foto_url: string | null;
}

interface Props {
  pacientes: Paciente[];
  plantilla?: Plantilla;
  pacienteIdDefault?: string;
  esRenovacionDefault?: boolean;
  onClose: () => void;
}

function parseFotoUrls(foto_url: string | null): string[] {
  if (!foto_url) return [];
  try {
    const parsed = JSON.parse(foto_url);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [foto_url];
}

export default function PlantillaForm({ pacientes, plantilla, pacienteIdDefault, esRenovacionDefault, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<string[]>(parseFotoUrls(plantilla?.foto_url ?? null));

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    try {
      if (plantilla) {
        await editarPlantilla(plantilla.id, formData);
      } else {
        await crearPlantilla(formData);
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {plantilla ? "Editar plantilla" : esRenovacionDefault ? "Registrar renovación" : "Nueva plantilla"}
        </h2>
        <input type="hidden" name="es_renovacion" value={String(esRenovacionDefault ?? false)} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <select name="paciente_id" defaultValue={plantilla?.paciente_id ?? pacienteIdDefault ?? ""} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha entrega</label>
            <input type="date" name="fecha_entrega" defaultValue={plantilla?.fecha_entrega ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notas" defaultValue={plantilla?.notas ?? ""} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Observaciones opcionales..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fotos de la pisada</label>
            <input type="file" name="foto" accept="image/*" multiple onChange={handleFotoChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <p className="text-xs text-gray-400 mt-1">Podés seleccionar varias fotos a la vez</p>
            {previews.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {previews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`Preview ${i + 1}`} className="h-20 rounded-lg object-cover border border-gray-200" />
                ))}
              </div>
            )}
          </div>
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
