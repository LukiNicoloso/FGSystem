import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AccionButton from "./AccionButton";
import WaButton from "./WaButton";
import { actualizarEstadoContacto } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const hoy = ahora.toISOString().split("T")[0];
  const en15dias = new Date(ahora);
  en15dias.setDate(en15dias.getDate() + 15);
  const en15diasStr = en15dias.toISOString().split("T")[0];

  const [
    { data: porContactar },
    { data: contactados },
    { data: agendados },
  ] = await Promise.all([
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre, celular, consultorios(nombre))")
      .lte("fecha_renovacion", en15diasStr)
      .is("estado_contacto", null)
      .order("fecha_renovacion", { ascending: true }),
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre, celular, consultorios(nombre))")
      .eq("estado_contacto", "contactado")
      .order("fecha_renovacion", { ascending: true }),
    supabase
      .from("plantillas")
      .select("*, pacientes(id, nombre)")
      .eq("estado_contacto", "agendado")
      .eq("fecha_agendado", hoy)
      .order("fecha_renovacion", { ascending: true }),
  ]);

  function diasRestantes(fechaRenovacion: string) {
    return Math.round(
      (new Date(fechaRenovacion + "T00:00:00").getTime() - new Date(hoy + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
    );
  }

function DiasTag({ dias }: { dias: number }) {
    if (dias < 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Vencida hace {Math.abs(dias)} día{Math.abs(dias) !== 1 ? "s" : ""}</span>;
    if (dias === 0)
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Vence hoy</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Vence en {dias} día{dias !== 1 ? "s" : ""}</span>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seguimiento</h1>
        <p className="text-sm text-gray-500 mt-0.5">Seguimiento de renovaciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

        {/* Columna 1: Por contactar */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">Por contactar</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              {porContactar?.length ?? 0}
            </span>
          </div>
          <div className="space-y-3">
            {!porContactar?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin pacientes pendientes ✅</p>
            ) : porContactar.map((p) => {
              const paciente = p.pacientes as { id: string; nombre: string; celular: string; consultorios: { nombre: string } | null } | null;
              const dias = diasRestantes(p.fecha_renovacion);
              return (
                <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2.5">
                  <div>
                    <Link href={`/pacientes/${paciente?.id}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 hover:underline">
                      {paciente?.nombre ?? "—"}
                    </Link>
                    <div className="mt-1.5">
                      <DiasTag dias={dias} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <WaButton celular={paciente?.celular} consultorio={paciente?.consultorios?.nombre} nombre={paciente?.nombre} />
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
        </div>

        {/* Columna 2: Contactados */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">Contactados</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {contactados?.length ?? 0}
            </span>
          </div>
          <div className="space-y-3">
            {!contactados?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin pacientes contactados</p>
            ) : contactados.map((p) => {
              const paciente = p.pacientes as { id: string; nombre: string; celular: string; consultorios: { nombre: string } | null } | null;
              const dias = diasRestantes(p.fecha_renovacion);
              return (
                <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2.5">
                  <div>
                    <Link href={`/pacientes/${paciente?.id}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 hover:underline">
                      {paciente?.nombre ?? "—"}
                    </Link>
                    <div className="mt-1.5">
                      <DiasTag dias={dias} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <WaButton celular={paciente?.celular} consultorio={paciente?.consultorios?.nombre} nombre={paciente?.nombre} label="Reenviar" />
                    <AccionButton
                      action={actualizarEstadoContacto.bind(null, p.id, "agendado")}
                      label="✓ Agendado"
                      className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
                    />
                    <AccionButton
                      action={actualizarEstadoContacto.bind(null, p.id, "no_interesado")}
                      label="✗ No interesado"
                      className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna 3: Agendados hoy */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-700 text-sm">Agendados hoy</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              {agendados?.length ?? 0}
            </span>
          </div>
          <div className="space-y-3">
            {!agendados?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin agendados hoy</p>
            ) : agendados.map((p) => {
              const paciente = p.pacientes as { id: string; nombre: string } | null;
              const dias = diasRestantes(p.fecha_renovacion);
              return (
                <div key={p.id} className="bg-white rounded-lg border border-green-200 p-3 space-y-1.5">
                  <Link href={`/pacientes/${paciente?.id}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 hover:underline block">
                    {paciente?.nombre ?? "—"}
                  </Link>
                  <DiasTag dias={dias} />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
