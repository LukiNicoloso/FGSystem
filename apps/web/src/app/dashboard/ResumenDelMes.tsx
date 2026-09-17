import Link from "next/link";

/**
 * El pulso del mes, arriba de todo.
 *
 * Los tres primeros numeros resumen lo que esta mas abajo en la pantalla, asi que
 * al abrir se ve de un vistazo si hay algo que atender y despues se baja al
 * detalle. Las altas por consultorio van en barras horizontales y no verticales
 * porque los nombres son largos y en vertical quedarian rotados o cortados.
 */

export interface AltaPorConsultorio {
  nombre: string;
  altas: number;
}

interface Props {
  mes: string;
  altasDelMes: number;
  renovacionesDelMes: number;
  porConsultorio: AltaPorConsultorio[];
  turnosSinConfirmar: number;
  renovacionesVencidas: number;
}

function Tile({
  valor,
  etiqueta,
  detalle,
  className = "text-gray-900",
}: {
  valor: string | number;
  etiqueta: string;
  detalle?: string;
  className?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500">{etiqueta}</p>
      <p className={`text-2xl font-bold mt-1 truncate ${className}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-0.5 h-4 truncate">{detalle ?? ""}</p>
    </div>
  );
}

export default function ResumenDelMes({
  mes,
  altasDelMes,
  renovacionesDelMes,
  porConsultorio,
  turnosSinConfirmar,
  renovacionesVencidas,
}: Props) {
  const top = porConsultorio[0];
  // Las barras se miden contra el mayor, no contra el total: con un consultorio
  // concentrando la mayoria, medir contra el total dejaria al resto invisible.
  const max = top?.altas ?? 0;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Resumen del mes</h2>
        <span className="text-sm text-gray-500">{mes}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Tile
          valor={altasDelMes}
          etiqueta="Plantillas dadas de alta"
          detalle={
            renovacionesDelMes === 0
              ? "ninguna es renovación"
              : `${renovacionesDelMes} son renovaciones`
          }
          className="text-blue-700"
        />
        <Tile
          valor={top?.nombre ?? "—"}
          etiqueta="Consultorio con más altas"
          detalle={top ? `${top.altas} de ${altasDelMes}` : "sin altas este mes"}
        />
        <Tile
          valor={turnosSinConfirmar}
          etiqueta="Turnos de hoy sin confirmar"
          detalle={turnosSinConfirmar > 0 ? "conviene llamarlos" : "todo confirmado"}
          className={turnosSinConfirmar > 0 ? "text-amber-700" : "text-gray-900"}
        />
        <Tile
          valor={renovacionesVencidas}
          etiqueta="Renovaciones vencidas"
          detalle={renovacionesVencidas > 0 ? "esperando contacto" : "al día"}
          className={renovacionesVencidas > 0 ? "text-red-700" : "text-gray-900"}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900">Altas por consultorio</h3>
        <p className="text-xs text-gray-500 mt-0.5 mb-4">
          Plantillas dadas de alta este mes, según el consultorio del paciente.
        </p>

        {porConsultorio.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Todavía no hay altas este mes.
          </p>
        ) : (
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
                    className="h-full bg-blue-600 rounded"
                    style={{ width: `${max > 0 ? Math.max((c.altas / max) * 100, 2) : 0}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium text-gray-900 tabular-nums">
                  {c.altas}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          ¿Falta alguno? Los pacientes sin consultorio asignado aparecen como «Sin
          consultorio».{" "}
          <Link href="/consultorios" className="text-blue-600 hover:underline">
            Ver consultorios
          </Link>
        </p>
      </div>
    </section>
  );
}
