"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizarCelularesPendientes } from "./actions";

export interface Fila {
  id: string;
  nombre: string;
  celular: string;
  guardado: string | null;
  resultado: string | null;
  motivo: string | null;
  yaEsta: boolean;
}

interface Props {
  filas: Fila[];
  listos: number;
  porNormalizar: number;
  conProblema: number;
  formatoEsperado: string;
}

type Filtro = "pendientes" | "problemas" | "todos";

export default function NormalizarClient({
  filas,
  listos,
  porNormalizar,
  conProblema,
  formatoEsperado,
}: Props) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>(
    conProblema > 0 && porNormalizar === 0 ? "problemas" : "pendientes"
  );
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);

  const visibles = filas.filter((f) => {
    if (filtro === "todos") return true;
    if (filtro === "problemas") return !f.yaEsta && !f.resultado;
    return !f.yaEsta && Boolean(f.resultado);
  });

  async function aplicar() {
    setAplicando(true);
    setError("");
    setResultado(null);
    try {
      const r = await normalizarCelularesPendientes();
      setResultado(
        r.omitidos > 0
          ? `Se normalizaron ${r.actualizados} pacientes. Quedaron ${r.omitidos} sin normalizar, hay que corregirlos a mano.`
          : `Se normalizaron ${r.actualizados} pacientes.`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setAplicando(false);
    }
  }

  return (
    <div>
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-700">{listos}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ya listos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-blue-700">{porNormalizar}</p>
          <p className="text-xs text-gray-500 mt-0.5">Se pueden normalizar</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-2xl font-bold text-red-700">{conProblema}</p>
          <p className="text-xs text-gray-500 mt-0.5">Hay que corregirlos</p>
        </div>
      </div>

      {/* Acción */}
      <div className="flex items-center gap-3 flex-wrap mb-5">
        <button
          onClick={aplicar}
          disabled={aplicando || porNormalizar === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {aplicando
            ? "Aplicando..."
            : porNormalizar === 0
              ? "No hay nada para normalizar"
              : `Normalizar ${porNormalizar} paciente${porNormalizar === 1 ? "" : "s"}`}
        </button>
        {resultado && <p className="text-sm text-green-700">{resultado}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {conProblema > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
          <p className="text-sm text-amber-900 font-medium">
            {conProblema} paciente{conProblema === 1 ? "" : "s"} sin celular utilizable
          </p>
          <p className="text-xs text-amber-800 mt-1">
            No van a recibir recordatorios hasta que se corrija el número. Editalos desde la
            lista de pacientes. {formatoEsperado}
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(
          [
            ["pendientes", `Se pueden normalizar (${porNormalizar})`],
            ["problemas", `Con problema (${conProblema})`],
            ["todos", `Todos (${filas.length})`],
          ] as [Filtro, string][]
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setFiltro(valor)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filtro === valor
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {visibles.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">Nada para mostrar acá ✅</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Paciente</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Como está cargado</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Cómo queda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibles.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/pacientes/${f.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                    >
                      {f.nombre}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">
                    {f.celular || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {f.yaEsta ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✓ Ya listo
                      </span>
                    ) : f.resultado ? (
                      <span className="font-mono text-xs text-blue-700">{f.resultado}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        {f.motivo}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
