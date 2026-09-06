"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarConfiguracionConsultorio } from "../actions";
import {
  armarRecordatorio,
  faltantesParaRecordatorio,
  FIRMA_POR_DEFECTO,
  TELEFONO_AVISOS_FG,
  TIPOS_TURNO,
  type TipoTurno,
} from "@/lib/recordatorios";

interface Consultorio {
  id: string;
  nombre: string;
  direccion: string | null;
  recordatorio_estudio_activo: boolean;
  recordatorio_entrega_activo: boolean;
  recordatorio_firma: string | null;
  telefono_avisos: string | null;
}

interface Props {
  consultorio: Consultorio;
}

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function Switch({
  activo,
  disabled,
  onToggle,
}: {
  activo: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        activo ? "bg-green-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-0.5 ${
          activo ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function ConsultorioConfig({ consultorio }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  const [nombre, setNombre] = useState(consultorio.nombre);
  const [direccion, setDireccion] = useState(consultorio.direccion ?? "");
  const [firma, setFirma] = useState(consultorio.recordatorio_firma ?? FIRMA_POR_DEFECTO);
  const [telefonoAvisos, setTelefonoAvisos] = useState(consultorio.telefono_avisos ?? "");
  const [activos, setActivos] = useState<Record<TipoTurno, boolean>>({
    estudio: consultorio.recordatorio_estudio_activo,
    entrega: consultorio.recordatorio_entrega_activo,
  });

  const faltantes = faltantesParaRecordatorio({ direccion });
  const puedeActivar = faltantes.length === 0;

  const algunoActivo = puedeActivar && (activos.estudio || activos.entrega);

  // Las vistas previas usan un turno de ejemplo, pero la direccion y la firma son
  // las que se estan editando: es el mensaje exacto que va a recibir el paciente.
  function previewDe(tipo: TipoTurno) {
    return armarRecordatorio(tipo, {
      paciente: "Adrián",
      fecha: "martes 8 de septiembre",
      hora: "15:30",
      direccion: direccion.trim() || "—",
      firma: firma.trim() || FIRMA_POR_DEFECTO,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGuardado(false);
    const formData = new FormData(e.currentTarget);
    formData.set("recordatorio_estudio_activo", String(activos.estudio && puedeActivar));
    formData.set("recordatorio_entrega_activo", String(activos.entrega && puedeActivar));
    try {
      await guardarConfiguracionConsultorio(consultorio.id, formData);
      setGuardado(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------- Datos ---------- */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Datos</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input
              name="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className={inputClass}
              placeholder="Ej: Av. Rivadavia 1234, Caballito"
            />
            <p className="text-xs text-gray-400 mt-1">
              Se la mandamos al paciente en los recordatorios, así sabe dónde presentarse.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Recordatorios ---------- */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900">Recordatorios de turno</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">
          Se envían por WhatsApp a las 18:00 del día anterior al turno. Cada tipo de turno
          se activa por separado.
        </p>

        {!puedeActivar && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Para activar cualquiera de los dos falta cargar {faltantes.join(" y ")}.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIPOS_TURNO.map((tipo) => (
            <div
              key={tipo.value}
              className={`rounded-lg border p-4 transition-colors ${
                activos[tipo.value] && puedeActivar
                  ? "border-green-300 bg-green-50/40"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <Switch
                  activo={activos[tipo.value] && puedeActivar}
                  disabled={!puedeActivar}
                  onToggle={() =>
                    setActivos((prev) => ({ ...prev, [tipo.value]: !prev[tipo.value] }))
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{tipo.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tipo.descripcion}</p>
                </div>
              </div>

              <div className="mt-3 bg-white rounded-xl rounded-bl-sm border border-gray-200 p-3">
                <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                  {previewDe(tipo.value)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Aplica a los dos recordatorios
          </p>

          <div>
            <label className={labelClass}>Firma</label>
            <input
              name="recordatorio_firma"
              value={firma}
              onChange={(e) => setFirma(e.target.value)}
              className={inputClass}
              placeholder={FIRMA_POR_DEFECTO}
            />
            <p className="text-xs text-gray-400 mt-1">
              Cierra los mensajes, debajo del &quot;Gracias&quot;. Si la dejás vacía firmamos
              como {FIRMA_POR_DEFECTO}.
            </p>
          </div>

          <div>
            <label className={labelClass}>Avisar rechazos también a</label>
            <input
              name="telefono_avisos"
              value={telefonoAvisos}
              onChange={(e) => setTelefonoAvisos(e.target.value)}
              className={inputClass}
              placeholder="Ej: +54 9 11 5620-7854"
            />
            <p className="text-xs text-gray-400 mt-1">
              Cuando un paciente rechaza un turno, el aviso le llega siempre a FG
              (<span className="font-medium text-gray-500">{TELEFONO_AVISOS_FG}</span>). Si
              querés que además le llegue a alguien del consultorio, cargá su número acá.
            </p>
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {guardado && !error && (
        <p className="text-sm text-green-700">
          {algunoActivo
            ? "Cambios guardados. Este consultorio ya envía recordatorios."
            : "Cambios guardados. Este consultorio todavía no envía ningún recordatorio."}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
