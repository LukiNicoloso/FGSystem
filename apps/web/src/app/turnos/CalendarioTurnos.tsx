"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TurnoForm from "./TurnoForm";
import { eliminarTurno } from "./actions";

interface Paciente { id: string; nombre: string; dni: string | null }
interface Consultorio { id: string; nombre: string }
interface Turno {
  id: string;
  paciente_id: string;
  consultorio_id: string | null;
  fecha: string;
  hora: string;
  estado: string;
  pacientes: Paciente | null;
  consultorios: Consultorio | null;
}

interface Props {
  turnos: Turno[];
  pacientes: Paciente[];
  consultorios: Consultorio[];
  mesStr: string;
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const SLOTS = Array.from({ length: 25 }, (_, i) => {
  const totalMin = 8 * 60 + i * 30;
  const h = Math.floor(totalMin / 60).toString().padStart(2, "0");
  const m = (totalMin % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}); // 08:00 … 20:00

const COLORES = [
  { light: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-300" },
  { light: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-300" },
  { light: "bg-green-100", text: "text-green-700", dot: "bg-green-500", border: "border-green-300" },
  { light: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-300" },
  { light: "bg-pink-100", text: "text-pink-700", dot: "bg-pink-500", border: "border-pink-300" },
  { light: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500", border: "border-teal-300" },
];

const estadoConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente confirmación", className: "bg-yellow-100 text-yellow-700" },
  confirmado: { label: "Confirmado", className: "bg-green-100 text-green-700" },
  cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700" },
};

export default function CalendarioTurnos({ turnos, pacientes, consultorios, mesStr }: Props) {
  const router = useRouter();
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Turno | null>(null);
  const [fechaPre, setFechaPre] = useState("");
  const [horaPre, setHoraPre] = useState("");
  const [eliminando, setEliminando] = useState<string | null>(null);

  const [year, month] = mesStr.split("-").map(Number);
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  // Color por consultorio
  const colorMap: Record<string, number> = {};
  consultorios.forEach((c, i) => { colorMap[c.id] = i % COLORES.length; });

  // Agrupar turnos por día
  const turnosPorDia: Record<string, Turno[]> = {};
  for (const t of turnos) {
    if (!turnosPorDia[t.fecha]) turnosPorDia[t.fecha] = [];
    turnosPorDia[t.fecha].push(t);
  }

  // Construir grilla del mes (lunes primero)
  const primerDia = new Date(year, month - 1, 1);
  const totalDias = new Date(year, month, 0).getDate();
  const primerDiaSemana = (primerDia.getDay() + 6) % 7;
  const celdas: (number | null)[] = [
    ...Array(primerDiaSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  function getFechaStr(dia: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }

  function navMes(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const newMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/turnos?mes=${newMes}`);
    setDiaSeleccionado(null);
  }

  function handleSlotClick(slot: string) {
    if (!diaSeleccionado) return;
    setFechaPre(diaSeleccionado);
    setHoraPre(slot);
    setEditando(null);
    setShowForm(true);
  }

  function handleEditar(t: Turno) {
    setEditando(t);
    setFechaPre("");
    setHoraPre("");
    setShowForm(true);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este turno?")) return;
    setEliminando(id);
    await eliminarTurno(id);
    setEliminando(null);
  }

  // Turnos del día seleccionado por slot
  const turnosPorSlot: Record<string, Turno> = {};
  if (diaSeleccionado) {
    for (const t of turnosPorDia[diaSeleccionado] ?? []) {
      turnosPorSlot[t.hora.slice(0, 5)] = t;
    }
  }

  const labelDiaSeleccionado = diaSeleccionado
    ? new Date(diaSeleccionado + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Turnos</h1>
        <p className="text-sm text-gray-500 mt-0.5">Hacé click en un día para ver los horarios disponibles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Calendario mensual ── */}
        <div className={diaSeleccionado ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Navegación de mes */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => navMes(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-xl transition-colors">
                ‹
              </button>
              <h2 className="text-base font-semibold text-gray-900">
                {MESES[month - 1]} {year}
              </h2>
              <button onClick={() => navMes(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 text-xl transition-colors">
                ›
              </button>
            </div>

            {/* Cabecera días */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Celdas */}
            <div className="grid grid-cols-7 gap-1">
              {celdas.map((dia, i) => {
                if (!dia) return <div key={i} className="min-h-[64px]" />;
                const fechaStr = getFechaStr(dia);
                const turnosDia = turnosPorDia[fechaStr] ?? [];
                const esHoy = fechaStr === hoyStr;
                const esSel = fechaStr === diaSeleccionado;

                return (
                  <button key={i} onClick={() => setDiaSeleccionado(esSel ? null : fechaStr)}
                    className={`min-h-[64px] p-1.5 rounded-xl flex flex-col items-start text-left transition-colors ${
                      esSel ? "bg-blue-600" : esHoy ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}>
                    <span className={`text-xs font-semibold mb-1 ${esSel ? "text-white" : esHoy ? "text-blue-700" : "text-gray-700"}`}>
                      {dia}
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {turnosDia.slice(0, 5).map((t) => {
                        const ci = t.consultorio_id ? (colorMap[t.consultorio_id] ?? 0) : 0;
                        return (
                          <span key={t.id}
                            className={`w-2 h-2 rounded-full ${esSel ? "bg-white opacity-75" : COLORES[ci].dot}`}
                            title={t.pacientes?.nombre ?? ""} />
                        );
                      })}
                      {turnosDia.length > 5 && (
                        <span className={`text-xs leading-none ${esSel ? "text-white opacity-75" : "text-gray-400"}`}>
                          +{turnosDia.length - 5}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            {consultorios.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                {consultorios.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-2.5 h-2.5 rounded-full ${COLORES[colorMap[c.id] ?? 0].dot}`} />
                    {c.nombre}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Vista de día ── */}
        {diaSeleccionado && (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col max-h-[700px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 capitalize">{labelDiaSeleccionado}</h3>
              <button onClick={() => setDiaSeleccionado(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-3 py-2 space-y-1">
              {SLOTS.map((slot) => {
                const turno = turnosPorSlot[slot];
                const ci = turno?.consultorio_id ? (colorMap[turno.consultorio_id] ?? 0) : 0;
                const color = COLORES[ci];

                return (
                  <div key={slot} className="flex items-start gap-2">
                    <span className="text-xs text-gray-400 w-10 pt-2 shrink-0 font-mono">{slot}</span>
                    {turno ? (
                      <div className={`flex-1 rounded-lg px-3 py-2 border ${color.light} ${color.border}`}>
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className={`text-xs font-semibold ${color.text}`}>{turno.pacientes?.nombre ?? "—"}</p>
                            {turno.consultorios && (
                              <p className="text-xs text-gray-500">{turno.consultorios.nombre}</p>
                            )}
                            <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full ${estadoConfig[turno.estado]?.className ?? ""}`}>
                              {estadoConfig[turno.estado]?.label ?? turno.estado}
                            </span>
                          </div>
                          <div className="flex gap-2 shrink-0 pt-0.5">
                            <button onClick={() => handleEditar(turno)}
                              className="text-xs text-blue-600 hover:underline">Editar</button>
                            <button onClick={() => handleEliminar(turno.id)}
                              disabled={eliminando === turno.id}
                              className="text-xs text-red-500 hover:underline disabled:opacity-50">
                              {eliminando === turno.id ? "..." : "✕"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => handleSlotClick(slot)}
                        className="flex-1 h-9 rounded-lg border border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-xs text-gray-300 hover:text-blue-500">
                        + Agregar turno
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <TurnoForm
          pacientes={pacientes}
          consultorios={consultorios}
          turno={editando ?? undefined}
          fechaDefault={fechaPre}
          horaDefault={horaPre}
          onClose={() => { setShowForm(false); setEditando(null); }}
        />
      )}
    </>
  );
}
