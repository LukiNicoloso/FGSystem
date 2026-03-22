"use client";

import { useState, useRef, useEffect } from "react";
import { crearTurno, editarTurno } from "./actions";

interface Paciente { id: string; nombre: string; dni: string | null }
interface Consultorio { id: string; nombre: string }
interface Turno {
  id: string;
  paciente_id: string;
  consultorio_id: string | null;
  fecha: string;
  hora: string;
  estado: string;
}

interface Props {
  pacientes: Paciente[];
  consultorios: Consultorio[];
  turno?: Turno;
  onClose: () => void;
}

const estados = [
  { value: "pendiente", label: "Pendiente confirmación" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
];

export default function TurnoForm({ pacientes, consultorios, turno, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pacienteInicial = turno ? pacientes.find((p) => p.id === turno.paciente_id) : null;
  const [busqueda, setBusqueda] = useState(pacienteInicial?.nombre ?? "");
  const [pacienteId, setPacienteId] = useState(turno?.paciente_id ?? "");
  const [abierto, setAbierto] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  const pacientesFiltrados = pacientes.filter((p) => {
    const q = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || (p.dni ?? "").includes(q);
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function seleccionarPaciente(p: Paciente) {
    setPacienteId(p.id);
    setBusqueda(p.nombre);
    setAbierto(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pacienteId) { setError("Seleccioná un paciente"); return; }
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("paciente_id", pacienteId);
    try {
      if (turno) {
        await editarTurno(turno.id, formData);
      } else {
        await crearTurno(formData);
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {turno ? "Editar turno" : "Nuevo turno"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Buscador de paciente */}
          <div ref={comboRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPacienteId(""); setAbierto(true); }}
                onFocus={() => setAbierto(true)}
                placeholder="Buscar por nombre o DNI..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {abierto && busqueda.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {pacientesFiltrados.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
                  ) : (
                    pacientesFiltrados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => seleccionarPaciente(p)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{p.nombre}</span>
                        {p.dni && <span className="text-gray-400 ml-2 text-xs">DNI {p.dni}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {pacienteId && (
              <p className="text-xs text-green-600 mt-1">✓ Paciente seleccionado</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultorio</label>
            <select
              name="consultorio_id"
              defaultValue={turno?.consultorio_id ?? ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin consultorio</option>
              {consultorios.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                name="fecha"
                defaultValue={turno?.fecha}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora (formato 24hs)</label>
              <input
                type="time"
                name="hora"
                defaultValue={turno?.hora?.slice(0, 5)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              defaultValue={turno?.estado ?? "pendiente"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {estados.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
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
