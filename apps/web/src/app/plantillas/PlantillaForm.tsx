"use client";

import { useState } from "react";
import { crearPlantilla, editarPlantilla } from "./actions";
import type { PacienteParaAlta } from "@/lib/pacientes";
import {
  formatearPesos,
  montoSugerido,
  PARES_POR_DEFECTO,
  PARES_POSIBLES,
  type Pares,
} from "@/lib/precios";

type Paciente = PacienteParaAlta;
interface Plantilla {
  id: string;
  paciente_id: string;
  estado: string;
  notas: string | null;
  fecha_entrega: string | null;
  fecha_renovacion: string | null;
  foto_url: string | null;
  pares: number | null;
  monto_cobrado: number | null;
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
  const [existingPhotos, setExistingPhotos] = useState<string[]>(parseFotoUrls(plantilla?.foto_url ?? null));
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [pacienteId, setPacienteId] = useState(plantilla?.paciente_id ?? pacienteIdDefault ?? "");
  // En un alta nueva arrancamos en dos pares, que es lo habitual. Al editar una
  // plantilla vieja queda en null: esas altas son anteriores a que esto se
  // registrara y no queremos inventarles una cantidad al abrirlas.
  const [pares, setPares] = useState<Pares | null>(
    plantilla ? (plantilla.pares === 1 || plantilla.pares === 2 ? plantilla.pares : null) : PARES_POR_DEFECTO
  );
  const [monto, setMonto] = useState(
    plantilla?.monto_cobrado != null ? String(plantilla.monto_cobrado) : ""
  );
  // Una vez que se escribe el monto a mano dejamos de pisarlo: el precio del
  // consultorio es una sugerencia, no la verdad de lo que se cobro.
  const [montoEditado, setMontoEditado] = useState(plantilla?.monto_cobrado != null);

  const precioPorPar = pacientes.find((p) => p.id === pacienteId)?.precio_por_par ?? null;
  const sugerido = pares === null ? null : montoSugerido(precioPorPar, pares);
  const montoAMostrar = montoEditado || sugerido === null ? monto : String(sugerido);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setNewPreviews(files.map(f => URL.createObjectURL(f)));
  }

  function removeExisting(index: number) {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tiene que vivir dentro del form: FormData solo levanta los campos que estan adentro */}
          <input type="hidden" name="es_renovacion" value={String(esRenovacionDefault ?? false)} />
          <input type="hidden" name="pares" value={pares === null ? "" : String(pares)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <select name="paciente_id" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required
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
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cantidad</label>
              <div className="flex gap-2">
                {PARES_POSIBLES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPares(n)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      pares === n
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {n === 1 ? "1 par" : "2 pares (x2)"}
                  </button>
                ))}
              </div>
              {pares === null && (
                <p className="text-xs text-amber-700 mt-1.5">
                  Este alta es anterior al registro de cantidad. Si te acordás cuántos
                  pares fueron, elegilo; si no, dejalo así.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto cobrado</label>
              <input
                name="monto_cobrado"
                value={montoAMostrar}
                onChange={(e) => {
                  setMontoEditado(true);
                  setMonto(e.target.value);
                }}
                inputMode="numeric"
                placeholder={precioPorPar === null ? "El consultorio no tiene precio cargado" : "Ej: 190000"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {montoEditado && sugerido !== null && String(sugerido) !== monto ? (
                <button
                  type="button"
                  onClick={() => {
                    setMontoEditado(false);
                    setMonto("");
                  }}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Volver al sugerido ({formatearPesos(sugerido)})
                </button>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  {precioPorPar === null
                    ? "Se sugiere solo cuando el consultorio del paciente tiene precio cargado."
                    : "Sugerido según el precio del consultorio. Se puede corregir."}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea name="notas" defaultValue={plantilla?.notas ?? ""} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Observaciones opcionales..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fotos de la pisada</label>

            {/* Fotos existentes con botón de eliminar */}
            {existingPhotos.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-400 mb-1.5">Fotos actuales</p>
                <div className="flex gap-2 flex-wrap">
                  {existingPhotos.map((src, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Foto ${i + 1}`} className="h-20 rounded-lg object-cover border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeExisting(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden field con las fotos existentes que quedan */}
            <input type="hidden" name="remaining_fotos" value={JSON.stringify(existingPhotos)} />

            {/* Agregar nuevas fotos */}
            <input type="file" name="foto" accept="image/*" multiple onChange={handleFotoChange}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <p className="text-xs text-gray-400 mt-1">Podés seleccionar varias fotos a la vez</p>

            {/* Preview de nuevas fotos */}
            {newPreviews.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {newPreviews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`Nueva ${i + 1}`} className="h-20 rounded-lg object-cover border border-blue-200" />
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
