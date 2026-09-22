"use client";

import { useState } from "react";
import {
  formatearPesos,
  montoSugerido,
  PARES_POR_DEFECTO,
  PARES_POSIBLES,
  type Pares,
} from "@/lib/precios";

/**
 * Cuantos pares y cuanto se cobro, para cualquier formulario que cree o edite una
 * plantilla.
 *
 * Vive aparte porque hay dos formas de dar de alta una plantilla —desde la pantalla
 * de plantillas y junto con el alta del paciente— y tener el campo dos veces
 * garantizaba que tarde o temprano dejaran de coincidir.
 */

interface Props {
  /** Precio de un par en el consultorio que corresponde. null = sin precio cargado. */
  precioPorPar: number | null;
  /** Al editar, lo que ya tenia guardado. En null se arranca en el default. */
  paresIniciales?: number | null;
  montoInicial?: number | null;
  /**
   * true cuando se esta editando una plantilla existente. Cambia el arranque: en un
   * alta nueva se asume el caso habitual, al editar no se le inventa nada a una
   * plantilla vieja que nunca tuvo el dato.
   */
  editando?: boolean;
  /**
   * Con que cantidad arranca un alta nueva. No es la misma en los dos formularios:
   * un alta suelta suele ser de dos pares, pero la primera plantilla de un paciente
   * nuevo suele ser de uno.
   */
  paresPorDefecto?: Pares;
}

export default function CamposDeCobro({
  precioPorPar,
  paresIniciales,
  montoInicial,
  editando = false,
  paresPorDefecto = PARES_POR_DEFECTO,
}: Props) {
  const [pares, setPares] = useState<Pares | null>(
    paresIniciales === 1 || paresIniciales === 2
      ? paresIniciales
      : editando
        ? null
        : paresPorDefecto
  );
  const [monto, setMonto] = useState(montoInicial != null ? String(montoInicial) : "");
  // Una vez escrito a mano dejamos de pisarlo: el precio del consultorio es una
  // sugerencia, no la verdad de lo que se cobro.
  const [editado, setEditado] = useState(montoInicial != null);

  const sugerido = pares === null ? null : montoSugerido(precioPorPar, pares);
  const aMostrar = editado || sugerido === null ? monto : String(sugerido);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
      <input type="hidden" name="pares" value={pares === null ? "" : String(pares)} />

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
            Este alta es anterior al registro de cantidad. Si te acordás cuántos pares
            fueron, elegilo; si no, dejalo así.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Monto cobrado</label>
        <input
          name="monto_cobrado"
          value={aMostrar}
          onChange={(e) => {
            setEditado(true);
            setMonto(e.target.value);
          }}
          inputMode="numeric"
          placeholder={
            precioPorPar === null ? "El consultorio no tiene precio cargado" : "Ej: 190000"
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {editado && sugerido !== null && String(sugerido) !== monto ? (
          <button
            type="button"
            onClick={() => {
              setEditado(false);
              setMonto("");
            }}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            Volver al sugerido ({formatearPesos(sugerido)})
          </button>
        ) : (
          <p className="text-xs text-gray-400 mt-1">
            {precioPorPar === null
              ? "Se sugiere solo cuando el consultorio tiene precio cargado."
              : pares === null
                ? "Elegí la cantidad y se sugiere el monto."
                : "Sugerido según el precio del consultorio. Se puede corregir."}
          </p>
        )}
      </div>
    </div>
  );
}
