"use client";

import { useState } from "react";
import Link from "next/link";
import WaButton from "./WaButton";
import AccionButton from "./AccionButton";
import { actualizarEstadoContacto } from "./actions";

interface Consultorio {
  nombre: string;
}

interface Paciente {
  id: string;
  nombre: string;
  celular: string;
  consultorios: Consultorio | null;
}

interface Plantilla {
  id: string;
  fecha_renovacion: string;
  pacientes: Paciente | null;
}

interface Props {
  plantillas: Plantilla[];
  hoy: string;
}

function diasRestantes(fechaRenovacion: string, hoy: string) {
  return Math.round(
    (new Date(fechaRenovacion + "T00:00:00").getTime() - new Date(hoy + "T00:00:00").getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

function DiasTag({ dias }: { dias: number }) {
  if (dias < 0)
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Vencida hace {Math.abs(dias)} día{Math.abs(dias) !== 1 ? "s" : ""}</span>;
  if (dias === 0)
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Vencida hoy</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Vence en {dias} día{dias !== 1 ? "s" : ""}</span>;
}

type Filtro = "vencidas" | "proximas";

export default function SeguimientoGrid({ plantillas, hoy }: Props) {
  const [filtro, setFiltro] = useState<Filtro>("vencidas");

  const vencidas = plantillas.filter(p => diasRestantes(p.fecha_renovacion, hoy) <= 0);
  const proximas = plantillas.filter(p => diasRestantes(p.fecha_renovacion, hoy) > 0);
  const lista = filtro === "vencidas" ? vencidas : proximas;

  return (
    <div>
      {/* Filtro */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFiltro("vencidas")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filtro === "vencidas"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Vencidas
          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filtro === "vencidas" ? "bg-red-200 text-red-700" : "bg-gray-200 text-gray-500"}`}>
            {vencidas.length}
          </span>
        </button>
        <button
          onClick={() => setFiltro("proximas")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filtro === "proximas"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          Proximas a vencer
          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filtro === "proximas" ? "bg-yellow-200 text-yellow-700" : "bg-gray-200 text-gray-500"}`}>
            {proximas.length}
          </span>
        </button>
      </div>

      {/* Grid */}
      {!lista.length ? (
        <p className="text-sm text-gray-400 text-center py-16">
          {filtro === "vencidas" ? "Sin plantillas vencidas ✅" : "Sin plantillas proximas a vencer ✅"}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {lista.map((p) => {
            const dias = diasRestantes(p.fecha_renovacion, hoy);
            return (
              <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2.5">
                <div>
                  <Link href={`/pacientes/${p.pacientes?.id}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 hover:underline">
                    {p.pacientes?.nombre ?? "—"}
                  </Link>
                  <div className="mt-1.5">
                    <DiasTag dias={dias} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <WaButton
                    celular={p.pacientes?.celular}
                    consultorio={p.pacientes?.consultorios?.nombre}
                    nombre={p.pacientes?.nombre}
                    fechaRenovacion={p.fecha_renovacion}
                  />
                  <AccionButton
                    action={actualizarEstadoContacto.bind(null, p.id, "contactado")}
                    label="✓ Contactado"
                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
