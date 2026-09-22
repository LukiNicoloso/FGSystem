import Link from "next/link";
import { DIAS_HASTA_EL_COBRO, formatearPesos } from "@/lib/precios";

/**
 * Cuanto se gano en el mes, por consultorio, separando lo que ya entro de lo que
 * falta cobrar.
 *
 * Va al lado de las altas y no mezclado con ellas porque las dos listas cuentan
 * cosas distintas y el contraste es el dato: el consultorio que mas altas hace no
 * es necesariamente el que mas deja.
 *
 * La plata de un alta entra unos 15 dias despues de la entrega, asi que el total
 * del mes y lo que hay en la mano no son lo mismo. Cada barra esta partida en dos
 * tonos —cobrado y pendiente— para que los dos numeros del pie cierren con lo que
 * se ve dibujado.
 *
 * Solo se suma lo que tiene monto cargado. Las altas sin monto se muestran aparte
 * en vez de contarse como cero: un cero se lee como "no dejo plata" y lo que en
 * realidad pasa es que no se pudo saber.
 */

export interface GananciaPorConsultorio {
  nombre: string;
  /** Todo lo del mes: cobrado mas pendiente. */
  monto: number;
  /** La parte que ya entro. */
  cobrado: number;
  /** Altas con monto cargado. */
  conMonto: number;
  /** Altas sin monto cargado: no entran en ninguna suma. */
  sinMonto: number;
}

interface Props {
  mes: string;
  porConsultorio: GananciaPorConsultorio[];
  sinMontoTotal: number;
  /** Pares registrados en el mes. Es lo que hace que el total no sea altas x precio. */
  paresTotal: number;
}

export default function GananciasDelMes({
  mes,
  porConsultorio,
  sinMontoTotal,
  paresTotal,
}: Props) {
  // Los totales salen de las mismas filas que se dibujan y no vienen dados: asi no
  // puede pasar que el pie diga un numero que las barras no sostienen.
  const total = porConsultorio.reduce((acc, c) => acc + c.monto, 0);
  const cobrado = porConsultorio.reduce((acc, c) => acc + c.cobrado, 0);
  const porCobrar = total - cobrado;

  // Contra el mayor y no contra el total: con un consultorio concentrando la
  // mayoria, medir contra el total deja al resto invisible.
  const max = Math.max(0, ...porConsultorio.map((c) => c.monto));
  const hayAlgoCargado = porConsultorio.some((c) => c.conMonto > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900">Ganancias por consultorio</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Lo que generaron las altas de {mes}, según el monto cargado en cada una.
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
                <div className="flex-1 bg-gray-100 rounded h-5 min-w-0 overflow-hidden">
                  {/* Una sola barra partida: el largo total es lo del mes y el tramo
                      oscuro es lo que ya entro. */}
                  <div
                    className="flex h-full rounded overflow-hidden"
                    style={{ width: `${max > 0 ? Math.max((c.monto / max) * 100, 2) : 0}%` }}
                  >
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${c.monto > 0 ? (c.cobrado / c.monto) * 100 : 0}%` }}
                    />
                    <div className="h-full flex-1 bg-emerald-200" />
                  </div>
                </div>
                <span className="w-24 text-right text-sm font-medium text-gray-900 tabular-nums">
                  {formatearPesos(c.monto)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 shrink-0" />
                Ya cobrado
              </span>
              <span className="text-lg font-bold text-emerald-700 tabular-nums">
                {formatearPesos(cobrado)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-200 shrink-0" />
                Por cobrar
              </span>
              <span className="text-sm font-medium text-gray-600 tabular-nums">
                {formatearPesos(porCobrar)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-1.5 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Total de {mes}
                {paresTotal > 0 && (
                  <> · {paresTotal} {paresTotal === 1 ? "par" : "pares"}</>
                )}
              </span>
              <span className="text-xs text-gray-500 tabular-nums">{formatearPesos(total)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            La plata de cada alta entra unos {DIAS_HASTA_EL_COBRO} días después de la
            entrega, así que lo pendiente son las entregas más recientes.
          </p>
        </>
      )}

      {sinMontoTotal > 0 && hayAlgoCargado && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
          {sinMontoTotal === 1
            ? "Hay 1 alta sin monto, así que no entra en ninguna de las dos sumas."
            : `Hay ${sinMontoTotal} altas sin monto, así que no entran en ninguna de las dos sumas.`}{" "}
          Pasa cuando el consultorio no tiene precio cargado.{" "}
          <Link href="/consultorios" className="font-medium hover:underline">
            Ver consultorios
          </Link>
          .
        </p>
      )}
    </div>
  );
}
