import Link from "next/link";
import { formatearPesos } from "@/lib/precios";

/**
 * Cuanto se gano en el mes, por consultorio.
 *
 * Va al lado de las altas y no mezclado con ellas porque las dos listas cuentan
 * cosas distintas y el contraste es el dato: el consultorio que mas altas hace no
 * es necesariamente el que mas deja.
 *
 * Solo se suma lo que tiene monto cargado. Las altas sin monto se muestran
 * aparte en vez de contarse como cero: un cero se lee como "no dejo plata" y lo
 * que en realidad pasa es que no se registro.
 */

export interface GananciaPorConsultorio {
  nombre: string;
  /** Suma de los montos cargados. */
  monto: number;
  /** Altas con monto cargado. */
  conMonto: number;
  /** Altas sin monto cargado: no entran en la suma. */
  sinMonto: number;
}

interface Props {
  mes: string;
  porConsultorio: GananciaPorConsultorio[];
  sinMontoTotal: number;
  /** Pares registrados en el mes. Es lo que hace que el total no sea una altas x precio. */
  paresTotal: number;
}

export default function GananciasDelMes({ mes, porConsultorio, sinMontoTotal, paresTotal }: Props) {
  // El total se saca de las mismas filas que se dibujan y no viene dado: asi no
  // puede pasar que el encabezado diga un numero que las barras no sostienen.
  const total = porConsultorio.reduce((acc, c) => acc + c.monto, 0);
  // Contra el mayor y no contra el total, igual que las altas: con un consultorio
  // concentrando la mayoria, medir contra el total deja al resto invisible.
  const max = Math.max(0, ...porConsultorio.map((c) => c.monto));
  const hayAlgoCargado = porConsultorio.some((c) => c.conMonto > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900">Ganancias por consultorio</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Lo cobrado por las altas de {mes}, según el monto cargado en cada una.
      </p>

      {!hayAlgoCargado ? (
        <p className="text-sm text-gray-400 text-center py-8">
          {sinMontoTotal > 0 ? (
            <>
              Ninguna de las {sinMontoTotal} altas de {mes} tiene monto cargado todavía.{" "}
              <Link href="/plantillas" className="text-blue-600 hover:underline">
                Completarlas
              </Link>
              .
            </>
          ) : (
            `No hubo altas en ${mes}.`
          )}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {porConsultorio.map((c) => (
              <div key={c.nombre} className="flex items-center gap-3">
                <span
                  className="w-28 sm:w-36 shrink-0 text-sm text-gray-600 truncate"
                  title={c.nombre}
                >
                  {c.nombre}
                </span>
                <div className="flex-1 bg-gray-100 rounded h-5 min-w-0">
                  <div
                    className="h-full bg-emerald-600 rounded"
                    style={{ width: `${max > 0 ? Math.max((c.monto / max) * 100, 2) : 0}%` }}
                  />
                </div>
                <span className="w-24 text-right text-sm font-medium text-gray-900 tabular-nums">
                  {formatearPesos(c.monto)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-baseline justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              Total de {mes}
              {paresTotal > 0 && (
                <span className="text-gray-400 font-normal">
                  {" "}· {paresTotal} {paresTotal === 1 ? "par" : "pares"}
                </span>
              )}
            </span>
            <span className="text-lg font-bold text-emerald-700 tabular-nums">
              {formatearPesos(total)}
            </span>
          </div>
        </>
      )}

      {sinMontoTotal > 0 && hayAlgoCargado && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
          {sinMontoTotal === 1
            ? "Hay 1 alta sin monto cargado, así que no entra en el total."
            : `Hay ${sinMontoTotal} altas sin monto cargado, así que no entran en el total.`}{" "}
          <Link href="/plantillas" className="font-medium hover:underline">
            Completarlas
          </Link>
          .
        </p>
      )}
    </div>
  );
}
