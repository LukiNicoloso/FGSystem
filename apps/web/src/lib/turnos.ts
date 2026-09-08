/**
 * Como se muestra el estado de un turno.
 *
 * El campo `estado` solo no alcanza: un turno cancelado puede haberlo rechazado el
 * paciente o haberlo dado de baja el consultorio, y eso cambia lo que hay que
 * hacer. Lo mismo con los pendientes: uno al que todavia no le mandamos el
 * recordatorio esta en orden, y uno al que le mandamos y no contesto es el caso
 * que hay que mirar, porque no genera ningun aviso y es tan probable que no
 * aparezca como el que dijo que no.
 */

export type EstadoVisual = {
  label: string;
  className: string;
  /** Marca los que necesitan que alguien haga algo. */
  requiereAtencion: boolean;
};

export type TurnoParaEstado = {
  estado: string;
  respuesta_paciente?: string | null;
  recordatorio_enviado?: boolean | null;
};

const SIN_DATO: EstadoVisual = {
  label: "—",
  className: "bg-gray-100 text-gray-600",
  requiereAtencion: false,
};

export function estadoVisualDeTurno(t: TurnoParaEstado): EstadoVisual {
  switch (t.estado) {
    case "confirmado":
      return t.respuesta_paciente === "si"
        ? { label: "Confirmó por WhatsApp", className: "bg-green-100 text-green-700", requiereAtencion: false }
        : { label: "Confirmado", className: "bg-green-100 text-green-700", requiereAtencion: false };

    case "cancelado":
      return t.respuesta_paciente === "no"
        ? { label: "Rechazó por WhatsApp", className: "bg-red-100 text-red-700", requiereAtencion: true }
        : { label: "Cancelado", className: "bg-red-100 text-red-700", requiereAtencion: false };

    case "completado":
      return { label: "Completado", className: "bg-blue-100 text-blue-700", requiereAtencion: false };

    case "pendiente":
      return t.recordatorio_enviado
        ? { label: "Sin responder", className: "bg-amber-100 text-amber-800", requiereAtencion: true }
        : { label: "Pendiente confirmación", className: "bg-yellow-100 text-yellow-700", requiereAtencion: false };

    default:
      return { ...SIN_DATO, label: t.estado };
  }
}

/** Cuantos turnos de la lista necesitan que alguien haga algo. */
export function contarQueRequierenAtencion(turnos: TurnoParaEstado[]): {
  sinResponder: number;
  rechazados: number;
} {
  let sinResponder = 0;
  let rechazados = 0;
  for (const t of turnos) {
    const e = estadoVisualDeTurno(t);
    if (!e.requiereAtencion) continue;
    if (t.estado === "pendiente") sinResponder++;
    else rechazados++;
  }
  return { sinResponder, rechazados };
}
